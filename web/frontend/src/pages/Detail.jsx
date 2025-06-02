import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchStockDetail, fetchStockInfo } from "../api/api";
import ReactECharts from "echarts-for-react";
import Papa from "papaparse";
import groupBy from "lodash/groupBy";
import dayjs from "dayjs";
import { useTheme } from "../context/ThemeContext";
import AIChatAssistant from "../components/AIChatAssistant";

export default function Detail() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  const colors = {
    // 背景色 - 使用更深的背景提高对比度
    primary: isDark ? "bg-gray-950" : "bg-gray-50",
    secondary: isDark ? "bg-gray-900" : "bg-white",
    tertiary: isDark ? "bg-gray-800" : "bg-gray-100",
    quaternary: isDark ? "bg-gray-700" : "bg-gray-50",

    // 文字色 - 提高可读性
    textPrimary: isDark ? "text-gray-100" : "text-gray-900",
    textSecondary: isDark ? "text-gray-300" : "text-gray-600",
    textMuted: isDark ? "text-gray-400" : "text-gray-500",
    textDisabled: isDark ? "text-gray-600" : "text-gray-400",

    // 边框色 - 清晰分界
    border: isDark ? "border-gray-700" : "border-gray-200",
    borderLight: isDark ? "border-gray-800" : "border-gray-100",
    borderStrong: isDark ? "border-gray-600" : "border-gray-300",

    // 强调色 - 保持品牌一致性但提高对比度
    accent: isDark ? "bg-blue-600" : "bg-blue-600",
    accentHover: isDark ? "hover:bg-blue-500" : "hover:bg-blue-700",
    accentLight: isDark ? "bg-blue-900/30" : "bg-blue-50",
    accentText: isDark ? "text-blue-400" : "text-blue-600",

    // 状态色 - 增强对比
    success: isDark ? "text-emerald-400" : "text-emerald-600",
    successBg: isDark ? "bg-emerald-900/30" : "bg-emerald-50",
    danger: isDark ? "text-red-400" : "text-red-600",
    dangerBg: isDark ? "bg-red-900/30" : "bg-red-50",
    warning: isDark ? "text-amber-400" : "text-amber-600",
    warningBg: isDark ? "bg-amber-900/30" : "bg-amber-50",

    // 阴影 - 适合深色模式
    shadow: isDark
      ? "shadow-lg shadow-black/25"
      : "shadow-sm shadow-gray-200/50",
    shadowStrong: isDark
      ? "shadow-xl shadow-black/40"
      : "shadow-lg shadow-gray-300/20",
  };
  // 拖拽相关状态
  const [leftWidth, setLeftWidth] = useState(25);
  const [rightWidth, setRightWidth] = useState(25);
  const [isDragging, setIsDragging] = useState(null);
  const containerRef = useRef(null);

  const [detail, setDetail] = useState(null);
  const [stockInfo, setStockInfo] = useState(null);
  const [klineData, setKlineData] = useState([]);
  const [period, setPeriod] = useState("日K");

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

  useEffect(() => {
    fetchStockDetail(code)
      .then((data) => {
        setDetail(data);
        if (data?.kline_data) {
          setKlineData(data.kline_data);
        } else {
          fetchKlineFromCSV(code);
        }
      })
      .catch(() => {
        fetchKlineFromCSV(code);
      });

    fetchStockInfo(code)
      .then((info) => {
        setStockInfo(info);
      })
      .catch((err) => {
        console.error("获取股票信息失败:", err);
      });
  }, [code]);

  const fetchKlineFromCSV = async (stockCode) => {
    try {
      const response = await fetch("/data/day_klines/all_klines.csv");
      const text = await response.text();
      Papa.parse(text, {
        header: true,
        complete: (result) => {
          const filtered = result.data.filter((row) =>
            row["证券代码"]?.includes(stockCode)
          );
          const formatted = filtered
            .map((row) => ({
              date: row["交易日期"],
              open: parseFloat(row["开盘价"]),
              close: parseFloat(row["收盘价"]),
              low: parseFloat(row["最低价"]),
              high: parseFloat(row["最高价"]),
            }))
            .filter((row) => !isNaN(row.open));
          setKlineData(formatted);
        },
      });
    } catch (err) {
      console.error("读取文件失败:", err);
    }
  };

  const periods = ["日K", "周K", "月K", "季K", "年K"];

  const resampleKline = (data, period) => {
    if (period === "日K") return data;

    const formatMap = {
      周K: (date) => dayjs(date).startOf("week").format("YYYY-MM-DD"),
      月K: (date) => dayjs(date).startOf("month").format("YYYY-MM-DD"),
      年K: (date) => dayjs(date).startOf("year").format("YYYY-MM-DD"),
      季K: (date) => {
        const d = dayjs(date);
        const month = d.month();
        const startMonth = [0, 3, 6, 9][Math.floor(month / 3)];
        return dayjs(
          `${d.year()}-${(startMonth + 1).toString().padStart(2, "0")}-01`
        ).format("YYYY-MM-DD");
      },
    };

    const grouped = groupBy(data, (item) => formatMap[period](item.date));
    return Object.entries(grouped).map(([date, group]) => ({
      date,
      open: group[0].open,
      close: group[group.length - 1].close,
      low: Math.min(...group.map((i) => i.low)),
      high: Math.max(...group.map((i) => i.high)),
    }));
  };

  const calculateEMA = (data, dayCount) => {
    const result = [];
    let multiplier = 2 / (dayCount + 1);
    for (let i = 0; i < data.length; i++) {
      if (i === 0) {
        result.push(data[i].close);
      } else {
        result.push(
          (data[i].close - result[i - 1]) * multiplier + result[i - 1]
        );
      }
    }
    return result.map((val) => val.toFixed(2));
  };

  const getKlineOption = () => {
    const sourceData = resampleKline(klineData, period);
    if (!sourceData || sourceData.length === 0) return {};

    const dates = sourceData.map((item) => item.date);
    const candlestickData = sourceData.map((item) => [
      item.open,
      item.close,
      item.low,
      item.high,
    ]);

    return {
      backgroundColor: isDark ? "#0f172a" : "#ffffff",
      textStyle: { color: isDark ? "#e2e8f0" : "#111827", fontSize: 12 },
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "cross",
          lineStyle: {
            color: isDark ? "#64748b" : "#6b7280",
            width: 1,
            type: "dashed",
          },
        },
        backgroundColor: isDark ? "#1e293b" : "#ffffff",
        borderColor: isDark ? "#475569" : "#e5e7eb",
        textStyle: { color: isDark ? "#e2e8f0" : "#111827", fontSize: 12 },
        borderWidth: 1,
        shadowColor: isDark ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.1)",
        shadowBlur: 10,
      },
      legend: {
        data: ["K线", "EMA20"],
        textStyle: { color: isDark ? "#cbd5e1" : "#374151", fontSize: 12 },
        top: 10,
      },
      xAxis: {
        type: "category",
        data: dates,
        scale: true,
        boundaryGap: false,
        axisLine: {
          onZero: false,
          lineStyle: { color: isDark ? "#475569" : "#d1d5db", width: 1 },
        },
        axisTick: {
          lineStyle: { color: isDark ? "#475569" : "#d1d5db" },
        },
        axisLabel: {
          color: isDark ? "#cbd5e1" : "#6b7280",
          fontSize: 11,
        },
        splitLine: {
          show: true,
          lineStyle: {
            color: isDark ? "#334155" : "#f1f5f9",
            type: "solid",
            width: 1,
          },
        },
        min: "dataMin",
        max: "dataMax",
        minInterval: 1,
      },
      yAxis: {
        scale: true,
        splitArea: { show: false },
        axisLine: {
          lineStyle: { color: isDark ? "#475569" : "#d1d5db", width: 1 },
        },
        axisTick: {
          lineStyle: { color: isDark ? "#475569" : "#d1d5db" },
        },
        axisLabel: {
          color: isDark ? "#cbd5e1" : "#6b7280",
          fontSize: 11,
        },
        splitLine: {
          show: true,
          lineStyle: {
            color: isDark ? "#334155" : "#f1f5f9",
            type: "solid",
            width: 1,
          },
        },
      },
      dataZoom: [
        { type: "inside", start: 50, end: 100, minValueSpan: 5 },
        {
          show: true,
          type: "slider",
          top: "90%",
          start: 50,
          end: 100,
          minValueSpan: 5,
          backgroundColor: isDark ? "#1e293b" : "#f8fafc",
          fillerColor: isDark ? "#3b82f6" : "#2563eb",
          borderColor: isDark ? "#475569" : "#e5e7eb",
          textStyle: { color: isDark ? "#cbd5e1" : "#6b7280" },
          handleStyle: {
            color: isDark ? "#64748b" : "#94a3b8",
            borderColor: isDark ? "#cbd5e1" : "#64748b",
          },
          moveHandleStyle: {
            color: isDark ? "#475569" : "#e2e8f0",
          },
        },
      ],
      series: [
        {
          name: "K线",
          type: "candlestick",
          data: candlestickData,
          itemStyle: {
            color: isDark ? "#22c55e" : "#16a34a",
            color0: isDark ? "#ef4444" : "#dc2626",
            borderColor: isDark ? "#22c55e" : "#16a34a",
            borderColor0: isDark ? "#ef4444" : "#dc2626",
            borderWidth: 1,
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: isDark
                ? "rgba(34, 197, 94, 0.3)"
                : "rgba(22, 163, 74, 0.3)",
            },
          },
        },
        {
          name: "EMA20",
          type: "line",
          data: calculateEMA(sourceData, 20),
          smooth: false,
          lineStyle: {
            width: 2,
            color: isDark ? "#60a5fa" : "#1d4ed8",
          },
          symbol: "none",
          emphasis: {
            lineStyle: {
              width: 3,
            },
          },
        },
      ],
    };
  };

  const middleWidth = 100 - leftWidth - rightWidth;

  return (
    <div
      className={`flex flex-col h-screen ${colors.primary} ${colors.textPrimary} transition-colors duration-300`}
    >
      {/* 顶部导航栏 - 增强对比度 */}
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
          <button
            onClick={toggleTheme}
            className={`${colors.accent} ${colors.accentHover} text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 ${colors.shadow}`}
          >
            {isDark ? "🌞 浅色" : "🌙 深色"}
          </button>
        </div>
      </div>

      <div ref={containerRef} className="flex flex-1 overflow-hidden">
        {/* 左侧股票信息面板 - 优化布局和对比度 */}
        <div
          className={`${colors.tertiary} overflow-y-auto transition-all duration-200`}
          style={{ width: `${leftWidth}%` }}
        >
          <div className="p-6 space-y-6">
            {/* 标题区域 - 简化设计 */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div
                  className={`w-10 h-10 ${colors.accent} rounded-lg flex items-center justify-center`}
                >
                  <svg
                    className="w-6 h-6 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className={`text-xl font-bold ${colors.textPrimary}`}>
                    股票信息
                  </h2>
                  <p className={`${colors.textMuted} text-sm`}>实时数据分析</p>
                </div>
              </div>
            </div>

            {stockInfo ? (
              <div className="space-y-6">
                {/* 基本信息卡片 - 扁平化设计 */}
                <div
                  className={`${colors.secondary} ${colors.border} border rounded-lg p-6 ${colors.shadow} transition-all duration-200`}
                >
                  <h3
                    className={`text-sm font-semibold ${colors.textMuted} uppercase tracking-wider mb-4`}
                  >
                    基本信息
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-2">
                      <span className={`${colors.textSecondary} font-medium`}>
                        股票代码
                      </span>
                      <div
                        className={`${colors.accent} text-white px-3 py-1.5 rounded-md text-sm font-mono font-bold`}
                      >
                        {stockInfo.code}
                      </div>
                    </div>
                    <div
                      className={`h-px ${colors.borderLight} bg-current`}
                    ></div>
                    <div className="flex items-center justify-between py-2">
                      <span className={`${colors.textSecondary} font-medium`}>
                        股票名称
                      </span>
                      <span className={`${colors.textPrimary} font-semibold`}>
                        {stockInfo.name}
                      </span>
                    </div>
                    <div
                      className={`h-px ${colors.borderLight} bg-current`}
                    ></div>
                    <div className="flex items-center justify-between py-2">
                      <span className={`${colors.textSecondary} font-medium`}>
                        年份
                      </span>
                      <div
                        className={`${colors.quaternary} ${colors.textPrimary} px-3 py-1.5 rounded-md text-sm font-medium`}
                      >
                        {stockInfo.year}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 财务指标卡片 - 增强可读性 */}
                <div
                  className={`${colors.secondary} ${colors.border} border rounded-lg p-6 ${colors.shadow} transition-all duration-200`}
                >
                  <h3
                    className={`text-sm font-semibold ${colors.textMuted} uppercase tracking-wider mb-6`}
                  >
                    财务指标
                  </h3>
                  <div className="space-y-6">
                    {/* 年涨跌幅 */}
                    <div className={`${colors.quaternary} rounded-lg p-4`}>
                      <div className="flex items-center justify-between mb-3">
                        <span
                          className={`${colors.textSecondary} text-sm font-medium`}
                        >
                          年涨跌幅
                        </span>
                        <div
                          className={`px-3 py-1 rounded-md text-xs font-bold ${
                            stockInfo.annual_return > 0
                              ? `${colors.successBg} ${colors.success}`
                              : stockInfo.annual_return < 0
                              ? `${colors.dangerBg} ${colors.danger}`
                              : `${colors.quaternary} ${colors.textMuted}`
                          }`}
                        >
                          {stockInfo.annual_return
                            ? `${(stockInfo.annual_return * 100).toFixed(2)}%`
                            : "--"}
                        </div>
                      </div>
                      <div
                        className={`h-2 ${colors.borderLight} bg-current rounded-full overflow-hidden`}
                      >
                        <div
                          className={`h-full transition-all duration-500 rounded-full ${
                            stockInfo.annual_return > 0
                              ? "bg-emerald-500"
                              : "bg-red-500"
                          }`}
                          style={{
                            width: `${Math.min(
                              Math.abs(stockInfo.annual_return * 100),
                              100
                            )}%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    {/* 最大回撤 */}
                    <div className={`${colors.quaternary} rounded-lg p-4`}>
                      <div className="flex items-center justify-between mb-3">
                        <span
                          className={`${colors.textSecondary} text-sm font-medium`}
                        >
                          最大回撤
                        </span>
                        <div
                          className={`px-3 py-1 rounded-md text-xs font-bold ${colors.warningBg} ${colors.warning}`}
                        >
                          {stockInfo.max_drawdown
                            ? `${(stockInfo.max_drawdown * 100).toFixed(2)}%`
                            : "--"}
                        </div>
                      </div>
                      <div
                        className={`h-2 ${colors.borderLight} bg-current rounded-full overflow-hidden`}
                      >
                        <div
                          className="h-full bg-amber-500 transition-all duration-500 rounded-full"
                          style={{
                            width: `${Math.min(
                              Math.abs(stockInfo.max_drawdown * 100),
                              100
                            )}%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    {/* 估值指标 */}
                    <div className="grid grid-cols-2 gap-4">
                      <div
                        className={`${colors.quaternary} rounded-lg p-4 text-center`}
                      >
                        <div
                          className={`${colors.textMuted} text-xs font-medium mb-2`}
                        >
                          市盈率
                        </div>
                        <div
                          className={`${colors.textPrimary} text-xl font-bold mb-1`}
                        >
                          {stockInfo.pe_ratio
                            ? stockInfo.pe_ratio.toFixed(1)
                            : "--"}
                        </div>
                        <div className={`${colors.textMuted} text-xs`}>P/E</div>
                      </div>
                      <div
                        className={`${colors.quaternary} rounded-lg p-4 text-center`}
                      >
                        <div
                          className={`${colors.textMuted} text-xs font-medium mb-2`}
                        >
                          市净率
                        </div>
                        <div
                          className={`${colors.textPrimary} text-xl font-bold mb-1`}
                        >
                          {stockInfo.pb_ratio
                            ? stockInfo.pb_ratio.toFixed(1)
                            : "--"}
                        </div>
                        <div className={`${colors.textMuted} text-xs`}>P/B</div>
                      </div>
                    </div>

                    {/* 夏普比率 */}
                    <div className={`${colors.quaternary} rounded-lg p-4`}>
                      <div className="flex items-center justify-between">
                        <span
                          className={`${colors.textSecondary} text-sm font-medium`}
                        >
                          夏普比率
                        </span>
                        <div
                          className={`px-3 py-1 rounded-md text-xs font-bold ${
                            stockInfo.sharpe_ratio > 1
                              ? `${colors.successBg} ${colors.success}`
                              : stockInfo.sharpe_ratio > 0.5
                              ? `${colors.warningBg} ${colors.warning}`
                              : `${colors.dangerBg} ${colors.danger}`
                          }`}
                        >
                          {stockInfo.sharpe_ratio
                            ? stockInfo.sharpe_ratio.toFixed(3)
                            : "--"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 价格信息卡片 */}
                {klineData && klineData.length > 0 && (
                  <div
                    className={`${colors.secondary} ${colors.border} border rounded-lg p-6 ${colors.shadow} transition-all duration-200`}
                  >
                    <div className="flex items-center space-x-2 mb-6">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <h3
                        className={`text-sm font-semibold ${colors.textMuted} uppercase tracking-wider`}
                      >
                        最新价格
                      </h3>
                    </div>
                    <div className="space-y-4">
                      <div className="text-center py-4">
                        <div
                          className={`${colors.textPrimary} text-3xl font-bold mb-2`}
                        >
                          ¥
                          {klineData[klineData.length - 1]?.close?.toFixed(2) ||
                            "--"}
                        </div>
                        <div className={`${colors.textMuted} text-sm`}>
                          {klineData[klineData.length - 1]?.date || "--"}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div
                          className={`${colors.quaternary} rounded-lg p-3 text-center`}
                        >
                          <div className={`${colors.textMuted} text-xs mb-1`}>
                            开盘
                          </div>
                          <div
                            className={`${colors.textPrimary} font-semibold`}
                          >
                            ¥
                            {klineData[klineData.length - 1]?.open?.toFixed(
                              2
                            ) || "--"}
                          </div>
                        </div>
                        <div
                          className={`${colors.quaternary} rounded-lg p-3 text-center`}
                        >
                          <div className={`${colors.textMuted} text-xs mb-1`}>
                            最高
                          </div>
                          <div className={`${colors.success} font-semibold`}>
                            ¥
                            {klineData[klineData.length - 1]?.high?.toFixed(
                              2
                            ) || "--"}
                          </div>
                        </div>
                        <div
                          className={`${colors.quaternary} rounded-lg p-3 text-center`}
                        >
                          <div className={`${colors.textMuted} text-xs mb-1`}>
                            最低
                          </div>
                          <div className={`${colors.danger} font-semibold`}>
                            ¥
                            {klineData[klineData.length - 1]?.low?.toFixed(2) ||
                              "--"}
                          </div>
                        </div>
                        <div
                          className={`${colors.quaternary} rounded-lg p-3 text-center`}
                        >
                          <div className={`${colors.textMuted} text-xs mb-1`}>
                            收盘
                          </div>
                          <div
                            className={`${colors.textPrimary} font-semibold`}
                          >
                            ¥
                            {klineData[klineData.length - 1]?.close?.toFixed(
                              2
                            ) || "--"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <div className={`${colors.textMuted} text-sm`}>
                  正在加载股票信息...
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 左侧拖拽分隔条 - 简化设计 */}
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

        {/* 中间图表区域 - 优化布局 */}
        <div
          className={`${colors.secondary} flex flex-col transition-all duration-200`}
          style={{ width: `${middleWidth}%` }}
        >
          <div
            className={`${colors.borderStrong} border-b p-6 ${colors.secondary}`}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <h2 className={`text-xl font-bold ${colors.textPrimary}`}>
                  K线图表
                </h2>
                <div className="flex items-center space-x-2">
                  <span
                    className={`${colors.textSecondary} text-sm font-medium`}
                  >
                    周期:
                  </span>
                  <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className={`${colors.quaternary} ${colors.borderStrong} border ${colors.textPrimary} px-3 py-2 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all`}
                  >
                    {periods.map((p) => (
                      <option
                        key={p}
                        value={p}
                        className={`${colors.quaternary} ${colors.textPrimary}`}
                      >
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

            </div>
          </div>
          <div className="flex-1 p-6">
            <div
              className={`h-full ${colors.border} border rounded-lg overflow-hidden ${colors.shadow}`}
            >
              <ReactECharts
                option={getKlineOption()}
                style={{ height: "100%", width: "100%" }}
              />
            </div>
          </div>
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
            apiEndpoint="http://localhost:8000/api/chat/stock"
            contextId={code}
            initialMessage={`当前分析标的：${code}，请问有什么可以帮您？`}
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
