from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import pandas as pd
import os
from dotenv import load_dotenv
from pathlib import Path

load_dotenv()
app = FastAPI()

# --- Define Directories ---
BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / "data"
METRICS_FILE = DATA_DIR / "data_analysis/stock_metrics.csv"

# --- CORS Configuration ---
origins = [
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "null",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Data Loading Function ---
def load_stock_data():
    try:
        if not METRICS_FILE.exists():
            raise HTTPException(status_code=404, detail="Metrics file not found")
        
        df = pd.read_csv(METRICS_FILE)
        
        # 确保必要的列存在
        required_columns = ['code', 'annual_return', 'max_drawdown', 'sharpe']
        missing_cols = [col for col in required_columns if col not in df.columns]
        if missing_cols:
            raise HTTPException(
                status_code=400, 
                detail=f"CSV文件缺少必要列: {', '.join(missing_cols)}"
            )
        
        # 数据清洗
        numeric_cols = ['annual_return', 'max_drawdown', 'sharpe']
        for col in numeric_cols:
            df[col] = pd.to_numeric(df[col], errors='coerce')
        
        df = df.dropna(subset=numeric_cols)
        
        # 计算信号强度
        df['buy_signal_strength'] = df['sharpe'].apply(
            lambda x: round(x, 2) if pd.notnull(x) else 0
        )
        
        return df.to_dict('records')
        
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"数据处理错误: {str(e)}"
        )

# --- API Endpoints ---
@app.get("/api/stock_data")
async def get_stock_data():
    return load_stock_data()

# --- Mount Static Files ---
app.mount("/", StaticFiles(directory=BASE_DIR / "frontend", html=True), name="static")

# --- Run Server ---
if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    print(f"Starting server on http://127.0.0.1:{port}")
    print(f"Data file path: {METRICS_FILE}")
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)