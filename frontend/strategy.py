import tkinter as tk

class StrategyPage:
    def __init__(self, root, content_frame):
        self.root = root
        self.content_frame = content_frame
        self.display_strategy()

    def display_strategy(self):
        for widget in self.content_frame.winfo_children():
            widget.destroy()

        tk.Label(self.content_frame, text="这是策略选择页面", font=("Helvetica", 18), bg="#f9f9f9").pack(pady=20)
        tk.Button(self.content_frame, text="返回主页", font=("Helvetica", 14), bg="white", command=self.return_to_home).pack(pady=10)

    def return_to_home(self):
        from home import HomePage
        HomePage(self.root, self.content_frame)
