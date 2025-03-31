"""
数据可视化模块（网页15）
集成Matplotlib/Seaborn实现指标可视化
"""
import matplotlib.pyplot as plt
import seaborn as sns
from core import load_data

def plot_kline(data, code):
    """绘制个股K线（含MA均线）"""
    stock_data = data[data['code']==code].set_index('date')
    plt.figure(figsize=(12,6))
    plt.plot(stock_data['close'], label='Close')
    plt.plot(stock_data['ma5'], label='5日均线', linestyle='--')
    plt.plot(stock_data['ma20'], label='20日均线', linestyle=':')
    plt.title(f"{code} K线分析")
    plt.legend()
    plt.savefig(f'outputs/{code}_kline.png')

def plot_portfolio_performance(returns):
    """组合收益-回撤可视化（网页8）"""
    cumulative = (1 + returns).cumprod()
    plt.figure(figsize=(10,6))
    plt.subplot(211)
    plt.plot(cumulative, label='组合净值')
    plt.subplot(212)
    plt.plot(cumulative/cumulative.expanding().max()-1, label='动态回撤', color='red')
    plt.savefig('outputs/performance.png')
