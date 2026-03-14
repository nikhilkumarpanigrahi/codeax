from datetime import datetime

from pydantic import BaseModel, Field


class RepositoryHealth(BaseModel):
    code_quality: int = Field(ge=0, le=100)
    security: int = Field(ge=0, le=100)
    tests: int = Field(ge=0, le=100)
    overall: int = Field(ge=0, le=100)


class RepositoryModel(BaseModel):
    owner: str
    name: str
    full_name: str
    description: str | None = None
    stars: int = 0
    language: str | None = None
    health: RepositoryHealth


class RepositoryBase(BaseModel):
    """
    Base schema for repositories stored in MongoDB.

    Field names follow the requirement exactly so the API contract
    matches the requested shape.
    """

    repoName: str
    ownerName: str
    description: str
    githubLink: str
    vulnerabilitiesDetected: int = Field(ge=0)
    lastScanDate: datetime


class RepositoryCreate(RepositoryBase):
    """
    Schema used when creating a new repository.
    """


class RepositoryInDB(RepositoryBase):
    """
    Schema representing a repository document as returned by the API.

    The MongoDB ObjectId is exposed as a string `id` field so that
    clients do not need to deal with ObjectId types directly.
    """

    id: str = Field(..., description="MongoDB document identifier")
