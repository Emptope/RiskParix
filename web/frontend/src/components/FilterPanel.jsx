import React from "react";

export default function FilterPanel({
  tmpFilters,
  onFilterChange,
  onApplyFilters,
  onResetFilters,
  formatNumber,
  colors,
  isDark
}) {
  const years = Array.from({ length: 2025 - 2014 }, (_, i) => 2014 + i);
  const sliderColor = isDark ? "bg-gray-600" : "bg-gray-300";

  return (
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
              <label className={`block text-sm font-medium mb-1 ${colors.textSecondary}`}>
                股票搜索
              </label>
              <input
                type="text"
                value={tmpFilters.search_text}
                onChange={(e) => onFilterChange("search_text", e.target.value)}
                placeholder="输入代码或名称搜索"
                className={`w-full border ${colors.border} px-3 py-2 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                  isDark ? "bg-gray-800 text-white" : "bg-white text-black"
                }`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1 ${colors.textSecondary}`}>
                年份
              </label>
              <select
                value={tmpFilters.year}
                onChange={(e) => onFilterChange("year", e.target.value)}
                className={`w-full border ${colors.border} px-3 py-2 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                  isDark ? "bg-gray-800 text-white" : "bg-white text-black"
                }`}
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

            {/* 筛选和重置按钮 */}
            <div className="flex space-x-3 pt-4">
              <button
                onClick={onApplyFilters}
                className={`flex-1 ${colors.accent} ${colors.accentHover} text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
              >
                筛选
              </button>
              <button
                onClick={onResetFilters}
                className={`flex-1 ${colors.quaternary} ${colors.textSecondary} px-4 py-2 rounded-lg font-medium transition-colors duration-200 hover:${colors.tertiary} focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2`}
              >
                重置
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}