import os
import pandas as pd
import tkinter as tk
from tkinter import ttk, messagebox, simpledialog
import matplotlib.pyplot as plt
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg, NavigationToolbar2Tk
import mplfinance as mpf
from chat import ChatBox
import re

# 全局设置中文字体
plt.rcParams['font.sans-serif'] = ['SimHei']  # 使用黑体显示中文
plt.rcParams['axes.unicode_minus'] = False  # 解决负号显示问题
mpf.__version__

# ========== 股票详情页 ==========
class StockDetailPage:
    def __init__(self, root, stock_code):
        self.root = root
        self.stock_code = stock_code
        
        # 数据文件路径 - 改为查找所有K线文件
        self.data_dir = "data"
        self.kline_files = [
            os.path.join(self.data_dir, "day_klines", "all_klines.csv"),
            os.path.join(self.data_dir, "day_klines", "hs300_klines.csv"),
            os.path.join(self.data_dir, "day_klines", "sz50_klines.csv"),
            os.path.join(self.data_dir, "day_klines", "zz500_klines.csv")
        ]
        self.metrics_path = os.path.join(self.data_dir, "order_book", "metrics.csv")
        self.details_path = os.path.join(self.data_dir, "data_analysis", "details.csv")
        
        # 数据路径
        self.kline_path = os.path.join("data", "day_klines", "sz50_klines.csv")
        self.metrics_path = os.path.join("data", "data_analysis", "all_metrics.csv")
        self.details_path = os.path.join("data", "data_analysis", "details.csv")
        
        # 初始化数据
        self.df_k = pd.DataFrame()
        self.df_m = pd.DataFrame()
        self.df_details = pd.DataFrame()
        self.stock_info = {}

        self.display_detail()

    def _to_kline_code(self, stock_id: str) -> str:
        """将详情格式代码转换为K线格式代码 (000001.SZ -> sz.000001)"""
        m = re.fullmatch(r"(\d{6})\.(SZ|SH)", stock_id.upper())
        if m:
            prefix = "sz" if m.group(2) == "SZ" else "sh"
            return f"{prefix}.{m.group(1)}"
        return stock_id  # 已是 sz./sh. 形式或其他

    def _to_detail_code(self, kline_code: str) -> str:
        """将K线格式代码转换为详情格式代码 (sz.000001 -> 000001.SZ)"""
        m = re.fullmatch(r"(sz|sh)\.(\d{6})", kline_code.lower())
        if m:
            suffix = "SZ" if m.group(1) == "sz" else "SH"
            return f"{m.group(2)}.{suffix}"
        return kline_code

    def _normalize_stock_code(self, code: str) -> tuple:
        """标准化股票代码，返回(详情格式, K线格式)"""
        if re.match(r"\d{6}\.(SZ|SH)", code.upper()):
            detail_code = code.upper()
            kline_code = self._to_kline_code(detail_code)
        elif re.match(r"(sz|sh)\.\d{6}", code.lower()):
            kline_code = code.lower()
            detail_code = self._to_detail_code(kline_code)
        else:
            # 默认处理
            detail_code = code
            kline_code = code
        return detail_code, kline_code

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
        if hasattr(self.chat_box.client, 'stock_id'):
            # 设置聊天框的股票代码为K线格式
            _, kline_code = self._normalize_stock_code(self.stock_code)
            self.chat_box.client.stock_id = kline_code
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
            # 标准化股票代码
            detail_code, kline_code = self._normalize_stock_code(self.stock_code)
            print(f"Debug: 原始代码={self.stock_code}, 详情格式={detail_code}, K线格式={kline_code}")
            
            # 在所有K线文件中查找数据
            self.df_k = pd.DataFrame()
            for kline_file in self.kline_files:
                if os.path.exists(kline_file):
                    print(f"Debug: 检查文件: {kline_file}")
                    try:
                        df_temp = pd.read_csv(kline_file)
                        if 'code' in df_temp.columns:
                            # 先尝试K线格式
                            filtered_data = df_temp[df_temp['code'] == kline_code]
                            if not filtered_data.empty:
                                self.df_k = filtered_data
                                print(f"Debug: 在 {kline_file} 中找到 {len(filtered_data)} 行数据（K线格式）")
                                break
                            
                            # 如果K线格式找不到，尝试详情格式
                            filtered_data = df_temp[df_temp['code'] == detail_code]
                            if not filtered_data.empty:
                                self.df_k = filtered_data
                                print(f"Debug: 在 {kline_file} 中找到 {len(filtered_data)} 行数据（详情格式）")
                                break
                            
                            # 尝试不区分大小写的匹配
                            filtered_data = df_temp[df_temp['code'].str.upper() == kline_code.upper()]
                            if not filtered_data.empty:
                                self.df_k = filtered_data
                                print(f"Debug: 在 {kline_file} 中找到 {len(filtered_data)} 行数据（大小写不敏感）")
                                break
                    except Exception as e:
                        print(f"Debug: 读取文件 {kline_file} 时出错: {e}")
                        continue
            
            if not self.df_k.empty:
                # 确保日期列存在并转换格式
                if 'date' in self.df_k.columns:
                    self.df_k['date'] = pd.to_datetime(self.df_k['date'])
                    self.df_k.set_index('date', inplace=True)
                    print(f"Debug: 成功加载K线数据，日期范围: {self.df_k.index.min()} 到 {self.df_k.index.max()}")
                else:
                    print(f"Debug: 警告 - K线数据中缺少 'date' 列")
            else:
                print(f"Debug: 在所有K线文件中都未找到股票代码 {kline_code} 或 {detail_code}")
                messagebox.showwarning("警告", f"未找到股票代码 {self.stock_code} 的K线数据")

            # 指标数据 - 尝试两种格式
            if os.path.exists(self.metrics_path):
                self.df_m = pd.read_csv(self.metrics_path)
                self.df_m = self.df_m[self.df_m['code'] == kline_code]
                if self.df_m.empty:
                    self.df_m = pd.read_csv(self.metrics_path)
                    self.df_m = self.df_m[self.df_m['code'] == detail_code]
            else:
                self.df_m = pd.DataFrame()

            # 详情数据 - 使用详情格式代码
            if os.path.exists(self.details_path):
                self.df_details = pd.read_csv(self.details_path)
                # 筛选当前股票的数据
                stock_details = self.df_details[self.df_details['证券代码'] == detail_code]
                if not stock_details.empty:
                    # 获取最新年份的数据
                    latest_year = stock_details['年份'].max()
                    latest_data = stock_details[stock_details['年份'] == latest_year].iloc[0]
                    
                    self.stock_info = {
                        '证券代码': latest_data['证券代码'],
                        '证券名称': latest_data['证券名称'],
                        '年份': latest_data['年份'],
                        '年涨跌幅': latest_data['年涨跌幅(%)'],
                        '市盈率TTM': latest_data['市盈率TTM'],
                        '市净率MRQ': latest_data['市净率MRQ'],
                        '最大回撤': latest_data['最大回撤%'],
                        '夏普比率': latest_data['夏普比率-普通收益率-日-一年定存利率']
                    }
                else:
                    self.stock_info = {'证券代码': detail_code, '证券名称': '未知股票'}
            else:
                self.stock_info = {'证券代码': detail_code, '证券名称': '未知股票'}
                messagebox.showwarning("警告", "详情数据文件未找到")

            # 获取当前价格信息
            if not self.df_k.empty:
                latest_price = self.df_k['close'].iloc[-1]
                self.stock_info['当前价格'] = latest_price
                self.stock_info['开盘价'] = self.df_k['open'].iloc[-1]
                self.stock_info['最高价'] = self.df_k['high'].iloc[-1]
                self.stock_info['最低价'] = self.df_k['low'].iloc[-1]
                self.stock_info['成交量'] = self.df_k['volume'].iloc[-1]

        except Exception as e:
            messagebox.showerror("错误", f"数据加载失败: {str(e)}")
            self.df_k = pd.DataFrame()
            self.df_m = pd.DataFrame()
            self.df_details = pd.DataFrame()
            detail_code, _ = self._normalize_stock_code(self.stock_code)
            self.stock_info = {'证券代码': detail_code, '证券名称': '数据加载失败'}

    def setup_info_panel(self, parent):
        """设置左侧信息面板"""
        # 股票基本信息框
        basic_frame = tk.LabelFrame(parent, text="股票基本信息", bg="white", font=("Microsoft YaHei", 12))
        basic_frame.pack(padx=10, pady=10, fill="x")
        
        # 显示股票基本信息
        info_text = f"""股票代码: {self.stock_info.get('证券代码', 'N/A')}
股票名称: {self.stock_info.get('证券名称', 'N/A')}
数据年份: {self.stock_info.get('年份', 'N/A')}"""
        
        if '当前价格' in self.stock_info:
            info_text += f"""
当前价格: {self.stock_info['当前价格']:.2f}
开盘价: {self.stock_info['开盘价']:.2f}
最高价: {self.stock_info['最高价']:.2f}
最低价: {self.stock_info['最低价']:.2f}
成交量: {int(self.stock_info['成交量']):,}"""
        
        info_label = tk.Label(basic_frame, text=info_text, bg="white", font=("Microsoft YaHei", 10), 
                             justify="left", anchor="w")
        info_label.pack(fill="x", padx=10, pady=5)

        # 估值信息框
        valuation_frame = tk.LabelFrame(parent, text="估值信息", bg="white", font=("Microsoft YaHei", 12))
        valuation_frame.pack(padx=10, pady=10, fill="x")

        # 市盈率
        tk.Label(valuation_frame, text="市盈率TTM:", bg="white", font=("Microsoft YaHei", 11), anchor="w").pack(fill="x", pady=2)
        self.pe_entry = tk.Entry(valuation_frame, font=("Microsoft YaHei", 11))
        self.pe_entry.pack(fill="x", padx=5, pady=2)
        if '市盈率TTM' in self.stock_info:
            self.pe_entry.insert(0, f"{self.stock_info['市盈率TTM']:.2f}")

        # 市净率
        tk.Label(valuation_frame, text="市净率MRQ:", bg="white", font=("Microsoft YaHei", 11), anchor="w").pack(fill="x", pady=2)
        self.pb_entry = tk.Entry(valuation_frame, font=("Microsoft YaHei", 11))
        self.pb_entry.pack(fill="x", padx=5, pady=2)
        if '市净率MRQ' in self.stock_info:
            self.pb_entry.insert(0, f"{self.stock_info['市净率MRQ']:.2f}")

        # 金融参数框
        financial_frame = tk.LabelFrame(parent, text="金融参数", bg="white", font=("Microsoft YaHei", 12))
        financial_frame.pack(padx=10, pady=10, fill="x")

        # 年涨跌幅
        tk.Label(financial_frame, text="年涨跌幅(%):", bg="white", font=("Microsoft YaHei", 11), anchor="w").pack(fill="x", pady=2)
        self.return_entry = tk.Entry(financial_frame, font=("Microsoft YaHei", 11))
        self.return_entry.pack(fill="x", padx=5, pady=2)
        if '年涨跌幅' in self.stock_info:
            self.return_entry.insert(0, f"{self.stock_info['年涨跌幅']:.2f}%")

        # 最大回撤
        tk.Label(financial_frame, text="最大回撤(%):", bg="white", font=("Microsoft YaHei", 11), anchor="w").pack(fill="x", pady=2)
        self.drawdown_entry = tk.Entry(financial_frame, font=("Microsoft YaHei", 11))
        self.drawdown_entry.pack(fill="x", padx=5, pady=2)
        if '最大回撤' in self.stock_info:
            self.drawdown_entry.insert(0, f"{self.stock_info['最大回撤']:.2f}%")

        # 夏普比率
        tk.Label(financial_frame, text="夏普比率:", bg="white", font=("Microsoft YaHei", 11), anchor="w").pack(fill="x", pady=2)
        self.sharpe_entry = tk.Entry(financial_frame, font=("Microsoft YaHei", 11))
        self.sharpe_entry.pack(fill="x", padx=5, pady=2)
        if '夏普比率' in self.stock_info:
            self.sharpe_entry.insert(0, f"{self.stock_info['夏普比率']:.4f}")

        # 相关股票框
        related_frame = tk.LabelFrame(parent, text="相关股票", bg="white", font=("Microsoft YaHei", 12))
        related_frame.pack(padx=10, pady=10, fill="x")

        tk.Label(related_frame, text="选择评估依据:", bg="white", font=("Microsoft YaHei", 11), anchor="w").pack(fill="x", pady=2)
        self.criteria_var = tk.StringVar(value="估值关联性")
        criteria_combo = ttk.Combobox(
            related_frame,
            textvariable=self.criteria_var,
            values=["估值关联性", "金融参数关联性", "行业关联性"],
            state="readonly",
            font=("Microsoft YaHei", 11)
        )
        criteria_combo.pack(fill="x", padx=5, pady=2)

        tk.Label(related_frame, text="相关股票列表:", bg="white", font=("Microsoft YaHei", 11), anchor="w").pack(fill="x", pady=2)
        self.stock_listbox = tk.Listbox(related_frame, font=("Microsoft YaHei", 11), height=5)
        self.stock_listbox.pack(fill="x", padx=5, pady=2)
        
        # 根据当前股票推荐相关股票
        related_stocks = self.get_related_stocks()
        for stock in related_stocks:
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

    def get_related_stocks(self):
        """获取相关股票列表"""
        if not self.df_details.empty:
            # 获取同行业或相似估值的股票
            current_pe = self.stock_info.get('市盈率TTM', 0)
            if current_pe > 0:
                # 找市盈率相近的股票
                similar_stocks = self.df_details[
                    (self.df_details['市盈率TTM'] >= current_pe * 0.8) & 
                    (self.df_details['市盈率TTM'] <= current_pe * 1.2) &
                    (self.df_details['证券代码'] != self.stock_code)
                ]['证券代码'].unique()[:5]
                return list(similar_stocks)
        
        # 默认返回一些热门股票
        return ["000001.SZ", "000002.SZ", "600000.SH", "600036.SH", "000858.SZ"]

    def edit_stock_list(self):
        """编辑股票列表"""
        new_stock = simpledialog.askstring("编辑股票", "请输入新的股票代码:")
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