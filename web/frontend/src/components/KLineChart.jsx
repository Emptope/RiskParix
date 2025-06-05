import React, { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import groupBy from "lodash/groupBy";
import dayjs from "dayjs";
import { useTheme } from "../context/ThemeContext";

const KLineChart = ({ 
  data = [], 
  period = "1天", 
  onPeriodChange,
  showPeriodSelector = true,
  height = "100%",
  className = ""
}) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const periods = [
    { label: "1天", value: "1天" },
    { label: "5天", value: "5天" },
    { label: "1个月", value: "1个月" },
    { label: "3个月", value: "3个月" },
    { label: "6个月", value: "6个月" },
    { label: "1年", value: "1年" }
  ];

   // 数据重采样函数
   const resampleKline = useMemo(() => {
    if (period === "1天" || !data || data.length === 0) return data;

    // const availableKeys = ["5天", "1个月", "3个月", "6个月", "1年"];
    // if (!availableKeys.includes(period)) {
    //   console.warn(`[KLineChart] 无法识别的 period：“${period}”，可选值：${availableKeys.join("、")}`);
    //   return data;
    // }

    const formatMap = {
      "1天": date => dayjs(date).format("YYYY-MM-DD"),
      "5天": (date) => dayjs(date).startOf("week").format("YYYY-MM-DD"),
      "1个月": (date) => dayjs(date).startOf("month").format("YYYY-MM-DD"),
      "1年": (date) => dayjs(date).startOf("year").format("YYYY-MM-DD"),
      "3个月": (date) => {
        const d = dayjs(date);
        const month = d.month();
        const startMonth = [0, 3, 6, 9][Math.floor(month / 3)];
        return dayjs(
          `${d.year()}-${(startMonth + 1).toString().padStart(2, "0")}-01`
        ).format("YYYY-MM-DD");
      },
      "6个月": (date) => {
        const d = dayjs(date);
        const month = d.month();
        const startMonth = month < 6 ? 0 : 6;
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
  }, [data, period]);

  // EMA计算函数
  const calculateEMA = (data, dayCount) => {
    if (!data || data.length === 0) return [];
    
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

  // 图表配置
  const chartOption = useMemo(() => {
    const sourceData = resampleKline;
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
        position: "right",
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
  }, [resampleKline, isDark]);

  // 主题颜色配置
  const colors = {
    secondary: isDark ? "bg-gray-900" : "bg-white",
    borderStrong: isDark ? "border-gray-600" : "border-gray-300",
    textPrimary: isDark ? "text-gray-100" : "text-gray-900",
    textSecondary: isDark ? "text-gray-300" : "text-gray-600",
    quaternary: isDark ? "bg-gray-700" : "bg-gray-50",
    border: isDark ? "border-gray-700" : "border-gray-200",
    accentLight: isDark ? "bg-blue-900/30" : "bg-blue-50",
    accentText: isDark ? "text-blue-400" : "text-blue-600",
  };

  return (
    <div className={`${colors.secondary} flex flex-col h-full ${className}`}>
      {showPeriodSelector && (
        <div className={`${colors.borderStrong} border-b p-4 ${colors.secondary}`}>
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              {periods.map((p) => (
                <button
                  key={p.value}
                  onClick={() => onPeriodChange?.(p.value)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                    period === p.value
                      ? `${colors.accentLight} ${colors.accentText} border ${colors.borderStrong}`
                      : `${colors.quaternary} ${colors.textSecondary} hover:${colors.textPrimary} border ${colors.border}`
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      
      <div className="flex-1">
        <ReactECharts
          option={chartOption}
          style={{ height: "100%", width: "100%" }}
        />
      </div>
    </div>
  );
};

export default KLineChart;