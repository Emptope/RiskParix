from dataclasses import dataclass
from datetime import datetime
from typing import Optional, Literal

@dataclass
class PositionData:
    """券商持仓数据标准结构"""
    symbol: str           # 标的代码 (e.g. 600000.SH)
    quantity: int         # 当前持仓数量
    cost_price: float     # 持仓成本价
    market_value: float   # 当前市值
    direction: Literal['LONG', 'SHORT']  # 多空方向
    position_ratio: Optional[float] = None  # 持仓占比
    available: int = 0    # 可用数量(考虑冻结情况)