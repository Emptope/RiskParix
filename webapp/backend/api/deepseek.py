import os
import requests

class DeepSeekClient:
    def __init__(self, api_key=None, stock_id=None, model='deepseek-chat'):
        self.base_url = "https://api.deepseek.com/v1"
        self.model = model
        self.api_key = api_key
        self.stock_id = stock_id
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        self.kline_path = os.path.join("data", "day_klines", "sz50_klines.csv")
        self.metrics_path = os.path.join("data", "data_analysis", "all_metrics.csv")
        self.order_path = os.path.join("data", "data_analysis", "trade_records.csv")

    def get_system_prompt(self):
        return {
            "role": "system",
            "content": (
                "你是一名专注于股票技术指标和K线图分析的市场专家。\n"
                f"当前分析标的：{self.stock_id or '[未指定具体股票]'}\n"
                "可用数据路径：\n"
                f"- K线数据：{self.kline_path}\n"
                f"- 指标数据：{self.metrics_path}\n"
                f"- 订单簿数据：{self.order_path}\n"
                "请提供清晰、专业的分析，禁止使用 markdown 格式。"
            )
        }

    def chat(self, message, history=None):
        messages = [self.get_system_prompt()]
        if history:
            messages.extend(history)
        messages.append({"role": "user", "content": message})
        payload = {"model": self.model, "messages": messages, "stream": False}

        try:
            response = requests.post(
                f"{self.base_url}/chat/completions",
                headers=self.headers, json=payload
            )
            response.raise_for_status()
            return response.json()['choices'][0]['message']['content']
        except Exception as e:
            return f"[请求失败] {str(e)}"