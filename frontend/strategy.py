import os
import csv
import tkinter as tk
from tkinter import ttk, scrolledtext, messagebox
import pandas as pd
from chat import ChatBox, DeepSeekClient

class StrategyPage:
    def __init__(self, root):
        self.root = root
        self.user_path = os.path.join("data", "data_analysis", "user_summary.csv")  # 用户总览
        self.trade_path = os.path.join("data", "data_analysis", "trade_records.csv")  # 交易记录
        
        # Initialize DataFrames
        self.user_df = pd.DataFrame()
        self.trade_df = pd.DataFrame()
        self.filtered_user_df = pd.DataFrame()
        
        self.selected_user = None
        
        self.load_data()
        self.display_strategy()

    def load_data(self):
        """Loads user summary and trade records from CSV files."""
        try:
            if os.path.exists(self.user_path):
                self.user_df = pd.read_csv(self.user_path)
                # Ensure numeric types for filtering
                if '收益率' in self.user_df.columns:
                    self.user_df['收益率'] = pd.to_numeric(self.user_df['收益率'], errors='coerce').fillna(0)
                if '胜率' in self.user_df.columns:
                    self.user_df['胜率'] = pd.to_numeric(self.user_df['胜率'], errors='coerce').fillna(0)
                self.filtered_user_df = self.user_df.copy()
            else:
                messagebox.showwarning("警告", f"用户列表文件未找到: {self.user_path}")
                # Define columns for empty DataFrame to prevent errors later
                self.user_df = pd.DataFrame(columns=["用户名", "交易笔数", "收益率", "胜率"])
                self.filtered_user_df = self.user_df.copy()

            if os.path.exists(self.trade_path):
                self.trade_df = pd.read_csv(self.trade_path)
            else:
                messagebox.showwarning("警告", f"交易记录文件未找到: {self.trade_path}")
                self.trade_df = pd.DataFrame(columns=["用户名", "交易时间", "证券代码", "方向", "成交价", "成交量", "成交额"])
        except Exception as e:
            messagebox.showerror("数据加载错误", f"加载CSV文件时出错: {e}")
            self.user_df = pd.DataFrame(columns=["用户名", "交易笔数", "收益率", "胜率"])
            self.filtered_user_df = self.user_df.copy()
            self.trade_df = pd.DataFrame(columns=["用户名", "交易时间", "证券代码", "方向", "成交价", "成交量", "成交额"])


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
        user_frame = tk.Frame(content_frame, bg='#f0f0f0', bd=1, relief='groove', width=280) # MODIFIED: width attribute set here
        user_frame.pack(side='left', fill='y', padx=(0, 5), ipadx=5, ipady=5) # MODIFIED: _width removed
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


        tk.Button(user_frame, text="筛选", command=self.filter_users, font=("Helvetica", 11), bg="#007bff", fg="white", relief=tk.FLAT).pack(pady=(8, 10), padx=10, fill="x")

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
        
        self.user_table.bind("<<TreeviewSelect>>", self.on_user_select) # Changed to <<TreeviewSelect>> for better UX
        self.load_user_table(self.filtered_user_df)


        # Middle Column: Order List
        order_frame = tk.Frame(content_frame, bg='#f0f0f0', bd=1, relief='groove')
        order_frame.pack(side='left', fill='both', expand=True, padx=5, ipadx=5, ipady=5)
        tk.Label(order_frame, text='订单列表', font=("Helvetica", 13, "bold"), bg='#f0f0f0').pack(pady=(10, 5))
        
        order_table_frame = tk.Frame(order_frame)
        order_table_frame.pack(fill='both', expand=True, padx=5, pady=(0,5))

        order_columns = ("交易时间", "证券代码", "方向", "成交价", "成交量", "成交额")
        self.order_table = ttk.Treeview(order_table_frame, columns=order_columns, show="headings", height=15)
        col_widths_orders = {"交易时间": 130, "证券代码": 80, "方向": 50, "成交价": 70, "成交量": 70, "成交额": 80}
        for col in order_columns:
            self.order_table.heading(col, text=col)
            self.order_table.column(col, width=col_widths_orders.get(col, 70), anchor="center" if col !="成交价" else "e")

        order_vsb = ttk.Scrollbar(order_table_frame, orient="vertical", command=self.order_table.yview)
        self.order_table.configure(yscrollcommand=order_vsb.set)
        order_vsb.pack(side='right', fill='y')
        self.order_table.pack(side='left', fill='both', expand=True)
        
        self.load_order_table(pd.DataFrame()) # Initialize empty

        # Right Column: AI Chat
        ai_frame = tk.Frame(content_frame, bg='#f0f0f0', bd=1, relief='groove', width=350) # MODIFIED: width attribute set here
        ai_frame.pack(side='left', fill='y', padx=(5, 0), ipadx=5, ipady=5) # MODIFIED: _width removed
        ai_frame.pack_propagate(False)
        
        tk.Label(ai_frame, text='大语言模型分析助手', font=("Helvetica", 13, "bold"), bg='#f0f0f0').pack(pady=(10,5), padx=10)
        
        self.chat_box = ChatBox(ai_frame) 
        self.chat_box.pack(fill="both", expand=True, padx=5, pady=(0,5))


        # Bottom Frame: Return Button
        bottom_frame = tk.Frame(main_frame, bg='#ffffff')
        bottom_frame.pack(fill='x', pady=(10,0)) 
        tk.Button(bottom_frame, text="返回主页", font=("Helvetica", 12), command=self.return_to_home, bg="#6c757d", fg="white", relief=tk.FLAT, width=10).pack(pady=5)

    def filter_users(self):
        """Filters the user list based on profit and win rate criteria."""
        try:
            profit_threshold = self.profit_var.get()
            win_threshold = self.win_var.get()
        except tk.TclError: 
            messagebox.showwarning("筛选错误", "请输入有效的筛选数值。")
            return

        if self.user_df.empty:
            self.filtered_user_df = self.user_df.copy()
        else:
            self.filtered_user_df = self.user_df[
                (self.user_df['收益率'] >= profit_threshold) & 
                (self.user_df['胜率'] >= win_threshold)
            ].reset_index(drop=True)
        
        self.load_user_table(self.filtered_user_df)
        self.load_order_table(pd.DataFrame())  # Clear order table as selection is reset
        self.selected_user = None
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
            display_df = df[["交易时间", "证券代码", "方向", "成交价", "成交量", "成交额"]]
            for _, row in display_df.iterrows():
                formatted_row = [
                    row["交易时间"],
                    row["证券代码"],
                    row["方向"],
                    f"{row['成交价']:.2f}" if pd.notnull(row['成交价']) else "N/A",
                    int(row['成交量']) if pd.notnull(row['成交量']) else "N/A",
                    f"{row['成交额']:.2f}" if pd.notnull(row['成交额']) else "N/A"
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
            
            if not self.trade_df.empty:
                user_orders_df = self.trade_df[self.trade_df['用户名'] == user_name].copy()
                self.load_order_table(user_orders_df)
                
                if hasattr(self, 'chat_box') and self.chat_box.client:
                    self.chat_box.history = [] 
                    self.chat_box.display_message("系统", f"已选择用户: {user_name}。您可以询问关于此用户交易模式或相关市场的分析。")
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

if __name__ == '__main__':
    data_dir = os.path.join("data", "data_analysis")
    os.makedirs(data_dir, exist_ok=True)

    user_summary_path = os.path.join(data_dir, "user_summary.csv")
    trade_records_path = os.path.join(data_dir, "trade_records.csv")

    if not os.path.exists(user_summary_path):
        with open(user_summary_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(["用户名", "交易笔数", "收益率", "胜率"])
            writer.writerow(["Alpha投资者", 150, 25.5, 65.0])
            writer.writerow(["Beta交易员", 220, 10.2, 55.5])
            writer.writerow(["Gamma策略师", 80, 35.0, 75.8])
            writer.writerow(["Delta短线客", 300, 5.0, 50.1])


    if not os.path.exists(trade_records_path):
        with open(trade_records_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(["用户名", "交易时间", "证券代码", "方向", "成交价", "成交量", "成交额"])
            writer.writerow(["Alpha投资者", "2024-05-01 10:00:00", "sh.600036", "买入", 10.50, 1000, 10500.00])
            writer.writerow(["Alpha投资者", "2024-05-03 14:30:00", "sz.000001", "卖出", 12.80, 500, 6400.00])
            writer.writerow(["Beta交易员", "2024-05-02 09:35:00", "sh.600519", "买入", 1700.00, 10, 17000.00])
            writer.writerow(["Gamma策略师", "2024-04-20 11:00:00", "sh.600028", "买入", 5.60, 2000, 11200.00])
            writer.writerow(["Alpha投资者", "2024-05-10 10:15:00", "sh.600028", "买入", 5.70, 1500, 8550.00])


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