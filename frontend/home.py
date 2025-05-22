import os
import csv
import tkinter as tk
from tkinter import ttk
from strategy import StrategyPage

class HomePage:
    def __init__(self, root):
        self.root = root
        self.root.title("Homepage")
        self.root.geometry("800x600")
        self.create_nav_bar()
        # 数据路径
        self.details_path = os.path.join("data", "data_analysis", "details.csv")
        print(self.details_path)
        self.display_home()

    def create_nav_bar(self):
        nav_bar = tk.Frame(self.root, bg="white", height=50, highlightbackground="#d1d1d1", highlightthickness=1)
        nav_bar.pack(side="top", fill="x")
        nav_bar._is_nav_bar = True

        style = ttk.Style()
        style.configure("TButton", font=("Helvetica", 14), background="white", foreground="black", borderwidth=0)
        style.map("TButton", background=[("active", "#f0f0f0")])

        ttk.Button(nav_bar, text="主页", style="TButton", command=self.display_home).pack(side="left", padx=20, pady=10)
        ttk.Button(nav_bar, text="策略选择页面", style="TButton", command=self.display_strategy).pack(side="left",
                                                                                                      padx=20, pady=10)

    def display_home(self):
        # 清空现有内容（保留导航栏）
        for widget in self.root.winfo_children():
            # 更安全的方式检查导航栏
            if isinstance(widget, tk.Frame) and not hasattr(widget, '_is_nav_bar'):
                widget.destroy()

        # 左侧：服务列表
        service_frame = tk.Frame(self.root, bg="#e8e8e8", width=200)
        service_frame.pack(side="left", fill="y")
        tk.Label(service_frame, text="服务列表", bg="#e8e8e8", font=("Arial", 14)).pack(pady=10)
        service_list = tk.Listbox(service_frame, font=("Arial", 12))
        services = ["soufflé服务器", "数据库", "baostock实时行情"]
        for service in services:
            service_list.insert(tk.END, service)
        service_list.pack(padx=10, pady=10, fill="both", expand=True)

        # 中间：筛选列表
        filter_frame = tk.Frame(self.root, bg="#f9f9f9", width=400)
        filter_frame.pack(side="left", fill="y", padx=10)
        tk.Label(filter_frame, text="筛选列表", bg="#f9f9f9", font=("Arial", 14)).pack(pady=10)

        # 年份选择
        tk.Label(filter_frame, text="年份", bg="#f9f9f9", font=("Arial", 12)).pack(anchor="w", padx=10)
        year_options = [str(year) for year in range(2014, 2025)]  # Example range of years
        year_combobox = ttk.Combobox(filter_frame, values=year_options, font=("Arial", 12), state="readonly")
        year_combobox.pack(fill="x", padx=10, pady=5)
        year_combobox.set("选择年份")  # Default placeholder text

        # 年化收益率
        tk.Label(filter_frame, text="年化收益率", bg="#f9f9f9", font=("Arial", 12)).pack(anchor="w", padx=10)
        annual_return = tk.Scale(filter_frame, from_=0, to=50, orient="horizontal", bg="#f9f9f9")
        annual_return.pack(fill="x", padx=10)

        # 最大回撤
        tk.Label(filter_frame, text="最大回撤", bg="#f9f9f9", font=("Arial", 12)).pack(anchor="w", padx=10)
        max_drawdown = tk.Scale(filter_frame, from_=0, to=100, orient="horizontal", bg="#f9f9f9")
        max_drawdown.pack(fill="x", padx=10)

        # 索提娜比率
        tk.Label(filter_frame, text="索提娜比率", bg="#f9f9f9", font=("Arial", 12)).pack(anchor="w", padx=10)
        sortino_ratio = tk.Scale(filter_frame, from_=0, to=5, resolution=0.1, orient="horizontal", bg="#f9f9f9")
        sortino_ratio.pack(fill="x", padx=10)

        # 夏普比率
        tk.Label(filter_frame, text="夏普比率", bg="#f9f9f9", font=("Arial", 12)).pack(anchor="w", padx=10)
        sharpe_ratio = tk.Scale(filter_frame, from_=0, to=5, resolution=0.1, orient="horizontal", bg="#f9f9f9")
        sharpe_ratio.pack(fill="x", padx=10)

        # 龙头股
        tk.Label(filter_frame, text="龙头股", bg="#f9f9f9", font=("Arial", 12)).pack(anchor="w", padx=10)
        leading_stock = ttk.Combobox(filter_frame, values=["是", "否"], font=("Arial", 12))
        leading_stock.pack(fill="x", padx=10, pady=5)

        # 行业
        tk.Label(filter_frame, text="行业", bg="#f9f9f9", font=("Arial", 12)).pack(anchor="w", padx=10)
        industry = ttk.Combobox(filter_frame, values=["A农林牧渔","B采矿业","C制造业",
                "D电力热力燃气及水生产和供应业",
                "E建筑业",
                "F批发和零售业",
                "G交通运输仓储和邮政业",
                "H住宿和餐饮业",
                "I信息传输软件和信息技术服务业",
                "J金融业",
                "K房地产业",
                "L租赁和商务服务业",
                "M科学研究和技术服务业",
                "N水利环境和公共设施管理业",
                "O居民服务修理和其他服务业",
                "P教育",
                "Q卫生和社会工作",
                "R文化体育和娱乐业",
                "S公共管理社会保障和社会组织",
                "T国际组织"], font=("Arial", 12))
        industry.pack(fill="x", padx=10, pady=5)

        # 右侧：股票列表
        stock_frame = tk.Frame(self.root, bg="#ffffff", width=400)
        stock_frame.pack(side="left", fill="both", expand=True)
        tk.Label(stock_frame, text="股票列表", bg="#ffffff", font=("Arial", 14)).pack(pady=10)

        # 创建包含列表和滚动条的框架
        list_container = tk.Frame(stock_frame)
        list_container.pack(padx=10, pady=10, fill="both", expand=True)

        # 创建垂直滚动条
        scrollbar = tk.Scrollbar(list_container)
        scrollbar.pack(side="right", fill="y")

        # 创建股票列表并关联滚动条
        stock_list = tk.Listbox(
            list_container,
            font=("Arial", 12),
            yscrollcommand=scrollbar.set
        )
        stock_list.pack(side="left", fill="both", expand=True)

        # 配置滚动条
        scrollbar.config(command=stock_list.yview)
        # Create Treeview for stock data
        columns = ("code", "name", "annual_return", "max_drawdown", "sharpe_ratio")
        stock_table = ttk.Treeview(stock_frame, columns=columns, show="headings", height=20)
        stock_table.pack(fill="both", expand=True, padx=10, pady=10)

        # Define column headers
        stock_table.heading("code", text="证券代码")
        stock_table.heading("name", text="证券名称")
        stock_table.heading("annual_return", text="年化收益率")
        stock_table.heading("max_drawdown", text="最大回撤")
        stock_table.heading("sharpe_ratio", text="夏普比率")

        # Set column widths
        stock_table.column("code", width=100, anchor="center")
        stock_table.column("name", width=100, anchor="center")
        stock_table.column("annual_return", width=100, anchor="center")
        stock_table.column("max_drawdown", width=100, anchor="center")
        # stock_table.column("sortino_ratio", width=100, anchor="center")
        stock_table.column("sharpe_ratio", width=100, anchor="center")

        # Load stock data into the table
        self.load_stock_data(stock_table)
        # 加载股票数据

    def load_stock_data(self, stock_table):
        try:
            with open(self.details_path, "r", encoding="utf-8-sig") as file:
                reader = csv.reader(file)
                next(reader)
                for row in reader:
                    stock_table.bind("<Double-Button-1>",
                                     lambda event: self.open_stock_detail(
                                         stock_table.item(stock_table.selection())['values'][0]))

                    if row[2] == "2024-12-31":  # Only process rows for the year 2024
                        annual_return = float(row[3])  # Convert to percentage
                        if annual_return > 10:  # Filter stocks with annual return > 10%
                            formatted_row = [
                                row[0],  # Stock code
                                row[1],
                                f"{annual_return:.2f}%",  # Annual return
                                f"{float(row[6]):.2f}%",  # Maximum drawdown
                                f"{float(row[7]):.2f}",  # Sharpe ratio
                            ]
                            stock_table.insert("", "end", values=formatted_row)
        except FileNotFoundError:
            stock_table.insert("", "end", values=("股票数据文件未找到", "", "", "", ""))

    def display_strategy(self):
        for widget in self.root.winfo_children():
            if isinstance(widget, tk.Frame) and widget != self.root.children['!frame']:
                widget.destroy()
        StrategyPage(self.root)

    def open_stock_detail(self, stock_name):
        from detail import StockDetailPage
        StockDetailPage(self.root, stock_name)


if __name__ == "__main__":
    root = tk.Tk()
    app = HomePage(root)
    root.mainloop()