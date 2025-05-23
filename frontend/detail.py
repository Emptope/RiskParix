import os
import pandas as pd
import tkinter as tk
from tkinter import ttk, messagebox, scrolledtext
import matplotlib.pyplot as plt
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg, NavigationToolbar2Tk
import mplfinance as mpf
from matplotlib import rcParams
import requests
import threading
import json
import time

# 全局设置中文字体
plt.rcParams['font.sans-serif'] = ['SimHei']  # 使用黑体显示中文
plt.rcParams['axes.unicode_minus'] = False  # 解决负号显示问题
mpf.__version__

# ========== DeepSeek 客户端 ==========
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
        self.order_path = os.path.join("data", "order_book", "order_book.csv")

    def get_system_prompt(self):
        system_prompt = (
            "你是一名专注于股票技术指标和K线图分析的市场专家。"
            f"{'当前分析标的：' + self.stock_id if self.stock_id else '[未指定具体股票]'}\n"
            "分析K线数据时请包含以下要素：\n"
            "1. 趋势分析（短期、中期、长期）\n"
            "2. 关键支撑位和阻力位\n"
            "3. 成交量分析\n"
            "4. 常见形态分析（头肩顶/底、双顶/底等）\n"
            "5. 关键技术指标（MACD、RSI、布林带等）\n\n"
            f"可用数据路径：\n"
            f"- K线数据：{self.kline_path}\n"
            f"- 指标数据：{self.metrics_path}\n"
            "请提供清晰、专业的分析报告，包含可操作的见解。"
            "禁止使用 - * # 等 markdown 格式，直接输出文本。"
        )
        return {"role": "system", "content": system_prompt}

    def get_strategy_prompt(self):
        strategy_prompt = (
            """
            你是一名专注于股票技术指标和K线图分析的市场专家。
            你需要分析一个订单簿，然后根据这个订单簿，结合K线数据，
            分析用户使用的策略。
            """,
            f"可用数据路径：\n"
            f"- K线数据：{self.kline_path}\n"
            f"- 指标数据：{self.metrics_path}\n"
            f"- 订单簿数据：{self.order_path}\n"
            "请提供清晰、专业的分析报告，包含可操作的见解。"
            "禁止使用 - * # 等 markdown 格式，直接输出文本。"
        )
        return {"role": "system", "content": strategy_prompt}

    def chat(self, message, history=None):
        # 初始化消息，包含系统提示
        messages = [self.get_system_prompt()]

        if len(self.stock_id) < 9:
            messages = [self.get_strategy_prompt()]
        
        # 添加历史对话记录（如果存在）
        if history:
            messages.extend(history)
            
        # 添加当前用户消息
        messages.append({"role": "user", "content": message})
        
        payload = {
            "model": self.model,
            "messages": messages,
            "stream": False
        }
        
        try:
            response = requests.post(f"{self.base_url}/chat/completions", 
                                    headers=self.headers, 
                                    json=payload)
            response.raise_for_status()
            return response.json()['choices'][0]['message']['content']
        except requests.RequestException as e:
            return f"[请求失败] {str(e)}"
        except (KeyError, json.JSONDecodeError) as e:
            return f"[响应解析失败] {str(e)}"

