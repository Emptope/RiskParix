# pages/detail.py
import os
import pandas as pd
import dearpygui.dearpygui as dpg
import mplfinance as mpf
from pages.chat import ChatBox

class StockDetailPage:
    def __init__(self, stock_code, open_home_cb):
        self.stock_code = stock_code
        self.open_home = open_home_cb
        self.kline_path = os.path.join("data", "day_klines", "sz50_klines.csv")
        self.metrics_path = os.path.join("data", "data_analysis", "all_metrics.csv")

        with dpg.window(label=f"详情 - {stock_code}", tag="detail_win", show=False):
            dpg.add_button(label="返回主页", callback=self._back)
            dpg.add_separator()
            # 左侧信息
            with dpg.group(horizontal=False):
                df = self._load_kdata()
                dpg.add_text("估值信息")
                dpg.add_input_text(label="FCFE估值")
                dpg.add_input_text(label="FCFF估值")
                dpg.add_text("金融参数")
                for lbl in ["年化收益率", "最大回撤", "夏普比率"]:
                    dpg.add_input_text(label=lbl)
                dpg.add_text("相关股票")
                dpg.add_combo(["估值关联性","金融参数关联性","行业关联性"], label="评估依据")
                dpg.add_listbox(items=["sh.600028","sh.600519","sh.601318","sh.601398"], label="列表")
                dpg.add_button(label="编辑列表")
            # 中间K线
            with dpg.group():
                self.period = dpg.add_combo(["日K","周K","月K","季K","年K"], default_value="日K", label="周期", callback=self._plot)
                self.tex_tag = "kline_tex"
                dpg.add_image(self.tex_tag)
            # 右侧聊天
            ChatBox(parent=dpg.last_container())
        # 预加载
        self.df_k = self._load_kdata()

    def _load_kdata(self):
        if os.path.exists(self.kline_path):
            df = pd.read_csv(self.kline_path)
            df = df[df['code'] == self.stock_code]
            df['date'] = pd.to_datetime(df['date'])
            df.set_index('date', inplace=True)
            return df
        return pd.DataFrame()

    def _plot(self, sender, app_data, user_data):
        if self.df_k.empty:
            return
        rule_map = {"日K":'D',"周K":'W-MON',"月K":'M',"季K":'Q',"年K":'Y'}
        res = self.df_k.resample(rule_map[dpg.get_value(self.period)]).agg({
            'open':'first','high':'max','low':'min','close':'last','volume':'sum'
        }).dropna()
        mc = mpf.make_marketcolors(up='r', down='g', inherit=True)
        style = mpf.make_mpf_style(base_mpf_style='yahoo', marketcolors=mc)
        fig, axlist = mpf.plot(res, type='candle', mav=(5,10,20), volume=True,
                               style=style, returnfig=True, figsize=(6,4))
        # 转图片为纹理
        fig.canvas.draw()
        w, h = fig.canvas.get_width_height()
        raw = fig.canvas.buffer_rgba()
        dpg.add_raw_texture(w, h, raw.tobytes(), tag=self.tex_tag, format=dpg.mvFormat_RGBA8)
        mpf.close(fig)

    def _back(self):
        self.hide()
        self.open_home()

    def show(self): dpg.show_item("detail_win"); self._plot(None,None,None)
    def hide(self): dpg.hide_item("detail_win")
