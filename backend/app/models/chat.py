from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: str = Field(pattern="^(user|assistant)$")
    content: str = Field(min_length=1, max_length=2000)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    owner: str | None = None
    repo: str | None = None
    conversation: list[ChatMessage] = Field(default_factory=list)


class ChatResponse(BaseModel):
    answer: str
    suggestions: list[str] = Field(default_factory=list)
    context: dict[str, str | int | float | bool | None] = Field(default_factory=dict)