# ========== Tkinter 聊天框 ==========
class ChatBox(tk.Frame):
    def __init__(self, master=None, **kwargs):
        super().__init__(master, **kwargs)
        self.client = DeepSeekClient(api_key="sk-9db9e88186f14721b11b70c8c791b1d7", stock_id="sh.600028")
        self.configure(bg='#eaeaea')
        self.pack(fill=tk.BOTH, expand=True)

        # ===== Scrollable Text with Scrollbar (fix scroll) =====
        self.text_frame = tk.Frame(self)
        self.text_frame.pack(fill=tk.BOTH, expand=True, padx=8, pady=8)

        self.chat_display = tk.Text(
            self.text_frame, wrap=tk.WORD, bg='#f2f2f2',
            font=('Helvetica', 11), relief=tk.FLAT, bd=0
        )
        self.chat_display.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)

        scrollbar = ttk.Scrollbar(self.text_frame, orient=tk.VERTICAL, command=self.chat_display.yview)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        self.chat_display.configure(yscrollcommand=scrollbar.set)
        self.chat_display.config(state='disabled')

        # ===== Entry and Send Button =====
        self.entry_frame = tk.Frame(self, bg='#eaeaea')
        self.entry_frame.pack(fill=tk.X, padx=8, pady=(0, 8))

        self.user_input = tk.Entry(
            self.entry_frame, font=('Helvetica', 11), relief=tk.FLAT, bd=2,
            highlightthickness=1, highlightbackground='#ccc', highlightcolor='#0078d4'
        )
        self.user_input.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(0, 6), ipady=6)
        self.user_input.bind("<Return>", self.send_message)

        self.send_button = tk.Button(
            self.entry_frame, text="发送", command=self.send_message,
            bg="#0078d4", fg="white", activebackground="#005a9e",
            relief=tk.FLAT, padx=12, pady=4, font=('Helvetica', 10, 'bold')
        )
        self.send_button.pack(side=tk.RIGHT)

        self.history = []
        self.thinking_animation_running = False
        self.bubble_max_width = 300  # Initial
        self.bind("<Configure>", self.on_resize)

    def on_resize(self, event):
        self.bubble_max_width = int(self.winfo_width() * 0.66)

    def send_message(self, event=None):
        message = self.user_input.get().strip()
        if message:
            self.display_bubble(message, sender="user")
            self.history.append({"role": "user", "content": message})
            self.user_input.delete(0, tk.END)

            self.chat_display.config(state='normal')
            self.thinking_frame = tk.Frame(self.chat_display, bg='#f2f2f2')
            self.thinking_label = tk.Label(
                self.thinking_frame,
                text="正在思考.",
                bg="#ffffff",
                fg="gray",
                font=('Helvetica', 11),
                padx=10, pady=6,
                wraplength=self.bubble_max_width, justify=tk.LEFT
            )
            self.thinking_label.pack(side=tk.LEFT, anchor='w')
            self.chat_display.window_create(tk.END, window=self.thinking_frame)
            self.chat_display.insert(tk.END, "\n\n")
            self.chat_display.config(state='disabled')
            self.chat_display.see(tk.END)

            self.thinking_animation_running = True
            threading.Thread(target=self._thinking_animation).start()
            threading.Thread(target=self.query_deepseek, args=(message,)).start()

    def _thinking_animation(self):
        dots = 1
        while self.thinking_animation_running:
            text = "正在思考" + ("." * dots)
            dots = (dots % 3) + 1
            self.after(0, lambda t=text: self.thinking_label.config(text=t))
            time.sleep(0.5)

    def query_deepseek(self, message):
        response = self.client.chat(message, history=self.history[:-1])
        self.history.append({"role": "assistant", "content": response})
        self.after(0, lambda: self.update_thinking_to_response(response))

    def update_thinking_to_response(self, response):
        self.thinking_animation_running = False
        if hasattr(self, 'thinking_frame'):
            self.thinking_frame.destroy()
        self.display_bubble(response, sender="assistant")

    def display_bubble(self, message, sender="user"):
        self.chat_display.config(state='normal')
        frame = tk.Frame(self.chat_display, bg='#f2f2f2')
        justify = tk.RIGHT if sender == "user" else tk.LEFT
        bg_color = "#dcf8c6" if sender == "user" else "#ffffff"
        anchor = 'e' if sender == "user" else 'w'

        label = tk.Label(
            frame,
            text=message,
            bg=bg_color,
            fg="#000",
            font=('Helvetica', 11),
            justify=tk.LEFT,
            wraplength=self.bubble_max_width,
            anchor=anchor,
            padx=10,
            pady=6
        )
        label.pack(side=justify, anchor=anchor)
        self.chat_display.window_create(tk.END, window=frame)
        self.chat_display.insert(tk.END, "\n\n")
        self.chat_display.config(state='disabled')
        self.chat_display.see(tk.END)

