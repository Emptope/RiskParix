import os
import time
import pandas as pd
import baostock as bs


class StockDataDownloader:
    def __init__(self, csv_path, start_date, end_date):
        self.csv_path = csv_path
        self.start_date = start_date
        self.end_date = end_date
        self.failed_codes = []
        self.output_file = "stock_kline_data.csv"
        self._validate_dates()

    def _validate_dates(self):
        """日期格式校验"""
        if pd.to_datetime(self.start_date) > pd.to_datetime(self.end_date):
            raise ValueError("起始日期不能晚于结束日期")

    def _convert_code_format(self, original_code):
        """转换股票代码格式[2](@ref)"""
        return original_code
        if '.' in original_code:
            exchange = original_code.split('.')[1].lower()[:2]
            code = original_code.split('.')[0]
            return f"{exchange}.{code}"
        raise ValueError(f"无效的股票代码格式：{original_code}")

    def _init_output_file(self):
        """初始化输出文件，写入表头"""
        if not os.path.exists(self.output_file):
            pd.DataFrame(columns=["date", "code", "open", "high", "low", "close", "preclose",
                                  "volume", "amount", "adjustflag", "turn", "tradestatus",
                                  "pctChg", "isST"]).to_csv(self.output_file, index=False)

    def _fetch_and_save(self, original_code, converted_code):
        """获取并保存单只股票数据"""
        for attempt in range(3):
            try:
                rs = bs.query_history_k_data_plus(
                    code=converted_code,
                    fields="date,code,open,high,low,close,preclose,volume,amount,adjustflag,turn,tradestatus,pctChg,isST",
                    start_date=self.start_date,
                    end_date=self.end_date,
                    frequency="d",
                    adjustflag="2"
                )

                if rs.error_code != '0':
                    print(f"错误 [{converted_code}]: {rs.error_msg}")
                    return False

                # 流式写入数据
                with open(self.output_file, 'a') as f:
                    while (rs.error_code == '0') and rs.next():
                        f.write(','.join(rs.get_row_data()) + '\n')
                return True

            except Exception as e:
                print(f"尝试 {attempt + 1} 次失败: {str(e)}")
                time.sleep(2)

        self.failed_codes.append(original_code)
        return False

    def run(self):
        """主运行流程"""
        if not os.path.exists(self.csv_path):
            raise FileNotFoundError(f"CSV文件不存在：{self.csv_path}")

        # 初始化输出文件
        self._init_output_file()

        # 读取股票列表
        df = pd.read_csv(self.csv_path)
        code_pairs = [(code, self._convert_code_format(code))
                      for code in df['code'].tolist()]

        # 登录系统
        lg = bs.login()
        if lg.error_code != '0':
            raise ConnectionError(f"登录失败: {lg.error_msg}")

        try:
            total = len(code_pairs)
            success_count = 0

            for idx, (orig_code, conv_code) in enumerate(code_pairs, 1):
                print(f"正在获取 [{orig_code} -> {conv_code}] ({idx}/{total})...")

                if self._fetch_and_save(orig_code, conv_code):
                    success_count += 1
                time.sleep(0.5)  # 降低请求频率

            print(f"完成！成功{success_count}只，失败{len(self.failed_codes)}只")

            if self.failed_codes:
                pd.Series(self.failed_codes).to_csv("failed_codes.csv", index=False)
                print("失败代码已保存至 failed_codes.csv")

        finally:
            bs.logout()


if __name__ == "__main__":
    config = {
        "csv_path": "../data/stock_lists/all_stocks.csv",
        "start_date": "2015-01-01",
        "end_date": "2025-03-22"
    }
    downloader = StockDataDownloader(**config)
    downloader.run()