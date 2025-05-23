import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchStockDetail } from '../api/api';
import ReactECharts from 'echarts-for-react';
import Papa from 'papaparse';
import groupBy from 'lodash/groupBy';
import dayjs from 'dayjs';

export default function Detail() {
  const { code } = useParams();
  const [detail, setDetail] = useState(null);
  const [klineData, setKlineData] = useState([]);
  const [period, setPeriod] = useState('日K');
  const [theme, setTheme] = useState('light');
  const navigate = useNavigate();

  useEffect(() => {
    fetchStockDetail(code)
      .then(data => {
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
          const filtered = result.data.filter(row => row["证券代码"]?.includes(stockCode));
          const formatted = filtered.map(row => ({
            date: row["交易日期"],
            open: parseFloat(row["开盘价"]),
            close: parseFloat(row["收盘价"]),
            low: parseFloat(row["最低价"]),
            high: parseFloat(row["最高价"])
          })).filter(row => !isNaN(row.open));
          setKlineData(formatted);
        }
      });
    } catch (err) {
      console.error('读取CSV失败:', err);
    }
  };

  const periods = ['日K', '周K', '月K', '季K', '年K'];

  const resampleKline = (data, period) => {
    if (period === '日K') return data;
    const formatMap = {
      '周K': date => dayjs(date).startOf('week').format('YYYY-MM-DD'),
      '月K': date => dayjs(date).startOf('month').format('YYYY-MM-DD'),
      '季K': date => dayjs(date).startOf('quarter').format('YYYY-MM-DD'),
      '年K': date => dayjs(date).startOf('year').format('YYYY-MM-DD')
    };
    const grouped = groupBy(data, item => formatMap[period](item.date));
    return Object.entries(grouped).map(([date, group]) => ({
      date,
      open: group[0].open,
      close: group[group.length - 1].close,
      low: Math.min(...group.map(i => i.low)),
      high: Math.max(...group.map(i => i.high))
    }));
  };

  const calculateEMA = (data, dayCount) => {
    const result = [];
    let multiplier = 2 / (dayCount + 1);
    for (let i = 0; i < data.length; i++) {
      if (i === 0) {
        result.push(data[i].close);
      } else {
        result.push((data[i].close - result[i - 1]) * multiplier + result[i - 1]);
      }
    }
    return result.map(val => val.toFixed(2));
  };

  const getKlineOption = () => {
    const sourceData = resampleKline(klineData, period);
    if (!sourceData || sourceData.length === 0) return {};

    const dates = sourceData.map(item => item.date);
    const candlestickData = sourceData.map(item => [item.open, item.close, item.low, item.high]);

    return {
      backgroundColor: theme === 'dark' ? '#1e1e1e' : '#fff',
      textStyle: {
        color: theme === 'dark' ? '#ccc' : '#333'
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross'
        }
      },
      legend: {
        data: ['K线', 'EMA20'],
        textStyle: {
          color: theme === 'dark' ? '#ccc' : '#333'
        }
      },
      xAxis: {
        type: 'category',
        data: dates,
        scale: true,
        boundaryGap: false,
        axisLine: { onZero: false },
        splitLine: { show: false },
        min: 'dataMin',
        max: 'dataMax',
        minInterval: 1
      },
      yAxis: {
        scale: true,
        splitArea: { show: true }
      },
      dataZoom: [
        {
          type: 'inside',
          start: 50,
          end: 100,
          minValueSpan: 5
        },
        {
          show: true,
          type: 'slider',
          top: '90%',
          start: 50,
          end: 100,
          minValueSpan: 5
        }
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
            borderColor0: '#26a69a'
          }
        },
        {
          name: 'EMA20',
          type: 'line',
          data: calculateEMA(sourceData, 20),
          smooth: false,
          lineStyle: { width: 1 }
        }
      ]
    };
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex flex-1 overflow-hidden">
        {/* 左侧信息面板 */}
        <div className="w-1/4 bg-gray-100 p-4 overflow-y-auto">
          <h2 className="text-lg font-semibold mb-2">估值信息</h2>
          {detail ? (
            <div className="space-y-2">
              <div>
                <label className="block text-sm">FCFE估值</label>
                <input className="w-full border px-2 py-1" value={detail.fcfe || ''} readOnly />
              </div>
              <div>
                <label className="block text-sm">FCFF估值</label>
                <input className="w-full border px-2 py-1" value={detail.fcff || ''} readOnly />
              </div>

              <h2 className="text-lg font-semibold mt-4 mb-2">金融参数</h2>
              <div>
                <label className="block text-sm">年化收益率</label>
                <input className="w-full border px-2 py-1" value={detail.annualized_return || ''} readOnly />
              </div>
              <div>
                <label className="block text-sm">最大回撤</label>
                <input className="w-full border px-2 py-1" value={detail.max_drawdown || ''} readOnly />
              </div>
              <div>
                <label className="block text-sm">夏普比率</label>
                <input className="w-full border px-2 py-1" value={detail.sharpe_ratio || ''} readOnly />
              </div>
              <h2 className="text-lg font-semibold mt-4 mb-2">相关股票</h2>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {detail.related_stocks?.map((stock, idx) => (
                  <li key={idx}>{stock}</li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="text-gray-600 text-sm">暂无详细估值信息</div>
          )}
        </div>

        {/* 中间图表面板 */}
        <div className="w-2/4 bg-white p-4 flex flex-col">
          <div className="mb-4 flex justify-between items-center">
            <div>
              <label className="mr-2">K线周期:</label>
              <select
                value={period}
                onChange={e => setPeriod(e.target.value)}
                className="border px-2 py-1"
              >
                {periods.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <button
              onClick={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
              className="border px-2 py-1 rounded text-sm"
            >
              切换为 {theme === 'light' ? '深色' : '浅色'} 模式
            </button>
          </div>
          <div className="flex-1 border rounded bg-gray-50">
            <ReactECharts option={getKlineOption()} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>

        {/* 右侧聊天助手 */}
        <div className="w-1/4 bg-white border-l p-4 flex flex-col">
          <h2 className="text-lg font-semibold mb-2">DeepSeek 分析助手</h2>
          <div className="flex-1 bg-gray-100 rounded p-2 overflow-y-auto text-sm">
            <p className="text-gray-600">AI: 请输入您想要咨询的股票问题。</p>
          </div>
          <input
            type="text"
            placeholder="输入问题..."
            className="border mt-2 px-2 py-1 w-full"
          />
        </div>
      </div>

      {/* 底部返回按钮 */}
      <div className="border-t p-4 text-right">
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
