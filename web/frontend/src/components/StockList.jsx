import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

export default function StockList({ 
  displayStocks, 
  filteredStocks, 
  sortConfig, 
  handleSort, 
  handleScroll,
  formatNumber 
}) {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

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
  );
}