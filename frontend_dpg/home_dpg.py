from dearpygui.dearpygui import *
import csv
import os

details_path = os.path.join("data", "data_analysis", "details.csv")
stock_table_id = generate_uuid()

def load_stock_data():
    delete_item(stock_table_id, children_only=True)
    try:
        with open(details_path, "r", encoding="utf-8-sig") as file:
            reader = csv.reader(file)
            next(reader)  # Skip header
            for row in reader:
                if row[2] == "2024-12-31" and float(row[3]) > 10:
                    add_table_row(
                        stock_table_id,
                        [row[0], row[1], f"{float(row[3]):.2f}%", f"{float(row[6]):.2f}%", f"{float(row[7]):.2f}"]
                    )
    except FileNotFoundError:
        add_table_row(stock_table_id, ["数据文件未找到", "", "", "", ""])

def setup_ui():
    with window(label="主页", width=1200, height=800):
        add_text("导航栏", bullet=True)
        add_button(label="主页", callback=lambda: log_info("主页"))
        add_button(label="策略选择页面", callback=lambda: log_info("跳转策略页面"))

        add_spacing(count=2)
        add_separator()

        with group(horizontal=True):
            with child_window(width=200, height=600):
                add_text("服务列表")
                add_listbox(items=["soufflé服务器", "数据库", "baostock实时行情"], width=180)

            with child_window(width=300, height=600):
                add_text("筛选列表")
                add_combo(label="年份", items=[str(i) for i in range(2014, 2025)], width=150)
                add_slider_float(label="年化收益率", min_value=0, max_value=50)
                add_slider_float(label="最大回撤", min_value=0, max_value=100)
                add_slider_float(label="索提娜比率", min_value=0, max_value=5)
                add_slider_float(label="夏普比率", min_value=0, max_value=5)
                add_combo(label="龙头股", items=["是", "否"])
                add_combo(label="行业", items=[
                    "A农林牧渔", "B采矿业", "C制造业", "D电力热力燃气及水生产和供应业",
                    "E建筑业", "F批发和零售业", "G交通运输仓储和邮政业", "H住宿和餐饮业",
                    "I信息传输软件和信息技术服务业", "J金融业", "K房地产业", "L租赁和商务服务业",
                    "M科学研究和技术服务业", "N水利环境和公共设施管理业", "O居民服务修理和其他服务业",
                    "P教育", "Q卫生和社会工作", "R文化体育和娱乐业", "S公共管理社会保障和社会组织", "T国际组织"
                ], width=250)

            with child_window(width=600, height=600):
                add_text("股票列表")
                with table(header_row=True, resizable=True, policy=mvTable_SizingStretchProp, 
                           borders_innerV=True, borders_outerH=True, borders_outerV=True,
                           row_background=True, delay_search=True, tag=stock_table_id):
                    add_table_column("证券代码")
                    add_table_column("证券名称")
                    add_table_column("年化收益率")
                    add_table_column("最大回撤")
                    add_table_column("夏普比率")
                load_stock_data()

setup_ui()
start_dearpygui()