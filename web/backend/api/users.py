from fastapi import APIRouter
import duckdb
import os

router = APIRouter()

@router.get("/users")
def get_users():
    conn = duckdb.connect(database=':memory:')
    path = os.path.join("data", "order_book", "user_summary.parquet")
    query = f"SELECT * FROM '{path}'"
    df = conn.query(query).to_df()
    conn.close()
    return df.to_dict(orient="records")

@router.get("/order_book")
def get_order_book():
    conn = duckdb.connect(database=':memory:')
    path = os.path.join("data", "order_book", "order_book.parquet")
    query = f"SELECT * FROM '{path}'"
    df = conn.query(query).to_df()
    conn.close()
    return df.to_dict(orient="records")
