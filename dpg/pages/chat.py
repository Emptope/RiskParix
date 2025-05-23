# pages/chat.py
import threading
import dearpygui.dearpygui as dpg
from client import DeepSeekClient

class ChatBox:
    def __init__(self, parent):
        # 聊天记录区
        with dpg.group(parent=parent):
            self.region = dpg.add_child_window(width=380, height=300, autosize_x=False, autosize_y=False)
            # 输入与发送
            dpg.add_input_text(label="", width=300, callback=lambda s,a,u: self.send_message(), parent=parent, tag="chat_input")
            dpg.add_same_line(parent=parent)
            dpg.add_button(label="发送", width=60, callback=lambda: self.send_message(), parent=parent)
        self.history = []
        # TODO: 替换为真实 key
        self.client = DeepSeekClient(api_key="sk-...", stock_id=None)

    def display_message(self, sender, msg):
        dpg.add_text(f"{sender}: {msg}", parent=self.region)

    def send_message(self):
        msg = dpg.get_value("chat_input").strip()
        if not msg:
            return
        self.display_message("用户", msg)
        self.history.append({"role": "user", "content": msg})
        dpg.set_value("chat_input", "")
        threading.Thread(target=self.query, args=(msg,)).start()

    def query(self, msg):
        rsp = self.client.chat(msg, history=self.history[:-1])
        self.history.append({"role": "assistant", "content": rsp})
        # 直接在主线程更新
        dpg.execute_deferred(lambda: self.display_message("助手", rsp))
