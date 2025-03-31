"""
全局配置模块（网页1、5、12）
包含路径参数、策略参数、风控阈值等可配置项
"""
import os
from datetime import datetime

# 路径配置
BASE_DIR = os.path.dirname(os.path.dirname(__file__))
DATA_PATH = os.path.join(BASE_DIR, 'data/day_klines/sz50_klines.csv')  # 你的CSV文件路径
OUTPUT_DIR = os.path.join(BASE_DIR, 'data/data_analysis')

# 回测参数
BACKTEST_START = datetime(2020, 1, 1)
BACKTEST_END = datetime(2024, 12, 31)
INITIAL_CAPITAL = 1_000_000  # 初始本金

# 策略参数（示例MACD策略）
STRATEGY_PARAMS = {
    'fast_period': 12,
    'slow_period': 26,
    'signal_period': 9,
    'take_profit': 0.15,  # 止盈比例
    'stop_loss': -0.08    # 止损比例
}

# 风险参数（网页8、15）
RISK_CONFIG = {
    'max_drawdown_alert': -0.20,  # 最大回撤预警
    'volatility_limit': 0.30,     # 波动率阈值
    'position_limits': {
        'single_stock': 0.1,     # 单股最大仓位
        'sector': 0.3            # 行业最大仓位
    }
}
