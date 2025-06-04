import os
import time
import json
import threading
import requests
import tkinter as tk
from tkinter import ttk
from dotenv import load_dotenv

load_dotenv()

# ========== DeepSeek 客户端 ==========
class DeepSeekClient:
    def __init__(self, api_key=None, stock_id=None, model='deepseek-chat'):
        self.base_url = "https://api.deepseek.com/v1"
        self.model = model
        self.api_key = api_key
        self.stock_id = stock_id
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        self.kline_path = os.path.join("data", "day_klines", "sz50_klines.csv")
        self.metrics_path = os.path.join("data", "data_analysis", "all_metrics.csv")
        self.order_path = os.path.join("data", "order_book", "order_book.csv")

    def get_system_prompt(self):
        system_prompt = (
            "你是一名专注于股票技术指标和K线图分析的市场专家。"
            f"{'当前分析标的：' + self.stock_id if self.stock_id else '[未指定具体股票]'}\\n"
            "分析K线数据时请包含以下要素：\\n"
            "1. 趋势分析（短期、中期、长期）\\n"
            "2. 关键支撑位和阻力位\\n"
            "3. 成交量分析\\n"
            "4. 常见形态分析（头肩顶/底、双顶/底等）\\n"
            "5. 关键技术指标（MACD、RSI、布林带等）\\n\\n"
            f"可用数据路径：\\n"
            f"- K线数据：{self.kline_path}\\n"
            f"- 指标数据：{self.metrics_path}\\n"
            "请提供清晰、专业的分析报告，包含可操作的见解。"
            "禁止使用 - * # 等 markdown 格式，直接输出文本。"
        )
        return {"role": "system", "content": system_prompt}

    def get_strategy_prompt(self):
        strategy_prompt = (
            "你是一名专注于股票技术指标和K线图分析的市场专家。"
            "你需要分析一个订单簿，然后根据这个订单簿，结合K线数据，"
            "分析用户使用的策略。\\n"
            f"可用数据路径：\\n"
            f"- K线数据：{self.kline_path}\\n"
            f"- 指标数据：{self.metrics_path}\\n"
            f"- 订单簿数据：{self.order_path}\\n"
            "请提供清晰、专业的分析报告，包含可操作的见解。"
            "禁止使用 - * # 等 markdown 格式，直接输出文本。"
        )
        return {"role": "system", "content": strategy_prompt}

    def chat(self, message, history=None):
        messages = [self.get_system_prompt()]

        if not self.stock_id or len(self.stock_id) < 9:
            messages = [self.get_strategy_prompt()]

        if history:
            messages.extend(history)

        messages.append({"role": "user", "content": message})
        payload = {"model": self.model, "messages": messages, "stream": False}

        try:
            response = requests.post(f"{self.base_url}/chat/completions",
                                     headers=self.headers, json=payload)
            response.raise_for_status()
            return response.json()['choices'][0]['message']['content']
        except requests.RequestException as e:
            return f"[请求失败] {str(e)}"
        except (KeyError, json.JSONDecodeError) as e:
            return f"[响应解析失败] {str(e)}"

