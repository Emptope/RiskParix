import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Strategy() {
  const [users, setUsers] = useState([]);
  const [trades, setTrades] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [profitFilter, setProfitFilter] = useState(0);
  const [winRateFilter, setWinRateFilter] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    // 模拟数据加载
    fetch('/data/user_summary.json')
      .then(res => res.json())
      .then(data => {
        setUsers(data);
        setFilteredUsers(data);
      });

    fetch('/data/trade_records.json')
      .then(res => res.json())
      .then(data => setTrades(data));
  }, []);

  const handleFilter = () => {
    const result = users.filter(user =>
      user.收益率 >= profitFilter && user.胜率 >= winRateFilter
    );
    setFilteredUsers(result);
    setSelectedUser(null);
  };

  const userOrders = trades.filter(t => t.用户名 === selectedUser);

  return (
    <div className="flex flex-col h-screen">
      {/* 顶部标题 */}
      <div className="p-4 border-b flex justify-between items-center bg-white">
        <button className="bg-gray-200 px-4 py-2 rounded">用户管理</button>
        <h1 className="text-xl font-bold">策略分析页面</h1>
        <div></div>
      </div>

      {/* 主体区域 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 左侧用户列表 */}
        <div className="w-1/4 bg-gray-50 p-4 overflow-y-auto">
          <h2 className="text-lg font-bold mb-2">用户列表</h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center space-x-2">
              <span>收益率 ≥</span>
              <input
                type="number"
                value={profitFilter}
                onChange={e => setProfitFilter(Number(e.target.value))}
                className="border p-1 w-16"
              />
              <span>%</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>胜率 ≥</span>
              <input
                type="number"
                value={winRateFilter}
                onChange={e => setWinRateFilter(Number(e.target.value))}
                className="border p-1 w-16"
              />
              <span>%</span>
            </div>
            <button
              onClick={handleFilter}
              className="bg-blue-600 text-white px-3 py-1 rounded mt-2"
            >
              筛选
            </button>
          </div>
          <table className="mt-4 w-full text-sm table-fixed border">
            <thead>
              <tr className="bg-gray-200">
                <th className="w-1/4">用户</th>
                <th>笔数</th>
                <th>收益率</th>
                <th>胜率</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr
                  key={user.用户名}
                  className={`cursor-pointer hover:bg-blue-50 ${selectedUser === user.用户名 ? 'bg-blue-100' : ''}`}
                  onClick={() => setSelectedUser(user.用户名)}
                >
                  <td className="text-center">{user.用户名}</td>
                  <td className="text-center">{user.交易笔数}</td>
                  <td className="text-right pr-2">{user.收益率.toFixed(2)}%</td>
                  <td className="text-right pr-2">{user.胜率.toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 中间交易记录 */}
        <div className="w-2/4 bg-white p-4 overflow-y-auto">
          <h2 className="text-lg font-bold mb-2">订单列表</h2>
          <table className="w-full text-sm table-fixed border">
            <thead>
              <tr className="bg-gray-200">
                <th>时间</th>
                <th>代码</th>
                <th>方向</th>
                <th>成交价</th>
                <th>成交量</th>
                <th>成交额</th>
              </tr>
            </thead>
            <tbody>
              {userOrders.map((order, i) => (
                <tr key={i} className="border-t">
                  <td>{order.交易时间}</td>
                  <td>{order.证券代码}</td>
                  <td>{order.方向}</td>
                  <td className="text-right pr-2">{order.成交价?.toFixed(2)}</td>
                  <td className="text-right pr-2">{order.成交量}</td>
                  <td className="text-right pr-2">{order.成交额?.toFixed(2)}</td>
                </tr>
              ))}
              {userOrders.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center text-gray-500 py-4">无数据</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 右侧AI聊天 */}
        <div className="w-1/4 bg-gray-50 p-4 flex flex-col">
          <h2 className="text-lg font-bold mb-2">DeepSeek 分析助手</h2>
          <div className="flex-1 bg-white border rounded p-2 overflow-y-auto text-sm">
            <p className="text-gray-600">AI: 您可以提问当前用户的交易模式或相关市场分析。</p>
          </div>
          <input
            type="text"
            placeholder="输入问题..."
            className="border mt-2 px-2 py-1 w-full"
          />
        </div>
      </div>

      {/* 底部返回 */}
      <div className="border-t p-4 text-right bg-white">
        <button
          onClick={() => navigate('/')}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          返回主页
        </button>
      </div>
    </div>
  );
}
