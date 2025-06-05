import React, { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";

export default function TradingPanel({ 
  code, 
  currentPrice, 
  onTradeSubmit 
}) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // 交易相关状态
  const [tradeType, setTradeType] = useState("buy");
  const [orderType, setOrderType] = useState("market");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");

  // 当currentPrice变化时更新价格
  useEffect(() => {
    if (currentPrice && orderType === "limit") {
      setPrice(currentPrice.toFixed(2));
    }
  }, [currentPrice, orderType]);

  const colors = {
    secondary: isDark ? "bg-gray-900" : "bg-white",
    tertiary: isDark ? "bg-gray-800" : "bg-gray-100",
    quaternary: isDark ? "bg-gray-700" : "bg-gray-50",
    textPrimary: isDark ? "text-gray-100" : "text-gray-900",
    textSecondary: isDark ? "text-gray-300" : "text-gray-600",
    textMuted: isDark ? "text-gray-400" : "text-gray-500",
    border: isDark ? "border-gray-700" : "border-gray-200",
    borderStrong: isDark ? "border-gray-600" : "border-gray-300",
    accentLight: isDark ? "bg-blue-900/30" : "bg-blue-50",
    accentText: isDark ? "text-blue-400" : "text-blue-600",
  };

  const handleSubmit = () => {
    if (!quantity) {
      alert("请输入交易数量");
      return;
    }
    
    if (orderType === "limit" && !price) {
      alert("限价单请输入价格");
      return;
    }

    const tradeData = {
      code,
      type: tradeType,
      orderType,
      quantity: parseInt(quantity),
      price: orderType === "limit" ? parseFloat(price) : currentPrice,
    };

    onTradeSubmit?.(tradeData);
  };

  // 计算预估金额
  const estimatedAmount = quantity && (orderType === "limit" ? price : currentPrice) 
    ? (parseFloat(orderType === "limit" ? price : currentPrice) * parseInt(quantity || 0))
    : 0;

  return (
    <div className={`h-full ${colors.secondary} overflow-y-auto`}>
      <div className="p-4 space-y-4">
        {/* 标题 */}
        <div className="flex items-center justify-between">
          <h2 className={`text-lg font-bold ${colors.textPrimary}`}>
            交易面板
          </h2>
          <div className={`text-sm ${colors.textSecondary}`}>
            {code}
          </div>
        </div>

        {/* 当前价格显示 */}
        {currentPrice && (
          <div className={`p-3 ${colors.tertiary} rounded-lg`}>
            <div className={`text-sm ${colors.textSecondary} mb-1`}>当前价格</div>
            <div className={`text-xl font-bold ${colors.textPrimary}`}>
              ¥{currentPrice.toFixed(2)}
            </div>
          </div>
        )}

        {/* 买卖切换 */}
        <div className="flex rounded-lg overflow-hidden">
          <button
            onClick={() => setTradeType("buy")}
            className={`flex-1 py-3 px-4 font-medium transition-all flex flex-col items-center ${
              tradeType === "buy"
                ? "text-white"
                : `${colors.quaternary} ${colors.textSecondary} hover:${colors.textPrimary}`
            }`}
            style={{
              backgroundColor: tradeType === "buy" ? "#4285f4" : undefined
            }}
          >
            <span className="text-lg font-bold">买入</span>
            {currentPrice && (
              <span className="text-sm opacity-90">
                {currentPrice.toFixed(2)}
              </span>
            )}
          </button>
          <button
            onClick={() => setTradeType("sell")}
            className={`flex-1 py-3 px-4 font-medium transition-all flex flex-col items-center ${
              tradeType === "sell"
                ? "text-white"
                : `${colors.quaternary} ${colors.textSecondary} hover:${colors.textPrimary}`
            }`}
            style={{
              backgroundColor: tradeType === "sell" ? "#ea4335" : undefined
            }}
          >
            <span className="text-lg font-bold">卖出</span>
            {currentPrice && (
              <span className="text-sm opacity-90">
                {currentPrice.toFixed(2)}
              </span>
            )}
          </button>
        </div>

        {/* 订单类型 */}
        <div>
          <label className={`block text-sm font-medium ${colors.textSecondary} mb-2`}>
            订单类型
          </label>
          <div className="flex space-x-2">
            <button
              onClick={() => setOrderType("market")}
              className={`px-4 py-2 text-sm rounded transition-all ${
                orderType === "market"
                  ? `${colors.accentLight} ${colors.accentText} border ${colors.borderStrong}`
                  : `${colors.quaternary} ${colors.textSecondary} hover:${colors.textPrimary}`
              }`}
            >
              市价单
            </button>
            <button
              onClick={() => setOrderType("limit")}
              className={`px-4 py-2 text-sm rounded transition-all ${
                orderType === "limit"
                  ? `${colors.accentLight} ${colors.accentText} border ${colors.borderStrong}`
                  : `${colors.quaternary} ${colors.textSecondary} hover:${colors.textPrimary}`
              }`}
            >
              限价单
            </button>
          </div>
        </div>

        {/* 价格输入 - 仅限价单显示 */}
        {orderType === "limit" && (
          <div>
            <label className={`block text-sm font-medium ${colors.textSecondary} mb-2`}>
              价格 (¥)
            </label>
            <input
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="输入价格"
              className={`w-full ${colors.quaternary} ${colors.border} border ${colors.textPrimary} px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
            />
          </div>
        )}

        {/* 数量输入 */}
        <div>
          <label className={`block text-sm font-medium ${colors.textSecondary} mb-2`}>
            数量 (股)
          </label>
          <input
            type="number"
            step="100"
            min="100"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="输入数量"
            className={`w-full ${colors.quaternary} ${colors.border} border ${colors.textPrimary} px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
          />
        </div>

        {/* 预估金额 */}
        {estimatedAmount > 0 && (
          <div className={`p-4 ${colors.accentLight} rounded-lg`}>
            <div className={`text-sm ${colors.textSecondary} mb-1`}>
              预估{tradeType === "buy" ? "买入" : "卖出"}金额
            </div>
            <div className={`text-lg font-bold ${colors.accentText}`}>
              ¥{estimatedAmount.toLocaleString()}
            </div>
          </div>
        )}

        {/* 快速数量选择 */}
        <div>
          <div className="grid grid-cols-4 gap-2">
            {[100, 500, 1000, 2000].map((amount) => (
              <button
                key={amount}
                onClick={() => setQuantity(amount.toString())}
                className={`py-2 px-3 text-sm rounded transition-all ${colors.quaternary} ${colors.textSecondary} hover:${colors.textPrimary} hover:${colors.borderStrong} border ${colors.border}`}
              >
                {amount}
              </button>
            ))}
          </div>
        </div>

        {/* 提交按钮 */}
        <button
          onClick={handleSubmit}
          disabled={!quantity}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-all text-white text-center ${
            !quantity
              ? `cursor-not-allowed opacity-50`
              : ""
          }`}
          style={{
            backgroundColor: !quantity 
              ? "#6b7280" 
              : tradeType === "buy" 
              ? "#4285f4" 
              : "#ea4335"
          }}
        >
          {tradeType === "buy" ? "买入" : "卖出"}
          <br />
          <span className="text-sm">
            {quantity} {code} @ {orderType === 'market' ? 'MKT' : (price || currentPrice?.toFixed(2))} {orderType === 'market' ? '' : 'LMT'}
          </span>
        </button>

      </div>
    </div>
  )
}