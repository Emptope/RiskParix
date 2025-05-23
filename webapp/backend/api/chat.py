from fastapi import APIRouter, Body
from pydantic import BaseModel
from .deepseek import DeepSeekClient
from typing import Optional

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    history: list[dict] = []
    stock_id: Optional[str] = None

@router.post("/chat")
def chat(req: ChatRequest):
    client = DeepSeekClient(api_key="sk-9db9e88186f14721b11b70c8c791b1d7", stock_id=req.stock_id)
    response = client.chat(req.message, req.history)
    return {"response": response}