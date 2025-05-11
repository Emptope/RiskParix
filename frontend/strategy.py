import tkinter as tk

class StrategyPage:
    def __init__(self, root):
        self.root = root
        self.display_strategy()

    def display_strategy(self):
        content_frame = tk.Frame(self.root, bg="#f9f9f9")
        content_frame.pack(fill="both", expand=True)
        tk.Label(content_frame, text="这是策略选择页面", font=("Helvetica", 18), bg="#f9f9f9").pack(pady=20)
        tk.Button(content_frame, text="返回主页", font=("Helvetica", 14), bg="white", command=self.return_to_home).pack(pady=10)

    def return_to_home(self):
        from home import HomePage
        for widget in self.root.winfo_children():
            widget.destroy()
        HomePage(self.root)