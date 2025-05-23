from PyQt5.QtWidgets import QWidget, QHBoxLayout, QVBoxLayout, QFormLayout, QLabel, QComboBox, QDoubleSpinBox, QPushButton, QListWidget
from matplotlib.backends.backend_qt5agg import FigureCanvasQTAgg as FigureCanvas
import mplfinance as mpf
from utils.data_loader import load_klines, load_metrics
from widgets.chat_widget import ChatWidget

API_KEY = "sk-9db9e88186f14721b11b70c8c791b1d7"
stock_code = 'sh.600028'

class DetailPage(QWidget):
    def __init__(self):
        super().__init__()
        hl = QHBoxLayout(self)
        # 左侧参数面板
        left = QVBoxLayout()
        left.addWidget(QLabel("股票代码：" + stock_code))
        # 估值参数
        form1 = QFormLayout()
        self.fcfe = QDoubleSpinBox(); self.fcfe.setDecimals(4)
        self.fcff = QDoubleSpinBox(); self.fcff.setDecimals(4)
        form1.addRow("FCFE估值", self.fcfe)
        form1.addRow("FCFF估值", self.fcff)
        left.addLayout(form1)
        # 金融指标
        form2 = QFormLayout()
        self.annual = QDoubleSpinBox(); self.annual.setDecimals(4)
        self.drawdown = QDoubleSpinBox(); self.drawdown.setDecimals(4)
        self.sharpe = QDoubleSpinBox(); self.sharpe.setDecimals(4)
        form2.addRow("年化收益率", self.annual)
        form2.addRow("最大回撤", self.drawdown)
        form2.addRow("夏普比率", self.sharpe)
        left.addLayout(form2)
        # 相关股票
        left.addWidget(QLabel("相关性依据"))
        self.basis = QComboBox(); self.basis.addItems(["估值","行业","财务"])
        left.addWidget(self.basis)
        self.related = QListWidget()
        self.related.addItems([stock_code, 'sh.600519', 'sh.601318'])
        self.related.setMaximumHeight(80)
        left.addWidget(self.related)
        left.addWidget(QPushButton("编辑股票"))
        hl.addLayout(left,1)
        # 中间：K线图区
        mid = QVBoxLayout()
        ctrl = QHBoxLayout(); ctrl.addWidget(QLabel("K线周期:"))
        self.combo = QComboBox(); self.combo.addItems(['日K','周K','月K','季K','年K'])
        self.combo.currentTextChanged.connect(self.update_kline)
        ctrl.addWidget(self.combo)
        mid.addLayout(ctrl)
        self.canvas = FigureCanvas(mpf.figure(style='yahoo', figsize=(6,4)))
        mid.addWidget(self.canvas)
        hl.addLayout(mid,2)
        # 右侧：聊天区
        self.chat = ChatWidget(API_KEY, self.get_system_prompt)
        hl.addWidget(self.chat,1)
        # 加载数据
        self.df = load_klines(stock_code)
        df_m = load_metrics(stock_code)
        # 参数预填充
        if not df_m.empty:
            row = df_m.iloc[0]
            self.fcfe.setValue(row.get('fcfe',0))
            self.fcff.setValue(row.get('fcff',0))
            self.annual.setValue(row.get('annualized_return',0))
            self.drawdown.setValue(row.get('max_drawdown',0))
            self.sharpe.setValue(row.get('sharpe_ratio',0))
        # 初始绘图
        self.update_kline('日K')

    def get_system_prompt(self):
        return {"role":"system","content":(
            "你是一名专注于股票技术指标和K线图分析的市场专家。\n"
            f"当前分析标的：{stock_code}。\n"
            "请提供趋势、支撑位、技术分析建议。"
        )}

    def update_kline(self, period_label):
        period_map = {'日K':'D','周K':'W-MON','月K':'M','季K':'Q','年K':'Y'}
        rule = period_map.get(period_label,'D')
        resampled = self.df.resample(rule).agg(
            {'open':'first','high':'max','low':'min','close':'last'}
        ).dropna()
        self.canvas.figure.clear()
        ax = self.canvas.figure.add_subplot(111)
        mpf.plot(resampled, type='candle', mav=(5,10,20), volume=False,
                 style='yahoo', ax=ax)
        self.canvas.draw()