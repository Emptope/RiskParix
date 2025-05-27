from fastapi import APIRouter
import duckdb
import os

router = APIRouter()

@router.get("/users")
def get_users():
    path = os.path.join("data", "data_analysis", "user_summary.parquet")
    query = f"SELECT * FROM '{path}'"
    df = duckdb.query(query).to_df()
    return df.to_dict(orient="records")