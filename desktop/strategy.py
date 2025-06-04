import os
import csv
import requests
import json
import tkinter as tk
from tkinter import ttk, messagebox
import pandas as pd
from dotenv import load_dotenv
from chat import ChatBox, DeepSeekClient

load_dotenv()
class StrategyPage:
    def __init__(self, root):
        self.root = root
        self.user_path = os.path.join("data", "order_book", "user_summary.csv")  # 用户总览
        self.trade_path = os.path.join("data", "order_book", "order_book.csv")  # 交易记录
        
        # Initialize DataFrames
        self.user_df = pd.DataFrame()
        self.trade_df = pd.DataFrame()
        self.filtered_user_df = pd.DataFrame()
        
        self.selected_user = None
        self.selected_user_data = None  # 存储选中用户的交易数据
        
        self.load_data()
        self.display_strategy()

    def load_data(self):
        """Loads user summary and trade records from CSV files."""
        try:
            if os.path.exists(self.user_path):
                self.user_df = pd.read_csv(self.user_path)
                # 将英文列名映射为中文显示名
                self.user_df_display = self.user_df.copy()
                if 'user' in self.user_df.columns:
                    self.user_df_display['用户名'] = self.user_df['user']
                if 'trades' in self.user_df.columns:
                    self.user_df_display['交易笔数'] = self.user_df['trades']
                if 'returnRate' in self.user_df.columns:
                    self.user_df_display['收益率'] = pd.to_numeric(self.user_df['returnRate'], errors='coerce').fillna(0)
                if 'winRate' in self.user_df.columns:
                    self.user_df_display['胜率'] = pd.to_numeric(self.user_df['winRate'], errors='coerce').fillna(0)
                
                self.filtered_user_df = self.user_df_display.copy()
            else:
                messagebox.showwarning("警告", f"用户列表文件未找到: {self.user_path}")
                # Define columns for empty DataFrame to prevent errors later
                self.user_df = pd.DataFrame(columns=["user", "trades", "returnRate", "winRate"])
                self.user_df_display = pd.DataFrame(columns=["用户名", "交易笔数", "收益率", "胜率"])
                self.filtered_user_df = self.user_df_display.copy()

            if os.path.exists(self.trade_path):
                self.trade_df = pd.read_csv(self.trade_path)
                # 将英文列名映射为中文显示名
                self.trade_df_display = self.trade_df.copy()
                if 'user' in self.trade_df.columns:
                    self.trade_df_display['用户名'] = self.trade_df['user']
                if 'time' in self.trade_df.columns:
                    self.trade_df_display['交易时间'] = self.trade_df['time']
                if 'code' in self.trade_df.columns:
                    self.trade_df_display['证券代码'] = self.trade_df['code']
                if 'price' in self.trade_df.columns:
                    self.trade_df_display['成交价'] = pd.to_numeric(self.trade_df['price'], errors='coerce').fillna(0)
                if 'direction' in self.trade_df.columns:
                    # 将buy/sell转换为中文
                    self.trade_df_display['方向'] = self.trade_df['direction'].map({'buy': '买入', 'sell': '卖出'}).fillna(self.trade_df['direction'])
                if 'result' in self.trade_df.columns:
                    self.trade_df_display['结果'] = self.trade_df['result'].map({'win': '盈利', 'lose': '亏损'}).fillna(self.trade_df['result'])
                
                # 计算成交量和成交额（如果原数据没有的话，使用默认值）
                if '成交量' not in self.trade_df_display.columns:
                    self.trade_df_display['成交量'] = 100  # 默认成交量
                if '成交额' not in self.trade_df_display.columns:
                    self.trade_df_display['成交额'] = self.trade_df_display['成交价'] * self.trade_df_display['成交量']
            else:
                messagebox.showwarning("警告", f"交易记录文件未找到: {self.trade_path}")
                self.trade_df = pd.DataFrame(columns=["user", "time", "code", "price", "direction", "result"])
                self.trade_df_display = pd.DataFrame(columns=["用户名", "交易时间", "证券代码", "方向", "成交价", "成交量", "成交额", "结果"])
        except Exception as e:
            messagebox.showerror("数据加载错误", f"加载CSV文件时出错: {e}")
            self.user_df = pd.DataFrame(columns=["user", "trades", "returnRate", "winRate"])
            self.user_df_display = pd.DataFrame(columns=["用户名", "交易笔数", "收益率", "胜率"])
            self.filtered_user_df = self.user_df_display.copy()
            self.trade_df = pd.DataFrame(columns=["user", "time", "code", "price", "direction", "result"])
            self.trade_df_display = pd.DataFrame(columns=["用户名", "交易时间", "证券代码", "方向", "成交价", "成交量", "成交额", "结果"])

    def get_user_trading_summary(self, user_name):
        """获取用户交易数据摘要，供AI分析使用"""
        if self.trade_df.empty:
            return "暂无交易数据"
        
        user_trades = self.trade_df[self.trade_df['user'] == user_name]
        if user_trades.empty:
            return f"用户 {user_name} 暂无交易记录"
        
        # 获取用户基本信息
        user_info = self.user_df[self.user_df['user'] == user_name]
        if not user_info.empty:
            user_summary = user_info.iloc[0]
            summary_text = f"用户 {user_name} 交易概况：\n"
            summary_text += f"总交易笔数: {user_summary.get('trades', 0)}\n"
            summary_text += f"收益率: {user_summary.get('returnRate', 0):.2f}%\n"
            summary_text += f"胜率: {user_summary.get('winRate', 0):.2f}%\n\n"
        else:
            summary_text = f"用户 {user_name} 交易概况：\n"
        
        # 分析交易模式
        summary_text += "交易详情分析：\n"
        
        # 交易方向分析
        direction_counts = user_trades['direction'].value_counts()
        summary_text += f"交易方向分布: {dict(direction_counts)}\n"
        
        # 盈亏分析
        result_counts = user_trades['result'].value_counts()
        summary_text += f"盈亏分布: {dict(result_counts)}\n"
        
        # 交易的股票代码
        stock_codes = user_trades['code'].unique()
        summary_text += f"交易股票: {list(stock_codes)}\n"
        
        # 价格区间分析
        if 'price' in user_trades.columns:
            prices = pd.to_numeric(user_trades['price'], errors='coerce').dropna()
            if not prices.empty:
                summary_text += f"价格区间: {prices.min():.2f} - {prices.max():.2f}\n"
                summary_text += f"平均价格: {prices.mean():.2f}\n"
        
        # 时间分析
        if 'time' in user_trades.columns:
            summary_text += f"交易时间范围: {user_trades['time'].min()} 至 {user_trades['time'].max()}\n"
        
        # 最近几笔交易
        recent_trades = user_trades.tail(5)
        summary_text += "\n最近5笔交易：\n"
        for _, trade in recent_trades.iterrows():
            summary_text += f"- {trade.get('time', 'N/A')} {trade.get('code', 'N/A')} {trade.get('direction', 'N/A')} {trade.get('price', 'N/A')} {trade.get('result', 'N/A')}\n"
        
        return summary_text

    def display_strategy(self):
        """Sets up the UI for the strategy analysis page."""
        for widget in self.root.winfo_children():
            widget.destroy()

        main_frame = tk.Frame(self.root, bg='#ffffff', bd=2, relief='solid')
        main_frame.pack(fill='both', expand=True, padx=10, pady=10)

        # Top Frame: Navigation and Title
        top_frame = tk.Frame(main_frame, bg='#ffffff')
        top_frame.pack(fill='x', padx=10, pady=(10, 0))
        
        tk.Button(top_frame, text='用户管理', width=15, height=1, font=("Helvetica", 12), bg="#e0e0e0").pack(side='left', padx=5)
        tk.Label(top_frame, text='策略分析页面', font=("Helvetica", 14, 'bold'), bg='#ffffff').pack(side='left', expand=True) # Centered title

        # Separator
        sep = ttk.Separator(main_frame, orient='horizontal')
        sep.pack(fill='x', padx=10, pady=10)

        # Content Frame: 3 columns
        content_frame = tk.Frame(main_frame, bg='#ffffff')
        content_frame.pack(fill='both', expand=True, padx=10, pady=(0, 10))

        # Left Column: User List and Filters
        user_frame = tk.Frame(content_frame, bg='#f0f0f0', bd=1, relief='groove', width=280)
        user_frame.pack(side='left', fill='y', padx=(0, 5), ipadx=5, ipady=5)
        user_frame.pack_propagate(False)

        tk.Label(user_frame, text='用户列表', font=("Helvetica", 13, "bold"), bg='#f0f0f0').pack(pady=(10, 5))
        
        filter_controls_frame = tk.Frame(user_frame, bg='#f0f0f0')
        filter_controls_frame.pack(fill='x', padx=10, pady=5)

        tk.Label(filter_controls_frame, text="收益率 >=", bg="#f0f0f0", font=("Helvetica", 10)).grid(row=0, column=0, sticky='w', pady=2)
        self.profit_var = tk.DoubleVar(value=0.0)
        profit_entry = tk.Entry(filter_controls_frame, textvariable=self.profit_var, width=6, font=("Helvetica", 10))
        profit_entry.grid(row=0, column=1, padx=(2,5), pady=2, sticky='ew')
        tk.Label(filter_controls_frame, text="%", bg="#f0f0f0", font=("Helvetica", 10)).grid(row=0, column=2, sticky='w', pady=2)

        tk.Label(filter_controls_frame, text="胜率 >=", bg="#f0f0f0", font=("Helvetica", 10)).grid(row=1, column=0, sticky='w', pady=2)
        self.win_var = tk.DoubleVar(value=0.0)
        win_entry = tk.Entry(filter_controls_frame, textvariable=self.win_var, width=6, font=("Helvetica", 10))
        win_entry.grid(row=1, column=1, padx=(2,5), pady=2, sticky='ew')
        tk.Label(filter_controls_frame, text="%", bg="#f0f0f0", font=("Helvetica", 10)).grid(row=1, column=2, sticky='w', pady=2)
        
        filter_controls_frame.columnconfigure(1, weight=1)

        tk.Button(user_frame, text="筛选", command=self.filter_users, font=("Helvetica", 11), bg="#0596B7", fg="white", relief=tk.FLAT).pack(pady=(8, 10), padx=10, fill="x")

        user_table_frame = tk.Frame(user_frame)
        user_table_frame.pack(fill='both', expand=True, padx=5, pady=(0,5))

        user_columns = ("用户名", "交易笔数", "收益率(%)", "胜率(%)")
        self.user_table = ttk.Treeview(user_table_frame, columns=user_columns, show="headings", height=15)
        
        self.user_table.heading("用户名", text="用户名")
        self.user_table.column("用户名", width=70, anchor="center")
        self.user_table.heading("交易笔数", text="笔数")
        self.user_table.column("交易笔数", width=40, anchor="center")
        self.user_table.heading("收益率(%)", text="收益率")
        self.user_table.column("收益率(%)", width=60, anchor="e")
        self.user_table.heading("胜率(%)", text="胜率")
        self.user_table.column("胜率(%)", width=50, anchor="e")
        
        user_vsb = ttk.Scrollbar(user_table_frame, orient="vertical", command=self.user_table.yview)
        self.user_table.configure(yscrollcommand=user_vsb.set)
        user_vsb.pack(side='right', fill='y')
        self.user_table.pack(side='left', fill='both', expand=True)
        
        self.user_table.bind("<<TreeviewSelect>>", self.on_user_select)
        self.load_user_table(self.filtered_user_df)

        # Middle Column: Order List
        order_frame = tk.Frame(content_frame, bg='#f0f0f0', bd=1, relief='groove')
        order_frame.pack(side='left', fill='both', expand=True, padx=5, ipadx=5, ipady=5)
        tk.Label(order_frame, text='订单列表', font=("Helvetica", 13, "bold"), bg='#f0f0f0').pack(pady=(10, 5))
        
        order_table_frame = tk.Frame(order_frame)
        order_table_frame.pack(fill='both', expand=True, padx=5, pady=(0,5))

        order_columns = ("交易时间", "证券代码", "方向", "成交价", "成交量", "成交额", "结果")
        self.order_table = ttk.Treeview(order_table_frame, columns=order_columns, show="headings", height=15)
        col_widths_orders = {"交易时间": 100, "证券代码": 80, "方向": 50, "成交价": 70, "成交量": 60, "成交额": 80, "结果": 50}
        for col in order_columns:
            self.order_table.heading(col, text=col)
            self.order_table.column(col, width=col_widths_orders.get(col, 70), anchor="center" if col not in ["成交价", "成交额"] else "e")

        order_vsb = ttk.Scrollbar(order_table_frame, orient="vertical", command=self.order_table.yview)
        self.order_table.configure(yscrollcommand=order_vsb.set)
        order_vsb.pack(side='right', fill='y')
        self.order_table.pack(side='left', fill='both', expand=True)
        
        self.load_order_table(pd.DataFrame()) # Initialize empty

        # Right Column: AI Chat
        ai_frame = tk.Frame(content_frame, bg='#f0f0f0', bd=1, relief='groove', width=350)
        ai_frame.pack(side='left', fill='y', padx=(5, 0), ipadx=5, ipady=5)
        ai_frame.pack_propagate(False)
        
        tk.Label(ai_frame, text='DeepSeek 分析助手', font=("Helvetica", 13, "bold"), bg='#f0f0f0').pack(pady=(10,5), padx=10)
        
        # 创建自定义的ChatBox，传入策略分析的客户端
        self.chat_box = StrategyAnalysisChatBox(ai_frame, strategy_page=self) 
        self.chat_box.pack(fill="both", expand=True, padx=5, pady=(0,5))

        # Bottom Frame: Return Button
        bottom_frame = tk.Frame(main_frame, bg='#ffffff')
        bottom_frame.pack(fill='x', pady=(10,0)) 
        tk.Button(bottom_frame, text="返回主页", font=("Helvetica", 12), command=self.return_to_home, bg="#0596B7", fg="white", relief=tk.FLAT, width=10).pack(pady=5)

    def filter_users(self):
        """Filters the user list based on profit and win rate criteria."""
        try:
            profit_threshold = self.profit_var.get()
            win_threshold = self.win_var.get()
        except tk.TclError: 
            messagebox.showwarning("筛选错误", "请输入有效的筛选数值。")
            return

        if self.user_df_display.empty:
            self.filtered_user_df = self.user_df_display.copy()
        else:
            self.filtered_user_df = self.user_df_display[
                (self.user_df_display['收益率'] >= profit_threshold) & 
                (self.user_df_display['胜率'] >= win_threshold)
            ].reset_index(drop=True)
        
        self.load_user_table(self.filtered_user_df)
        self.load_order_table(pd.DataFrame())  # Clear order table as selection is reset
        self.selected_user = None
        self.selected_user_data = None
        if hasattr(self, 'chat_box') and self.chat_box.client: 
             self.chat_box.client.stock_id = None 
             self.chat_box.history = [] 
             self.chat_box.display_message("系统", "用户列表已筛选。请选择用户查看详情或开始新的分析。")

    def load_user_table(self, df):
        """Populates the user table with data from the DataFrame."""
        for item in self.user_table.get_children():
            self.user_table.delete(item)
        if df is not None and not df.empty:
            for _, row in df.iterrows():
                profit_str = f"{row.get('收益率', 0):.2f}"
                win_str = f"{row.get('胜率', 0):.2f}"
                self.user_table.insert('', 'end', values=(
                    row.get('用户名', 'N/A'), 
                    row.get('交易笔数', 0), 
                    profit_str,
                    win_str
                ))

    def load_order_table(self, df):
        """Populates the order table with data from the DataFrame."""
        for item in self.order_table.get_children():
            self.order_table.delete(item)
        if df is not None and not df.empty:
            display_columns = ["交易时间", "证券代码", "方向", "成交价", "成交量", "成交额", "结果"]
            for _, row in df.iterrows():
                formatted_row = [
                    row.get("交易时间", "N/A"),
                    row.get("证券代码", "N/A"),
                    row.get("方向", "N/A"),
                    f"{row.get('成交价', 0):.2f}" if pd.notnull(row.get('成交价')) else "N/A",
                    int(row.get('成交量', 0)) if pd.notnull(row.get('成交量')) else "N/A",
                    f"{row.get('成交额', 0):.2f}" if pd.notnull(row.get('成交额')) else "N/A",
                    row.get("结果", "N/A")
                ]
                self.order_table.insert('', 'end', values=tuple(formatted_row))

    def on_user_select(self, event):
        """Handles user selection in the user table to display their orders."""
        selected_items = self.user_table.selection()
        if not selected_items:
            return
        
        selected_item = selected_items[0] 
        item_values = self.user_table.item(selected_item, 'values')
        
        if item_values and len(item_values) > 0:
            user_name = item_values[0]
            self.selected_user = user_name
            
            # 获取用户交易数据摘要
            self.selected_user_data = self.get_user_trading_summary(user_name)
            
            if not self.trade_df_display.empty:
                user_orders_df = self.trade_df_display[self.trade_df_display['用户名'] == user_name].copy()
                self.load_order_table(user_orders_df)
                
                if hasattr(self, 'chat_box') and self.chat_box.client:
                    self.chat_box.history = [] 
                    # 更新AI客户端的用户数据
                    self.chat_box.update_user_context(user_name, self.selected_user_data)
                    welcome_msg = f"已选择用户: {user_name}。\n\n{self.selected_user_data}\n\n您可以询问关于此用户的交易策略分析、风险评估或投资建议。"
                    self.chat_box.display_message("系统", welcome_msg)
            else:
                self.load_order_table(pd.DataFrame()) 
                if hasattr(self, 'chat_box') and self.chat_box.client:
                    self.chat_box.history = []
                    self.chat_box.display_message("系统", f"已选择用户: {user_name}。但未找到交易记录。")

    def return_to_home(self):
        """Clears current page and navigates back to the HomePage."""
        from home import HomePage # Assuming home.py is in the same directory
        for widget in self.root.winfo_children():
            widget.destroy()
        HomePage(self.root)

