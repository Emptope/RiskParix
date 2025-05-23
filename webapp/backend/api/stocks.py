from fastapi import APIRouter
import pandas as pd
import os

router = APIRouter()

@router.get("/stocks") 
def get_stocks():
    path = os.path.join("data", "data_analysis", "details.csv")
    df = pd.read_csv(path)
    return df.to_dict(orient="records")
