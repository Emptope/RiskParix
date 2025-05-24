import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchStocks } from '../api/api';
import { useTheme } from '../context/ThemeContext';
import debounce from 'lodash/debounce';

export default function Home() {
  const [allStocks, setAllStocks] = useState([]);
  const [displayStocks, setDisplayStocks] = useState([]);
  const [displayCount, setDisplayCount] = useState(50); // 初始展示数量
  const [filters, setFilters] = useState({
    year: '',
    annual_return: 0,
    max_drawdown: 100,
    pe_ratio: 100,
    pb_ratio: 10,
    sharpe_ratio: 0,
  });
  const [tmpFilters, setTmpFilters] = useState(filters);
  const [sortConfig, setSortConfig] = useState({ key: '', direction: 'asc' });

  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

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
    return isNaN(n) ? '-' : n.toFixed(2);
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key) {
      direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
    }
    setSortConfig({ key, direction });
  };

  const filteredStocks = useMemo(() => {
    setDisplayCount(50); // 筛选变动时重置展示数量
    return allStocks.filter((item) => {
      if (filters.year && String(item.year) !== String(filters.year)) return false;
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
      if (sortConfig.key !== 'code' && sortConfig.key !== 'name' && !isNaN(aNum) && !isNaN(bNum)) {
        return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
      }
      return sortConfig.direction === 'asc'
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

  const services = ['soufflé服务器', '数据库', 'baostock实时行情'];
  const years = Array.from({ length: 2025 - 2014 }, (_, i) => 2014 + i);

  const isDark = theme === 'dark';
  const baseBg = isDark ? 'bg-gray-900 text-white' : 'bg-white text-black';
  const cardBg = isDark ? 'bg-gray-800 text-white' : 'bg-white text-black';
  const tableHead = isDark ? 'bg-blue-800 text-white' : 'bg-blue-900 text-white';
  const sliderColor = isDark ? 'bg-gray-600' : 'bg-gray-300';

  const columnConfig = [
    ['证券代码', 'code'],
    ['证券名称', 'name'],
    ['年份', 'year'],
    ['年涨跌幅', 'annual_return'],
    ['最大回撤', 'max_drawdown'],
    ['市盈率', 'pe_ratio'],
    ['市净率', 'pb_ratio'],
    ['夏普比率', 'sharpe_ratio']
  ];

  return (
    <div className={`flex flex-col h-screen ${baseBg}`}>
      <div className="flex justify-end p-2">
        <button onClick={toggleTheme} className="border px-3 py-1 rounded text-sm">
          切换为 {theme === 'light' ? '深色' : '浅色'} 模式
        </button>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <aside className={`w-56 p-4 flex flex-col rounded-xl m-2 ${cardBg}`}>
          <h2 className="text-xl font-bold mb-4 text-center">服务列表</h2>
          <ul className="space-y-2 flex-1 overflow-y-auto">
            {services.map((srv) => (
              <li key={srv} className="p-2 hover:bg-blue-700 rounded cursor-pointer">
                {srv}
              </li>
            ))}
          </ul>
        </aside>

        <aside className={`w-72 border-r border-gray-300 overflow-y-auto rounded-xl m-2 p-4 ${cardBg}`}>
          <h2 className="text-xl font-bold mb-4 text-center">筛选列表</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">年份</label>
              <select
                value={tmpFilters.year}
                onChange={(e) => onFilterChange('year', e.target.value)}
                className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-black"
              >
                <option value="">选择年份</option>
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            {[
              ['年化收益率 ≥', 'annual_return', 0, 50, '%'],
              ['最大回撤 ≤', 'max_drawdown', 0, 100, '%'],
              ['市盈率 ≤', 'pe_ratio', 0, 100, ''],
              ['市净率 ≤', 'pb_ratio', 0, 10, ''],
              ['夏普比率 ≥', 'sharpe_ratio', 0, 5, '']
            ].map(([label, key, min, max, suffix]) => (
              <div key={key}>
                <label className="block text-sm font-medium mb-1">
                  {label} {formatNumber(tmpFilters[key])}{suffix}
                </label>
                <input
                  type="range"
                  min={min}
                  max={max}
                  step={key === 'pb_ratio' || key === 'sharpe_ratio' ? 0.1 : 1}
                  value={tmpFilters[key]}
                  onChange={(e) => onFilterChange(key, Number(e.target.value))}
                  className={`w-full h-2 ${sliderColor} rounded-lg appearance-none cursor-pointer`}
                />
              </div>
            ))}
          </div>
        </aside>

        <main className={`flex-1 p-4 overflow-auto rounded-xl m-2 ${cardBg}`} onScroll={handleScroll}>
          <h2 className="text-xl font-bold mb-4 text-center">股票列表</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 rounded-xl overflow-hidden">
              <thead className={tableHead}>
                <tr>
                  {columnConfig.map(([label, key]) => (
                    <th
                      key={key}
                      onClick={() => handleSort(key)}
                      className="px-4 py-2 text-center font-medium uppercase cursor-pointer select-none"
                    >
                      <div className="inline-flex items-center">
                        <span>{label}</span>
                        <span style={{ fontSize: '0.6rem' }}>
                          {sortConfig.key === key
                            ? (sortConfig.direction === 'asc' ? ' ▲' : ' ▼')
                            : ' △'}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className={isDark ? 'bg-gray-800 text-white' : 'bg-white text-black'}>
                {displayStocks.map((stk) => (
                  <tr
                    key={stk.code + stk.year}
                    className="hover:bg-blue-100 cursor-pointer"
                    onClick={() => navigate(`/detail/${stk.code}`)}
                  >
                    <td className="px-4 py-2 text-center text-sm">{stk.code}</td>
                    <td className="px-4 py-2 text-center text-sm">{stk.name}</td>
                    <td className="px-4 py-2 text-center text-sm">{stk.year}</td>
                    <td className="px-4 py-2 text-center text-sm">{formatNumber(stk.annual_return)}</td>
                    <td className="px-4 py-2 text-center text-sm">{formatNumber(stk.max_drawdown)}</td>
                    <td className="px-4 py-2 text-center text-sm">{formatNumber(stk.pe_ratio)}</td>
                    <td className="px-4 py-2 text-center text-sm">{formatNumber(stk.pb_ratio)}</td>
                    <td className="px-4 py-2 text-center text-sm">{formatNumber(stk.sharpe_ratio)}</td>
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
