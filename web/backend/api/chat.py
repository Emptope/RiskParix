from fastapi import APIRouter, Body
from pydantic import BaseModel
from .deepseek import DeepSeekClient
from typing import Optional
from fastapi.responses import StreamingResponse
import os
import pandas as pd

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
    
    # 如果消息中包含交易策略分析关键词，添加交易数据上下文
    if req.stock_id and ("策略" in req.message or "交易" in req.message or "分析" in req.message):
        try:
            # 读取该用户的交易记录
            order_path = os.path.join("data", "order_book", "order_book.csv")
            orders_df = pd.read_csv(order_path)
            user_orders = orders_df[orders_df['user'] == req.stock_id]
            
            # 读取用户汇总数据
            summary_path = os.path.join("data", "order_book", "user_summary.csv")
            summary_df = pd.read_csv(summary_path)
            user_summary = summary_df[summary_df['user'] == req.stock_id]
            
            # 构建数据上下文
            if not user_orders.empty and not user_summary.empty:
                data_context = f"\n用户 {req.stock_id} 的交易数据:\n"
                data_context += f"总交易次数: {user_summary['trades'].values[0]}\n"
                data_context += f"总收益率: {user_summary['returnRate'].values[0]}%\n"
                data_context += f"胜率: {user_summary['winRate'].values[0]}%\n\n"
                
                # 添加最近10笔交易记录
                recent_orders = user_orders.tail(10)
                data_context += "最近交易记录:\n"
                for _, order in recent_orders.iterrows():
                    data_context += f"时间: {order['time']}, 代码: {order['code']}, "
                    data_context += f"方向: {order['direction']}, 价格: {order['price']}, "
                    data_context += f"结果: {order['result']}\n"
                
                # 在用户消息前添加数据上下文
                context_message = {"role": "system", "content": data_context}
                trimmed_history.append(context_message)
        except Exception as e:
            print(f"加载交易数据出错: {str(e)}")

    def event_stream():
        for chunk in client.stream_chat(req.message, trimmed_history):
            yield f"data: {chunk}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")
