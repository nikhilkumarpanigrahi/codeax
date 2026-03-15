from __future__ import annotations

from typing import List

from fastapi import APIRouter, status

from app.models.repository import RepositoryCreate, RepositoryInDB
from app.services.repository_service import RepositoryService

router = APIRouter()


@router.post(
    "/repo",
    response_model=RepositoryInDB,
    status_code=status.HTTP_201_CREATED,
    summary="Add a new repository",
)
async def add_repository(payload: RepositoryCreate) -> RepositoryInDB:
    """
    Create a new repository document in the `repositories` collection.
    """
    service = RepositoryService()
    return await service.create_repository(payload)


@router.get(
    "/repos",
    response_model=List[RepositoryInDB],
    summary="List all repositories",
)
async def list_repositories() -> List[RepositoryInDB]:
    """
    Return all repositories ordered by their last scan date.
    """
    service = RepositoryService()
    return await service.list_repositories()


@router.get(
    "/repo/{id}",
    response_model=RepositoryInDB,
    summary="Get repository by id",
)
async def get_repository(id: str) -> RepositoryInDB:
    """
    Fetch a single repository document by its MongoDB identifier.
    """
    service = RepositoryService()
    return await service.get_repository(id)


@router.delete(
    "/repo/{id}",
    response_model=RepositoryInDB,
    summary="Delete repository by id",
)
async def delete_repository(id: str) -> RepositoryInDB:
    """
    Delete a repository document and return the deleted record.
    """
    service = RepositoryService()
    return await service.delete_repository(id)

