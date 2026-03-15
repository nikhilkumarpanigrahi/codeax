from contextlib import asynccontextmanager
from uuid import uuid4

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database.client import connect_to_mongo, close_mongo_connection
from app.errors import AppError
from app.models import ApiErrorResponse
from app.routers import analysis, chat, health, pull_requests, repositories, webhooks

@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongo()
    yield
    await close_mongo_connection()

app = FastAPI(title="Codeax AI", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(repositories.router, prefix="/api/repositories", tags=["repositories"])
app.include_router(pull_requests.router, prefix="/api/pull-requests", tags=["pull-requests"])
app.include_router(analysis.router, prefix="/api/analysis", tags=["analysis"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(webhooks.router, prefix="/api/webhooks", tags=["webhooks"])


@app.exception_handler(AppError)
async def handle_app_error(request: Request, exc: AppError):
    request_id = request.headers.get("x-request-id") or str(uuid4())
    payload = ApiErrorResponse(error={"code": exc.code, "message": exc.message, "request_id": request_id})
    return JSONResponse(status_code=exc.status_code, content=payload.model_dump())


@app.exception_handler(HTTPException)
async def handle_http_exception(request: Request, exc: HTTPException):
    request_id = request.headers.get("x-request-id") or str(uuid4())
    payload = ApiErrorResponse(
        error={
            "code": f"http_{exc.status_code}",
            "message": str(exc.detail),
            "request_id": request_id,
        }
    )
    return JSONResponse(status_code=exc.status_code, content=payload.model_dump())


@app.exception_handler(Exception)
async def handle_unexpected_exception(request: Request, _: Exception):
    request_id = request.headers.get("x-request-id") or str(uuid4())
    payload = ApiErrorResponse(
        error={
            "code": "internal_error",
            "message": "Unexpected server error",
            "request_id": request_id,
        }
    )
    return JSONResponse(status_code=500, content=payload.model_dump())