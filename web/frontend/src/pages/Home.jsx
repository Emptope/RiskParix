import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { fetchStocks } from "../api/api";
import { useTheme } from "../context/ThemeContext";
import debounce from "lodash/debounce";

export default function Home() {
  const [allStocks, setAllStocks] = useState([]);
  const [displayStocks, setDisplayStocks] = useState([]);
  const [displayCount, setDisplayCount] = useState(50);
  const [filters, setFilters] = useState({
    year: "",
    annual_return: 0,
    max_drawdown: 100,
    pe_ratio: 100,
    pb_ratio: 10,
    sharpe_ratio: 0,
    search_text: "",
  });
  const [tmpFilters, setTmpFilters] = useState(filters);
  const [sortConfig, setSortConfig] = useState({ key: "", direction: "asc" });

  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const isDark = theme === "dark";

  // 颜色定义
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

  useEffect(() => {
    async function load() {
      const data = await fetchStocks({});
      setAllStocks(data);
    }
    load();
  }, []);

  const applyFilters = useMemo(
    () => debounce((newFilters) => setFilters(newFilters), 300),
    []
  );

  const onFilterChange = (key, value) => {
    const newTmp = { ...tmpFilters, [key]: value };
    setTmpFilters(newTmp);
    applyFilters(newTmp);
  };

  const formatNumber = (num) => {
    const n = Number(num);
    return isNaN(n) ? "-" : n.toFixed(2);
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key) {
      direction = sortConfig.direction === "asc" ? "desc" : "asc";
    }
    setSortConfig({ key, direction });
  };

  const filteredStocks = useMemo(() => {
    setDisplayCount(50);
    return allStocks.filter((item) => {
      if (filters.search_text) {
        const searchTerm = filters.search_text.toLowerCase();
        const codeMatch = item.code.toLowerCase().includes(searchTerm);
        const nameMatch = item.name.toLowerCase().includes(searchTerm);
        if (!codeMatch && !nameMatch) {
          return false;
        }
      }
      if (filters.year && String(item.year) !== String(filters.year))
        return false;
      if (Number(item.annual_return) < filters.annual_return) return false;
      if (Number(item.max_drawdown) > filters.max_drawdown) return false;
      if (Number(item.pe_ratio) > filters.pe_ratio) return false;
      if (Number(item.pb_ratio) > filters.pb_ratio) return false;
      if (Number(item.sharpe_ratio) < filters.sharpe_ratio) return false;
      return true;
    });
  }, [allStocks, filters]);

  const sortedStocks = useMemo(() => {
    if (!sortConfig.key) return filteredStocks;
    return [...filteredStocks].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (aVal == null || bVal == null) return 0;
      const aNum = parseFloat(aVal);
      const bNum = parseFloat(bVal);
      if (
        sortConfig.key !== "code" &&
        sortConfig.key !== "name" &&
        !isNaN(aNum) &&
        !isNaN(bNum)
      ) {
        return sortConfig.direction === "asc" ? aNum - bNum : bNum - aNum;
      }
      return sortConfig.direction === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [filteredStocks, sortConfig]);

  useEffect(() => {
    setDisplayStocks(sortedStocks.slice(0, displayCount));
  }, [sortedStocks, displayCount]);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollTop + clientHeight >= scrollHeight - 50) {
      setDisplayCount((prev) => Math.min(prev + 50, sortedStocks.length));
    }
  };

  const services = ["soufflé服务器", "数据库", "baostock实时行情"];
  const years = Array.from({ length: 2025 - 2014 }, (_, i) => 2014 + i);
  const sliderColor = isDark ? "bg-gray-600" : "bg-gray-300";
  const tableHead = "bg-[#1e3a8a] text-white font-bold";

  const columnConfig = [
    ["证券代码", "code"],
    ["证券名称", "name"],
    ["年份", "year"],
    ["年涨跌幅", "annual_return"],
    ["最大回撤", "max_drawdown"],
    ["市盈率", "pe_ratio"],
    ["市净率", "pb_ratio"],
    ["夏普比率", "sharpe_ratio"],
  ];

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
            <h1 className={`text-xl font-bold ${colors.textPrimary}`}>
              股票面板
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

      <div className="flex flex-1 overflow-hidden">
        {/* 左侧服务列表面板 */}
        <div className={`w-[15%] ${colors.tertiary} overflow-y-auto`}>
          <div className="p-6 space-y-6">
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
                    服务列表
                  </h2>
                  <p className={`${colors.textMuted} text-sm`}>可用服务</p>
                </div>
              </div>
            </div>

            <div
              className={`${colors.secondary} ${colors.border} border rounded-lg p-6 ${colors.shadow} transition-all duration-200`}
            >
              <ul className="space-y-2">
                {services.map((srv) => (
                  <li
                    key={srv}
                    className={`p-3 ${colors.quaternary} rounded-lg cursor-pointer hover:${colors.accentLight} transition-colors duration-150 ${colors.textPrimary}`}
                  >
                    {srv}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* 中间筛选面板 */}
        <div className={`w-[20%] ${colors.secondary} overflow-y-auto`}>
          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div
                  className={`w-10 h-10 ${colors.accentLight} ${colors.accentText} rounded-lg flex items-center justify-center`}
                >
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className={`text-xl font-bold ${colors.textPrimary}`}>
                    筛选列表
                  </h2>
                  <p className={`${colors.textMuted} text-sm`}>设置筛选条件</p>
                </div>
              </div>
            </div>

            <div
              className={`${colors.secondary} ${colors.border} border rounded-lg p-6 ${colors.shadow} transition-all duration-200`}
            >
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${colors.textSecondary}`}>股票搜索</label>
                  <input
                    type="text"
                    value={tmpFilters.search_text}
                    onChange={(e) => onFilterChange("search_text", e.target.value)}
                    placeholder="输入代码或名称搜索"
                    className={`w-full border ${colors.border} px-3 py-2 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${isDark ? 'bg-gray-800 text-white' : 'bg-white text-black'}`}
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-1 ${colors.textSecondary}`}>年份</label>
                  <select
                    value={tmpFilters.year}
                    onChange={(e) => onFilterChange("year", e.target.value)}
                    className={`w-full border ${colors.border} px-3 py-2 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${isDark ? 'bg-gray-800 text-white' : 'bg-white text-black'}`}
                  >
                    <option value="">选择年份</option>
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
                {[
                  ["年化收益率 ≥", "annual_return", 0, 50, "%"],
                  ["最大回撤 ≤", "max_drawdown", 0, 100, "%"],
                  ["市盈率 ≤", "pe_ratio", 0, 100, ""],
                  ["市净率 ≤", "pb_ratio", 0, 10, ""],
                  ["夏普比率 ≥", "sharpe_ratio", 0, 5, ""],
                ].map(([label, key, min, max, suffix]) => (
                  <div key={key}>
                    <label className={`block text-sm font-medium mb-1 ${colors.textSecondary}`}>
                      {label} {formatNumber(tmpFilters[key])}
                      {suffix}
                    </label>
                    <input
                      type="range"
                      min={min}
                      max={max}
                      step={key === "pb_ratio" || key === "sharpe_ratio" ? 0.1 : 1}
                      value={tmpFilters[key]}
                      onChange={(e) => onFilterChange(key, Number(e.target.value))}
                      className={`w-full h-2 ${sliderColor} rounded-lg appearance-none cursor-pointer accent-blue-600`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 右侧股票列表面板 */}
        <div
          className={`w-[65%] ${colors.tertiary} overflow-y-auto`}
          onScroll={handleScroll}
        >
          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div
                  className={`w-10 h-10 ${colors.accentLight} ${colors.accentText} rounded-lg flex items-center justify-center`}
                >
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z"></path>
                  </svg>
                </div>
                <div>
                  <h2 className={`text-xl font-bold ${colors.textPrimary}`}>
                    股票列表
                  </h2>
                  <p className={`${colors.textMuted} text-sm`}>
                    共 {filteredStocks.length} 条记录
                  </p>
                </div>
              </div>
            </div>

            <div
              className={`${colors.secondary} ${colors.border} border rounded-lg overflow-hidden ${colors.shadow} transition-all duration-200`}
            >
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className={`${tableHead}`}>
                    <tr>
                      {columnConfig.map(([label, key]) => (
                        <th
                          key={key}
                          onClick={() => handleSort(key)}
                          className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider cursor-pointer select-none"
                        >
                          <div className="inline-flex items-center">
                            <span>{label}</span>
                            <span className="ml-1">
                              {sortConfig.key === key
                                ? sortConfig.direction === "asc"
                                  ? " ▲"
                                  : " ▼"
                                : " △"}
                            </span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody
                    className={`${colors.secondary} divide-y ${colors.borderLight}`}
                  >
                    {displayStocks.map((stk) => (
                      <tr
                        key={stk.code + stk.year}
                        className={`cursor-pointer transition-colors duration-150 hover:${isDark ? 'bg-gray-700/50' : 'bg-gray-100/50'}`}
                        onClick={() => navigate(`/detail/${stk.code}/${stk.year}`)}
                      >
                        <td className={`px-4 py-3 text-center text-sm ${colors.textPrimary}`}>
                          {stk.code}
                        </td>
                        <td className={`px-4 py-3 text-center text-sm ${colors.textPrimary}`}>
                          {stk.name}
                        </td>
                        <td className={`px-4 py-3 text-center text-sm ${colors.textPrimary}`}>
                          {stk.year}
                        </td>
                        <td className={`px-4 py-3 text-center text-sm ${Number(stk.annual_return) >= 0 ? colors.success : colors.danger}`}>
                          {formatNumber(stk.annual_return)}
                        </td>
                        <td className={`px-4 py-3 text-center text-sm ${colors.textPrimary}`}>
                          {formatNumber(stk.max_drawdown)}
                        </td>
                        <td className={`px-4 py-3 text-center text-sm ${colors.textPrimary}`}>
                          {formatNumber(stk.pe_ratio)}
                        </td>
                        <td className={`px-4 py-3 text-center text-sm ${colors.textPrimary}`}>
                          {formatNumber(stk.pb_ratio)}
                        </td>
                        <td className={`px-4 py-3 text-center text-sm ${colors.textPrimary}`}>
                          {formatNumber(stk.sharpe_ratio)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}