from dearpygui.dearpygui import *
from dearpygui.dearpygui import log_info
from dearpygui.dearpygui import add_candle_series
import pandas as pd
import os
import requests
import threading

# ==== 全局变量 ====
stock_code = "sh.600028"
kline_path = os.path.join("data", "day_klines", "sz50_klines.csv")
metrics_path = os.path.join("data", "data_analysis", "all_metrics.csv")
API_KEY = "你的 deepseek api key"
history = []

# ==== 数据预加载 ====
def load_data():
    df_k = pd.read_csv(kline_path)
    df_k = df_k[df_k["code"] == stock_code].copy()
    df_k["date"] = pd.to_datetime(df_k["date"])
    df_k.set_index("date", inplace=True)

    df_m = pd.read_csv(metrics_path)
    df_m = df_m[df_m["code"] == stock_code]
    return df_k, df_m

df_k, df_m = load_data()

# ==== 系统提示 ====
def get_system_prompt():
    return {
        "role": "system",
        "content": (
            "你是一名专注于股票技术指标和K线图分析的市场专家。\n"
            f"当前分析标的：{stock_code}。\n"
            "请提供趋势、支撑位、成交量、技术指标等技术分析建议。"
        )
    }

# ==== Candlestick 绘图 ====
def update_kline(period_label):
    period_map = {
        "日K": "D",
        "周K": "W-MON",
        "月K": "M",
        "季K": "Q",
        "年K": "Y"
    }
    rule = period_map.get(period_label, "D")

    resampled = df_k.resample(rule).agg({
        'open': 'first',
        'high': 'max',
        'low': 'min',
        'close': 'last'
    }).dropna()

    ohlc_data = [
        [int(date.timestamp()), row["open"], row["high"], row["low"], row["close"]]
        for date, row in resampled.iterrows()
    ]

    configure_item("kline", ohlc=ohlc_data)

# ==== 聊天发送 ====
def query_deepseek(message):
    global history
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    messages = [get_system_prompt()] + history + [{"role": "user", "content": message}]
    payload = {
        "model": "deepseek-chat",
        "messages": messages,
        "stream": False
    }
    try:
        response = requests.post("https://api.deepseek.com/v1/chat/completions", headers=headers, json=payload)
        response.raise_for_status()
        reply = response.json()["choices"][0]["message"]["content"]
    except Exception as e:
        reply = f"[请求失败] {str(e)}"
    history.append({"role": "user", "content": message})
    history.append({"role": "assistant", "content": reply})
    add_text(f"助手: {reply}", parent="chat_output")

def send_message_callback(sender, app_data, user_data):
    message = get_value("chat_input").strip()
    if message:
        add_text(f"用户: {message}", parent="chat_output")
        set_value("chat_input", "")
        threading.Thread(target=query_deepseek, args=(message,)).start()

# ==== UI 构建 ====
with window(label="股票详情页", width=1300, height=800):
    add_text(f"股票代码：{stock_code}", bullet=True)

    with group(horizontal=True):

        # ===== 左侧参数面板 =====
        with child_window(width=300, border=True):
            add_text("估值参数", color=[255, 128, 0])
            add_input_float(label="FCFE估值", default_value=0.0, tag="fcfe_val")
            add_input_float(label="FCFF估值", default_value=0.0, tag="fcff_val")

            add_separator()
            add_text("金融指标")
            add_input_float(label="年化收益率", default_value=0.0, tag="annual_return")
            add_input_float(label="最大回撤", default_value=0.0, tag="max_drawdown")
            add_input_float(label="夏普比率", default_value=0.0, tag="sharpe_ratio")

            add_separator()
            add_text("相关股票")
            add_combo(label="相关性依据", items=["估值", "行业", "财务"], default_value="估值", tag="correl_basis")
            add_listbox(label="相关股票", items=["sh.600028", "sh.600519", "sh.601318"], num_items=5, tag="related_list")

            add_button(label="编辑股票", callback=lambda: log_info("编辑待实现"))

        # ===== 中间图表区 =====
        with child_window(width=700, border=True):
            add_text("K线图")

            add_combo(label="K线周期", items=["日K", "周K", "月K", "季K", "年K"],
                      default_value="日K",
                      callback=lambda s, a, u: update_kline(a))

            with plot(label="K线图", height=500, width=680):
                add_plot_axis(mvXAxis, label="时间", time=True)
                with add_plot_axis(mvYAxis, label="价格", tag="y_axis"):
                    add_candle_series([], tag="kline", weight=0.3)

        # ===== 聊天窗口 =====
        with child_window(width=300, border=True):
            add_text("聊天分析助手")
            add_input_text(label="", tag="chat_input", hint="请输入问题", on_enter=True, callback=send_message_callback)
            add_button(label="发送", callback=send_message_callback)
            add_child_window(height=500, tag="chat_output", border=True)

# ==== 页面初始化 ====
update_kline("日K")

# 自动填充指标参数
if not df_m.empty:
    set_value("fcfe_val", float(df_m.iloc[0].get("fcfe", 0)))
    set_value("fcff_val", float(df_m.iloc[0].get("fcff", 0)))
    set_value("annual_return", float(df_m.iloc[0].get("annualized_return", 0)))
    set_value("max_drawdown", float(df_m.iloc[0].get("max_drawdown", 0)))
    set_value("sharpe_ratio", float(df_m.iloc[0].get("sharpe_ratio", 0)))

start_dearpygui()