import os
import pandas as pd
import tkinter as tk
from tkinter import ttk, messagebox
import matplotlib.pyplot as plt
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg, NavigationToolbar2Tk
import mplfinance as mpf
from matplotlib import rcParams

# 全局设置中文字体
plt.rcParams['font.sans-serif'] = ['SimHei']  # 使用黑体显示中文
plt.rcParams['axes.unicode_minus'] = False    # 解决负号显示问题
mpf.__version__

class StockDetailPage:
    def __init__(self, root, stock_code):
        self.root = root
        self.stock_code = stock_code
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

        # 右侧图表面板
        right_frame = tk.Frame(main_frame, bg="white")
        right_frame.pack(side="left", fill="both", expand=True, padx=5, pady=5)

        # 底部按钮面板
        bottom_frame = tk.Frame(self.root, bg="#f0f0f0", height=40)
        bottom_frame.pack(side="bottom", fill="x", padx=10, pady=10)

        # 加载数据
        self.load_data()

        # 左侧信息展示
        self.setup_info_panel(left_frame)

        # 右侧图表控制面板
        control_frame = tk.Frame(right_frame, bg="white")
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
        self.chart_frame = tk.Frame(right_frame, bg="white")
        self.chart_frame.pack(fill="both", expand=True)

        # 初始绘图
        if not self.df_k.empty:
            self.plot_kline()
        else:
            tk.Label(self.chart_frame, text="无有效K线数据", font=("Arial", 12)).pack()
        
        # 返回主页按钮
        return_button = tk.Button(
            bottom_frame,
            text="返回主页",
            font=("Microsoft YaHei", 12),
            bg="#4CAF50",  # 绿色背景
            fg="white",    # 白色文字
            command=self.return_to_home
        )
        return_button.pack(side="right", padx=10, pady=5)  # 靠右对齐

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
        # 基本信息框架
        info_frame = tk.LabelFrame(parent, text="股票信息", bg="#f0f0f0", font=("Microsoft YaHei", 12))
        info_frame.pack(padx=10, pady=10, fill="x")

        tk.Label(info_frame, text=f"股票代码: {self.stock_code}",
                 bg="#f0f0f0", font=("Microsoft YaHei", 11), anchor="w").pack(fill="x")

        if not self.df_k.empty:
            latest = self.df_k.iloc[-1]
            tk.Label(info_frame, text=f"最新价格: {latest['close']:.2f}",
                     bg="#f0f0f0", font=("Microsoft YaHei", 11), anchor="w").pack(fill="x")
            tk.Label(info_frame, text=f"成交量: {latest['volume']/10000:.2f}万手",
                     bg="#f0f0f0", font=("Microsoft YaHei", 11), anchor="w").pack(fill="x")
        else:
            tk.Label(info_frame, text="无日线数据", bg="#f0f0f0", font=("Microsoft YaHei", 11), anchor="w").pack(fill="x")

        # 指标框架
        metrics_frame = tk.LabelFrame(parent, text="指标分析", bg="#f0f0f0", font=("Microsoft YaHei", 12))
        metrics_frame.pack(padx=10, pady=10, fill="x")

        if not self.df_m.empty:
            # 取最新年份指标
            latest_m = self.df_m.sort_values('year').iloc[-1]
            
            # 安全格式化函数
            def safe_format(value, default="N/A", fmt=".2f"):
                try:
                    if pd.isna(value):
                        return default
                    return f"{float(value):{fmt}}"
                except (ValueError, TypeError):
                    return str(value)
            
            metrics = [
                ("年化收益率", latest_m.get('annualized_return'), "%", "衡量投资平均年收益"),
                ("最大回撤", latest_m.get('max_drawdown'), "%", "投资期间最大亏损幅度"),
                ("夏普比率", latest_m.get('sharpe_ratio'), "", "风险调整后收益(>1为佳)"),
                ("索提诺比率", latest_m.get('sortino_ratio'), "", "下行风险调整收益"),
                ("胜率", latest_m.get('win_rate'), "%", "盈利交易比例")
            ]
            
            for name, value, unit, desc in metrics:
                frame = tk.Frame(metrics_frame, bg="#f0f0f0")
                frame.pack(fill="x", pady=2)
                val_str = safe_format(value) + unit
                tk.Label(frame, text=f"{name}: {val_str}", bg="#f0f0f0", 
                         font=("Microsoft YaHei", 11), anchor="w", width=15).pack(side="left")
                tk.Label(frame, text=desc, bg="#f0f0f0", 
                         font=("Microsoft YaHei", 9), fg="#666666", anchor="w").pack(side="left", fill="x", expand=True)
        else:
            tk.Label(metrics_frame, text="无指标数据", bg="#f0f0f0", font=("Microsoft YaHei", 11)).pack()

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
            'font.family': 'SimHei',
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
            title=f"{self.stock_code} - {period} K线图",
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