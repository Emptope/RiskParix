import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchStockDetail } from "../api/api";
import { useTheme } from "../context/ThemeContext";
import KLineChart from "../components/KLineChart";

export default function Trade() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const colors = {
    // 背景色
    primary: isDark ? "bg-gray-950" : "bg-gray-50",
    secondary: isDark ? "bg-gray-900" : "bg-white",
    tertiary: isDark ? "bg-gray-800" : "bg-gray-100",
    quaternary: isDark ? "bg-gray-700" : "bg-gray-50",

    // 文字色
    textPrimary: isDark ? "text-gray-100" : "text-gray-900",
    textSecondary: isDark ? "text-gray-300" : "text-gray-600",
    textMuted: isDark ? "text-gray-400" : "text-gray-500",
    textDisabled: isDark ? "text-gray-600" : "text-gray-400",

    // 边框色
    border: isDark ? "border-gray-700" : "border-gray-200",
    borderLight: isDark ? "border-gray-800" : "border-gray-100",
    borderStrong: isDark ? "border-gray-600" : "border-gray-300",

    // 强调色
    accent: isDark ? "bg-blue-600" : "bg-blue-600",
    accentHover: isDark ? "hover:bg-blue-500" : "hover:bg-blue-700",
    accentLight: isDark ? "bg-blue-900/30" : "bg-blue-50",
    accentText: isDark ? "text-blue-400" : "text-blue-600",

    // 状态色
    success: isDark ? "text-emerald-400" : "text-emerald-600",
    successBg: isDark ? "bg-emerald-900/30" : "bg-emerald-50",
    danger: isDark ? "text-red-400" : "text-red-600",
    dangerBg: isDark ? "bg-red-900/30" : "bg-red-50",
    warning: isDark ? "text-amber-400" : "text-amber-600",
    warningBg: isDark ? "bg-amber-900/30" : "bg-amber-50",

    // 阴影
    shadow: isDark
      ? "shadow-lg shadow-black/25"
      : "shadow-lg shadow-gray-400/25",
    shadowStrong: isDark
      ? "shadow-xl shadow-black/40"
      : "shadow-xl shadow-gray-500/30",
  };

  // 拖拽相关状态
  const [rightWidth, setRightWidth] = useState(30);
  const [isDragging, setIsDragging] = useState(null);
  const containerRef = useRef(null);

  const [klineData, setKlineData] = useState([]);
  const [period, setPeriod] = useState("日K");

  // 交易相关状态
  const [tradeType, setTradeType] = useState("buy"); // buy or sell
  const [orderType, setOrderType] = useState("market"); // market or limit
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");

  // 拖拽处理函数
  const handleMouseDown = useCallback((divider) => {
    setIsDragging(divider);
  }, []);

  const handleMouseMove = useCallback(
    (e) => {
      if (!isDragging || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const mouseX = e.clientX - containerRect.left;
      const percentage = (mouseX / containerWidth) * 100;

      if (isDragging === "right") {
        const newRightWidth = Math.max(20, Math.min(50, 100 - percentage));
        setRightWidth(newRightWidth);
      }
    },
    [isDragging]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(null);
  }, []);

  // 添加全局鼠标事件监听
  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    } else {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // 获取K线数据
  useEffect(() => {
    fetchStockDetail(code)
      .then((data) => {
        if (data?.kline_data) {
          setKlineData(data.kline_data);
          // 设置当前价格为默认限价
          if (data.kline_data.length > 0) {
            setPrice(data.kline_data[data.kline_data.length - 1].close.toFixed(2));
          }
        }
      })
      .catch((err) => {
        console.error("获取股票详情失败:", err);
      });
  }, [code]);

  // 处理交易提交
  const handleTradeSubmit = () => {
    if (!quantity || (orderType === "limit" && !price)) {
      alert("请填写完整的交易信息");
      return;
    }

    const tradeData = {
      code,
      type: tradeType,
      orderType,
      quantity: parseInt(quantity),
      price: orderType === "limit" ? parseFloat(price) : null,
    };

    console.log("提交交易:", tradeData);
    // 这里可以调用交易API
    alert(`${tradeType === "buy" ? "买入" : "卖出"}订单已提交`);
  };

  const middleWidth = 100 - rightWidth;

  return (
    <div
      className={`flex flex-col h-screen ${colors.primary} ${colors.textPrimary} transition-colors duration-300`}
    >
      {/* 顶部导航栏 */}
      <div
        className={`${colors.secondary} ${colors.borderStrong} border-b px-6 py-4 ${colors.shadow}`}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(-1)}
              className={`flex items-center space-x-2 ${colors.textSecondary} hover:${colors.textPrimary} transition-colors duration-200 px-3 py-2 rounded-lg hover:${colors.quaternary}`}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              <span className="font-medium">返回</span>
            </button>
            <div className={`h-6 w-px ${colors.borderStrong} bg-current`}></div>
            <h1 className={`text-xl font-bold ${colors.textPrimary}`}>
              股票交易 - {code}
            </h1>
          </div>
        </div>
      </div>

      <div ref={containerRef} className="flex flex-1 overflow-hidden">
        {/* K线图区域 */}
        <div
          className="transition-all duration-200"
          style={{ width: `${middleWidth}%` }}
        >
          <KLineChart
            data={klineData}
            period={period}
            onPeriodChange={setPeriod}
            showPeriodSelector={true}
            className="h-full"
          />
        </div>

        {/* 右侧拖拽分隔条 */}
        <div
          className={`w-1 cursor-col-resize transition-all duration-200 ${
            isDragging === "right"
              ? "bg-blue-500"
              : isDark
              ? "bg-gray-700 hover:bg-blue-500"
              : "bg-gray-300 hover:bg-blue-500"
          }`}
          onMouseDown={() => handleMouseDown("right")}
        ></div>

        {/* 右侧交易面板 */}
        <div 
          style={{ width: `${rightWidth}%` }} 
          className={`h-full ${colors.secondary} overflow-y-auto`}
        >
          <div className="p-6">
            <h2 className={`text-xl font-bold ${colors.textPrimary} mb-6`}>
              交易面板
            </h2>
            
            {/* 买卖切换 */}
            <div className="mb-6">
              <div className="flex rounded-lg overflow-hidden">
                <button
                  onClick={() => setTradeType("buy")}
                  className={`flex-1 py-3 px-4 font-medium transition-all ${
                    tradeType === "buy"
                      ? "bg-emerald-600 text-white"
                      : `${colors.quaternary} ${colors.textSecondary} hover:${colors.textPrimary}`
                  }`}
                >
                  买入
                </button>
                <button
                  onClick={() => setTradeType("sell")}
                  className={`flex-1 py-3 px-4 font-medium transition-all ${
                    tradeType === "sell"
                      ? "bg-red-600 text-white"
                      : `${colors.quaternary} ${colors.textSecondary} hover:${colors.textPrimary}`
                  }`}
                >
                  卖出
                </button>
              </div>
            </div>

            {/* 订单类型 */}
            <div className="mb-6">
              <label className={`block text-sm font-medium ${colors.textSecondary} mb-2`}>
                订单类型
              </label>
              <select
                value={orderType}
                onChange={(e) => setOrderType(e.target.value)}
                className={`w-full ${colors.quaternary} ${colors.borderStrong} border ${colors.textPrimary} px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
              >
                <option value="market">市价单</option>
                <option value="limit">限价单</option>
              </select>
            </div>

            {/* 价格输入 */}
            {orderType === "limit" && (
              <div className="mb-6">
                <label className={`block text-sm font-medium ${colors.textSecondary} mb-2`}>
                  价格
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="输入价格"
                  className={`w-full ${colors.quaternary} ${colors.borderStrong} border ${colors.textPrimary} px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                />
              </div>
            )}

            {/* 数量输入 */}
            <div className="mb-6">
              <label className={`block text-sm font-medium ${colors.textSecondary} mb-2`}>
                数量（股）
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="输入数量"
                className={`w-full ${colors.quaternary} ${colors.borderStrong} border ${colors.textPrimary} px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
              />
            </div>

            {/* 预估金额 */}
            {quantity && price && (
              <div className={`mb-6 p-4 ${colors.accentLight} rounded-lg`}>
                <div className={`text-sm ${colors.textSecondary} mb-1`}>
                  预估{tradeType === "buy" ? "买入" : "卖出"}金额
                </div>
                <div className={`text-lg font-bold ${colors.accentText}`}>
                  ¥{(parseFloat(price) * parseInt(quantity || 0)).toLocaleString()}
                </div>
              </div>
            )}

            {/* 提交按钮 */}
            <button
              onClick={handleTradeSubmit}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
                tradeType === "buy"
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-red-600 hover:bg-red-700 text-white"
              } ${colors.shadow}`}
            >
              {tradeType === "buy" ? "买入" : "卖出"} {code}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}