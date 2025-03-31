from dataclasses import dataclass
from datetime import datetime
from typing import Optional, Literal

@dataclass
class OrderData:
    """券商订单数据标准结构"""
    order_id: str         # 唯一订单ID
    symbol: str           # 交易标的
    direction: Literal['BUY', 'SELL']
    order_type: Literal['MARKET', 'LIMIT']  # 市价/限价单
    quantity: int         # 委托数量(已考虑手数转换)
    price: Optional[float] = None  # 限价单价格
    status: str = 'PENDING'  # 订单状态
    timestamp: str = datetime.now().isoformat()