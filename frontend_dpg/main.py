import dearpygui.dearpygui as dpg
import pandas as pd
import os
import csv
import requests
import threading
from datetime import datetime

# ==== 全局变量 ====
stock_code = "sh.600028"
kline_path = os.path.join("data", "day_klines", "sz50_klines.csv")
metrics_path = os.path.join("data", "data_analysis", "all_metrics.csv")
details_path = os.path.join("data", "data_analysis", "details.csv")
API_KEY = "sk-9db9e88186f14721b11b70c8c791b1d7"
history = []

# ==== 数据预加载 ====
def load_data():
    # 创建必要的目录
    os.makedirs(os.path.dirname(kline_path), exist_ok=True)
    os.makedirs(os.path.dirname(metrics_path), exist_ok=True)
    os.makedirs(os.path.dirname(details_path), exist_ok=True)
    
    # 如果数据文件不存在，创建示例数据
    if not os.path.exists(kline_path):
        create_sample_kline_data()
    if not os.path.exists(metrics_path):
        create_sample_metrics_data()
    if not os.path.exists(details_path):
        create_sample_details_data()
    
    df_k = pd.read_csv(kline_path)
    df_k = df_k[df_k["code"] == stock_code].copy()
    df_k["date"] = pd.to_datetime(df_k["date"])
    df_k.set_index("date", inplace=True)

    df_m = pd.read_csv(metrics_path)
    df_m = df_m[df_m["code"] == stock_code]
    
    return df_k, df_m

def create_sample_kline_data():
    dates = pd.date_range(start="2023-01-01", end="2024-01-01", freq="D")
    data = {
        "code": [stock_code] * len(dates),
        "date": dates,
        "open": [100 + i * 0.1 + (i % 7) for i in range(len(dates))],
        "high": [101 + i * 0.1 + (i % 7) for i in range(len(dates))],
        "low": [99 + i * 0.1 + (i % 7) for i in range(len(dates))],
        "close": [100.5 + i * 0.1 + (i % 7) for i in range(len(dates))],
        "volume": [1000000 + i * 10000 for i in range(len(dates))]
    }
    df = pd.DataFrame(data)
    df.to_csv(kline_path, index=False)

def create_sample_metrics_data():
    data = {
        "code": [stock_code],
        "fcfe": [15.2],
        "fcff": [14.8],
        "annualized_return": [12.5],
        "max_drawdown": [25.3],
        "sharpe_ratio": [1.8]
    }
    df = pd.DataFrame(data)
    df.to_csv(metrics_path, index=False)

