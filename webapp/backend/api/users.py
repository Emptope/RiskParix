from fastapi import APIRouter
import pandas as pd
import os

router = APIRouter()

@router.get("/users")
def get_users():
    path = os.path.join("data", "data_analysis", "user_summary.csv")
    df = pd.read_csv(path)
    return df.to_dict(orient="records")