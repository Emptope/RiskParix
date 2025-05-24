// Detail Themed with Coordinated Dark Mode Styling
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchStockDetail } from '../api/api';
import ReactECharts from 'echarts-for-react';
import Papa from 'papaparse';
import groupBy from 'lodash/groupBy';
import dayjs from 'dayjs';
import { useTheme } from '../context/ThemeContext';

export default function Detail() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const baseBg = isDark ? 'bg-[#0a0a0a] text-[#e5e5e5]' : 'bg-white text-black';
  const cardBg = isDark ? 'bg-[#141414] text-[#e5e5e5]' : 'bg-white text-black';
  const sectionBg = isDark ? 'bg-[#1c1c1c]' : 'bg-gray-100';
  const inputStyle = `w-full border border-gray-600 px-2 py-1 rounded ${isDark ? 'bg-[#1c1c1c] text-white' : 'text-black'}`;

  const [detail, setDetail] = useState(null);
  const [klineData, setKlineData] = useState([]);
  const [period, setPeriod] = useState('日K');

  useEffect(() => {
    fetchStockDetail(code)
      .then((data) => {
        setDetail(data);
        if (data?.kline_data) {
          setKlineData(data.kline_data);
        } else {
          fetchKlineFromCSV(code);
        }
      })
      .catch(() => {
        fetchKlineFromCSV(code);
      });
  }, [code]);

  const fetchKlineFromCSV = async (stockCode) => {
    try {
      const response = await fetch('/data/day_klines/all_klines.csv');
      const text = await response.text();
      Papa.parse(text, {
        header: true,
        complete: (result) => {
          const filtered = result.data.filter((row) =>
            row['证券代码']?.includes(stockCode)
          );
          const formatted = filtered
            .map((row) => ({
              date: row['交易日期'],
              open: parseFloat(row['开盘价']),
              close: parseFloat(row['收盘价']),
              low: parseFloat(row['最低价']),
              high: parseFloat(row['最高价']),
            }))
            .filter((row) => !isNaN(row.open));
          setKlineData(formatted);
        },
      });
    } catch (err) {
      console.error('读取CSV失败:', err);
    }
  };

  const periods = ['日K', '周K', '月K', '季K', '年K'];

  const resampleKline = (data, period) => {
    if (period === '日K') return data;

    const formatMap = {
      周K: (date) => dayjs(date).startOf('week').format('YYYY-MM-DD'),
      月K: (date) => dayjs(date).startOf('month').format('YYYY-MM-DD'),
      年K: (date) => dayjs(date).startOf('year').format('YYYY-MM-DD'),
      季K: (date) => {
        const d = dayjs(date);
        const month = d.month(); // 0-11
        const startMonth = [0, 3, 6, 9][Math.floor(month / 3)];
        return dayjs(`${d.year()}-${(startMonth + 1).toString().padStart(2, '0')}-01`).format('YYYY-MM-DD');
      }
    };

    const grouped = groupBy(data, (item) => formatMap[period](item.date));
    return Object.entries(grouped).map(([date, group]) => ({
      date,
      open: group[0].open,
      close: group[group.length - 1].close,
      low: Math.min(...group.map((i) => i.low)),
      high: Math.max(...group.map((i) => i.high)),
    }));
  };
  
  const calculateEMA = (data, dayCount) => {
    const result = [];
    let multiplier = 2 / (dayCount + 1);
    for (let i = 0; i < data.length; i++) {
      if (i === 0) {
        result.push(data[i].close);
      } else {
        result.push(
          (data[i].close - result[i - 1]) * multiplier + result[i - 1]
        );
      }
    }
    return result.map((val) => val.toFixed(2));
  };

