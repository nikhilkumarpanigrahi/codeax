from datetime import datetime

from app.database.state import (
    append_health_history,
    get_analysis_report,
    get_health_history,
    list_repository_reports,
    save_analysis_report,
)
from app.errors import AppError
from app.models import AnalysisResult, HealthSnapshot, RepositoryInsight
from app.services.coordinator_agent import CoordinatorAgent
from app.services.agent_engine import PullRequestContext


class AnalysisService:
    def __init__(self, coordinator: CoordinatorAgent | None = None):
        self.coordinator = coordinator or CoordinatorAgent()

    async def run_pull_request_analysis(self, context: PullRequestContext) -> AnalysisResult:
        result = await self.coordinator.analyze(context)
        try:
            await save_analysis_report(result.repository, result.pr_number, result.model_dump(mode="json"))
            await append_health_history(
                result.repository,
                {
                    "timestamp": datetime.utcnow().isoformat(),
                    "code_quality": result.health.code_quality,
                    "security": result.health.security,
                    "tests": result.health.tests,
                    "technical_debt": result.health.technical_debt,
                    "overall": result.health.overall,
                },
            )
        except Exception as exc:
            raise AppError(
                code="analysis_persistence_failed",
                message=f"Failed to persist analysis artifacts: {exc}",
                status_code=500,
            )
        return result

    async def get_pull_request_analysis(self, owner: str, repo: str, pr_number: int) -> AnalysisResult | None:
        payload = await get_analysis_report(f"{owner}/{repo}", pr_number)
        if not payload:
            return None
        return AnalysisResult(**payload)

    async def list_repository_analyses(self, owner: str, repo: str) -> list[AnalysisResult]:
        reports = await list_repository_reports(f"{owner}/{repo}")
        return [AnalysisResult(**item) for item in reports]

    async def get_repository_insights(self, owner: str, repo: str) -> RepositoryInsight:
        repository = f"{owner}/{repo}"
        analyses = await self.list_repository_analyses(owner, repo)
        vulnerabilities = len(
            [
                finding
                for report in analyses
                for finding in report.findings
                if finding.severity in ["critical", "high"]
            ]
        )
        code_smells = len([finding for report in analyses for finding in report.findings if finding.category == "complexity"])
        test_coverage = 0
        if analyses:
            test_coverage = round(sum(report.health.tests for report in analyses) / len(analyses))

        history = [HealthSnapshot(**snapshot) for snapshot in await get_health_history(repository)]
        return RepositoryInsight(
            repository=repository,
            vulnerabilities=vulnerabilities,
            code_smells=code_smells,
            test_coverage=test_coverage,
            health_history=history,
        )
