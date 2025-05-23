from PyQt5.QtWidgets import QWidget, QVBoxLayout, QHBoxLayout, QLabel, QScrollArea, QLineEdit, QPushButton
from PyQt5.QtCore import Qt
import threading, requests

class ChatWidget(QWidget):
    """GPT-like modern chat interface with Deepseek API"""
    def __init__(self, api_key, system_prompt_fn, parent=None):
        super().__init__(parent)
        self.api_key = api_key
        self.system_prompt_fn = system_prompt_fn
        self.history = []
        layout = QVBoxLayout(self)
        # 消息区
        self.scroll = QScrollArea()
        self.scroll.setWidgetResizable(True)
        self.container = QWidget()
        self.chat_layout = QVBoxLayout(self.container)
        self.chat_layout.addStretch()
        self.scroll.setWidget(self.container)
        layout.addWidget(self.scroll)
        # 输入区
        il = QHBoxLayout()
        self.input_edit = QLineEdit()
        self.input_edit.setPlaceholderText("请输入问题...")
        self.send_btn = QPushButton("发送")
        self.send_btn.clicked.connect(self.on_send)
        il.addWidget(self.input_edit); il.addWidget(self.send_btn)
        layout.addLayout(il)

    def add_message(self, role, text):
        bubble = QLabel(text)
        bubble.setWordWrap(True)
        style = '#DCF8C6' if role=='user' else '#FFFFFF'
        bubble.setStyleSheet(f"background:{style}; padding:8px; border-radius:5px;")
        wrapper = QHBoxLayout()
        if role=='assistant': wrapper.addStretch()
        wrapper.addWidget(bubble)
        if role=='user': wrapper.addStretch()
        w = QWidget(); w.setLayout(wrapper)
        self.chat_layout.insertWidget(self.chat_layout.count()-1, w)
        self.scroll.verticalScrollBar().setValue(self.scroll.verticalScrollBar().maximum())

    def on_send(self):
        msg = self.input_edit.text().strip()
        if not msg: return
        self.add_message('user', msg)
        self.input_edit.clear()
        # 异步调用 Deepseek
        threading.Thread(target=self.query_deepseek, args=(msg,)).start()

    def query_deepseek(self, message):
        headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}
        messages = [self.system_prompt_fn()] + self.history + [{"role":"user","content":message}]
        payload = {"model":"deepseek-chat","messages":messages,"stream":False}
        try:
            res = requests.post("https://api.deepseek.com/v1/chat/completions", headers=headers, json=payload)
            res.raise_for_status()
            reply = res.json()["choices"][0]["message"]["content"]
        except Exception as e:
            reply = f"[请求失败] {e}"
        self.history.append({"role":"user","content":message})
        self.history.append({"role":"assistant","content":reply})
        self.add_message('assistant', reply)