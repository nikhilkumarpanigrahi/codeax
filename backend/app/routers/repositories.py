from fastapi import APIRouter

from app.models import RepositoryInsight, RepositoryModel
from app.services import AnalysisService, GitHubService

router = APIRouter()


@router.get("/", response_model=list[RepositoryModel])
async def list_repositories() -> list[RepositoryModel]:
    return await GitHubService().list_repositories()


@router.get("/{owner}/{repo}/insights", response_model=RepositoryInsight)
async def get_repository_insights(owner: str, repo: str) -> RepositoryInsight:
    return await AnalysisService().get_repository_insights(owner, repo)


@router.get("/{owner}/{repo}/health-history")
async def get_repository_health_history(owner: str, repo: str) -> dict[str, object]:
    insight = await AnalysisService().get_repository_insights(owner, repo)
    return {"repository": f"{owner}/{repo}", "history": [item.model_dump(mode="json") for item in insight.health_history]}
