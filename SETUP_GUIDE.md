# Setup Guide

## Prerequisites
- Node.js 18+
- Python 3.11+ (validated on 3.14 in this workspace)

## Frontend
1. cd frontend
2. npm install
3. npm run dev

Default URL: http://localhost:3000
If busy, Next.js auto-selects another port (for example 3001).

## Backend
1. cd backend
2. python -m venv .venv
3. .venv\\Scripts\\Activate.ps1
4. pip install -r requirements.txt
5. python -m uvicorn main:app --host 0.0.0.0 --port 8000

Backend URL: http://localhost:8000
Swagger docs: http://localhost:8000/docs

## Quick Verification (Local Dev)
- Frontend: open /
- Backend health: GET /health returns status JSON
- Trigger analysis: POST /api/analysis/{owner}/{repo}/{pr_number}

## VS Code Task
A task is available in .vscode/tasks.json:
- Frontend Dev Server

## Docker (Production-style)

From the project root:

1. Copy `.env.example` to `.env` and adjust values (GitHub secrets, tokens, etc.).
2. Build and start all services:
   - `docker compose up --build`

This will start:
- `codeax-backend` (FastAPI + Uvicorn on port 8000)
- `codeax-frontend` (Next.js production build on port 3000)
- `codeax-mongo` (MongoDB with persistent `mongo_data` volume)
