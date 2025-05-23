import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchStocks } from '../api/api';

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

  return (
    <div className="flex flex-col h-screen">
      <div className="flex flex-1 overflow-hidden">
        {/* 服务列表 */}
        <aside className="w-56 bg-gray-200 p-4 flex flex-col">
          <h2 className="text-xl font-bold mb-4 text-center">服务列表</h2>
          <ul className="space-y-2 flex-1 overflow-y-auto">
            {services.map((srv) => (
              <li 
                key={srv} 
                className="text-gray-700 p-2 hover:bg-gray-300 rounded cursor-pointer"
              >
                {srv}
              </li>
            ))}
          </ul>
        </aside>

        {/* 筛选面板 */}
        <aside className="w-72 bg-gray-100 p-4 border-r border-gray-300 overflow-y-auto">
          <h2 className="text-xl font-bold mb-4 text-center">筛选列表</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">年份</label>
              <select
                value={filters.year}
                onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option>选择年份</option>
                {years.map((y) => (
                  <option key={y}>{y}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">年化收益率 ≥ {filters.annual_return}%</label>
              <input type="range" min={0} max={50} value={filters.annual_return}
                onChange={(e) => setFilters({ ...filters, annual_return: Number(e.target.value) })}
                className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">最大回撤 ≤ {filters.max_drawdown}%</label>
              <input type="range" min={0} max={100} value={filters.max_drawdown}
                onChange={(e) => setFilters({ ...filters, max_drawdown: Number(e.target.value) })}
                className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">市盈率 TTM ≤ {filters.pe_ratio}</label>
              <input type="range" min={0} max={100} step={1} value={filters.pe_ratio}
                onChange={(e) => setFilters({ ...filters, pe_ratio: Number(e.target.value) })}
                className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">市净率 MRQ ≤ {filters.pb_ratio.toFixed(1)}</label>
              <input type="range" min={0} max={10} step={0.1} value={filters.pb_ratio}
                onChange={(e) => setFilters({ ...filters, pb_ratio: Number(e.target.value) })}
                className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">夏普比率 ≥ {filters.sharpe_ratio.toFixed(1)}</label>
              <input type="range" min={0} max={5} step={0.1} value={filters.sharpe_ratio}
                onChange={(e) => setFilters({ ...filters, sharpe_ratio: Number(e.target.value) })}
                className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer" />
            </div>
          </div>
        </aside>

        {/* 股票列表 */}
        <main className="flex-1 bg-white p-4 overflow-auto">
          <h2 className="text-xl font-bold mb-4 text-center">股票列表</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-center text-white font-medium text-gray-600 uppercase">证券代码</th>
                  <th className="px-4 py-2 text-center text-white font-medium text-gray-600 uppercase">证券名称</th>
                  <th className="px-4 py-2 text-center text-white font-medium text-gray-600 uppercase">年份</th>
                  <th className="px-4 py-2 text-center text-white font-medium text-gray-600 uppercase">年涨跌幅</th>
                  <th className="px-4 py-2 text-center text-white font-medium text-gray-600 uppercase">最大回撤</th>
                  <th className="px-4 py-2 text-center text-white font-medium text-gray-600 uppercase">市盈率</th>
                  <th className="px-4 py-2 text-center text-white font-medium text-gray-600 uppercase">市净率</th>
                  <th className="px-4 py-2 text-center text-white font-medium text-gray-600 uppercase">夏普比率</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stocks.map((stk) => (
                  <tr
                    key={stk.code}
                    className="hover:bg-gray-100 cursor-pointer"
                    onClick={() => navigate(`/detail/${stk.code}`)}
                  >
                    <td className="px-4 py-2 text-center text-sm text-gray-800">{stk.code}</td>
                    <td className="px-4 py-2 text-center text-sm text-gray-800">{stk.name}</td>
                    <td className="px-4 py-2 text-center text-sm text-gray-800">{stk.year}</td>
                    <td className="px-4 py-2 text-center text-sm text-gray-800">{stk.annual_return}</td>
                    <td className="px-4 py-2 text-center text-sm text-gray-800">{stk.max_drawdown}</td>
                    <td className="px-4 py-2 text-center text-sm text-gray-800">{stk.pe_ratio}</td>
                    <td className="px-4 py-2 text-center text-sm text-gray-800">{stk.pb_ratio}</td>
                    <td className="px-4 py-2 text-center text-sm text-gray-800">{stk.sharpe_ratio}</td>
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