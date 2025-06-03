import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { fetchUsers, fetchOrderBook } from '../api/api';
import AIChatAssistant from '../components/AIChatAssistant';

export default function Strategy() {
  const [users, setUsers] = useState([]);
  const [orderBook, setOrderBook] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [profitFilter, setProfitFilter] = useState(0);
  const [winRateFilter, setWinRateFilter] = useState(0);
  
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const navigate = useNavigate();
  const containerRef = useRef(null);
  
  // 拖拽相关状态
  const [leftWidth, setLeftWidth] = useState(30);
  const [rightWidth, setRightWidth] = useState(30);
  const [isDragging, setIsDragging] = useState(null);
  
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
      
      if (isDragging === "left") {
        const newLeftWidth = Math.max(15, Math.min(45, (mouseX / containerWidth) * 100));
        const currentRightWidth = rightWidth;
        if (100 - newLeftWidth - currentRightWidth >= 10) {
            setLeftWidth(newLeftWidth);
        }
      } else if (isDragging === "right") {
        const newRightWidth = Math.max(15, Math.min(45, ((containerWidth - mouseX) / containerWidth) * 100));
        const currentLeftWidth = leftWidth;
        if (100 - currentLeftWidth - newRightWidth >= 10) {
            setRightWidth(newRightWidth);
        }
      }
    },
    [isDragging, leftWidth, rightWidth] 
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(null);
  }, []);

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
    fetchUsers()
      .then(data => {
        setUsers(data);
        setFilteredUsers(data);
      })
      .catch(err => console.error('获取用户数据失败:', err));

    fetchOrderBook()
      .then(data => setOrderBook(data))
      .catch(err => console.error('获取订单数据失败:', err));
  }, []);

  const handleFilter = () => {
    const result = users.filter(
      user => user.returnRate >= profitFilter && user.winRate >= winRateFilter
    );
    setFilteredUsers(result);
    setSelectedUser(null);
  };

  const userOrders = orderBook.filter(order => order.user === selectedUser);
  const middleWidth = Math.max(10, 100 - leftWidth - rightWidth);

  return (
      <div className={`flex flex-col h-screen ${colors.primary} ${colors.textPrimary} transition-colors duration-300`}>
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
              交易策略分析
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
        {/* 左侧用户列表面板 */}
        <div
          className={`${colors.tertiary} overflow-y-auto transition-all duration-200`}
          style={{ width: `${leftWidth}%` }}
        >
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
                    用户筛选与列表
                  </h2>
                  <p className={`${colors.textMuted} text-sm`}>选择用户以分析策略</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div
                className={`${colors.secondary} ${colors.border} border rounded-lg p-6 ${colors.shadow} transition-all duration-200`}
              >
                <h3
                  className={`text-sm font-semibold ${colors.textMuted} uppercase tracking-wider mb-4`}
                >
                  筛选条件
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className={`block ${colors.textSecondary} text-sm font-medium mb-1`}>
                      收益率 ≥ {profitFilter}%
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={profitFilter}
                      onChange={(e) => setProfitFilter(Number(e.target.value))}
                      className={`w-full h-2 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                    />
                  </div>
                  <div>
                    <label className={`block ${colors.textSecondary} text-sm font-medium mb-1`}>
                      胜率 ≥ {winRateFilter}%
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={winRateFilter}
                      onChange={(e) => setWinRateFilter(Number(e.target.value))}
                      className={`w-full h-2 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                    />
                  </div>
                  <button
                    onClick={handleFilter}
                    className={`${colors.accent} ${colors.accentHover} text-white px-4 py-2 rounded-lg font-medium w-full transition-all duration-200 ${colors.shadow}`}
                  >
                    应用筛选
                  </button>
                </div>
              </div>

              <div
                className={`${colors.secondary} ${colors.border} border rounded-lg p-6 ${colors.shadow} transition-all duration-200`}
              >
                <h3
                  className={`text-sm font-semibold ${colors.textMuted} uppercase tracking-wider mb-4`}
                >
                  用户列表
                </h3>
                <div className="overflow-x-auto max-h-96"> 
                  <table className="w-full text-sm">
                    <thead className={`${colors.secondary} ${colors.borderStrong} border-b sticky top-0 z-10`}>
                      <tr>
                        <th className={`py-3 px-3 text-left font-semibold ${colors.textPrimary} bg-inherit`}>用户</th>
                        <th className={`py-3 px-3 text-center font-semibold ${colors.textPrimary} bg-inherit`}>笔数</th>
                        <th className={`py-3 px-3 text-right font-semibold ${colors.textPrimary} bg-inherit`}>收益率</th>
                        <th className={`py-3 px-3 text-right font-semibold ${colors.textPrimary} bg-inherit`}>胜率</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${colors.borderLight}`}>
                      {filteredUsers.map(user => (
                        <tr
                          key={user.user}
                          className={`cursor-pointer transition-colors duration-150 ${
                            selectedUser === user.user 
                              ? (isDark ? 'bg-blue-800/40' : 'bg-blue-100') 
                              : ''
                          } hover:${isDark ? 'bg-gray-700/50' : 'bg-gray-100/50'}`}
                          onClick={() => setSelectedUser(user.user)}
                        >
                          <td className={`py-2.5 px-3 ${colors.textPrimary} font-medium`}>{user.user}</td>
                          <td className={`py-2.5 px-3 text-center ${colors.textSecondary}`}>{user.trades}</td>
                          <td className={`py-2.5 px-3 text-right font-medium ${
                            user.returnRate >= 0 ? colors.success : colors.danger
                          }`}>
                            {user.returnRate.toFixed(2)}%
                          </td>
                          <td className={`py-2.5 px-3 text-right ${colors.textSecondary}`}>{user.winRate.toFixed(2)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
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

        {/* 中间订单列表区域 */}
        <div
          className={`${colors.secondary} flex flex-col transition-all duration-200`}
          style={{ width: `${middleWidth}%` }}
        >
          <div
            className={`${colors.borderStrong} border-b p-6 ${colors.secondary}`}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                 <div className={`w-10 h-10 ${colors.accentLight} ${colors.accentText} rounded-lg flex items-center justify-center`}>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z"></path>
                    </svg>
                </div>
                <h2 className={`text-xl font-bold ${colors.textPrimary}`}>
                  订单列表 {selectedUser && <span className={`${colors.textMuted} text-lg`}>({selectedUser})</span>}
                </h2>
              </div>
            </div>
          </div>

          <div className={`flex-1 p-6 overflow-y-auto`}>
            <div
              className={`${colors.border} border rounded-lg overflow-hidden ${colors.shadow}`}
            >
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className={`${colors.secondary} ${colors.borderStrong} border-b`}>
                    <tr>
                      <th className={`px-4 py-3 text-left text-xs font-semibold ${colors.textPrimary} uppercase tracking-wider bg-inherit`}>时间</th>
                      <th className={`px-4 py-3 text-left text-xs font-semibold ${colors.textPrimary} uppercase tracking-wider bg-inherit`}>代码</th>
                      <th className={`px-4 py-3 text-left text-xs font-semibold ${colors.textPrimary} uppercase tracking-wider bg-inherit`}>方向</th>
                      <th className={`px-4 py-3 text-right text-xs font-semibold ${colors.textPrimary} uppercase tracking-wider bg-inherit`}>价格</th>
                      <th className={`px-4 py-3 text-center text-xs font-semibold ${colors.textPrimary} uppercase tracking-wider bg-inherit`}>结果</th>
                    </tr>
                  </thead>
                  <tbody className={`${colors.secondary} divide-y ${colors.borderLight}`}>
                    {userOrders.length > 0 ? (
                      userOrders.map((order, i) => (
                        <tr 
                          key={i} 
                          className={`transition-colors duration-150 hover:${isDark ? 'bg-gray-800/70' : 'bg-gray-50/70'}`}
                        >
                          <td className={`px-4 py-3 text-sm ${colors.textSecondary}`}>
                            {order.time}
                          </td>
                          <td className={`px-4 py-3 text-sm ${colors.textPrimary}`}>
                            {order.code}
                          </td>
                          <td className={`px-4 py-3 text-sm ${colors.textPrimary}`}>
                            {order.direction}
                          </td>
                          <td className={`px-4 py-3 text-sm text-right ${colors.textPrimary}`}>
                            {parseFloat(order.price).toFixed(2)}
                          </td>
                          <td className={`px-4 py-3 text-sm text-center`}>
                            <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                              order.result === 'win' 
                                ? `${colors.successBg} ${colors.success}`
                                : `${colors.dangerBg} ${colors.danger}`
                            }`}>
                              {order.result === 'win' ? '盈利' : '亏损'}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td 
                          colSpan="5" 
                          className={`px-4 py-10 text-center ${colors.textMuted}`}
                        >
                         {selectedUser ? '该用户暂无订单数据' : '请先从左侧选择一位用户'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
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
            apiEndpoint="http://localhost:8000/api/chat/strategy"
            contextId={selectedUser}
            initialMessage={selectedUser ? `当前用户：${selectedUser}，请问您想分析什么？\n\n您可以尝试询问：\n- 这个用户使用的交易策略是什么？\n- 分析该用户的交易表现\n- 该用户的风险管理方式如何？\n- 有哪些策略优化建议？` : null}
            placeholder="向AI助手提问..."
            disabled={!selectedUser}
            disabledPlaceholder="请先选择用户再提问"
            title="AI 分析助手"
            subtitle="DeepSeek 驱动"
            className="h-full"
          />
        </div>
      </div>
    </div>
  );
}