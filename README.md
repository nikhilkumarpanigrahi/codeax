# RepoGuardian AI

RepoGuardian AI is a full-stack baseline for autonomous PR analysis workflows:
- Frontend: Next.js 14 + TypeScript + Tailwind dashboard and landing page
- Backend: FastAPI with structured routers, models, and service layer
- Infra: Docker Compose and VS Code task support

## Hackathon Features Implemented
- GitHub webhook integration for pull request opened, synchronize, push, and repository events
- AI Coordinator Agent that classifies PR type and selects specialist agents
- AI Code Review Agent findings for complexity and reliability risks
- Security detection for secret exposure and injection-like patterns
- AI test suggestion generation for changed files
- Automated PR feedback comments via GitHub Issues Comment API
- Repository health score with quality, security, tests, and technical debt
- Dashboard sections for repositories, pull requests, security, tests, and metrics-oriented insights
- PR Analysis View with code review findings, generated tests, and recommendations
- Code change intelligence classification: feature, bug fix, refactor, security update
- Repository metrics tracking history endpoints
- Optional modules included: dependency risk checks, doc update recommendations, auto-fix suggestions, knowledge-map style context routing

## Quick Start

### Frontend
1. `cd frontend`
2. `npm install`
3. `npm run dev`

### Backend
1. `cd backend`
2. `python -m venv .venv`
3. `.venv\\Scripts\\Activate.ps1`
4. `pip install -r requirements.txt`
5. `uvicorn main:app --reload`

## Docker
`docker compose up --build`

## Ports
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- API docs: http://localhost:8000/docs

## Chatbot LLM (Grok)
Set these values in `.env` to enable Grok-powered responses:
- `CHATBOT_ENABLE_LLM=true`
- `GROK_API_KEY=<your_key>`
- `GROK_BASE_URL=https://api.x.ai/v1`
- `GROK_MODEL=grok-2-latest`

If no valid Grok key is present, chatbot automatically uses the built-in repository-aware fallback logic.

## Implemented Backend Routes
- `GET /`
- `GET /health`
- `GET /api/repositories/`
- `GET /api/repositories/{owner}/{repo}/insights`
- `GET /api/repositories/{owner}/{repo}/health-history`
- `GET /api/pull-requests/{owner}/{repo}`
- `POST /api/analysis/{owner}/{repo}/{pr_number}`
- `GET /api/analysis/{owner}/{repo}/{pr_number}`
- `GET /api/analysis/{owner}/{repo}`
- `POST /api/chat/`
- `POST /api/webhooks/github`

## Implemented Frontend Routes
- `/`
- `/dashboard`
- `/dashboard/repositories`
- `/dashboard/pull-requests`
- `/dashboard/security`
- `/dashboard/tests`
- `/dashboard/chatbot`
- `/dashboard/settings`

See `ARCHITECTURE.md` and `SETUP_GUIDE.md` for details.

## GitHub APIs to Integrate
Use these official APIs for production integration:
1. GitHub Webhooks for repository and pull request events:
https://docs.github.com/en/webhooks
2. GitHub App flow (recommended for org/repo installations):
https://docs.github.com/en/apps/creating-github-apps
3. REST API for pull request and issue comments:
https://docs.github.com/en/rest/issues/comments#create-an-issue-comment
4. REST API for pull request files and metadata:
https://docs.github.com/en/rest/pulls/pulls#get-a-pull-request
5. Octokit SDK if you prefer typed client libraries:
https://github.com/octokit/octokit.js

Minimum setup for this project:
1. Create a GitHub App.
2. Enable pull_request, push, and repository webhook events.
3. Set webhook URL to your backend endpoint: /api/webhooks/github.
4. Copy webhook secret into GITHUB_WEBHOOK_SECRET.
5. Provide a token in GITHUB_TOKEN to enable automated PR comments.
