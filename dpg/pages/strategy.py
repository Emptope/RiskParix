# pages/strategy.py
import dearpygui.dearpygui as dpg

class StrategyPage:
    def __init__(self, open_home_cb):
        self.open_home = open_home_cb
        with dpg.window(label="策略选择", tag="strat_win", show=False):
            dpg.add_text("这是策略选择页面", bullet=True)
            dpg.add_button(label="返回主页", callback=self.open_home)

    def show(self): dpg.show_item("strat_win")
    def hide(self): dpg.hide_item("strat_win")
