"""
主执行模块
"""
from core import *
from visualization import *
import config

if __name__ == '__main__':
    # 数据加载
    raw_data = load_data()

    # 计算核心指标
    metrics_df = calculate_metrics(raw_data)
    metrics_df.to_csv(f'{config.OUTPUT_DIR}/stock_metrics.csv')

    # 执行动量策略
    signals = momentum_strategy(raw_data)

    # 可视化展示
    plot_kline(raw_data, '600000.SH')  # 示例个股
    plot_portfolio_performance(raw_data.groupby('date')['returns'].mean())
