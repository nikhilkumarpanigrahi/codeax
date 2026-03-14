from __future__ import annotations

from typing import List, Optional

from bson import ObjectId
from fastapi import HTTPException, status

from app.database.mongodb import get_database
from app.models.repository import RepositoryCreate, RepositoryInDB


def _parse_object_id(id_str: str) -> ObjectId:
    """
    Safely parse a string into a MongoDB ObjectId or raise 400.
    """
    if not ObjectId.is_valid(id_str):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid repository id format.",
        )
    return ObjectId(id_str)


def _document_to_model(doc: dict) -> RepositoryInDB:
    """
    Convert a raw MongoDB document into a Pydantic model.
    """
    doc_id = str(doc.pop("_id"))
    return RepositoryInDB(id=doc_id, **doc)


class RepositoryService:
    """
    Service layer for CRUD operations on the `repositories` collection.

    All methods are async and use the shared Motor client, following
    FastAPI's async patterns.
    """

    COLLECTION_NAME = "repositories"

    def __init__(self) -> None:
        self._db = get_database()
        self._collection = self._db[self.COLLECTION_NAME]

    async def create_repository(self, data: RepositoryCreate) -> RepositoryInDB:
        payload = data.model_dump()
        result = await self._collection.insert_one(payload)
        created = await self._collection.find_one({"_id": result.inserted_id})
        if not created:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create repository.",
            )
        return _document_to_model(created)

    async def list_repositories(self) -> List[RepositoryInDB]:
        cursor = self._collection.find().sort("lastScanDate", -1)
        docs = await cursor.to_list(length=1000)
        return [_document_to_model(doc) for doc in docs]

    async def get_repository(self, repo_id: str) -> RepositoryInDB:
        object_id = _parse_object_id(repo_id)
        doc = await self._collection.find_one({"_id": object_id})
        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Repository not found.",
            )
        return _document_to_model(doc)

    async def delete_repository(self, repo_id: str) -> Optional[RepositoryInDB]:
        object_id = _parse_object_id(repo_id)
        doc = await self._collection.find_one({"_id": object_id})
        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Repository not found.",
            )
        await self._collection.delete_one({"_id": object_id})
        return _document_to_model(doc)

