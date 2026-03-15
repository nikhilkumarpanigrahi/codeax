# Codeax Maintainer Runbook

## Scope
This runbook covers professional operations for the Codeax GitHub App-style integration.

## Production Readiness Checklist
- Use GitHub App credentials in production (`GITHUB_APP_ID` + private key).
- Keep PAT fallback disabled in production unless emergency break-glass.
- Verify webhook signature validation is enabled with `GITHUB_WEBHOOK_SECRET`.
- Verify webhook delivery idempotency collection is healthy (`webhook_deliveries`).
- Ensure Mongo indexes are present for analysis and webhook collections.
- Rotate all secrets every 90 days or immediately after exposure.

## Incident: Webhook Duplicate Processing
1. Check `webhook_deliveries` for duplicate delivery ID.
2. Confirm endpoint returns `ignored_duplicate` for repeated `X-GitHub-Delivery`.
3. Verify no duplicate PR comments were posted.

## Incident: GitHub API Auth Failures
1. Validate `GITHUB_APP_ID` and private key values.
2. Confirm app is installed on target repo.
3. Verify callback URL and OAuth credentials for login providers.
4. Check installation token generation path in logs.

## Incident: Missing PR Analysis Data
1. Manually trigger: `POST /api/analysis/{owner}/{repo}/pr/{pr_number}`.
2. Confirm report exists in `analysis_reports` with repository and pr_number.
3. Confirm related health snapshot inserted into `health_history`.

## Local Developer Commands
- Backend: `cd backend && python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000`
- Frontend: `cd frontend && npm run dev -- -p 3000`
- Backend smoke test: `cd backend && python smoke_test.py`

## CI Gates
- Backend smoke test job must pass.
- Frontend build job must pass.
- Reject merges when either gate fails.
