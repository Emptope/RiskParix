import tkinter as tk
from tkinter import ttk
import threading
import time

# Dummy client for demonstration
class DeepSeekClient:
    def __init__(self, api_key=None, stock_id=None):
        pass

    def chat(self, message, history=None):
        time.sleep(2)
        return f"AI 回复：你刚才说的是“{message}”"

class ChatBox(tk.Frame):
    def __init__(self, master=None, **kwargs):
        super().__init__(master, **kwargs)
        self.client = DeepSeekClient(api_key="sk-xxxx", stock_id="sh.600028")
        self.configure(bg='#eaeaea')
        self.pack(fill=tk.BOTH, expand=True)

        # ===== Scrollable Text with Scrollbar (fix scroll) =====
        self.text_frame = tk.Frame(self)
        self.text_frame.pack(fill=tk.BOTH, expand=True, padx=8, pady=8)

        self.chat_display = tk.Text(
            self.text_frame, wrap=tk.WORD, bg='#f2f2f2',
            font=('Helvetica', 11), relief=tk.FLAT, bd=0
        )
        self.chat_display.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)

        scrollbar = ttk.Scrollbar(self.text_frame, orient=tk.VERTICAL, command=self.chat_display.yview)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        self.chat_display.configure(yscrollcommand=scrollbar.set)
        self.chat_display.config(state='disabled')

        # ===== Entry and Send Button =====
        self.entry_frame = tk.Frame(self, bg='#eaeaea')
        self.entry_frame.pack(fill=tk.X, padx=8, pady=(0, 8))

        self.user_input = tk.Entry(
            self.entry_frame, font=('Helvetica', 11), relief=tk.FLAT, bd=2,
            highlightthickness=1, highlightbackground='#ccc', highlightcolor='#0078d4'
        )
        self.user_input.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(0, 6), ipady=6)
        self.user_input.bind("<Return>", self.send_message)

        self.send_button = tk.Button(
            self.entry_frame, text="发送", command=self.send_message,
            bg="#0078d4", fg="white", activebackground="#005a9e",
            relief=tk.FLAT, padx=12, pady=4, font=('Helvetica', 10, 'bold')
        )
        self.send_button.pack(side=tk.RIGHT)

        self.history = []
        self.thinking_animation_running = False
        self.bubble_max_width = 300  # Initial
        self.bind("<Configure>", self.on_resize)

    def on_resize(self, event):
        self.bubble_max_width = int(self.winfo_width() * 0.66)

    def send_message(self, event=None):
        message = self.user_input.get().strip()
        if message:
            self.display_bubble(message, sender="user")
            self.history.append({"role": "user", "content": message})
            self.user_input.delete(0, tk.END)

            self.chat_display.config(state='normal')
            self.thinking_frame = tk.Frame(self.chat_display, bg='#f2f2f2')
            self.thinking_label = tk.Label(
                self.thinking_frame,
                text="正在思考.",
                bg="#ffffff",
                fg="gray",
                font=('Helvetica', 11),
                padx=10, pady=6,
                wraplength=self.bubble_max_width, justify=tk.LEFT
            )
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

        label = tk.Label(
            frame,
            text=message,
            bg=bg_color,
            fg="#000",
            font=('Helvetica', 11),
            justify=tk.LEFT,
            wraplength=self.bubble_max_width,
            anchor=anchor,
            padx=10,
            pady=6
        )
        label.pack(side=justify, anchor=anchor)
        self.chat_display.window_create(tk.END, window=frame)
        self.chat_display.insert(tk.END, "\n\n")
        self.chat_display.config(state='disabled')
        self.chat_display.see(tk.END)


# === Entry point ===
if __name__ == "__main__":
    root = tk.Tk()
    root.title("聊天框示例")
    root.geometry("600x500")
    ChatBox(root)
    root.mainloop()
