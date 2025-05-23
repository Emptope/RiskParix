import os
import csv
import tkinter as tk
from tkinter import ttk
from strategy import StrategyPage

class HomePage:
    def __init__(self, root):
        self.root = root
        self.root.title("Homepage")
        self.root.geometry("1000x600")
        self.details_path = os.path.join("data", "data_analysis", "details.csv")

        self.create_nav_bar()

        self.content_frame = tk.Frame(self.root, bg="#f9f9f9")
        self.content_frame.pack(fill="both", expand=True)

        self.display_home()

    def create_nav_bar(self):
        nav_bar = tk.Frame(self.root, bg="white", height=50, highlightbackground="#d1d1d1", highlightthickness=1)
        nav_bar.pack(side="top", fill="x")
        nav_bar._is_nav_bar = True

        style = ttk.Style()
        style.configure("TButton", font=("Helvetica", 14), background="white", foreground="black", borderwidth=0)
        style.map("TButton", background=[("active", "#f0f0f0")])

        ttk.Button(nav_bar, text="主页", style="TButton", command=self.display_home).pack(side="left", padx=20, pady=10)
        ttk.Button(nav_bar, text="策略分析页面", style="TButton", command=self.display_strategy).pack(side="left", padx=20, pady=10)

    def display_home(self):
        for widget in self.root.winfo_children():
            if isinstance(widget, tk.Frame) and not hasattr(widget, '_is_nav_bar'):
                widget.destroy()

        self.create_service_list()
        self.create_filter_frame()
        self.create_stock_table()
        self.load_stock_data(self.stock_table)

    def create_service_list(self):
        service_frame = tk.Frame(self.root, bg="#e8e8e8", width=200)
        service_frame.pack(side="left", fill="y")
        tk.Label(service_frame, text="服务列表", bg="#e8e8e8", font=("Arial", 14)).pack(pady=10)
        service_list = tk.Listbox(service_frame, font=("Arial", 12))
        services = ["soufflé服务器", "数据库", "baostock实时行情"]
        for service in services:
            service_list.insert(tk.END, service)
        service_list.pack(padx=10, pady=10, fill="both", expand=True)

    def create_filter_frame(self):
        filter_frame = tk.Frame(self.root, bg="#f9f9f9", width=400)
        filter_frame.pack(side="left", fill="y", padx=10)
        tk.Label(filter_frame, text="筛选列表", bg="#f9f9f9", font=("Arial", 14)).pack(pady=10)

        tk.Label(filter_frame, text="年份", bg="#f9f9f9", font=("Arial", 12)).pack(anchor="w", padx=10)
        year_options = [str(year) for year in range(2014, 2025)]
        self.year_combobox = ttk.Combobox(filter_frame, values=year_options, font=("Arial", 12), state="readonly")
        self.year_combobox.pack(fill="x", padx=10, pady=5)
        self.year_combobox.set("选择年份")

        tk.Label(filter_frame, text="年化收益率", bg="#f9f9f9", font=("Arial", 12)).pack(anchor="w", padx=10)
        self.annual_return = tk.Scale(filter_frame, from_=0, to=50, orient="horizontal", bg="#f9f9f9")
        self.annual_return.pack(fill="x", padx=10)

        tk.Label(filter_frame, text="最大回撤", bg="#f9f9f9", font=("Arial", 12)).pack(anchor="w", padx=10)
        self.max_drawdown = tk.Scale(filter_frame, from_=0, to=100, orient="horizontal", bg="#f9f9f9")
        self.max_drawdown.pack(fill="x", padx=10)

        tk.Label(filter_frame, text="市盈率 TTM", bg="#f9f9f9", font=("Arial", 12)).pack(anchor="w", padx=10)
        self.pe_ratio = tk.Scale(filter_frame, from_=0, to=100, resolution=1, orient="horizontal", bg="#f9f9f9")
        self.pe_ratio.pack(fill="x", padx=10)

        tk.Label(filter_frame, text="市净率 MRQ", bg="#f9f9f9", font=("Arial", 12)).pack(anchor="w", padx=10)
        self.pb_ratio = tk.Scale(filter_frame, from_=0, to=10, resolution=0.1, orient="horizontal", bg="#f9f9f9")
        self.pb_ratio.pack(fill="x", padx=10)

        tk.Label(filter_frame, text="夏普比率", bg="#f9f9f9", font=("Arial", 12)).pack(anchor="w", padx=10)
        self.sharpe_ratio = tk.Scale(filter_frame, from_=0, to=5, resolution=0.1, orient="horizontal", bg="#f9f9f9")
        self.sharpe_ratio.pack(fill="x", padx=10)

        tk.Button(filter_frame, text="筛选", command=self.apply_filters, font=("Arial", 12), bg="#0596B7", fg="white").pack(pady=20, padx=10, fill="x")

    def create_stock_table(self):
        stock_frame = tk.Frame(self.root, bg="#ffffff", width=600)
        stock_frame.pack(side="left", fill="both", expand=True)
        tk.Label(stock_frame, text="股票列表", bg="#ffffff", font=("Arial", 14)).pack(pady=10)

        columns = ("code", "name", "year", "annual_return", "max_drawdown", "pe_ratio", "pb_ratio", "sharpe_ratio")
        self.stock_table = ttk.Treeview(stock_frame, columns=columns, show="headings", height=20)
        self.stock_table.pack(fill="both", expand=True, padx=10, pady=10)

        headers = [
            ("code", "证券代码"),
            ("name", "证券名称"),
            ("year", "年份"),
            ("annual_return", "年涨跌幅"),
            ("max_drawdown", "最大回撤"),
            ("pe_ratio", "市盈率"),
            ("pb_ratio", "市净率"),
            ("sharpe_ratio", "夏普比率")
        ]
        for col, title in headers:
            self.stock_table.heading(col, text=title)
            self.stock_table.column(col, width=80, anchor="center")

    def apply_filters(self):
        filter_data = {
            "年份": self.year_combobox.get(),
            "年化收益率": self.annual_return.get(),
            "最大回撤": self.max_drawdown.get(),
            "市盈率": self.pe_ratio.get(),
            "市净率": self.pb_ratio.get(),
            "夏普比率": self.sharpe_ratio.get()
        }

        for item in self.stock_table.get_children():
            self.stock_table.delete(item)

        self.load_stock_data(self.stock_table, filter_data)

    def load_stock_data(self, stock_table, filters=None):
        try:
            with open(self.details_path, "r", encoding="utf-8-sig") as file:
                reader = csv.reader(file)
                next(reader)

                for row in reader:
                    try:
                        stock_code = row[0]
                        stock_name = row[1]
                        year = row[2]
                        annual_return = float(row[3])
                        pe_ratio = float(row[4])
                        pb_ratio = float(row[5])
                        max_drawdown = float(row[6])
                        sharpe = float(row[7])

                        if filters:
                            if filters["年份"] != "选择年份" and filters["年份"] not in year:
                                continue
                            if annual_return < filters["年化收益率"]:
                                continue
                            if max_drawdown < -filters["最大回撤"]:
                                continue
                            if pe_ratio < filters["市盈率"]:
                                continue
                            if pb_ratio < filters["市净率"]:
                                continue
                            if sharpe < filters["夏普比率"]:
                                continue

                        formatted_row = [
                            stock_code,
                            stock_name,
                            year,
                            f"{annual_return:.2f}%",
                            f"{max_drawdown:.2f}%",
                            f"{pe_ratio:.2f}",
                            f"{pb_ratio:.2f}",
                            f"{sharpe:.2f}"
                        ]
                        stock_table.insert("", "end", values=formatted_row)
                    except ValueError:
                        continue

                stock_table.bind("<Double-Button-1>", lambda event: self.open_stock_detail(
                    stock_table.item(stock_table.selection())['values'][0]))

        except FileNotFoundError:
            stock_table.insert("", "end", values=("股票数据文件未找到", "", "", "", "", "", "", ""))

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
