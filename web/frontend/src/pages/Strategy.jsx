import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function Strategy() {
  const [users, setUsers] = useState([]);
  const [trades, setTrades] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [profitFilter, setProfitFilter] = useState(0);
  const [winRateFilter, setWinRateFilter] = useState(0);

  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const baseBg = isDark ? 'bg-gray-900 text-white' : 'bg-white text-black';
  const cardBg = isDark ? 'bg-gray-800 text-white' : 'bg-white text-black';
  const tableHead = isDark ? 'bg-blue-800 text-white' : 'bg-blue-900 text-white';

  const navigate = useNavigate();

  useEffect(() => {
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

  useEffect(() => {
    if (selectedUser) {
      setMessages([{ role: 'ai', content: `当前用户：${selectedUser}，请问您想分析什么？` }]);
    } else {
      setMessages([]);
    }
  }, [selectedUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFilter = () => {
    const result = users.filter(
      user => user.收益率 >= profitFilter && user.胜率 >= winRateFilter
    );
    setFilteredUsers(result);
    setSelectedUser(null);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;
    const userMessage = { role: 'user', content: inputValue };
    const currentHistory = [...messages, userMessage];
    setMessages(currentHistory);
    setInputValue('');
    setIsLoading(true);

    try {
      const trimmedHistory = currentHistory
        .filter(msg => msg.role === 'user' || msg.role === 'ai')
        .slice(-6)
        .map(msg => ({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content,
        }));

      const res = await fetch('http://localhost:8000/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: inputValue,
          history: trimmedHistory,
          stock_id: selectedUser,
        }),
      });

      if (!res.ok || !res.body) throw new Error('连接失败');

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let partial = '';
      let aiText = '';
      const aiIndex = currentHistory.length;
      setMessages(prev => [...prev, { role: 'ai', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        partial += decoder.decode(value, { stream: true });
        const lines = partial.split('\n\n');

        for (let i = 0; i < lines.length - 1; i++) {
          const line = lines[i];
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              setIsLoading(false);
              return;
            }
            aiText += data;
            setMessages(prev => {
              const updated = [...prev];
              updated[aiIndex].content = aiText;
              return updated;
            });
          }
        }

        partial = lines[lines.length - 1];
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { role: 'ai', content: '发生错误: ' + err.message },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const userOrders = trades.filter(t => t.用户名 === selectedUser);

  return (
    <div className={`flex flex-col h-screen ${baseBg}`}>
      <div className="flex justify-end p-2 border-b">
        <button
          onClick={toggleTheme}
          className="border px-3 py-1 rounded text-sm"
        >
          切换为 {isDark ? '浅色' : '深色'} 模式
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <aside className={`w-1/4 p-4 overflow-y-auto rounded-xl m-2 ${cardBg}`}>
          <h2 className="text-xl font-bold mb-4 text-center">用户列表</h2>
          <div className="space-y-4 text-sm">
            <div>
              <label className="block mb-1">收益率 ≥ {profitFilter}%</label>
              <input
                type="range"
                min={0}
                max={100}
                value={profitFilter}
                onChange={(e) => setProfitFilter(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label className="block mb-1">胜率 ≥ {winRateFilter}%</label>
              <input
                type="range"
                min={0}
                max={100}
                value={winRateFilter}
                onChange={(e) => setWinRateFilter(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <button
              onClick={handleFilter}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg w-full"
            >
              筛选
            </button>
          </div>

          <table className="mt-6 w-full text-sm table-fixed border-collapse rounded-xl overflow-hidden">
            <thead className={tableHead}>
              <tr>
                <th className="py-2">用户</th>
                <th>笔数</th>
                <th>收益率</th>
                <th>胜率</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr
                  key={user.用户名}
                  className={`cursor-pointer hover:bg-blue-100 ${selectedUser === user.用户名 ? 'bg-blue-200' : ''}`}
                  onClick={() => setSelectedUser(user.用户名)}
                >
                  <td className="text-center py-1">{user.用户名}</td>
                  <td className="text-center">{user.交易笔数}</td>
                  <td className="text-right pr-2">{user.收益率.toFixed(2)}%</td>
                  <td className="text-right pr-2">{user.胜率.toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </aside>

        <main className={`w-2/4 p-4 overflow-y-auto rounded-xl m-2 ${cardBg}`}>
          <h2 className="text-xl font-bold mb-4 text-center">订单列表</h2>
          <table className="w-full text-sm table-fixed border-collapse rounded-xl overflow-hidden">
            <thead className={tableHead}>
              <tr>
                <th className="py-2">时间</th>
                <th>代码</th>
                <th>方向</th>
                <th>成交价</th>
                <th>成交量</th>
                <th>成交额</th>
              </tr>
            </thead>
            <tbody>
              {userOrders.length > 0 ? (
                userOrders.map((order, i) => (
                  <tr key={i} className="border-t">
                    <td>{order.交易时间}</td>
                    <td>{order.证券代码}</td>
                    <td>{order.方向}</td>
                    <td className="text-right pr-2">{order.成交价?.toFixed(2)}</td>
                    <td className="text-right pr-2">{order.成交量}</td>
                    <td className="text-right pr-2">{order.成交额?.toFixed(2)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center text-gray-500 py-4">
                    无数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </main>

        <aside className={`w-1/4 p-4 flex flex-col border-l ${isDark ? 'bg-[#1c1c1c]' : 'bg-gray-100'} chat-container`}>
          <h2 className="text-lg font-semibold mb-2 text-center">DeepSeek 分析助手</h2>

          <div className={`flex-1 overflow-y-auto rounded-lg mb-3 ${isDark ? 'bg-[#1e1e1e]' : 'bg-gray-50'}`}>
            <div className="p-3 space-y-3" style={{ minHeight: '100%' }}>
              {messages.map((msg, index) =>
                msg.role === 'user' ? (
                  <div key={index} className="ml-auto p-3 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white max-w-[90%] shadow-sm">
                    {msg.content}
                  </div>
                ) : (
                  <div key={index} className={`prose prose-base max-w-full ${isDark ? 'prose-invert text-gray-100' : 'text-gray-900'}`}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                )
              )}
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

          <div className={`mt-auto p-3 rounded-lg ${isDark ? 'bg-[#252525]' : 'bg-gray-100'}`}>
            <div className="flex items-end gap-2">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                onKeyDown={handleKeyDown}
                placeholder="输入问题..."
                className={`flex-1 resize-none rounded-lg p-3 focus:outline-none ${
                  isDark ? 'bg-[#333] text-gray-100 placeholder-gray-400 border-gray-600' : 'bg-white text-gray-800 placeholder-gray-500 border-gray-300'
                } border transition-all max-h-32`}
                rows={1}
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !inputValue.trim()}
                className={`h-10 w-10 rounded-lg flex items-center justify-center transition-colors ${
                  isLoading || !inputValue.trim()
                    ? isDark ? 'bg-gray-700 text-gray-500' : 'bg-gray-300 text-gray-500'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isLoading ? (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}