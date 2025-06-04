import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { fetchStocks } from "../api/api";
import { useTheme } from "../context/ThemeContext";
import StockList from "../components/StockList";
import FilterPanel from "../components/FilterPanel";

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

  const navigate = useNavigate();
  const { theme } = useTheme();
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

  const onFilterChange = (key, value) => {
    const newTmp = { ...tmpFilters, [key]: value };
    setTmpFilters(newTmp);
  };

  // 手动应用筛选函数
  const handleApplyFilters = () => {
    setFilters(tmpFilters);
  };

  // 重置筛选函数
  const handleResetFilters = () => {
    const defaultFilters = {
      year: "",
      annual_return: 0,
      max_drawdown: 100,
      pe_ratio: 100,
      pb_ratio: 10,
      sharpe_ratio: 0,
      search_text: "",
    };
    setTmpFilters(defaultFilters);
    setFilters(defaultFilters);
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

        {/* 中间筛选面板 - 使用新的 FilterPanel 组件 */}
        <FilterPanel
          tmpFilters={tmpFilters}
          onFilterChange={onFilterChange}
          onApplyFilters={handleApplyFilters}
          onResetFilters={handleResetFilters}
          formatNumber={formatNumber}
          colors={colors}
          isDark={isDark}
        />

        {/* 右侧股票列表面板 */}
        <StockList
          displayStocks={displayStocks}
          filteredStocks={filteredStocks}
          sortConfig={sortConfig}
          handleSort={handleSort}
          handleScroll={handleScroll}
          formatNumber={formatNumber}
        />
      </div>
    </div>
  );
}