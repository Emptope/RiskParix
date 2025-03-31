import uuid
from decimal import Decimal
from .struct.position import PositionData
from .struct.order import OrderData
import datetime

class PositionConverter:
    def validate_position(self, position_data: PositionData) -> bool:
        """
        验证仓位数据有效性
        1. 检查必填字段存在性
        2. 数值有效性校验
        3. 多空方向逻辑校验
        """
        required_fields = ['symbol', 'quantity', 'direction']
        if not all(getattr(position_data, f) for f in required_fields):
            raise ValueError("Missing required position fields")

        if position_data.quantity <= 0:
            raise ValueError("Position quantity must be positive")

        #  TODO:添加更多业务规则校验（持仓量分析）
        return True

    def calculate_lot_size(self, symbol: str) -> int:
        """
        计算标准手数转换
        股票: 1手=100股 | 期货: 根据合约设定
        """
        if symbol.endswith(('.SH', '.SZ')):
            return 100  # A股标准手数
        elif symbol.endswith('.CFE'):
            return 10  # 期货合约示例
        return 1

    def generate_order_id(self, symbol: str) -> str:
        """
        生成带时间戳的订单ID
        格式: YYYYMMDD-SYMBOL-UUID
        """
        date_str = datetime.now().strftime("%Y%m%d")
        return f"{date_str}-{symbol}-{uuid.uuid4().hex[:8]}"

    def convert_to_order(self, position: PositionData) -> OrderData:
        """
        主转换函数
        """
        self.validate_position(position)

        # 计算实际委托数量（考虑手数要求）
        lot_size = self.calculate_lot_size(position.symbol)
        valid_quantity = (position.quantity // lot_size) * lot_size

        return OrderData(
            order_id=self.generate_order_id(position.symbol),
            symbol=position.symbol,
            direction='SELL' if position.direction == 'LONG' else 'BUY',
            order_type='MARKET',  # 默认市价单
            quantity=valid_quantity,
            # TODO：持仓量分析逻辑
        )

