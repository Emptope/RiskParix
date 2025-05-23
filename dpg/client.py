# client.py
import os
import requests
import json

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

    def get_system_prompt(self):
        prompt = (
            "你是一名专注于股票技术指标和K线图分析的市场专家。"
            f"{'当前分析标的：' + self.stock_id if self.stock_id else '[未指定具体股票]'}\n"
            "分析K线数据时请包含：趋势分析（短期/中期/长期）、支撑/阻力位、成交量、形态、MACD/RSI/布林带\n"
            f"数据路径：K线({self.kline_path}) 指标({self.metrics_path})"
        )
        return {"role": "system", "content": prompt}

    def chat(self, message, history=None):
        messages = [self.get_system_prompt()]
        if history:
            messages.extend(history)
        messages.append({"role": "user", "content": message})
        payload = {"model": self.model, "messages": messages, "stream": False}
        try:
            rsp = requests.post(f"{self.base_url}/chat/completions",
                                headers=self.headers, json=payload)
            rsp.raise_for_status()
            return rsp.json()['choices'][0]['message']['content']
        except Exception as e:
            return f"[请求失败] {e}"