# 自定义的策略分析ChatBox
class StrategyAnalysisChatBox(ChatBox):
    def __init__(self, master, strategy_page=None, **kwargs):
        self.strategy_page = strategy_page
        super().__init__(master, **kwargs)
        # 使用策略分析专用的客户端
        self.client = StrategyAnalysisClient(api_key=os.getenv("DEEPSEEK_API_KEY"))
        
    def update_user_context(self, user_name, user_data):
        """更新AI客户端的用户上下文"""
        if self.client:
            self.client.set_user_context(user_name, user_data)

# 策略分析专用的DeepSeek客户端
class StrategyAnalysisClient(DeepSeekClient):
    def __init__(self, api_key=None, model='deepseek-chat'):
        super().__init__(api_key=api_key, model=model)
        self.current_user = None
        self.user_data = None
        
    def set_user_context(self, user_name, user_data):
        """设置当前分析的用户上下文"""
        self.current_user = user_name
        self.user_data = user_data
        
    def get_strategy_analysis_prompt(self):
        """获取策略分析的系统提示"""
        base_prompt = (
            "你是一名专业的量化交易策略分析师和风险管理专家。"
            "你需要基于用户的交易数据，进行深度的策略分析和风险评估。\n\n"
            "分析维度包括：\n"
            "1. 交易策略识别：分析用户的交易模式、偏好和策略类型\n"
            "2. 风险评估：评估交易风险、资金管理和风险控制能力\n"
            "3. 绩效分析：分析收益率、胜率、最大回撤等关键指标\n"
            "4. 行为分析：识别交易心理、纪律性和决策模式\n"
            "5. 改进建议：提供具体的策略优化和风险控制建议\n\n"
        )
        
        if self.current_user and self.user_data:
            user_context = f"当前分析用户：{self.current_user}\n\n用户交易数据：\n{self.user_data}\n\n"
            base_prompt += user_context
            
        base_prompt += (
            "请基于以上信息，提供专业、详细的分析报告。"
            "回答要具有可操作性，避免使用 - * # 等 markdown 格式，直接输出文本。"
        )
        
        return {"role": "system", "content": base_prompt}
        
    def chat(self, message, history=None):
        """重写chat方法，使用策略分析的系统提示"""
        messages = [self.get_strategy_analysis_prompt()]
        
        if history:
            messages.extend(history)
            
        messages.append({"role": "user", "content": message})
        payload = {"model": self.model, "messages": messages, "stream": False}
        
        try:
            response = requests.post(f"{self.base_url}/chat/completions",
                                   headers=self.headers, json=payload)
            response.raise_for_status()
            return response.json()['choices'][0]['message']['content']
       
        except (KeyError, json.JSONDecodeError) as e:
            return f"[响应解析失败] {str(e)}"

