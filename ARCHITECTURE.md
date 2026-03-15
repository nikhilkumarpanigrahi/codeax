# Codeax AI Architecture

## Overview
Codeax AI is split into two services:
- Frontend: Next.js App Router dashboard and landing page
- Backend: FastAPI API for repository, pull request, analysis, and webhook routes

## Frontend
- Entry points: app/page.tsx and app/dashboard/*
- Shared components: components/dashboard, components/ui, components/common
- Mock domain data: lib/data.ts
- Styling: Tailwind + custom GitHub-inspired color tokens

## Backend
- App bootstrap: backend/main.py
- Config: app/config.py
- Routers:
  - /health, /
  - /api/repositories
  - /api/pull-requests/{owner}/{repo}
  - /api/analysis/{owner}/{repo}/{pr_number}
  - /api/webhooks/github
- Service layer:
  - GitHubService (stub data)
  - AnalysisService + CoordinatorAgent (analysis orchestration)
- Models:
  - RepositoryModel
  - PullRequestModel
  - AnalysisResult

## Data Flow
1. Frontend requests repository/PR data from backend routes.
2. Analysis trigger endpoint delegates to AnalysisService.
3. CoordinatorAgent returns aggregated agent output summary.
4. Frontend displays data in dashboard route sections.

## Current Scope
- Production-style structure and routing are implemented.
- External integrations (real GitHub auth/webhooks persistence) are stubbed and ready for extension.
