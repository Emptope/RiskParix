import os
import csv
import dearpygui.dearpygui as dpg

class HomePage:
    def __init__(self, open_detail_cb, open_strategy_cb):
        self.open_detail = open_detail_cb
        self.open_strategy = open_strategy_cb
        self.details_path = os.path.join("data", "data_analysis", "details.csv")

        with dpg.window(label="主页", tag="home_win", show=False):
            with dpg.menu_bar():
                dpg.add_menu_item(label="主页")
                dpg.add_menu_item(label="策略选择页面", callback=self.open_strategy)

            with dpg.group(horizontal=True):
                # 服务列表
                with dpg.child_window(width=200, autosize_y=True):
                    dpg.add_text("服务列表")
                    for srv in ["soufflé服务器", "数据库", "baostock实时行情"]:
                        dpg.add_text(srv)
                # 筛选
                with dpg.child_window(width=400, autosize_y=True):
                    dpg.add_text("筛选列表")
                    dpg.add_combo([str(y) for y in range(2014,2025)], default_value="选择年份", label="年份")
                    dpg.add_slider_float(label="年化收益率", max_value=50)
                    dpg.add_slider_float(label="最大回撤", max_value=100)
                    dpg.add_slider_float(label="索提娜比率", max_value=5)
                    dpg.add_slider_float(label="夏普比率", max_value=5)
                    dpg.add_combo(["是","否"], label="龙头股")
                    dpg.add_combo([
                        "A农林牧渔","B采矿业","C制造业","D电力热力燃气及水","E建筑业","F批发和零售业",
                        "G交通运输仓储邮政","H住宿餐饮","I信息传输软件","J金融业","K房地产业","L租赁商务服务",
                        "M科研技术","N水利环境公共","O居民服务修理","P教育","Q卫生社会","R文化体育娱乐",
                        "S公共管理社会保障","T国际组织"
                    ], label="行业", width=380)
                # 股票列表
                with dpg.child_window(width=400, autosize_y=True):
                    dpg.add_text("股票列表")
                    table_id = dpg.generate_uuid()
                    with dpg.table(header_row=True, resizable=True, policy=dpg.mvTable_SizingStretchProp, tag=table_id):
                        for col in ["证券代码","证券名称","年化收益率","最大回撤","夏普比率"]:
                            dpg.add_table_column(label=col)
                        self._load_data(table_id)

    def _load_data(self, table_id):
        try:
            with open(self.details_path, 'r', encoding='utf-8-sig') as f:
                rd = csv.reader(f)
                next(rd)
                for row in rd:
                    if row[2] == "2024-12-31" and float(row[3]) > 10:
                        vals = [
                            row[0],
                            row[1],
                            f"{float(row[3]):.2f}%",
                            f"{float(row[6]):.2f}%",
                            f"{float(row[7]):.2f}"
                        ]
                        row_id = dpg.add_table_row(parent=table_id)
                        for v in vals:
                            dpg.add_text(v, parent=row_id)
                        dpg.set_item_callback(row_id, self.open_detail, user_data=row[0])
        except FileNotFoundError:
            # 文件不存在时在表格中添加一行提示
            row_id = dpg.add_table_row(parent=table_id)
            dpg.add_text("股票数据文件未找到", parent=row_id)

    def show(self): dpg.show_item("home_win")
    def hide(self): dpg.hide_item("home_win")