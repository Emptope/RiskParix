import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchStockDetail, fetchStockInfo } from "../api/api";
import { useTheme } from "../context/ThemeContext";
import AIChatAssistant from "../components/AIChatAssistant";
import KLineChart from "../components/KLineChart";
import StockInfo from "../components/StockInfo";

export default function Detail() {
  const { code, year } = useParams();
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
  const [leftWidth, setLeftWidth] = useState(25);
  const [rightWidth, setRightWidth] = useState(25);
  const [isDragging, setIsDragging] = useState(null);
  const containerRef = useRef(null);

  const [detail, setDetail] = useState(null);
  const [stockInfo, setStockInfo] = useState(null);
  const [klineData, setKlineData] = useState([]);
  const [period, setPeriod] = useState("1天");

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

      if (isDragging === "left") {
        const newLeftWidth = Math.max(15, Math.min(45, percentage));
        setLeftWidth(newLeftWidth);
      } else if (isDragging === "right") {
        const newRightWidth = Math.max(15, Math.min(45, 100 - percentage));
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

  // 获取数据
  useEffect(() => {
    fetchStockDetail(code)
      .then((data) => {
        setDetail(data);
        if (data?.kline_data) {
          setKlineData(data.kline_data);
        }
      })
      .catch((err) => {
        console.error("获取股票详情失败:", err);
      });

    fetchStockInfo(code, year)
      .then((info) => {
        setStockInfo(info);
      })
      .catch((err) => {
        console.error("获取股票信息失败:", err);
      });
  }, [code, year]);

  const middleWidth = 100 - leftWidth - rightWidth;

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
              股票详情分析
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(`/trade/${code}`)}
              className={`flex items-center space-x-2 ${colors.accent} ${colors.accentHover} text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 ${colors.shadow}`}
            >
              <span>交易</span>
            </button>
          </div>
        </div>
      </div>

      <div ref={containerRef} className="flex flex-1 overflow-hidden">
        {/* 左侧股票信息面板 */}
        <div
          className={`${colors.tertiary} overflow-y-auto transition-all duration-200`}
          style={{ width: `${leftWidth}%` }}
        >
          <StockInfo
            stockInfo={stockInfo}
            klineData={klineData}
            showPriceInfo={true}
          />
        </div>

        {/* 左侧拖拽分隔条 */}
        <div
          className={`w-1 cursor-col-resize transition-all duration-200 ${
            isDragging === "left"
              ? "bg-blue-500"
              : isDark
              ? "bg-gray-700 hover:bg-blue-500"
              : "bg-gray-300 hover:bg-blue-500"
          }`}
          onMouseDown={() => handleMouseDown("left")}
        ></div>

        {/* 中间图表区域 */}
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

        {/* 右侧聊天助手 */}
        <div style={{ width: `${rightWidth}%` }} className="h-full">
          <AIChatAssistant
            endpoint="stock"
            contextId={code}
            year={year}
            initialMessage={`当前分析标的：${code}（${year}年），请问有什么可以帮您？`}
            placeholder="输入您的问题..."
            title="AI 分析助手"
            subtitle="DeepSeek 驱动"
            className="h-full"
          />
        </div>
      </div>
    </div>
  );
}