def create_sample_details_data():
    data = [
        ["code", "name", "year", "return", "volatility", "sortino", "max_drawdown", "sharpe"],
        ["sh.600028", "中国石化", "2024-12-31", "15.2", "12.3", "1.5", "25.3", "1.8"],
        ["sh.600519", "贵州茅台", "2024-12-31", "25.6", "15.2", "2.1", "18.7", "2.3"],
        ["sh.601318", "中国平安", "2024-12-31", "18.9", "14.5", "1.8", "22.1", "2.0"]
    ]
    with open(details_path, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.writer(f)
        writer.writerows(data)

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

    df_k, _ = load_data()
    resampled = df_k.resample(rule).agg({
        'open': 'first',
        'high': 'max',
        'low': 'min',
        'close': 'last'
    }).dropna()

    dates = [int(date.timestamp()) for date in resampled.index]
    opens = resampled['open'].values.tolist()
    highs = resampled['high'].values.tolist()
    lows = resampled['low'].values.tolist()
    closes = resampled['close'].values.tolist()

    # 更新K线数据
    dpg.set_value("kline", [dates, opens, highs, lows, closes])

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
    dpg.add_text(f"助手: {reply}", parent="chat_output")

def send_message_callback(sender, app_data, user_data):
    message = dpg.get_value("chat_input").strip()
    if message:
        dpg.add_text(f"用户: {message}", parent="chat_output")
        dpg.set_value("chat_input", "")
        threading.Thread(target=query_deepseek, args=(message,)).start()

# ==== 股票列表加载 ====
def load_stock_data():
    dpg.delete_item("stock_table", children_only=True)
    try:
        with open(details_path, "r", encoding="utf-8-sig") as file:
            reader = csv.reader(file)
            next(reader)  # Skip header
            for row in reader:
                if row[2] == "2024-12-31" and float(row[3]) > 10:
                    with dpg.table_row(parent="stock_table"):
                        dpg.add_text(row[0])
                        dpg.add_text(row[1])
                        dpg.add_text(f"{float(row[3]):.2f}%")
                        dpg.add_text(f"{float(row[6]):.2f}%")
                        dpg.add_text(f"{float(row[7]):.2f}")
    except FileNotFoundError:
        with dpg.table_row(parent="stock_table"):
            dpg.add_text("数据文件未找到")
            dpg.add_text("")
            dpg.add_text("")
            dpg.add_text("")
            dpg.add_text("")

# ==== 页面切换 ====
def show_home_page():
    dpg.hide_item("detail_page")
    dpg.show_item("home_page")

def show_detail_page():
    dpg.hide_item("home_page")
    dpg.show_item("detail_page")
    
    # 更新K线图
    update_kline("日K")
    
    # 自动填充指标参数
    _, df_m = load_data()
    if not df_m.empty:
        dpg.set_value("fcfe_val", float(df_m.iloc[0].get("fcfe", 0)))
        dpg.set_value("fcff_val", float(df_m.iloc[0].get("fcff", 0)))
        dpg.set_value("annual_return", float(df_m.iloc[0].get("annualized_return", 0)))
        dpg.set_value("max_drawdown", float(df_m.iloc[0].get("max_drawdown", 0)))
        dpg.set_value("sharpe_ratio", float(df_m.iloc[0].get("sharpe_ratio", 0)))

# ==== UI 构建 ====
def setup_ui():
    dpg.create_context()
    # === 加载中文字体 ===
    with dpg.font_registry():
        with dpg.font("frontend_dpg\song.ttf", 18) as font1: 
            dpg.add_font_range_hint(dpg.mvFontRangeHint_Default)
            dpg.add_font_range_hint(dpg.mvFontRangeHint_Chinese_Simplified_Common)
            dpg.add_font_range_hint(dpg.mvFontRangeHint_Chinese_Full)
        dpg.bind_font(font1)

    dpg.create_viewport(title='股票分析系统', width=1400, height=900)

    # ==== 主页 ====
    with dpg.window(label="主页", tag="home_page", width=1400, height=900):
        dpg.add_text("导航栏", bullet=True)
        dpg.add_button(label="主页", callback=show_home_page)
        dpg.add_button(label="股票详情", callback=show_detail_page)

        dpg.add_spacer()
        dpg.add_spacer()
        dpg.add_separator()

        with dpg.group(horizontal=True):
            with dpg.child_window(width=200, height=800):
                dpg.add_text("服务列表")
                dpg.add_listbox(items=["soufflé服务器", "数据库", "baostock实时行情"], width=180)

            with dpg.child_window(width=300, height=800):
                dpg.add_text("筛选列表")
                dpg.add_combo(label="年份", items=[str(i) for i in range(2014, 2025)], width=150)
                dpg.add_slider_float(label="年化收益率", min_value=0, max_value=50)
                dpg.add_slider_float(label="最大回撤", min_value=0, max_value=100)
                dpg.add_slider_float(label="索提娜比率", min_value=0, max_value=5)
                dpg.add_slider_float(label="夏普比率", min_value=0, max_value=5)
                dpg.add_combo(label="龙头股", items=["是", "否"])
                dpg.add_combo(label="行业", items=[
                    "A农林牧渔", "B采矿业", "C制造业", "D电力热力燃气及水生产和供应业",
                    "E建筑业", "F批发和零售业", "G交通运输仓储和邮政业", "H住宿和餐饮业",
                    "I信息传输软件和信息技术服务业", "J金融业", "K房地产业", "L租赁和商务服务业",
                    "M科学研究和技术服务业", "N水利环境和公共设施管理业", "O居民服务修理和其他服务业",
                    "P教育", "Q卫生和社会工作", "R文化体育和娱乐业", "S公共管理社会保障和社会组织", "T国际组织"
                ], width=250)

            with dpg.child_window(width=800, height=800):
                dpg.add_text("股票列表")
                with dpg.table(header_row=True, resizable=True, policy=dpg.mvTable_SizingStretchProp, 
                           borders_innerV=True, borders_outerH=True, borders_outerV=True,
                           row_background=True, delay_search=True, tag="stock_table"):
                    dpg.add_table_column(label="证券代码")
                    dpg.add_table_column(label="证券名称")
                    dpg.add_table_column(label="年化收益率")
                    dpg.add_table_column(label="最大回撤")
                    dpg.add_table_column(label="夏普比率")
                load_stock_data()

    # ==== 详情页 ====
    with dpg.window(label="股票详情页", tag="detail_page", width=1400, height=900, show=False):
        dpg.add_text(f"股票代码：{stock_code}", bullet=True)
        dpg.add_button(label="返回主页", callback=show_home_page)

        with dpg.group(horizontal=True):
            # ===== 左侧参数面板 =====
            with dpg.child_window(width=300, border=True):
                dpg.add_text("估值参数", color=[255, 128, 0])
                dpg.add_input_float(label="FCFE估值", default_value=0.0, tag="fcfe_val")
                dpg.add_input_float(label="FCFF估值", default_value=0.0, tag="fcff_val")

                dpg.add_separator()
                dpg.add_text("金融指标")
                dpg.add_input_float(label="年化收益率", default_value=0.0, tag="annual_return")
                dpg.add_input_float(label="最大回撤", default_value=0.0, tag="max_drawdown")
                dpg.add_input_float(label="夏普比率", default_value=0.0, tag="sharpe_ratio")

                dpg.add_separator()
                dpg.add_text("相关股票")
                dpg.add_combo(label="相关性依据", items=["估值", "行业", "财务"], default_value="估值", tag="correl_basis")
                dpg.add_listbox(label="相关股票", items=["sh.600028", "sh.600519", "sh.601318"], num_items=5, tag="related_list")

                dpg.add_button(label="编辑股票", callback=lambda: dpg.log_info("编辑待实现"))

            # ===== 中间图表区 =====
            with dpg.child_window(width=700, border=True):
                dpg.add_text("K线图")

                dpg.add_combo(label="K线周期", items=["日K", "周K", "月K", "季K", "年K"],
                          default_value="日K",
                          callback=lambda s, a, u: update_kline(a))

                with dpg.plot(label="K线图", height=500, width=680):
                    # 创建X轴和Y轴
                    dpg.add_plot_axis(dpg.mvXAxis, label="时间", tag="x_axis")
                    dpg.add_plot_axis(dpg.mvYAxis, label="价格", tag="y_axis")
                    
                    # 初始化空数据
                    dates = []
                    opens = []
                    highs = []
                    lows = []
                    closes = []
                    
                    # 添加蜡烛图系列
                    dpg.add_candle_series(
                        dates, opens, closes, lows, highs, 
                        parent="y_axis", 
                        tag="kline", 
                        weight=0.3
                    )
            
            # ===== 聊天窗口 =====
            with dpg.child_window(width=300, border=True):
                dpg.add_text("聊天分析助手")
                dpg.add_input_text(label="", tag="chat_input", hint="请输入问题", on_enter=True, callback=send_message_callback)
                dpg.add_button(label="发送", callback=send_message_callback)
                dpg.add_child_window(height=500, tag="chat_output", border=True)

    dpg.setup_dearpygui()
    dpg.show_viewport()
    dpg.set_primary_window("home_page", True)
    dpg.start_dearpygui()
    dpg.destroy_context()

if __name__ == "__main__":
    setup_ui()