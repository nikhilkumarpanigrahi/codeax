from fastapi import APIRouter

from app.models import ChatRequest, ChatResponse
from app.services.chatbot_service import ChatbotService

router = APIRouter()


@router.post("/", response_model=ChatResponse)
async def chat(payload: ChatRequest) -> ChatResponse:
    service = ChatbotService()
    return await service.respond(
        message=payload.message,
        owner=payload.owner,
        repo=payload.repo,
        conversation=payload.conversation,
    )