# ========== 股票详情页 ==========
class StockDetailPage:
    def __init__(self, root, stock_code):
        self.root = root
        self.stock_code = "sh.600028"

        # 数据路径
        self.kline_path = os.path.join("data", "day_klines", "sz50_klines.csv")
        self.metrics_path = os.path.join("data", "data_analysis", "all_metrics.csv")

        self.display_detail()

    def display_detail(self):
        # 清空原有内容
        for widget in self.root.winfo_children():
            widget.destroy()

        # 主框架
        main_frame = tk.Frame(self.root)
        main_frame.pack(fill="both", expand=True, padx=10, pady=10)

        # 左侧信息面板
        left_frame = tk.Frame(main_frame, bg="#f0f0f0", width=350)
        left_frame.pack(side="left", fill="y", padx=5, pady=5)

        # 中间图表面板
        center_frame = tk.Frame(main_frame, bg="white")
        center_frame.pack(side="left", fill="both", expand=True, padx=5, pady=5)

        # 右侧聊天面板
        right_frame = tk.Frame(main_frame, bg="white", width=400)
        right_frame.pack(side="left", fill="y", padx=5, pady=5)

        # 底部按钮面板
        bottom_frame = tk.Frame(self.root, bg="#f0f0f0", height=40)
        bottom_frame.pack(side="bottom", fill="x", padx=10, pady=10)

        # 加载数据
        self.load_data()

        # 左侧信息展示
        self.setup_info_panel(left_frame)

        # 中间图表控制面板
        control_frame = tk.Frame(center_frame, bg="white")
        control_frame.pack(fill="x", pady=5)

        # 周期选择下拉框
        tk.Label(control_frame, text="K线周期:", bg="white").pack(side="left")
        self.period_var = tk.StringVar(value="日K")
        periods = ["日K", "周K", "月K", "季K", "年K"]
        period_combo = ttk.Combobox(
            control_frame,
            textvariable=self.period_var,
            values=periods,
            state="readonly",
            width=8
        )
        period_combo.pack(side="left", padx=5)
        period_combo.bind("<<ComboboxSelected>>", lambda e: self.plot_kline())

        # 图表容器
        self.chart_frame = tk.Frame(center_frame, bg="white")
        self.chart_frame.pack(fill="both", expand=True)

        # 初始绘图
        if not self.df_k.empty:
            print(1)
            self.plot_kline()
        else:
            tk.Label(self.chart_frame, text="未找到有效K线数据").pack()

        # 添加聊天框到右侧面板
        self.chat_box = ChatBox(right_frame)
        self.chat_box.pack(fill="both", expand=True)

        # 返回主页按钮
        return_button = tk.Button(
            bottom_frame,
            text="返回主页",
            bg="#4CAF50",
            fg="white",
            command=self.return_to_home
        )
        return_button.pack(side="right", padx=10, pady=5)

    def load_data(self):
        """加载股票数据"""
        try:
            # 日线数据
            if os.path.exists(self.kline_path):
                self.df_k = pd.read_csv(self.kline_path)
                self.df_k = self.df_k[self.df_k['code'] == self.stock_code]
                self.df_k['date'] = pd.to_datetime(self.df_k['date'])
                self.df_k.set_index('date', inplace=True)
            else:
                self.df_k = pd.DataFrame()
                messagebox.showwarning("警告", "日线数据文件未找到")

            # 指标数据
            if os.path.exists(self.metrics_path):
                self.df_m = pd.read_csv(self.metrics_path)
                self.df_m = self.df_m[self.df_m['code'] == self.stock_code]
            else:
                self.df_m = pd.DataFrame()
                messagebox.showwarning("警告", "指标数据文件未找到")

        except Exception as e:
            messagebox.showerror("错误", f"数据加载失败: {str(e)}")
            self.df_k = pd.DataFrame()
            self.df_m = pd.DataFrame()

    def setup_info_panel(self, parent):
        """设置左侧信息面板"""
        # 估值信息框
        valuation_frame = tk.LabelFrame(parent, text="估值信息", bg="white", font=("Microsoft YaHei", 12))
        valuation_frame.pack(padx=10, pady=10, fill="x")

        tk.Label(valuation_frame, text="FCFE估值:", bg="white", font=("Microsoft YaHei", 11), anchor="w").pack(fill="x",
                                                                                                               pady=2)
        self.fcfe_entry = tk.Entry(valuation_frame, font=("Microsoft YaHei", 11))
        self.fcfe_entry.pack(fill="x", padx=5, pady=2)

        tk.Label(valuation_frame, text="FCFF估值:", bg="white", font=("Microsoft YaHei", 11), anchor="w").pack(fill="x",
                                                                                                               pady=2)
        self.fcff_entry = tk.Entry(valuation_frame, font=("Microsoft YaHei", 11))
        self.fcff_entry.pack(fill="x", padx=5, pady=2)

        # 金融参数框
        financial_frame = tk.LabelFrame(parent, text="金融参数", bg="white", font=("Microsoft YaHei", 12))
        financial_frame.pack(padx=10, pady=10, fill="x")

        params = [("年化收益率", "annualized_return"), ("最大回撤", "max_drawdown"), ("夏普比率", "sharpe_ratio")]
        self.param_entries = {}
        for label, key in params:
            tk.Label(financial_frame, text=f"{label}:", bg="white", font=("Microsoft YaHei", 11), anchor="w").pack(
                fill="x", pady=2)
            entry = tk.Entry(financial_frame, font=("Microsoft YaHei", 11))
            entry.pack(fill="x", padx=5, pady=2)
            self.param_entries[key] = entry

        # 相关股票框
        related_frame = tk.LabelFrame(parent, text="相关股票", bg="white", font=("Microsoft YaHei", 12))
        related_frame.pack(padx=10, pady=10, fill="x")

        tk.Label(related_frame, text="选择评估依据:", bg="white", font=("Microsoft YaHei", 11), anchor="w").pack(
            fill="x", pady=2)
        self.criteria_var = tk.StringVar(value="市盈率")
        criteria_combo = ttk.Combobox(
            related_frame,
            textvariable=self.criteria_var,
            values=["估值关联性", "金融参数关联性", "行业关联性"],
            state="readonly",
            font=("Microsoft YaHei", 11)
        )
        criteria_combo.pack(fill="x", padx=5, pady=2)

        tk.Label(related_frame, text="相关股票列表:", bg="white", font=("Microsoft YaHei", 11), anchor="w").pack(
            fill="x", pady=2)
        self.stock_listbox = tk.Listbox(related_frame, font=("Microsoft YaHei", 11), height=5)
        self.stock_listbox.pack(fill="x", padx=5, pady=2)
        for stock in ["sh.600028", "sh.600519", "sh.601318", "sh.601398"]:
            self.stock_listbox.insert(tk.END, stock)

        # 添加编辑按钮
        edit_button = tk.Button(
            related_frame,
            text="编辑股票列表",
            font=("Microsoft YaHei", 11),
            bg="#4CAF50",
            fg="white",
            command=self.edit_stock_list
        )
        edit_button.pack(pady=5)

    def edit_stock_list(self):
        """编辑股票列表"""
        new_stock = tk.simpledialog.askstring("编辑股票", "请输入新的股票代码:")
        if new_stock:
            self.stock_listbox.insert(tk.END, new_stock)

    def plot_kline(self):
        """绘制K线图"""
        # 清空之前图表
        for widget in self.chart_frame.winfo_children():
            widget.destroy()

        if self.df_k.empty:
            tk.Label(self.chart_frame, text="无有效K线数据", font=("Microsoft YaHei", 12)).pack()
            return

        period = self.period_var.get()
        rule_map = {
            "日K": 'D',
            "周K": 'W-MON',
            "月K": 'M',
            "季K": 'Q',
            "年K": 'Y'
        }
        rule = rule_map.get(period, 'D')

        # 重采样数据
        resampled = self.df_k.resample(rule).agg({
            'open': 'first',
            'high': 'max',
            'low': 'min',
            'close': 'last',
            'volume': 'sum'
        }).dropna()

        # 设置mplfinance中文显示
        mc = mpf.make_marketcolors(up='r', down='g', inherit=True)
        s = mpf.make_mpf_style(base_mpf_style='yahoo', marketcolors=mc, rc={
            'axes.unicode_minus': False
        })

        # 创建图表
        fig, axlist = mpf.plot(
            resampled,
            type='candle',
            mav=(5, 10, 20),
            volume=True,
            style=s,
            returnfig=True,
            figsize=(10, 7),
            title=f"K lines",
            ylabel='价格',
            ylabel_lower='成交量',
            datetime_format='%Y-%m-%d',
            warn_too_much_data=10000
        )

        # 嵌入Tkinter
        canvas = FigureCanvasTkAgg(fig, master=self.chart_frame)
        canvas.draw()

        # 添加工具栏
        toolbar = NavigationToolbar2Tk(canvas, self.chart_frame)
        toolbar.update()

        # 布局
        canvas.get_tk_widget().pack(fill="both", expand=True)

    def return_to_home(self):
        """返回主页"""
        from home import HomePage
        for widget in self.root.winfo_children():
            widget.destroy()
        HomePage(self.root)
