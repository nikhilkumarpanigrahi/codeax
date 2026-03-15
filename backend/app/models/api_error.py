from pydantic import BaseModel


class ApiErrorDetail(BaseModel):
    code: str
    message: str
    request_id: str | None = None


class ApiErrorResponse(BaseModel):
    error: ApiErrorDetail
