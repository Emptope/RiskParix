export async function fetchStocks(filters) {
  const res = await fetch("http://localhost:8000/api/stocks", {
    method: "GET"
  });
  const all = await res.json();

  return all.filter(item => {
    if (filters.year !== '选择年份' && +item["年份"] !== +filters.year) return false;
    if (+item["年涨跌幅"] < +filters.annual_return) return false;
    if (+item["最大回撤%"] > +filters.max_drawdown) return false;
    if (+item["市盈率TTM"] > +filters.pe_ratio) return false;
    if (+item["市净率MRQ"] > +filters.pb_ratio) return false;
    if (+item["夏普比率-普通收益率-日-一年定存利率"] < +filters.sharpe_ratio) return false;
    return true;
  }).map(item => ({
    code: item["证券代码"],
    name: item["证券名称"],
    year: item["年份"],
    annual_return: item["年涨跌幅"],
    max_drawdown: item["最大回撤%"],
    pe_ratio: item["市盈率TTM"],
    pb_ratio: item["市净率MRQ"],
    sharpe_ratio: item["夏普比率-普通收益率-日-一年定存利率"]
  }));
}

export async function fetchStockDetail(code) {
  try {
    const res = await fetch(`http://localhost:8000/api/kline/${code}`);
    if (!res.ok) throw new Error("Failed to fetch kline data");

    const kline_data = await res.json();
    return { kline_data };
  } catch (err) {
    console.error("fetchStockDetail error:", err);
    return { kline_data: [] };
  }
}

export async function fetchUsers() {
  const res = await fetch("http://localhost:8000/api/users");
  return await res.json();
}

export async function fetchTrades() {
  const res = await fetch("http://localhost:8000/api/trades");
  return await res.json();
}

export async function sendChat({ message, history = [], stock_id = null }) {
  const res = await fetch("http://localhost:8000/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history, stock_id })
  });
  const data = await res.json();
  return data.response;
}