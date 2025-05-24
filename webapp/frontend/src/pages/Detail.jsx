// Detail Themed with Coordinated Dark Mode Styling
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchStockDetail, sendChat } from "../api/api";
import ReactECharts from "echarts-for-react";
import Papa from "papaparse";
import groupBy from "lodash/groupBy";
import dayjs from "dayjs";
import { useTheme } from "../context/ThemeContext";
import ReactMarkdown from "react-markdown";
import parse from "html-react-parser";

export default function Detail() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const baseBg = isDark ? "bg-[#0a0a0a] text-[#e5e5e5]" : "bg-white text-black";
  const cardBg = isDark ? "bg-[#141414] text-[#e5e5e5]" : "bg-white text-black";
  const sectionBg = isDark ? "bg-[#1c1c1c]" : "bg-gray-100";
  const inputStyle = `w-full border border-gray-600 px-2 py-1 rounded ${
    isDark ? "bg-[#1c1c1c] text-white" : "text-black"
  }`;
  const textareaRef = useRef(null);

  const [detail, setDetail] = useState(null);
  const [klineData, setKlineData] = useState([]);
  const [period, setPeriod] = useState("日K");

  // Chat assistant state
  const [messages, setMessages] = useState([
    { role: "ai", content: `当前分析标的：${code}，请问有什么可以帮您？` },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

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
  }, [code]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
        const month = d.month(); // 0-11
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
      backgroundColor: isDark ? "#0a0a0a" : "#fff",
      textStyle: { color: isDark ? "#e5e5e5" : "#333" },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "cross" },
      },
      legend: {
        data: ["K线", "EMA20"],
        textStyle: { color: isDark ? "#e5e5e5" : "#333" },
      },
      xAxis: {
        type: "category",
        data: dates,
        scale: true,
        boundaryGap: false,
        axisLine: {
          onZero: false,
          lineStyle: {
            color: isDark ? "#555" : "#333",
          },
        },
        splitLine: {
          show: true,
          lineStyle: {
            color: isDark ? "#2a2a2a" : "#eee",
            type: "dotted",
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
          lineStyle: {
            color: isDark ? "#555" : "#333",
          },
        },
        splitLine: {
          show: true,
          lineStyle: {
            color: isDark ? "#2a2a2a" : "#eee",
            type: "dotted",
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
        },
      ],
      series: [
        {
          name: "K线",
          type: "candlestick",
          data: candlestickData,
          itemStyle: {
            color: "#ef5350",
            color0: "#26a69a",
            borderColor: "#ef5350",
            borderColor0: "#26a69a",
          },
        },
        {
          name: "EMA20",
          type: "line",
          data: calculateEMA(sourceData, 20),
          smooth: false,
          lineStyle: { width: 1 },
        },
      ],
    };
  };

  // Chat assistant functions
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = { role: "user", content: inputValue };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    textareaRef.current.style.height = "auto";
    setIsLoading(true);

    try {
      const response = await sendChat({
        message: inputValue,
        history: messages
          .filter((msg) => msg.role !== "ai")
          .map((msg) => ({
            role: msg.role === "user" ? "user" : "assistant",
            content: msg.content,
          })),
        stock_id: code,
      });

      setMessages((prev) => [...prev, { role: "ai", content: response }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content: `请求出错: ${error.message}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className={`flex flex-col h-screen ${baseBg}`}>
      <div className="flex justify-end p-2">
        <button
          onClick={toggleTheme}
          className="border px-3 py-1 rounded text-sm"
        >
          切换为 {isDark ? "浅色" : "深色"} 模式
        </button>
      </div>
      <div className="flex flex-1 overflow-hidden">

        {/* 左侧估值信息 */}
        <div className={`w-1/4 p-4 overflow-y-auto ${sectionBg}`}>
          <h2 className="text-lg font-semibold mb-2">估值信息</h2>
          {detail ? (
            <div className="space-y-2">
              <div>
                <label className="block text-sm">FCFE估值</label>
                <input
                  className={inputStyle}
                  value={detail.fcfe || ""}
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm">FCFF估值</label>
                <input
                  className={inputStyle}
                  value={detail.fcff || ""}
                  readOnly
                />
              </div>
              <h2 className="text-lg font-semibold mt-4 mb-2">金融参数</h2>
              <div>
                <label className="block text-sm">年化收益率</label>
                <input
                  className={inputStyle}
                  value={detail.annualized_return || ""}
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm">最大回撤</label>
                <input
                  className={inputStyle}
                  value={detail.max_drawdown || ""}
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm">夏普比率</label>
                <input
                  className={inputStyle}
                  value={detail.sharpe_ratio || ""}
                  readOnly
                />
              </div>
              <h2 className="text-lg font-semibold mt-4 mb-2">相关股票</h2>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {detail.related_stocks?.map((stock, idx) => (
                  <li key={idx}>{stock}</li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="text-gray-400 text-sm">暂无详细估值信息</div>
          )}
        </div>

        {/* 中间图表区域 */}
        <div className={`w-2/4 p-4 flex flex-col ${cardBg}`}>
          <div className="mb-4 flex justify-between items-center">
            <div>
              <label className="mr-2">K线周期:</label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="border px-2 py-1 text-black"
              >
                {periods.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex-1 border rounded">
            <ReactECharts
              option={getKlineOption()}
              style={{ height: "100%", width: "100%" }}
            />
          </div>
        </div>

        {/* 右侧聊天助手 */}
        <div
          className={`w-1/4 p-4 flex flex-col border-l ${sectionBg} chat-container`}
        >
          <h2 className="text-lg font-semibold mb-2 text-center">
            DeepSeek 分析助手
          </h2>

{/* 消息展示区域 */}
<div className={`flex-1 overflow-y-auto rounded-lg mb-3 ${isDark ? "bg-[#1e1e1e]" : "bg-gray-50"}`}>
  <div className="p-3 space-y-3" style={{ minHeight: "100%" }}>
    {messages.map((msg, index) => (
      <div
        key={index}
        className={`p-4 rounded-lg max-w-[90%] shadow-sm ${
          msg.role === "user"
            ? "ml-auto bg-gradient-to-r from-blue-500 to-blue-600 text-white"
            : `mr-auto ${isDark ? "bg-[#2d2d2d] text-gray-100" : "bg-white text-gray-800 border border-gray-200"}`
        }`}
      >
        {msg.isHtml ? (
          parse(msg.content)
        ) : (
          <div className="whitespace-pre-line">
            <ReactMarkdown
              components={{
                // 处理空段落（连续换行）
                p: ({node, ...props}) => {
                  const isEmpty = React.Children.toArray(props.children).every(
                    child => child === '\n' || (typeof child === 'string' && child.trim() === '')
                  );
                  return isEmpty ? <br /> : <div className="mb-2">{props.children}</div>;
                },
                br: ({node, ...props}) => <>{'\n'}</>, // 转换为普通换行
                ol: ({node, ...props}) => <ol className="list-decimal pl-5 my-2 space-y-1" {...props} />,
                ul: ({node, ...props}) => <ul className="list-disc pl-5 my-2 space-y-1" {...props} />,
                li: ({node, ...props}) => <li className="mb-0.5" {...props} />,
                strong: ({node, ...props}) => <strong className="font-semibold" {...props} />,
                em: ({node, ...props}) => <em className="italic" {...props} />,
                h1: ({node, ...props}) => <h2 className={`text-lg font-bold my-3 ${isDark ? "text-blue-300" : "text-blue-600"}`} {...props} />,
                h2: ({node, ...props}) => <h3 className={`text-base font-semibold my-2 ${isDark ? "text-blue-300" : "text-blue-600"}`} {...props} />,
              }}
            >
              {msg.content
                .replace(/\n{3,}/g, '\n\n') // 将3个以上换行缩减为2个
                .replace(/<br\s*\/?>/gi, '') // 将HTML的br标签转换为空
                .replace(/<\/?p>/gi, '\n')  // 移除HTML的p标签
              }
            </ReactMarkdown>
          </div>
        )}
      </div>
    ))}
    {/* 保留加载状态和滚动锚点 */}
    {isLoading && (
      <div className={`mr-auto p-4 rounded-lg max-w-[90%] ${isDark ? "bg-[#2d2d2d] text-gray-300" : "bg-white text-gray-700 border border-gray-200"}`}>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
          <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse delay-100"></div>
          <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse delay-200"></div>
        </div>
      </div>
    )}
    <div ref={messagesEndRef} />
  </div>
</div>

          {/* 输入框与发送按钮 */}
          <div
            className={`mt-auto p-3 rounded-lg ${
              isDark ? "bg-[#252525]" : "bg-gray-100"
            }`}
          >
            <div className="flex items-end gap-2">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onInput={(e) => {
                  e.target.style.height = "auto";
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                onKeyDown={handleKeyDown}
                placeholder="输入问题..."
                className={`flex-1 resize-none rounded-lg p-3 focus:outline-none ${
                  isDark
                    ? "bg-[#333] text-gray-100 placeholder-gray-400 border-gray-600"
                    : "bg-white text-gray-800 placeholder-gray-500 border-gray-300"
                } border transition-all max-h-32`}
                rows={1}
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !inputValue.trim()}
                className={`h-10 w-10 rounded-lg flex items-center justify-center transition-colors ${
                  isLoading || !inputValue.trim()
                    ? isDark
                      ? "bg-gray-700 text-gray-500"
                      : "bg-gray-300 text-gray-500"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                {isLoading ? (
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
