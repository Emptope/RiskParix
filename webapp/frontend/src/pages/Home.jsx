import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchStocks } from '../api/api';
import { useTheme } from '../context/ThemeContext';

export default function Home() {
  const [stocks, setStocks] = useState([]);
  const [filters, setFilters] = useState({
    year: '选择年份',
    annual_return: 0,
    max_drawdown: 0,
    pe_ratio: 0,
    pb_ratio: 0,
    sharpe_ratio: 0,
  });
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      const data = await fetchStocks(filters);
      setStocks(data);
    }
    load();
  }, [filters]);

  const services = ['soufflé服务器', '数据库', 'baostock实时行情'];
  const years = Array.from({ length: 2025 - 2014 }, (_, i) => 2014 + i);

  const isDark = theme === 'dark';
  const baseBg = isDark ? 'bg-gray-900 text-white' : 'bg-white text-black';
  const cardBg = isDark ? 'bg-gray-800 text-white' : 'bg-white text-black';
  const tableHead = isDark ? 'bg-blue-800 text-white' : 'bg-blue-900 text-white';
  const sliderColor = isDark ? 'bg-gray-600' : 'bg-gray-300';

  return (
    <div className={`flex flex-col h-screen ${baseBg}`}>
      <div className="flex justify-end p-2">
        <button
          onClick={toggleTheme}
          className="border px-3 py-1 rounded text-sm"
        >
          切换为 {theme === 'light' ? '深色' : '浅色'} 模式
        </button>
      </div>
      <div className="flex flex-1 overflow-hidden">
        {/* 服务列表 */}
        <aside className={`w-56 p-4 flex flex-col rounded-xl m-2 ${cardBg}`}>
          <h2 className="text-xl font-bold mb-4 text-center">服务列表</h2>
          <ul className="space-y-2 flex-1 overflow-y-auto">
            {services.map((srv) => (
              <li 
                key={srv} 
                className="p-2 hover:bg-blue-700 rounded cursor-pointer"
              >
                {srv}
              </li>
            ))}
          </ul>
        </aside>

        {/* 筛选面板 */}
        <aside className={`w-72 border-r border-gray-300 overflow-y-auto rounded-xl m-2 p-4 ${cardBg}`}>
          <h2 className="text-xl font-bold mb-4 text-center">筛选列表</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">年份</label>
              <select
                value={filters.year}
                onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-black"
              >
                <option>选择年份</option>
                {years.map((y) => (
                  <option key={y}>{y}</option>
                ))}
              </select>
            </div>
            {[
              ['年化收益率 ≥', 'annual_return', 0, 50, '%'],
              ['最大回撤 ≤', 'max_drawdown', 0, 100, '%'],
              ['市盈率 TTM ≤', 'pe_ratio', 0, 100, ''],
              ['市净率 MRQ ≤', 'pb_ratio', 0, 10, ''],
              ['夏普比率 ≥', 'sharpe_ratio', 0, 5, '']
            ].map(([label, key, min, max, suffix]) => (
              <div key={key}>
                <label className="block text-sm font-medium mb-1">
                  {label} {filters[key].toFixed ? filters[key].toFixed(1) : filters[key]}{suffix}
                </label>
                <input
                  type="range"
                  min={min}
                  max={max}
                  step={key === 'pb_ratio' || key === 'sharpe_ratio' ? 0.1 : 1}
                  value={filters[key]}
                  onChange={(e) => setFilters({ ...filters, [key]: Number(e.target.value) })}
                  className={`w-full h-2 ${sliderColor} rounded-lg appearance-none cursor-pointer`}
                />
              </div>
            ))}
          </div>
        </aside>

        {/* 股票列表 */}
        <main className={`flex-1 p-4 overflow-auto rounded-xl m-2 ${cardBg}`}>
          <h2 className="text-xl font-bold mb-4 text-center">股票列表</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 rounded-xl overflow-hidden">
              <thead className={tableHead}>
                <tr>
                  {['证券代码','证券名称','年份','年涨跌幅','最大回撤','市盈率','市净率','夏普比率'].map(head => (
                    <th key={head} className="px-4 py-2 text-center font-medium uppercase">{head}</th>
                  ))}
                </tr>
              </thead>
              <tbody className={isDark ? 'bg-gray-800 text-white' : 'bg-white text-black'}>
                {stocks.map((stk) => (
                  <tr
                    key={stk.code}
                    className="hover:bg-blue-100 cursor-pointer"
                    onClick={() => navigate(`/detail/${stk.code}`)}
                  >
                    <td className="px-4 py-2 text-center text-sm">{stk.code}</td>
                    <td className="px-4 py-2 text-center text-sm">{stk.name}</td>
                    <td className="px-4 py-2 text-center text-sm">{stk.year}</td>
                    <td className="px-4 py-2 text-center text-sm">{stk.annual_return}</td>
                    <td className="px-4 py-2 text-center text-sm">{stk.max_drawdown}</td>
                    <td className="px-4 py-2 text-center text-sm">{stk.pe_ratio}</td>
                    <td className="px-4 py-2 text-center text-sm">{stk.pb_ratio}</td>
                    <td className="px-4 py-2 text-center text-sm">{stk.sharpe_ratio}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}
