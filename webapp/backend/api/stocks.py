from fastapi import APIRouter
import duckdb
import os

router = APIRouter()

@router.get("/stocks")
def get_stocks():
    path = os.path.join("data", "data_analysis", "details.parquet")
    query = f"SELECT * FROM '{path}'"
    df = duckdb.query(query).to_df()
    return df.to_dict(orient="records")
