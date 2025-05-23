from PyQt5.QtWidgets import QWidget, QHBoxLayout, QTableWidget, QTableWidgetItem
from utils.data_loader import load_stock_list

class HomePage(QWidget):
    def __init__(self):
        super().__init__()
        layout = QHBoxLayout(self)
        self.table = QTableWidget(0,5)
        self.table.setHorizontalHeaderLabels([
            'Code','Name','Return','Drawdown','Sharpe'
        ])
        layout.addWidget(self.table)
        self.populate()

    def populate(self):
        df = load_stock_list()
        if '年涨跌幅(%)' in df.columns:
            df = df[df['年涨跌幅(%)'] > 10]
        else:
            print("⚠️ details.csv 中没有 '年涨跌幅(%)' 列，已跳过收益过滤。")
        for _, r in df.iterrows():
            items = [
                r.get('证券代码',''),
                r.get('证券名称',''),
                f"{r.get('年涨跌幅(%)',0):.2f}%",
                f"{r.get('最大回撤%',0):.2f}%",
                f"{r.get('夏普比率-普通收益率-日-一年定存利率',0):.2f}"
            ]
            row = self.table.rowCount()
            self.table.insertRow(row)
            for i, v in enumerate(items):
                self.table.setItem(row, i, QTableWidgetItem(str(v)))