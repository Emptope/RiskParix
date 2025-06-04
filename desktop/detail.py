import os
import pandas as pd
import tkinter as tk
from tkinter import ttk, messagebox
import matplotlib.pyplot as plt
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg, NavigationToolbar2Tk
import mplfinance as mpf
from chat import ChatBox

# 全局设置中文字体
plt.rcParams['font.sans-serif'] = ['SimHei']  # 使用黑体显示中文
plt.rcParams['axes.unicode_minus'] = False  # 解决负号显示问题
mpf.__version__

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
        center_frame = tk.Frame(main_frame, bg="white", width=860)
        center_frame.pack_propagate(False)
        center_frame.pack(side="left", fill="y", padx=5, pady=5) 

        # 右侧聊天面板
        right_frame = tk.Frame(main_frame, bg="white", width=400)
        right_frame.pack(side="left", fill="y", padx=5, pady=5)
        tk.Label(right_frame, text='DeepSeek 分析助手', font=("Helvetica", 13, "bold"), bg='#f0f0f0').pack(pady=(10,5), padx=10)

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
            bg="#0596B7",
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
            bg="#0596B7",
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
        for widget in self.chart_frame.winfo_children():
            widget.destroy()

        if self.df_k.empty:
            tk.Label(self.chart_frame, text="无有效K线数据", font=("Microsoft YaHei", 12)).pack()
            return

        period = self.period_var.get()
        rule_map = {
            "日K": 'D', "周K": 'W-MON', "月K": 'M', "季K": 'Q', "年K": 'Y'
        }
        rule = rule_map.get(period, 'D')

        resampled = self.df_k.resample(rule).agg({
            'open': 'first',
            'high': 'max',
            'low': 'min',
            'close': 'last',
            'volume': 'sum'
        }).dropna()

        mc = mpf.make_marketcolors(
            up='red', down='green',
            edge='black', wick='black', volume='in'
        )
        s = mpf.make_mpf_style(
            base_mpf_style='yahoo',
            marketcolors=mc,
            facecolor='white',
            edgecolor='black',
            rc={
                'font.family': 'Microsoft YaHei',
                'axes.unicode_minus': False,
                'axes.grid': True,
                'grid.alpha': 0.3,
                'grid.linestyle': '--'
            }
        )

        fig, axlist = mpf.plot(
            resampled,
            type='candle',
            mav=(5, 10, 20),
            volume=False,
            style=s,
            returnfig=True,
            figsize=(14, 9),
            ylabel='价格',
            datetime_format='%Y-%m-%d',
            tight_layout=True,
            warn_too_much_data=10000
        )

        for ax in axlist:
            ax.set_navigate(True)
            ax.set_autoscale_on(True)
            ax.grid(True)

        if axlist and len(axlist) > 0:
            axlist[0].yaxis.tick_left()
            axlist[0].yaxis.set_label_position("left")

        canvas = FigureCanvasTkAgg(fig, master=self.chart_frame)
        canvas.draw()

        toolbar = NavigationToolbar2Tk(canvas, self.chart_frame)
        toolbar.update()
        toolbar.pack(side=tk.TOP, fill=tk.X)
        canvas.get_tk_widget().pack(fill="both", expand=True)

        canvas.get_tk_widget().pack_propagate(False)

    def return_to_home(self):
        """返回主页"""
        from home import HomePage
        for widget in self.root.winfo_children():
            widget.destroy()
        HomePage(self.root)
