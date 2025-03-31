import tkinter as tk
from tkinter import ttk
from datetime import datetime
from dataclasses import dataclass


@dataclass
class PositionData:
    symbol: str
    quantity: int
    direction: str
    cost_price: float


@dataclass
class OrderData:
    order_id: str
    symbol: str
    direction: str
    order_type: str
    quantity: int
    price: float = None


class PositionConverter:
    def validate_position(self, position_data):
        if not all([position_data.symbol, position_data.quantity > 0]):
            raise ValueError("Invalid position data")
        return True

    def generate_order_id(self, symbol):
        return f"{datetime.now().strftime('%Y%m%d%H%M%S')}-{symbol}"

    def convert_to_order(self, position):
        self.validate_position(position)
        return OrderData(
            order_id=self.generate_order_id(position.symbol),
            symbol=position.symbol,
            direction="SELL" if position.direction == "LONG" else "BUY",
            order_type="MARKET",
            quantity=position.quantity
        )


class TradingApp:
    def __init__(self, root):
        self.root = root
        self.converter = PositionConverter()
        self.setup_ui()
        self.load_sample_data()

    def setup_ui(self):
        """初始化界面组件[2,6](@ref)"""
        self.root.title("订单管理系统 v1.0")
        self.root.geometry("1000x600")

        # 主容器布局
        main_frame = ttk.Frame(self.root)
        main_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

        # 持仓面板
        position_frame = ttk.LabelFrame(main_frame, text="当前持仓")
        position_frame.grid(row=0, column=0, sticky="nsew", padx=5, pady=5)

        self.position_tree = ttk.Treeview(position_frame, columns=("Symbol", "Qty", "Direction", "Price"),
                                          show="headings")
        self.position_tree.heading("Symbol", text="代码")
        self.position_tree.heading("Qty", text="数量")
        self.position_tree.heading("Direction", text="方向")
        self.position_tree.heading("Price", text="成本价")
        self.position_tree.pack(fill=tk.BOTH, expand=True)

        # 订单面板
        order_frame = ttk.LabelFrame(main_frame, text="生成订单")
        order_frame.grid(row=0, column=1, sticky="nsew", padx=5, pady=5)

        # 控制面板
        control_frame = ttk.Frame(order_frame)
        control_frame.pack(pady=10)

        ttk.Button(control_frame, text="生成卖出订单", command=self.generate_order).grid(row=0, column=0, padx=5)
        ttk.Button(control_frame, text="刷新持仓", command=self.load_sample_data).grid(row=0, column=1, padx=5)

        # 订单列表
        self.order_tree = ttk.Treeview(order_frame, columns=("OrderID", "Symbol", "Direction", "Qty"), show="headings")
        self.order_tree.heading("OrderID", text="订单号")
        self.order_tree.heading("Symbol", text="代码")
        self.order_tree.heading("Direction", text="方向")
        self.order_tree.heading("Qty", text="数量")
        self.order_tree.pack(fill=tk.BOTH, expand=True)

        # 配置网格权重[4](@ref)
        main_frame.columnconfigure(0, weight=3)
        main_frame.columnconfigure(1, weight=2)
        main_frame.rowconfigure(0, weight=1)

    def load_sample_data(self):
        """加载模拟持仓数据[3](@ref)"""
        sample_positions = [
            PositionData("600000.SH", 5000, "LONG", 8.5),
            PositionData("000001.SZ", 3000, "SHORT", 15.2),
            PositionData("USDCNY.FX", 10000, "LONG", 6.8),
            PositionData("600000.SH", 5000, "LONG", 8.5),
            PositionData("000001.SZ", 3000, "SHORT", 15.2),
            PositionData("USDCNY.FX", 10000, "LONG", 6.8),
            PositionData("600000.SH", 5000, "LONG", 8.5),
            PositionData("000001.SZ", 3000, "SHORT", 15.2),
            PositionData("USDCNY.FX", 10000, "LONG", 6.8),
            PositionData("600000.SH", 5000, "LONG", 8.5),
            PositionData("000001.SZ", 3000, "SHORT", 15.2),
            PositionData("USDCNY.FX", 10000, "LONG", 6.8),
            PositionData("600000.SH", 5000, "LONG", 8.5),
            PositionData("000001.SZ", 3000, "SHORT", 15.2),
            PositionData("USDCNY.FX", 10000, "LONG", 6.8),
            PositionData("600000.SH", 5000, "LONG", 8.5),
            PositionData("000001.SZ", 3000, "SHORT", 15.2),
            PositionData("USDCNY.FX", 10000, "LONG", 6.8),
            PositionData("600000.SH", 5000, "LONG", 8.5),
            PositionData("000001.SZ", 3000, "SHORT", 15.2),
            PositionData("USDCNY.FX", 10000, "LONG", 6.8),
            PositionData("600000.SH", 5000, "LONG", 8.5),
            PositionData("000001.SZ", 3000, "SHORT", 15.2),
            PositionData("USDCNY.FX", 10000, "LONG", 6.8),
            PositionData("600000.SH", 5000, "LONG", 8.5),
            PositionData("000001.SZ", 3000, "SHORT", 15.2),
            PositionData("USDCNY.FX", 10000, "LONG", 6.8),
            PositionData("600000.SH", 5000, "LONG", 8.5),
            PositionData("000001.SZ", 3000, "SHORT", 15.2),
            PositionData("USDCNY.FX", 10000, "LONG", 6.8),
            PositionData("600000.SH", 5000, "LONG", 8.5),
            PositionData("000001.SZ", 3000, "SHORT", 15.2),
            PositionData("USDCNY.FX", 10000, "LONG", 6.8),
            PositionData("600000.SH", 5000, "LONG", 8.5),
            PositionData("000001.SZ", 3000, "SHORT", 15.2),
            PositionData("USDCNY.FX", 10000, "LONG", 6.8)
        ]

        # 清空现有数据
        for item in self.position_tree.get_children():
            self.position_tree.delete(item)

        # 插入新数据
        for pos in sample_positions:
            self.position_tree.insert("", "end", values=(
                pos.symbol, pos.quantity, pos.direction, f"¥{pos.cost_price:.2f}"
            ))

    def generate_order(self):
        """生成订单逻辑[7](@ref)"""
        try:
            selected = self.position_tree.selection()[0]
            item = self.position_tree.item(selected)["values"]

            position = PositionData(
                symbol=item[0],
                quantity=int(item[1]),
                direction=item[2],
                cost_price=float(item[3].strip("¥"))
            )

            order = self.converter.convert_to_order(position)

            self.order_tree.insert("", "end", values=(
                order.order_id,
                order.symbol,
                order.direction,
                order.quantity
            ))

            self.show_status("订单生成成功: " + order.order_id)

        except IndexError:
            self.show_status("错误: 请先选择持仓记录")
        except Exception as e:
            self.show_status(f"错误: {str(e)}")

    def show_status(self, message):
        """状态显示[4](@ref)"""
        status_bar = ttk.Label(self.root, text=message, relief=tk.SUNKEN)
        status_bar.pack(side=tk.BOTTOM, fill=tk.X)
        self.root.after(5000, status_bar.destroy)


def main():
    root = tk.Tk()
    app = TradingApp(root)
    root.mainloop()


if __name__ == "__main__":
    main()