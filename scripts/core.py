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
    """核心指标计算（新增索提诺比率）"""
    metrics = []
    rf = 0.03  # 无风险利率

    for code, group in data.groupby('code'):
        # 年化收益率计算
        cumulative_return = (1 + group['returns']).prod()
        annual_return = cumulative_return ** (252 / len(group)) - 1

        # 最大回撤计算
        cumulative = (1 + group['returns']).cumprod()
        peak = cumulative.expanding().max()
        max_dd = (cumulative / peak - 1).min()

        # 夏普比率计算
        returns_std = group['returns'].std() * np.sqrt(252)  # 年化波动率
        sharpe = (annual_return - rf) / returns_std if returns_std != 0 else np.nan

        # 索提诺比率计算（新增部分）
        excess_returns = group['returns'] - rf
        downside_returns = excess_returns[excess_returns < 0]
        downside_std = downside_returns.std() * np.sqrt(252) if not downside_returns.empty else 0
        sortino = (annual_return - rf) / downside_std if downside_std != 0 else np.nan

        metrics.append({
            'code': code,
            'annual_return': annual_return,
            'max_drawdown': max_dd,
            'sharpe': sharpe,
            'sortino': sortino  # 新增指标
        })

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