const getKlineOption = () => {
    const sourceData = resampleKline(klineData, period);
    if (!sourceData || sourceData.length === 0) return {};

    const dates = sourceData.map((item) => item.date);
    const candlestickData = sourceData.map((item) => [
      item.open,
      item.close,
      item.low,
      item.high,
    ]);

    return {
      backgroundColor: isDark ? '#0a0a0a' : '#fff',
      textStyle: { color: isDark ? '#e5e5e5' : '#333' },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
      },
      legend: {
        data: ['K线', 'EMA20'],
        textStyle: { color: isDark ? '#e5e5e5' : '#333' },
      },
      xAxis: {
        type: 'category',
        data: dates,
        scale: true,
        boundaryGap: false,
        axisLine: {
          onZero: false,
          lineStyle: {
            color: isDark ? '#555' : '#333',
          },
        },
        splitLine: {
          show: true,
          lineStyle: {
            color: isDark ? '#2a2a2a' : '#eee',
            type: 'dotted',
          },
        },
        min: 'dataMin',
        max: 'dataMax',
        minInterval: 1,
      },
      yAxis: {
        scale: true,
        splitArea: { show: false },
        axisLine: {
          lineStyle: {
            color: isDark ? '#555' : '#333',
          },
        },
        splitLine: {
          show: true,
          lineStyle: {
            color: isDark ? '#2a2a2a' : '#eee',
            type: 'dotted',
          },
        },
      },
      dataZoom: [
        { type: 'inside', start: 50, end: 100, minValueSpan: 5 },
        { show: true, type: 'slider', top: '90%', start: 50, end: 100, minValueSpan: 5 },
      ],
      series: [
        {
          name: 'K线',
          type: 'candlestick',
          data: candlestickData,
          itemStyle: {
            color: '#ef5350',
            color0: '#26a69a',
            borderColor: '#ef5350',
            borderColor0: '#26a69a',
          },
        },
        {
          name: 'EMA20',
          type: 'line',
          data: calculateEMA(sourceData, 20),
          smooth: false,
          lineStyle: { width: 1 },
        },
      ],
    };
  };

  return (
    <div className={`flex flex-col h-screen ${baseBg}`}>
      <div className="flex justify-end p-2">
        <button
          onClick={toggleTheme}
          className="border px-3 py-1 rounded text-sm"
        >
          切换为 {isDark ? '浅色' : '深色'} 模式
        </button>
      </div>
      <div className="flex flex-1 overflow-hidden">
        {/* 左侧估值信息 */}
        <div className={`w-1/4 p-4 overflow-y-auto ${sectionBg}`}>
          <h2 className="text-lg font-semibold mb-2">估值信息</h2>
          {detail ? (
            <div className="space-y-2">
              <div>
                <label className="block text-sm">FCFE估值</label>
                <input className={inputStyle} value={detail.fcfe || ''} readOnly />
              </div>
              <div>
                <label className="block text-sm">FCFF估值</label>
                <input className={inputStyle} value={detail.fcff || ''} readOnly />
              </div>
              <h2 className="text-lg font-semibold mt-4 mb-2">金融参数</h2>
              <div>
                <label className="block text-sm">年化收益率</label>
                <input className={inputStyle} value={detail.annualized_return || ''} readOnly />
              </div>
              <div>
                <label className="block text-sm">最大回撤</label>
                <input className={inputStyle} value={detail.max_drawdown || ''} readOnly />
              </div>
              <div>
                <label className="block text-sm">夏普比率</label>
                <input className={inputStyle} value={detail.sharpe_ratio || ''} readOnly />
              </div>
              <h2 className="text-lg font-semibold mt-4 mb-2">相关股票</h2>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {detail.related_stocks?.map((stock, idx) => (
                  <li key={idx}>{stock}</li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="text-gray-400 text-sm">暂无详细估值信息</div>
          )}
        </div>

        {/* 中间图表区域 */}
        <div className={`w-2/4 p-4 flex flex-col ${cardBg}`}>
          <div className="mb-4 flex justify-between items-center">
            <div>
              <label className="mr-2">K线周期:</label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="border px-2 py-1 text-black"
              >
                {periods.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex-1 border rounded">
            <ReactECharts option={getKlineOption()} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>

        {/* 右侧聊天助手 */}
        <div className={`w-1/4 p-4 flex flex-col border-l ${sectionBg}`}>
          <h2 className="text-lg font-semibold mb-2">DeepSeek 分析助手</h2>
          <div className={`flex-1 rounded p-2 overflow-y-auto text-sm ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>AI: 请输入您想要咨询的股票问题。</p>
          </div>
          <input
            type="text"
            placeholder="输入问题..."
            className="border mt-2 px-2 py-1 w-full text-black"
          />
        </div>
      </div>
    </div>
  );
}
