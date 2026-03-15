from fastapi import APIRouter

router = APIRouter()


@router.get("/")
async def root() -> dict[str, str]:
    return {
        "message": "Codeax AI Backend",
        "description": "AI coordinator driven PR analysis with security and test generation",
        "docs": "/docs",
        "openapi": "/openapi.json",
    }


@router.get("/health")
async def health() -> dict[str, str]:
    return {"status": "healthy", "service": "backend", "version": "0.1.0"}
