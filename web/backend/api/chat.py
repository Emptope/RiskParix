from fastapi import APIRouter, Body
from pydantic import BaseModel
from .deepseek import DeepSeekClient
from typing import Optional
from fastapi.responses import StreamingResponse

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    history: list[dict] = []
    stock_id: Optional[str] = None

@router.post("/chat/stream")
def chat_stream(req: ChatRequest):
    client = DeepSeekClient(api_key="sk-9db9e88186f14721b11b70c8c791b1d7", stock_id=req.stock_id)

    # 保留历史对话不超过最近 6 条（3 轮问答），避免重复
    trimmed_history = (req.history or [])[-6:]

    def event_stream():
        for chunk in client.stream_chat(req.message, trimmed_history):
            yield f"data: {chunk}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")
