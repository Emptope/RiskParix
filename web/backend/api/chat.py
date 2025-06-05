from __future__ import annotations
from pathlib import Path
from typing import List, Dict, Optional

import re
import json
import duckdb
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from .deepseek import DeepSeekClient

# ---------- 文件路径 ----------
DATA_DIR = Path("data")
DETAILS_PATH = DATA_DIR / "data_analysis" / "details.parquet"
KLINE_PATH = DATA_DIR / "day_klines" / "all_klines.parquet"
ORDER_PATH = DATA_DIR / "order_book" / "order_book.parquet"
USER_SUMMARY_PATH = DATA_DIR / "order_book" / "user_summary.parquet"

# 全局 DuckDB 连接
CON = duckdb.connect(database=":memory:", read_only=False)

router = APIRouter()


# ---------- 工具函数 ----------
def _detect_col(path: Path, candidates: list[str]) -> str | None:
    """从 parquet header 中找出真实列名（大小写匹配）。"""
    cols = CON.execute(
        f"SELECT * FROM read_parquet('{path.as_posix()}') LIMIT 0"
    ).fetchdf().columns.tolist()
    for c in candidates:
        for real in cols:
            if real.lower() == c.lower():
                return real  # 返回实际列名，保持大小写
    return None


def _read_filter_df(
    path: Path,
    key_val: str,
    key_candidates: list[str],
    extra_sql: str = "",
):
    """
    读取 parquet → DataFrame，按 key 列筛选。
    自动大小写匹配列名，避免 Binder Error。
    """
    key_col = _detect_col(path, key_candidates)
    if key_col is None:
        print(f"[WARN] {path.name} 中找不到列名 {tuple(key_candidates)}")
        import pandas as pd
        return pd.DataFrame()  # type: ignore

    # 使用 lower() 消除大小写 + 引号问题
    query = (
        f"SELECT * FROM read_parquet('{path.as_posix()}') "
        f"WHERE lower({key_col}) = lower(?) {extra_sql}"
    )
    return CON.execute(query, [key_val]).fetchdf()


# --------- 代码互转（000001.SZ ↔ sz.000001） ---------
def _to_kline_code(stock_id: str) -> str:
    m = re.fullmatch(r"(\d{6})\.(SZ|SH)", stock_id.upper())
    if m:
        prefix = "sz" if m.group(2) == "SZ" else "sh"
        return f"{prefix}.{m.group(1)}"
    return stock_id  # 已是 sz./sh. 形式或其他

def _to_detail_code(kline_code: str) -> str:
    m = re.fullmatch(r"(sz|sh)\.(\d{6})", kline_code.lower())
    if m:
        suffix = "SZ" if m.group(1) == "sz" else "SH"
        return f"{m.group(2)}.{suffix}"
    return kline_code


# ---------- 构造上下文 ----------
def _build_stock_context(stock_id: str, kline_rows: int = 60) -> str:
    try:
        detail_code = stock_id
        kline_code = _to_kline_code(stock_id)

        details_df = _read_filter_df(
            DETAILS_PATH, detail_code,
            key_candidates=["证券代码", "code", "股票代码", "stock_code"]
        )
        kline_df = _read_filter_df(
            KLINE_PATH, kline_code,
            key_candidates=["code", "证券代码", "stock_code"],
            extra_sql=f'ORDER BY date DESC LIMIT {kline_rows}'
        )

        if details_df.empty:
            print(f"[WARN] 股票详情中找不到代码: {detail_code}")
            return ""
        if kline_df.empty:
            print(f"[WARN] K线数据中找不到代码: {kline_code}")
            return ""

        r = details_df.iloc[0]
        ctx = [
            f"【{stock_id} 基础概况】",
            f"名称: {r.get('证券名称', r.get('name', ''))}",
            f"年份: {r['年份']}  年涨跌幅: {r['年涨跌幅']}%  最大回撤: {r['最大回撤']}%",
            f"市盈率: {r['市盈率']}  市净率: {r['市净率']}  夏普比率: {r['夏普比率-普通收益率-日-一年定存利率']}",
            "",
            f"【最近 {kline_rows} 根 K 线（最新在后）】",
        ]
        for _, k in kline_df.iloc[::-1].iterrows():  # 时间升序
            ctx.append(
                f"{k['date']} | 开:{k['open']} 收:{k['close']} "
                f"高:{k['high']} 低:{k['low']}"
            )
        return "\n".join(ctx)

    except Exception as e:
        print(f"[chat._build_stock_context] 读取股票数据失败: {e}")
        return ""


def _build_strategy_context(user_id: str, recent: int = 10) -> str:
    try:
        orders_df = _read_filter_df(
            ORDER_PATH, user_id, key_candidates=["user"],
            extra_sql=f'ORDER BY time DESC LIMIT {recent}'
        )
        summary_df = _read_filter_df(
            USER_SUMMARY_PATH, user_id, key_candidates=["user"]
        )

        if orders_df.empty or summary_df.empty:
            print(f"[WARN] 用户 {user_id} 的订单或汇总为空")
            return ""

        s = summary_df.iloc[0]
        ctx = [
            f"【用户 {user_id} 汇总】",
            f"总交易笔数: {s['trades']}  总收益率: {s['returnRate']}%  胜率: {s['winRate']}%",
            "",
            f"【最近 {recent} 笔交易】",
        ]
        for _, o in orders_df.iloc[::-1].iterrows():
            ctx.append(
                f"{o['time']} | {o['code']} | {o['direction']} | "
                f"{o['price']} | {o['result']}"
            )
        return "\n".join(ctx)
    except Exception as e:
        print(f"[chat._build_strategy_context] 读取用户交易数据失败: {e}")
        return ""


# ---------- 请求 & 流式返回 ----------
class ChatRequest(BaseModel):
    message: str
    history: List[Dict] = []
    stock_id: Optional[str] = None  # 股票或用户 ID


def _stream_response(
    client: DeepSeekClient, req: ChatRequest, sys_ctx: str = ""
) -> StreamingResponse:
    history = (req.history or [])[-6:]
    if sys_ctx:
        history.append({"role": "system", "content": sys_ctx})

    def event_stream():
        for chunk in client.stream_chat(req.message, history):
            data = json.dumps({"content": chunk}, ensure_ascii=False)
            yield f"data: {data}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


# ---------- 路由 ----------
@router.post("/chat/stock")
async def chat_stock(req: ChatRequest):
    sys_ctx = _build_stock_context(req.stock_id or "")
    client = DeepSeekClient(stock_id=req.stock_id)
    return _stream_response(client, req, sys_ctx)


@router.post("/chat/strategy")
async def chat_strategy(req: ChatRequest):
    sys_ctx = _build_strategy_context(req.stock_id or "")
    client = DeepSeekClient(stock_id=req.stock_id)
    return _stream_response(client, req, sys_ctx)
