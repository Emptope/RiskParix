import React from "react";
import { useTheme } from "../context/ThemeContext";

const StockInfo = ({ 
  stockInfo, 
  klineData = [], 
  className = "",
  showPriceInfo = true 
}) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // 主题颜色配置
  const colors = {
    // 背景色
    secondary: isDark ? "bg-gray-900" : "bg-white",
    tertiary: isDark ? "bg-gray-800" : "bg-gray-100",
    quaternary: isDark ? "bg-gray-700" : "bg-gray-50",

    // 文字色
    textPrimary: isDark ? "text-gray-100" : "text-gray-900",
    textSecondary: isDark ? "text-gray-300" : "text-gray-600",
    textMuted: isDark ? "text-gray-400" : "text-gray-500",

    // 边框色
    border: isDark ? "border-gray-700" : "border-gray-200",
    borderLight: isDark ? "border-gray-800" : "border-gray-100",

    // 强调色
    accent: isDark ? "bg-blue-600" : "bg-blue-600",

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
  };

  // 获取最新价格数据
  const latestPrice = klineData && klineData.length > 0 ? klineData[klineData.length - 1] : null;

  if (!stockInfo) {
    return (
      <div className={`${className} flex flex-col items-center justify-center py-16`}>
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <div className={`${colors.textMuted} text-sm`}>
          正在加载股票信息...
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} p-6 space-y-6`}>
      {/* 标题区域 */}
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

      <div className="space-y-6">
        {/* 基本信息卡片 */}
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
            <div className={`h-px ${colors.borderLight} bg-current`}></div>
            <div className="flex items-center justify-between py-2">
              <span className={`${colors.textSecondary} font-medium`}>
                股票名称
              </span>
              <span className={`${colors.textPrimary} font-semibold`}>
                {stockInfo.name}
              </span>
            </div>
            <div className={`h-px ${colors.borderLight} bg-current`}></div>
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

        {/* 财务指标卡片 */}
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
                    ? `${stockInfo.annual_return.toFixed(2)}%`
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
                      Math.abs(stockInfo.annual_return || 0),
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
                    ? `${stockInfo.max_drawdown.toFixed(2)}%`
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
                      Math.abs(stockInfo.max_drawdown || 0),
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

            {/* 风险指标 */}
            <div className="grid grid-cols-2 gap-4">
              <div
                className={`${colors.quaternary} rounded-lg p-4 text-center`}
              >
                <div
                  className={`${colors.textMuted} text-xs font-medium mb-2`}
                >
                  波动率
                </div>
                <div
                  className={`${colors.textPrimary} text-lg font-bold mb-1`}
                >
                  {stockInfo.volatility
                    ? `${(stockInfo.volatility * 100).toFixed(1)}%`
                    : "--"}
                </div>
                <div className={`${colors.textMuted} text-xs`}>年化</div>
              </div>
              <div
                className={`${colors.quaternary} rounded-lg p-4 text-center`}
              >
                <div
                  className={`${colors.textMuted} text-xs font-medium mb-2`}
                >
                  夏普比率
                </div>
                <div
                  className={`${colors.textPrimary} text-lg font-bold mb-1`}
                >
                  {stockInfo.sharpe_ratio
                    ? stockInfo.sharpe_ratio.toFixed(2)
                    : "--"}
                </div>
                <div className={`${colors.textMuted} text-xs`}>风险调整</div>
              </div>
            </div>
          </div>
        </div>

        {/* 价格信息卡片 */}
        {showPriceInfo && latestPrice && (
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
                  ¥{latestPrice.close?.toFixed(2) || "--"}
                </div>
                <div className={`${colors.textMuted} text-sm`}>
                  {latestPrice.date || "--"}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div
                  className={`${colors.quaternary} rounded-lg p-3 text-center`}
                >
                  <div className={`${colors.textMuted} text-xs mb-1`}>
                    开盘
                  </div>
                  <div className={`${colors.textPrimary} font-semibold`}>
                    ¥{latestPrice.open?.toFixed(2) || "--"}
                  </div>
                </div>
                <div
                  className={`${colors.quaternary} rounded-lg p-3 text-center`}
                >
                  <div className={`${colors.textMuted} text-xs mb-1`}>
                    最高
                  </div>
                  <div className={`${colors.success} font-semibold`}>
                    ¥{latestPrice.high?.toFixed(2) || "--"}
                  </div>
                </div>
                <div
                  className={`${colors.quaternary} rounded-lg p-3 text-center`}
                >
                  <div className={`${colors.textMuted} text-xs mb-1`}>
                    最低
                  </div>
                  <div className={`${colors.danger} font-semibold`}>
                    ¥{latestPrice.low?.toFixed(2) || "--"}
                  </div>
                </div>
                <div
                  className={`${colors.quaternary} rounded-lg p-3 text-center`}
                >
                  <div className={`${colors.textMuted} text-xs mb-1`}>
                    收盘
                  </div>
                  <div className={`${colors.textPrimary} font-semibold`}>
                    ¥{latestPrice.close?.toFixed(2) || "--"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockInfo;