from datetime import datetime

from fastapi import APIRouter, Header, HTTPException, Request

from app.config import settings
from app.database.state import append_health_history, register_webhook_delivery
from app.services import AnalysisService, GitHubService

router = APIRouter()


@router.post("/github")
async def receive_github_webhook(
    request: Request,
    x_github_event: str = Header(default="", alias="X-GitHub-Event"),
    x_github_delivery: str | None = Header(default=None, alias="X-GitHub-Delivery"),
    x_hub_signature_256: str | None = Header(default=None, alias="X-Hub-Signature-256"),
) -> dict[str, str]:
    github = GitHubService()
    body_bytes = await request.body()
    if not github.is_valid_webhook_signature(body_bytes, x_hub_signature_256):
        raise HTTPException(status_code=401, detail="Invalid webhook signature")

    payload = await request.json()
    repository = payload.get("repository", {}).get("full_name", "unknown/repository")
    is_new_delivery = await register_webhook_delivery(
        delivery_id=(x_github_delivery or "").strip(),
        event_type=x_github_event or "unknown",
        repository=repository,
    )
    if not is_new_delivery:
        return {
            "status": "ignored_duplicate",
            "event_type": x_github_event or "unknown",
            "repository": repository,
        }

    if x_github_event == "pull_request" and payload.get("action") in ["opened", "reopened", "synchronize"]:
        context = await github.build_context_from_webhook_payload(payload)
        if not context:
            raise HTTPException(status_code=400, detail="Pull request payload missing fields")
        result = await AnalysisService().run_pull_request_analysis(context)

        if settings.enable_auto_pr_comment:
            comment = _format_pr_comment(result)
            await github.post_pull_request_comment(context.repository, context.number, comment)

        return {
            "status": "processed",
            "event_type": x_github_event,
            "repository": context.repository,
        }

    if x_github_event == "push":
        await append_health_history(
            repository,
            {
                "timestamp": datetime.utcnow().isoformat(),
                "code_quality": 80,
                "security": 80,
                "tests": 70,
                "technical_debt": 30,
                "overall": 76,
            },
        )
        return {"status": "processed", "event_type": "push", "repository": repository}

    if x_github_event == "repository":
        return {"status": "processed", "event_type": "repository", "repository": repository}

    return {"status": "ignored", "event_type": x_github_event or "unknown", "repository": "n/a"}


def _format_pr_comment(result) -> str:
    high_severity = len([item for item in result.findings if item.severity in ["critical", "high"]])
    return (
        "Codeax AI Report\n\n"
        f"PR Type: {result.pr_type}\n"
        f"Overall Health: {result.health.overall}%\n"
        f"Security Issues: {high_severity}\n"
        f"Code Findings: {len(result.findings)}\n"
        f"Generated Tests: {len(result.generated_tests)}\n\n"
        f"Recommendation: {result.recommendation}"
    )
