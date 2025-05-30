from __future__ import annotations
from pathlib import Path
from typing import List, Dict, Optional

import pandas as pd
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from .deepseek import DeepSeekClient

# ------------------ 常量 ------------------ #
DATA_DIR = Path("data")
DETAILS_PATH = DATA_DIR / "data_analysis" / "details.parquet"
KLINE_PATH = DATA_DIR / "day_klines" / "all_klines.parquet"
ORDER_PATH = DATA_DIR / "order_book" / "order_book.parquet"
USER_SUMMARY_PATH = DATA_DIR / "order_book" / "user_summary.parquet"

router = APIRouter()


# ----------------- 数据上下文 ----------------- #
def _build_stock_context(stock_id: str, kline_rows: int = 60) -> str:
    """
    读取本地 parquet，拼接成对话上下文，供 LLM 使用。
    若数据不存在返回空串。
    """
    try:
        details_df = pd.read_parquet(DETAILS_PATH)
        kline_df = pd.read_parquet(KLINE_PATH)

        row = details_df.loc[details_df["证券代码"] == stock_id]
        latest_k = kline_df.loc[kline_df["证券代码"] == stock_id].tail(kline_rows)

        if row.empty or latest_k.empty:
            return ""

        r = row.iloc[0]
        ctx = [
            f"【{stock_id} 基础概况】",
            f"名称: {r['证券名称']}",
            f"年份: {r['年份']}  年涨跌幅: {r['年涨跌幅']}%  最大回撤: {r['最大回撤']}%",
            f"市盈率: {r['市盈率']}  市净率: {r['市净率']}  夏普比率: {r['夏普比率-普通收益率-日-一年定存利率']}",
            "",
            f"【最近 {kline_rows} 根 K 线（最新在后）】",
        ]
        for _, k in latest_k.iterrows():
            ctx.append(
                f"{k['交易日期']} | 开:{k['开盘价']} 收:{k['收盘价']} "
                f"高:{k['最高价']} 低:{k['最低价']}"
            )
        return "\n".join(ctx)
    except Exception as e:  # pragma: no cover
        # 保留空串而非报错，避免打断对话
        print(f"[chat._build_stock_context] 读取股票数据失败: {e}")
        return ""


def _build_strategy_context(user_id: str, recent: int = 10) -> str:
    """
    读取交易订单与汇总，返回用户交易策略分析上下文。
    """
    try:
        orders_df = pd.read_parquet(ORDER_PATH)
        summary_df = pd.read_parquet(USER_SUMMARY_PATH)

        orders = orders_df[orders_df["user"] == user_id]
        summary = summary_df[summary_df["user"] == user_id]

        if orders.empty or summary.empty:
            return ""

        s = summary.iloc[0]
        ctx = [
            f"【用户 {user_id} 汇总】",
            f"总交易笔数: {s['trades']}  总收益率: {s['returnRate']}%  胜率: {s['winRate']}%",
            "",
            f"【最近 {recent} 笔交易】",
        ]
        for _, o in orders.tail(recent).iterrows():
            ctx.append(
                f"{o['time']} | {o['code']} | {o['direction']} | "
                f"{o['price']} | {o['result']}"
            )
        return "\n".join(ctx)
    except Exception as e:  # pragma: no cover
        print(f"[chat._build_strategy_context] 读取用户交易数据失败: {e}")
        return ""


# ----------------- Pydantic ----------------- #
class ChatRequest(BaseModel):
    message: str
    history: List[Dict] = []
    stock_id: Optional[str] = None  # stock_id 或 user_id


# ----------------- 路由 ----------------- #
def _stream_response(
    client: DeepSeekClient, req: ChatRequest, sys_ctx: str = ""
) -> StreamingResponse:
    history = (req.history or [])[-6:]
    if sys_ctx:
        history.append({"role": "system", "content": sys_ctx})

    def event_stream():
        for chunk in client.stream_chat(req.message, history):
            yield f"data: {chunk}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@router.post("/chat/stock")
async def chat_stock(req: ChatRequest):
    """
    Details 页面专用：股票分析。
    """
    sys_ctx = _build_stock_context(req.stock_id or "")
    client = DeepSeekClient(stock_id=req.stock_id)
    return _stream_response(client, req, sys_ctx)


@router.post("/chat/strategy")
async def chat_strategy(req: ChatRequest):
    """
    Strategy 页面专用：用户交易策略分析。
    """
    sys_ctx = _build_strategy_context(req.stock_id or "")
    # stock_id 字段此处当作 user_id 透传，便于 DeepSeek 记录
    client = DeepSeekClient(stock_id=req.stock_id)
    return _stream_response(client, req, sys_ctx)
