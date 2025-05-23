import sys, os
from PyQt5.QtWidgets import QApplication, QMainWindow, QPushButton, QWidget, QHBoxLayout, QStackedWidget
from pages.home_page import HomePage
from pages.detail_page import DetailPage
from pages.strategy_page import StrategyPage

class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("股票分析系统")
        # 导航按钮
        btn_home = QPushButton("Home")
        btn_detail = QPushButton("Detail")
        btn_strat = QPushButton("Strategy")
        btn_home.clicked.connect(lambda: self.switch(0))
        btn_detail.clicked.connect(lambda: self.switch(1))
        btn_strat.clicked.connect(lambda: self.switch(2))
        nav = QWidget()
        hl = QHBoxLayout(nav)
        hl.addWidget(btn_home); hl.addWidget(btn_detail); hl.addWidget(btn_strat)
        hl.addStretch()
        self.addToolBarBreak()
        toolbar = self.addToolBar("Nav")
        toolbar.addWidget(nav)
        # 页面堆栈
        self.stack = QStackedWidget()
        self.stack.addWidget(HomePage())
        self.stack.addWidget(DetailPage())
        self.stack.addWidget(StrategyPage())
        self.setCentralWidget(self.stack)

    def switch(self, idx):
        self.stack.setCurrentIndex(idx)

if __name__ == '__main__':
    app = QApplication(sys.argv)
    win = MainWindow()
    win.show()
    sys.exit(app.exec_())