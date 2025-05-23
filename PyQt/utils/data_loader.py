import os, pandas as pd

def load_klines(symbol='sh.600028'):
    path = os.path.join('data', 'day_klines', 'sz50_klines.csv')
    df = pd.read_csv(path)
    df['date'] = pd.to_datetime(df['date'])
    df.set_index('date', inplace=True)
    return df[df['code']==symbol]


def load_stock_list(target_year=2024):
    path = os.path.join('data','data_analysis','details.csv')
    df = pd.read_csv(path, encoding='utf-8-sig')
    if '年份' in df.columns:
        df['年份'] = pd.to_numeric(df['年份'], errors='coerce')
        df = df[df['年份'] == target_year]
    return df


def load_metrics(symbol='sh.600028'):
    path = os.path.join('data','data_analysis','all_metrics.csv')
    df = pd.read_csv(path, encoding='utf-8-sig')
    df = df[df['code']==symbol]
    return df