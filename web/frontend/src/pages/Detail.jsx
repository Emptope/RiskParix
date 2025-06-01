import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchStockDetail, fetchStockInfo } from "../api/api";
import ReactECharts from "echarts-for-react";
import Papa from "papaparse";
import groupBy from "lodash/groupBy";
import dayjs from "dayjs";
import { useTheme } from "../context/ThemeContext";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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
  const [stockInfo, setStockInfo] = useState(null);
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
    // 获取K线数据
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

    // 获取股票基本信息
    fetchStockInfo(code)
      .then((info) => {
        setStockInfo(info);
      })
      .catch((err) => {
        console.error("获取股票信息失败:", err);
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
    const currentHistory = [...messages, userMessage];

    setMessages(currentHistory);
    setInputValue("");
    setIsLoading(true);

    try {
      const trimmedHistory = currentHistory
        .filter((msg) => msg.role === "user" || msg.role === "ai")
        .slice(-6)
        .map((msg) => ({
          role: msg.role === "user" ? "user" : "assistant",
          content: msg.content,
        }));

      const res = await fetch("http://localhost:8000/api/chat/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: inputValue,
          history: trimmedHistory,
          stock_id: code,
        }),
      });

      if (!res.ok || !res.body) throw new Error("连接失败");

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let partial = "";
      let aiText = "";

      // 先插入空 AI 消息，并记录插入位置
      let aiIndex = currentHistory.length;
      setMessages((prev) => [...prev, { role: "ai", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        partial += decoder.decode(value, { stream: true });
        const lines = partial.split("\n\n");

        for (let i = 0; i < lines.length - 1; i++) {
          const line = lines[i];
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") {
              setIsLoading(false);
              return;
            }
            aiText += data;

            setMessages((prev) => {
              const updated = [...prev];
              updated[aiIndex].content = aiText;
              return updated;
            });
          }
        }

        partial = lines[lines.length - 1];
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "ai", content: "发生错误: " + err.message },
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
        {/* 左侧股票信息 */}
        <div className={`w-1/4 p-6 overflow-y-auto ${sectionBg}`}>
          {/* 标题区域 */}
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-1 flex items-center">
              <svg
                className="w-5 h-5 mr-2 text-blue-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              股票信息
            </h2>
            <div
              className={`h-1 w-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500`}
            ></div>
          </div>

          {stockInfo ? (
            <div className="space-y-6">
              {/* 基本信息卡片 */}
              <div
                className={`p-4 rounded-xl border ${
                  isDark
                    ? "bg-[#1a1a1a] border-gray-700"
                    : "bg-white border-gray-200"
                } shadow-sm`}
              >
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  基本信息
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-600">
                      股票代码
                    </label>
                    <div
                      className={`px-3 py-1 rounded-lg text-sm font-mono font-bold ${
                        isDark
                          ? "bg-blue-900 text-blue-200"
                          : "bg-blue-50 text-blue-700"
                      }`}
                    >
                      {stockInfo.code}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-600">
                      股票名称
                    </label>
                    <div className="text-sm font-semibold">
                      {stockInfo.name}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-600">
                      年份
                    </label>
                    <div
                      className={`px-2 py-1 rounded text-sm font-medium ${
                        isDark
                          ? "bg-gray-700 text-gray-200"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {stockInfo.year}
                    </div>
                  </div>
                </div>
              </div>

              {/* 财务指标卡片 */}
              <div
                className={`p-4 rounded-xl border ${
                  isDark
                    ? "bg-[#1a1a1a] border-gray-700"
                    : "bg-white border-gray-200"
                } shadow-sm`}
              >
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4 flex items-center">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                  </svg>
                  财务指标
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  {/* 年涨跌幅 */}
                  <div
                    className={`p-3 rounded-lg ${
                      isDark ? "bg-[#0f0f0f]" : "bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium text-gray-500">
                        年涨跌幅
                      </label>
                      <div
                        className={`px-2 py-1 rounded text-xs font-bold ${
                          stockInfo.annual_return > 0
                            ? "bg-green-100 text-green-700"
                            : stockInfo.annual_return < 0
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {stockInfo.annual_return
                          ? `${(stockInfo.annual_return * 100).toFixed(2)}%`
                          : "--"}
                      </div>
                    </div>
                    <div
                      className={`h-2 rounded-full ${
                        isDark ? "bg-gray-700" : "bg-gray-200"
                      } overflow-hidden`}
                    >
                      <div
                        className={`h-full transition-all duration-300 ${
                          stockInfo.annual_return > 0
                            ? "bg-green-500"
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
                  <div
                    className={`p-3 rounded-lg ${
                      isDark ? "bg-[#0f0f0f]" : "bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium text-gray-500">
                        最大回撤
                      </label>
                      <div className="px-2 py-1 rounded text-xs font-bold bg-orange-100 text-orange-700">
                        {stockInfo.max_drawdown
                          ? `${(stockInfo.max_drawdown * 100).toFixed(2)}%`
                          : "--"}
                      </div>
                    </div>
                    <div
                      className={`h-2 rounded-full ${
                        isDark ? "bg-gray-700" : "bg-gray-200"
                      } overflow-hidden`}
                    >
                      <div
                        className="h-full bg-orange-500 transition-all duration-300"
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
                  <div className="grid grid-cols-2 gap-3">
                    <div
                      className={`p-3 rounded-lg text-center ${
                        isDark ? "bg-[#0f0f0f]" : "bg-gray-50"
                      }`}
                    >
                      <div className="text-xs font-medium text-gray-500 mb-1">
                        市盈率
                      </div>
                      <div className="text-lg font-bold">
                        {stockInfo.pe_ratio
                          ? stockInfo.pe_ratio.toFixed(1)
                          : "--"}
                      </div>
                      <div className="text-xs text-gray-400">P/E</div>
                    </div>
                    <div
                      className={`p-3 rounded-lg text-center ${
                        isDark ? "bg-[#0f0f0f]" : "bg-gray-50"
                      }`}
                    >
                      <div className="text-xs font-medium text-gray-500 mb-1">
                        市净率
                      </div>
                      <div className="text-lg font-bold">
                        {stockInfo.pb_ratio
                          ? stockInfo.pb_ratio.toFixed(1)
                          : "--"}
                      </div>
                      <div className="text-xs text-gray-400">P/B</div>
                    </div>
                  </div>

                  {/* 夏普比率 */}
                  <div
                    className={`p-3 rounded-lg ${
                      isDark ? "bg-[#0f0f0f]" : "bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-gray-500">
                        夏普比率
                      </label>
                      <div
                        className={`px-2 py-1 rounded text-xs font-bold ${
                          stockInfo.sharpe_ratio > 1
                            ? "bg-green-100 text-green-700"
                            : stockInfo.sharpe_ratio > 0.5
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
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
                  className={`p-4 rounded-xl border ${
                    isDark
                      ? "bg-[#1a1a1a] border-gray-700"
                      : "bg-white border-gray-200"
                  } shadow-sm`}
                >
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4 flex items-center">
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    最新价格
                  </h3>
                  <div className="space-y-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold mb-1">
                        ¥{klineData[klineData.length - 1]?.close?.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {klineData[klineData.length - 1]?.date}
                      </div>
                    </div>

                    {/* 价格变化指示器 */}
                    <div
                      className={`p-2 rounded-lg text-center ${
                        isDark ? "bg-[#0f0f0f]" : "bg-gray-50"
                      }`}
                    >
                      <div className="text-xs text-gray-500 mb-1">收盘价</div>
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                        <span className="text-sm font-medium">实时更新</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
              <div className="text-gray-400 text-sm">正在加载股票信息...</div>
            </div>
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
          <div
            className={`flex-1 overflow-y-auto rounded-lg mb-3 ${
              isDark ? "bg-[#1e1e1e]" : "bg-gray-50"
            }`}
          >
            <div className="p-3 space-y-3" style={{ minHeight: "100%" }}>
              {messages.map((msg, index) =>
                msg.role === "user" ? (
                  <div
                    key={index}
                    className="ml-auto p-3 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white max-w-[90%] shadow-sm"
                  >
                    {msg.content}
                  </div>
                ) : (
                  <div
                    key={index}
                    className={`prose prose-base max-w-full ${
                      isDark ? "prose-invert text-gray-100" : "text-gray-900"
                    }`}
                  >
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                )
              )}

              {/* 加载状态 */}
              {isLoading && (
                <div className="text-sm text-gray-400">
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
