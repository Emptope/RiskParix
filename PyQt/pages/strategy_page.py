from PyQt5.QtWidgets import QWidget, QVBoxLayout, QScrollArea, QGroupBox, QFormLayout, QLabel, QSpinBox

class StrategyPage(QWidget):
    def __init__(self):
        super().__init__()
        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        container = QWidget()
        layout = QVBoxLayout(container)
        strategies = {
            'Mean Reversion':[('Window Size',1,100,20),('Threshold',1,10,2)],
            'Momentum':[('Lookback',1,50,10),('Signal LP',1,5,2)]
        }
        for name, params in strategies.items():
            box = QGroupBox(name)
            form = QFormLayout()
            for label,minv,maxv,defv in params:
                sb = QSpinBox(); sb.setRange(minv,maxv); sb.setValue(defv)
                form.addRow(label, sb)
            suggestion = QLabel(f"建议：对于{name}策略，增大参数可减少噪声交易。")
            suggestion.setWordWrap(True)
            form.addRow(suggestion)
            box.setLayout(form)
            layout.addWidget(box)
        layout.addStretch()
        scroll.setWidget(container)
        main = QVBoxLayout(self)
        main.addWidget(scroll)