from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database.mongodb import connect_to_mongo, close_mongo_connection
from app.routers import analysis, chat, health, pull_requests, repositories, webhooks
from app.routers.repo import router as repo_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan handler.

    It ensures that the MongoDB connection is initialized when FastAPI
    starts and properly closed when the application shuts down.
    """
    await connect_to_mongo()
    yield
    await close_mongo_connection()

app = FastAPI(title="Codeax", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(repo_router, tags=["repo"])
app.include_router(repositories.router, prefix="/api/repositories", tags=["repositories"])
app.include_router(pull_requests.router, prefix="/api/pull-requests", tags=["pull-requests"])
app.include_router(analysis.router, prefix="/api/analysis", tags=["analysis"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(webhooks.router, prefix="/api/webhooks", tags=["webhooks"])