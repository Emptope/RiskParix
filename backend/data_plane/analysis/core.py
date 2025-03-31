"""
计算核心模块
包含数据加载、指标计算、策略逻辑
"""
import pandas as pd
import numpy as np
from config import *


def load_data():
    """数据加载与预处理"""
    df = pd.read_csv(DATA_PATH, parse_dates=['date'])
    df.sort_values(['code', 'date'], inplace=True)

    # 计算技术指标
    df['returns'] = df.groupby('code')['close'].pct_change()
    df['ma5'] = df.groupby('code')['close'].rolling(5).mean().reset_index(level=0, drop=True)
    df['ma20'] = df.groupby('code')['close'].rolling(20).mean().reset_index(level=0, drop=True)
    return df


def calculate_metrics(data):
    """
    核心指标计算
    """

    metrics = []
    for code, group in data.groupby('code'):
        # 年化收益率
        annual_return = (1 + group['returns']).prod() ** (252/len(group)) - 1

        # 最大回撤
        cumulative = (1 + group['returns']).cumprod()
        peak = cumulative.expanding().max()
        max_dd = (cumulative / peak - 1).min()


        # 添加到结果集
        metrics.append({
            'code': code,
            'annual_return': annual_return,
            'max_drawdown': max_dd,
            'sharpe': (annual_return - 0.03) / (group['returns'].std() * np.sqrt(252))
        })


def calculate_metrics(data):
    """
    核心指标计算
    """

    metrics = []
    for code, group in data.groupby('code'):
        # 年化收益率
        annual_return = (1 + group['returns']).prod() ** (252/len(group)) - 1

        # 最大回撤
        cumulative = (1 + group['returns']).cumprod()
        peak = cumulative.expanding().max()
        max_dd = (cumulative / peak - 1).min()


        # 添加到结果集
        metrics.append({
            'code': code,
            'annual_return': annual_return,
            'max_drawdown': max_dd,
            'sharpe': (annual_return - 0.03) / (group['returns'].std() * np.sqrt(252))
        })
    return pd.DataFrame(metrics)

    return pd.DataFrame(metrics)


def momentum_strategy(data, lookback=60):
    """动量策略实现"""
    signals = []
    for code, group in data.groupby('code'):
        group['momentum'] = group['close'].pct_change(lookback)
        last_signal = group.iloc[-1]
        if last_signal['momentum'] > 0.1:
            signals.append({'code': code, 'action': 'BUY'})
        elif last_signal['momentum'] < -0.1:
            signals.append({'code': code, 'action': 'SELL'})
    return pd.DataFrame(signals)