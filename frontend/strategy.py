import os
import csv
import tkinter as tk
from tkinter import ttk, scrolledtext, messagebox
import pandas as pd
from detail import DeepSeekClient, ChatBox

class StrategyPage:
    def __init__(self, root):
        self.root = root
        self.user_path = os.path.join("data", "data_analysis", "user_summary.csv")  # 用户总览
        self.trade_path = os.path.join("data", "data_analysis", "trade_records.csv")  # 交易记录
        self.user_df = pd.DataFrame()
        self.trade_df = pd.DataFrame()
        self.filtered_user_df = pd.DataFrame()
        self.selected_user = None
        self.load_data()
        self.display_strategy()

    def load_data(self):
        # 加载用户列表和交易记录
        if os.path.exists(self.user_path):
            self.user_df = pd.read_csv(self.user_path)
            self.filtered_user_df = self.user_df.copy()
        else:
            messagebox.showwarning("警告", f"用户列表文件未找到: {self.user_path}")
            self.user_df = pd.DataFrame()
            self.filtered_user_df = pd.DataFrame()
        if os.path.exists(self.trade_path):
            self.trade_df = pd.read_csv(self.trade_path)
        else:
            messagebox.showwarning("警告", f"交易记录文件未找到: {self.trade_path}")
            self.trade_df = pd.DataFrame()

    def display_strategy(self):
        for widget in self.root.winfo_children():
            widget.destroy()

        main_frame = tk.Frame(self.root, bg='#fff', bd=2, relief='solid')
        main_frame.pack(fill='both', expand=True, padx=20, pady=20)

        # 顶部
        top_frame = tk.Frame(main_frame, bg='#fff')
        top_frame.pack(fill='x', padx=30, pady=(20, 0))
        left_btn = tk.Button(top_frame, text='用户管理', width=16, height=2, font=("Helvetica", 12))
        left_btn.pack(side='left')
        center_btn = tk.Button(top_frame, text='策略分析页面', width=30, height=2, font=("Helvetica", 13, 'bold'))
        center_btn.pack(side='left', padx=130)

        sep = tk.Frame(main_frame, height=2, bg='black')
        sep.pack(fill='x', padx=10, pady=15)

        # 内容区3列
        content_frame = tk.Frame(main_frame, bg='#fff')
        content_frame.pack(fill='both', expand=True, padx=10, pady=(5, 20))

        # 左列 用户列表
        user_frame = tk.Frame(content_frame, bg='#f9f9f9', bd=2, relief='groove', width=220)
        user_frame.pack(side='left', fill='y', padx=(0, 15), ipadx=5, ipady=60)
        tk.Label(user_frame, text='用户列表', font=("Helvetica", 13)).pack(pady=(10, 5))
        # 筛选框
        filter_box = tk.Frame(user_frame, bg='#f9f9f9')
        filter_box.pack(fill='x', padx=10, pady=2)
        tk.Label(filter_box, text="收益率 >=", bg="#f9f9f9").pack(side='left')
        self.profit_var = tk.DoubleVar(value=0)
        profit_entry = tk.Entry(filter_box, textvariable=self.profit_var, width=5)
        profit_entry.pack(side='left')
        tk.Label(filter_box, text="胜率 >=", bg="#f9f9f9").pack(side='left', padx=(8,0))
        self.win_var = tk.DoubleVar(value=0)
        win_entry = tk.Entry(filter_box, textvariable=self.win_var, width=5)
        win_entry.pack(side='left')
        tk.Button(user_frame, text="筛选", command=self.filter_users, font=("Arial", 11), bg="#0596B7", fg="white").pack(pady=(6, 10), padx=10, fill="x")
        # 用户表
        columns = ("用户名", "交易笔数", "收益率", "胜率")
        self.user_table = ttk.Treeview(user_frame, columns=columns, show="headings", height=16)
        for col in columns:
            self.user_table.heading(col, text=col)
            self.user_table.column(col, width=55 if col!="用户名" else 70, anchor="center")
        self.user_table.pack(fill='y', expand=True, padx=6, pady=2)
        self.user_table.bind("<ButtonRelease-1>", self.on_user_select)
        self.load_user_table(self.filtered_user_df)

        # 中列 订单列表
        order_frame = tk.Frame(content_frame, bg='#f9f9f9', bd=2, relief='groove', width=380)
        order_frame.pack(side='left', fill='y', padx=(0, 15), ipadx=12, ipady=20)
        tk.Label(order_frame, text='订单列表', font=("Helvetica", 13)).pack(pady=(10, 5))
        order_columns = ("交易时间", "证券代码", "方向", "成交价", "成交量", "成交额")
        self.order_table = ttk.Treeview(order_frame, columns=order_columns, show="headings", height=18)
        for col in order_columns:
            self.order_table.heading(col, text=col)
            self.order_table.column(col, width=58 if col!="证券代码" else 75, anchor="center")
        self.order_table.pack(fill='both', expand=True, padx=8, pady=6)
        # 初始化为空
        self.load_order_table(pd.DataFrame())

        # 右列 AI 聊天
        ai_frame = tk.Frame(content_frame, bg='#f9f9f9', bd=2, relief='groove')
        ai_frame.pack(side='left', fill='both', expand=True, padx=(0, 0))
        tk.Label(ai_frame, text='大语言模型', font=("Helvetica", 13)).pack(padx=20, pady=(12,2))
        chat = ChatBox(ai_frame)
        chat.pack(fill="both", expand=True, padx=8, pady=4)

        # 返回主页按钮
        btn_frame = tk.Frame(main_frame, bg='#fff')
        btn_frame.pack(pady=(5, 0))
        tk.Button(btn_frame, text="返回主页", font=("Helvetica", 14), bg="white", command=self.return_to_home).pack()

    def filter_users(self):
        p = self.profit_var.get()
        w = self.win_var.get()
        df = self.user_df
        self.filtered_user_df = df[(df['收益率'] >= p) & (df['胜率'] >= w)].reset_index(drop=True)
        self.load_user_table(self.filtered_user_df)
        self.load_order_table(pd.DataFrame())  # 清空订单区
        self.selected_user = None

    def load_user_table(self, df):
        for item in self.user_table.get_children():
            self.user_table.delete(item)
        for i, row in df.iterrows():
            self.user_table.insert('', 'end', values=(row['用户名'], row['交易笔数'], f"{row['收益率']:.2f}%", f"{row['胜率']:.2f}%"))

    def load_order_table(self, df):
        for item in self.order_table.get_children():
            self.order_table.delete(item)
        if df is not None and not df.empty:
            for i, row in df.iterrows():
                self.order_table.insert('', 'end', values=(row['交易时间'], row['证券代码'], row['方向'], row['成交价'], row['成交量'], row['成交额']))

    def on_user_select(self, event):
        selected = self.user_table.focus()
        if not selected:
            return
        vals = self.user_table.item(selected, 'values')
        if len(vals) > 0:
            user_name = vals[0]
            self.selected_user = user_name
            # 按用户名筛选订单
            df = self.trade_df
            orders = df[df['用户名'] == user_name]
            self.load_order_table(orders)

    def return_to_home(self):
        from home import HomePage
        for widget in self.root.winfo_children():
            widget.destroy()
        HomePage(self.root)