if __name__ == '__main__':
    # 创建测试数据目录和文件（如果不存在）
    data_dir = os.path.join("data", "order_book")
    os.makedirs(data_dir, exist_ok=True)

    user_summary_path = os.path.join(data_dir, "user_summary.csv")
    order_book_path = os.path.join(data_dir, "order_book.csv")

    # 如果文件不存在，创建示例数据
    if not os.path.exists(user_summary_path):
        with open(user_summary_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(["user", "trades", "returnRate", "winRate"])
            writer.writerow(["trader01", 125, 12.5, 56.8])
            writer.writerow(["trader02", 89, -3.4, 47.2])
            writer.writerow(["trader03", 210, 25.6, 61.5])
            writer.writerow(["trader04", 45, -10.2, 35.1])

    if not os.path.exists(order_book_path):
        with open(order_book_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(["user", "time", "code", "price", "direction", "result"])
            writer.writerow(["trader01", "2023-02-21", "sh.000001", 3291.63, "buy", "lose"])
            writer.writerow(["trader01", "2023-02-28", "sh.000001", 3265.74, "buy", "win"])
            writer.writerow(["trader02", "2023-03-15", "sz.000002", 1250.30, "sell", "win"])
            writer.writerow(["trader03", "2023-04-10", "sh.600036", 45.80, "buy", "lose"])

    root = tk.Tk()
    root.title("策略分析")
    root.geometry("1200x700") 
    style = ttk.Style()
    style.theme_use("clam") 
    style.configure("Treeview.Heading", font=("Helvetica", 10, "bold"))
    style.configure("Treeview", font=("Helvetica", 9), rowheight=25)
    style.map("Treeview", background=[('selected', '#007bff')], foreground=[('selected', 'white')])

    app = StrategyPage(root)
    root.mainloop()