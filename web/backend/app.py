from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api import chat, users, stocks, kline

app = FastAPI()

# CORS 配置，允许前端访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 路由注册
app.include_router(chat.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(stocks.router, prefix="/api")
app.include_router(kline.router, prefix="/api") 

@app.get("/")
def root():
    return {"message": "Backend is running."}