import baostock as bs
import pandas as pd
from typing import Dict, Callable


class StockIndexDownloader:
    """可配置的股票指数成分股下载器"""

    # 指数配置字典 (可自由扩展)
    INDEX_CONFIG = {
        'sz50': {
            'query_func': bs.query_sz50_stocks,
            'filename': 'sz50_stocks.csv'
        },
        'hs300': {
            'query_func': bs.query_hs300_stocks,
            'filename': 'hs300_stocks.csv'
        },
        'zz500': {
            'query_func': bs.query_zz500_stocks,
            'filename': 'zz500_stocks.csv'
        },
        'all': {
            'query_func': bs.query_all_stock,
            'filename': 'all_stocks.csv'
        }
    }

    def __init__(self, save_path: str = "../data/stock_lists/"):
        """
        Args:
            save_path (str): 数据保存路径，默认../data/stock_lists/
        """
        self.save_path = save_path
        self._login()

    def _login(self):
        """登录baostock系统"""
        lg = bs.login()
        if lg.error_code != '0':
            raise ConnectionError(f"登录失败: {lg.error_code}-{lg.error_msg}")
        print(">>> 登录成功")

    def _fetch_data(self, query_func: Callable) -> pd.DataFrame:
        """执行查询并返回DataFrame"""
        rs = query_func()
        if rs.error_code != '0':
            raise ValueError(f"查询失败: {rs.error_msg}")

        data = []
        while rs.next():
            data.append(rs.get_row_data())
        return pd.DataFrame(data, columns=rs.fields)

    def download(self, index_names: list, verbose: bool = True):
        """
        下载指定指数的成分股

        Args:
            index_names (list): 需要下载的指数名称列表，如 ['hs300', 'zz500']
            verbose (bool): 是否显示进度信息
        """
        for idx in index_names:
            if idx not in self.INDEX_CONFIG:
                print(f"! 忽略未知指数: {idx}")
                continue

            config = self.INDEX_CONFIG[idx]
            try:
                df = self._fetch_data(config['query_func'])
                full_path = f"{self.save_path}/{config['filename']}"
                df.to_csv(full_path, index=False, encoding='utf-8')
                if verbose:
                    print(f">> {idx.upper()} 已保存 {len(df)} 条记录至 {full_path}")
            except Exception as e:
                print(f"! {idx} 下载失败: {str(e)}")

    def __del__(self):
        """对象销毁时自动登出"""
        bs.logout()
        print(">>> 已登出系统")


# 使用示例
if __name__ == '__main__':
    # 初始化下载器（可自定义保存路径）
    downloader = StockIndexDownloader()

    # 同时下载多个指数（支持：sz50 / hs300 / zz500 / all）
    downloader.download(
        index_names=['hs300', 'zz500', 'sz50', 'all'],  # 需要下载的指数列表
        verbose=True
    )