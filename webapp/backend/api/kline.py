from fastapi import APIRouter
from fastapi.responses import JSONResponse
import pandas as pd
import os

router = APIRouter()

KLINE_CSV_PATH = os.path.join("data", "day_klines", "all_klines.csv")

@router.get("/kline/{code}")
async def get_kline(code: str):
    """
    获取股票 K 线图数据，自动识别并转换股票代码格式。
    支持形式：600221, SH600221, 600221.SH, sz000001
    """
    try:
        df = pd.read_csv(KLINE_CSV_PATH, encoding="utf-8-sig")

        code = code.upper().replace("-", "").replace(".", "")
        if code.startswith("SH"):
            norm_code = f"sh.{code[2:]}"
        elif code.startswith("SZ"):
            norm_code = f"sz.{code[2:]}"
        elif code.endswith("SH"):
            norm_code = f"sh.{code[:-2]}"
        elif code.endswith("SZ"):
            norm_code = f"sz.{code[:-2]}"
        else:
            norm_code = f"{'sh' if code.startswith('6') else 'sz'}.{code}"

        if norm_code not in df["code"].values:
            return JSONResponse({"error": f"未找到股票代码: {norm_code}"}, status_code=404)

        filtered = df[df["code"] == norm_code].copy()
        result = filtered[["date", "open", "close", "high", "low"]].dropna()

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