from fastapi import APIRouter
from fastapi.responses import JSONResponse
import duckdb
import os

router = APIRouter()

KLINE_PATH = os.path.join("data", "day_klines", "all_klines.parquet")

def normalize_code(code: str) -> str:
    code = code.upper().replace("-", "").replace(".", "")
    if code.startswith("SH"):
        return f"sh.{code[2:]}"
    elif code.startswith("SZ"):
        return f"sz.{code[2:]}"
    elif code.endswith("SH"):
        return f"sh.{code[:-2]}"
    elif code.endswith("SZ"):
        return f"sz.{code[:-2]}"
    else:
        return f"{'sh' if code.startswith('6') else 'sz'}.{code}"

@router.get("/kline/{code}")
async def get_kline(code: str):
    """
    获取股票 K 线图数据，支持多种股票代码格式。
    """
    try:
        norm_code = normalize_code(code)

        con = duckdb.connect()
        query = f"""
        SELECT date, open, close, high, low
        FROM read_parquet('{KLINE_PATH}')
        WHERE code = '{norm_code}'
        """
        result = con.execute(query).fetchdf()
        con.close()

        if result.empty:
            return JSONResponse({"error": f"未找到股票代码: {norm_code}"}, status_code=404)

        # 构造返回值
        kline_data = [
            {
                "date": row["date"],
                "open": float(row["open"]),
                "close": float(row["close"]),
                "high": float(row["high"]),
                "low": float(row["low"]),
            }
            for _, row in result.iterrows()
        ]

        return kline_data

    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)
