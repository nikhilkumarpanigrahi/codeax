from fastapi import APIRouter

from app.errors import AppError
from app.models import AnalysisResult
from app.services import AnalysisService, GitHubService

router = APIRouter()


async def _run_manual_analysis(owner: str, repo: str, pr_number: int) -> AnalysisResult:
    github = GitHubService()
    try:
        context = await github.build_context_from_pull_request(owner, repo, pr_number)
    except Exception as exc:
        raise AppError(
            code="pr_context_fetch_failed",
            message=f"Unable to fetch pull request context for {owner}/{repo}#{pr_number}: {exc}",
            status_code=502,
        )
    return await AnalysisService().run_pull_request_analysis(context)


@router.get("/{owner}/{repo}/summary")
async def get_repo_summary(owner: str, repo: str) -> dict[str, object]:
    analyses = await AnalysisService().list_repository_analyses(owner, repo)
    latest = analyses[0] if analyses else None

    high_findings = [
        finding
        for report in analyses
        for finding in report.findings
        if finding.severity in ["critical", "high"]
    ]
    generated_tests = [item for report in analyses for item in report.generated_tests]
    dependency_risks = [item for report in analyses for item in report.dependency_risks]
    documentation_recommendations = [item for report in analyses for item in report.documentation_recommendations]
    auto_fix_suggestions = [item for report in analyses for item in report.auto_fix_suggestions]

    score = latest.health.overall if latest else 0
    recommendation = latest.recommendation if latest else "No analysis report found yet. Trigger an analysis first."

    return {
        "repository": f"{owner}/{repo}",
        "analysis_reports": len(analyses),
        "overall_score": score,
        "high_severity_findings": len(high_findings),
        "generated_tests": len(generated_tests),
        "dependency_risks": len(dependency_risks),
        "documentation_recommendations": len(documentation_recommendations),
        "auto_fix_suggestions": len(auto_fix_suggestions),
        "recommendation": recommendation,
    }


@router.get("/{owner}/{repo}/security")
async def get_security_summary(owner: str, repo: str) -> dict[str, object]:
    analyses = await AnalysisService().list_repository_analyses(owner, repo)
    security_findings = [
        finding
        for report in analyses
        for finding in report.findings
        if finding.category == "security" or finding.severity in ["critical", "high"]
    ]
    dependency_risks = [item for report in analyses for item in report.dependency_risks]
    auto_fix_suggestions = [item for report in analyses for item in report.auto_fix_suggestions]

    return {
        "repository": f"{owner}/{repo}",
        "security_findings": [item.model_dump() for item in security_findings],
        "dependency_risks": dependency_risks,
        "auto_fix_suggestions": auto_fix_suggestions,
        "critical_or_high_count": len([item for item in security_findings if item.severity in ["critical", "high"]]),
    }


@router.get("/{owner}/{repo}/tests")
async def get_test_summary(owner: str, repo: str) -> dict[str, object]:
    analyses = await AnalysisService().list_repository_analyses(owner, repo)
    generated_tests = [item for report in analyses for item in report.generated_tests]
    documentation_recommendations = [item for report in analyses for item in report.documentation_recommendations]

    return {
        "repository": f"{owner}/{repo}",
        "generated_tests": generated_tests,
        "documentation_recommendations": documentation_recommendations,
        "analysis_reports": len(analyses),
    }


@router.post("/{owner}/{repo}/pr/{pr_number}", response_model=AnalysisResult)
async def analyze_pr(owner: str, repo: str, pr_number: int) -> AnalysisResult:
    return await _run_manual_analysis(owner, repo, pr_number)


@router.get("/{owner}/{repo}/pr/{pr_number}", response_model=AnalysisResult)
async def get_pr_analysis(owner: str, repo: str, pr_number: int) -> AnalysisResult:
    report = await AnalysisService().get_pull_request_analysis(owner, repo, pr_number)
    if not report:
        raise AppError(code="analysis_not_found", message="Analysis report not found", status_code=404)
    return report


# Legacy-compatible endpoints retained for existing clients.
@router.post("/{owner}/{repo}/{pr_number}", response_model=AnalysisResult)
async def analyze_pr_legacy(owner: str, repo: str, pr_number: int) -> AnalysisResult:
    return await _run_manual_analysis(owner, repo, pr_number)


@router.get("/{owner}/{repo}/{pr_number}", response_model=AnalysisResult)
async def get_pr_analysis_legacy(owner: str, repo: str, pr_number: int) -> AnalysisResult:
    return await get_pr_analysis(owner, repo, pr_number)


@router.get("/{owner}/{repo}", response_model=list[AnalysisResult])
async def list_repo_analyses(owner: str, repo: str) -> list[AnalysisResult]:
    return await AnalysisService().list_repository_analyses(owner, repo)
