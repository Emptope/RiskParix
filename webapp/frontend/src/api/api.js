export async function fetchStocks(filters) {
  try {
    const res = await fetch("http://localhost:8000/api/stocks", {
      method: "GET"
    });

    if (!res.ok) {
      console.error("Failed to fetch stocks:", res.status, await res.text());
      return []; // Return empty array on error or throw an error
    }

    const allItems = await res.json();

    // Filter using the raw keys from the API response
    const filteredItems = allItems.filter(item => {
      // Handle year filter: filters.year can be '' or a number
      // The backend receives '选择年份' if no year is selected.
      if (filters.year && filters.year !== '选择年份' && item["年份"] != filters.year) { // Use loose equality for year as it might be string vs number initially
        return false;
      }

      // Ensure item properties are numbers before comparison
      const annualReturn = parseFloat(item["年涨跌幅"]);
      const maxDrawdown = parseFloat(item["最大回撤"]);
      const peRatio = parseFloat(item["市盈率"]);
      const pbRatio = parseFloat(item["市净率"]);
      // The API provides "夏普比率-普通收益率-日-一年定存利率" which maps to sharpe_ratio.
      const sharpeRatio = parseFloat(item["夏普比率-普通收益率-日-一年定存利率"]);

      // Initial filter for annual_return is 0.
      if (!isNaN(annualReturn) && annualReturn < parseFloat(filters.annual_return)) return false;
      // Initial filter for max_drawdown is 100.
      if (!isNaN(maxDrawdown) && maxDrawdown > parseFloat(filters.max_drawdown)) return false;
      // Initial filter for pe_ratio is 100.
      if (!isNaN(peRatio) && peRatio > parseFloat(filters.pe_ratio)) return false;
      // Initial filter for pb_ratio is 10.
      if (!isNaN(pbRatio) && pbRatio > parseFloat(filters.pb_ratio)) return false;
      // Initial filter for sharpe_ratio is 0.
      if (!isNaN(sharpeRatio) && sharpeRatio < parseFloat(filters.sharpe_ratio)) return false;
      
      return true;
    });

    // Map to the desired frontend structure
    return filteredItems.map(item => ({
      code: item["证券代码"], //
      name: item["证券名称"], //
      year: Number(item["年份"]), // Ensure year is a number
      annual_return: parseFloat(item["年涨跌幅"]), //
      max_drawdown: parseFloat(item["最大回撤"]), //
      pe_ratio: parseFloat(item["市盈率"]), //
      pb_ratio: parseFloat(item["市净率"]), //
      sharpe_ratio: parseFloat(item["夏普比率-普通收益率-日-一年定存利率"]) //
    }));

  } catch (error) {
    console.error("Error in fetchStocks:", error);
    return []; // Return empty array on network error or JSON parsing error
  }
}

export async function fetchStockDetail(code) {
  try {
    const res = await fetch(`http://localhost:8000/api/kline/${code}`);
    if (!res.ok) {
      console.error("Failed to fetch kline data:", res.status, await res.text());
      return { kline_data: [] }; // Consistent error handling
    }
    const kline_data = await res.json();
    return { kline_data };
  } catch (err) {
    console.error("fetchStockDetail error:", err);
    return { kline_data: [] };
  }
}

export async function fetchUsers() {
  try {
    const res = await fetch("http://localhost:8000/api/users");
    if (!res.ok) {
      console.error("Failed to fetch users:", res.status, await res.text());
      return [];
    }
    return await res.json();
  } catch (error) {
    console.error("Error in fetchUsers:", error);
    return [];
  }
}

export async function fetchTrades() {
  try {
    const res = await fetch("http://localhost:8000/api/trades");
    if (!res.ok) {
      console.error("Failed to fetch trades:", res.status, await res.text());
      return [];
    }
    return await res.json();
  } catch (error) {
    console.error("Error in fetchTrades:", error);
    return [];
  }
}

export async function sendChat({ message, history = [], stock_id = null }) {
  try {
    const res = await fetch("http://localhost:8000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, history, stock_id })
    });
    if (!res.ok) {
      console.error("Failed to send chat message:", res.status, await res.text());
      // Decide what to return on error, maybe throw or return a specific error structure
      return "Error sending message"; 
    }
    const data = await res.json();
    return data.response;
  } catch (error) {
    console.error("Error in sendChat:", error);
    return "Error sending message";
  }
}