# ========== 聊天组件 ==========
class ChatBox(tk.Frame):
    def __init__(self, master=None, **kwargs):
        super().__init__(master, **kwargs)
        self.client = DeepSeekClient(api_key=os.getenv("DEEPSEEK_API_KEY"), stock_id="sh.600028")
        self.configure(bg='#eaeaea')
        self.pack(fill=tk.BOTH, expand=True)
        self.create_widgets()
        self.history = []
        self.thinking_animation_running = False
        self.bubble_max_width = 300
        self.bind("<Configure>", self.on_resize)

    def create_widgets(self):
        self.text_frame = tk.Frame(self)
        self.text_frame.pack(fill=tk.BOTH, expand=True, padx=8, pady=8)

        self.chat_display = tk.Text(self.text_frame, wrap=tk.WORD, bg='#f2f2f2',
                                    font=('Helvetica', 11), relief=tk.FLAT, bd=0)
        self.chat_display.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        scrollbar = ttk.Scrollbar(self.text_frame, command=self.chat_display.yview)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        self.chat_display.config(yscrollcommand=scrollbar.set, state='disabled')

        self.entry_frame = tk.Frame(self, bg='#eaeaea')
        self.entry_frame.pack(fill=tk.X, padx=8, pady=(0, 8))
        self.user_input = tk.Entry(self.entry_frame, font=('Helvetica', 11), relief=tk.FLAT, bd=2,
                                   highlightthickness=1, highlightbackground='#ccc', highlightcolor='#0078d4')
        self.user_input.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(0, 6), ipady=6)
        self.user_input.bind("<Return>", self.send_message)

        self.send_button = tk.Button(self.entry_frame, text="发送", command=self.send_message,
                                     bg="#0596B7", fg="white", activebackground="#005a9e",
                                     relief=tk.FLAT, padx=12, pady=4, font=('Helvetica', 10, 'bold'))
        self.send_button.pack(side=tk.RIGHT)

    def on_resize(self, event):
        self.bubble_max_width = int(self.winfo_width() * 0.66)

    def send_message(self, event=None):
        message = self.user_input.get().strip()
        if message:
            self.display_bubble(message, sender="user")
            self.history.append({"role": "user", "content": message})
            self.user_input.delete(0, tk.END)
            self._start_thinking(message)

    def _start_thinking(self, message):
        self.chat_display.config(state='normal')
        self.thinking_frame = tk.Frame(self.chat_display, bg='#f2f2f2')
        self.thinking_label = tk.Label(self.thinking_frame, text="正在思考.",
                                       bg="#ffffff", fg="gray", font=('Helvetica', 11),
                                       padx=10, pady=6, wraplength=self.bubble_max_width, justify=tk.LEFT)
        self.thinking_label.pack(side=tk.LEFT, anchor='w')
        self.chat_display.window_create(tk.END, window=self.thinking_frame)
        self.chat_display.insert(tk.END, "\n\n")
        self.chat_display.config(state='disabled')
        self.chat_display.see(tk.END)
        self.thinking_animation_running = True
        threading.Thread(target=self._thinking_animation).start()
        threading.Thread(target=self.query_deepseek, args=(message,)).start()

    def _thinking_animation(self):
        dots = 1
        while self.thinking_animation_running:
            text = "正在思考" + ("." * dots)
            dots = (dots % 3) + 1
            self.after(0, lambda t=text: self.thinking_label.config(text=t))
            time.sleep(0.5)

    def query_deepseek(self, message):
        response = self.client.chat(message, history=self.history[:-1])
        self.history.append({"role": "assistant", "content": response})
        self.after(0, lambda: self.update_thinking_to_response(response))

    def update_thinking_to_response(self, response):
        self.thinking_animation_running = False
        if hasattr(self, 'thinking_frame'):
            self.thinking_frame.destroy()
        self.display_bubble(response, sender="assistant")

    def display_bubble(self, message, sender="user"):
        self.chat_display.config(state='normal')
        frame = tk.Frame(self.chat_display, bg='#f2f2f2')
        justify = tk.RIGHT if sender == "user" else tk.LEFT
        bg_color = "#dcf8c6" if sender == "user" else "#ffffff"
        anchor = 'e' if sender == "user" else 'w'
        label = tk.Label(frame, text=message, bg=bg_color, fg="#000",
                         font=('Helvetica', 11), justify=tk.LEFT,
                         wraplength=self.bubble_max_width, anchor=anchor,
                         padx=10, pady=6)
        label.pack(side=justify, anchor=anchor)
        self.chat_display.window_create(tk.END, window=frame)
        self.chat_display.insert(tk.END, "\n\n")
        self.chat_display.config(state='disabled')
        self.chat_display.see(tk.END)

    def display_message(self, sender, message):
        self.display_bubble(f"{sender}: {message}", sender="assistant")
