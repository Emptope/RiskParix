// 基础配置
const API_BASE_URL = "http://localhost:8000/api";

// 通用错误处理函数
const handleApiError = (error, context) => {
  console.error(`Error in ${context}:`, error);
  return null;
};

// 通用fetch包装函数
const apiRequest = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers
      },
      ...options
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API request failed for ${url}:`, error);
    throw error;
  }
};

/**
 * 获取股票列表并应用过滤器
 * @param {Object} filters - 过滤条件
 * @returns {Promise<StockItem[]>} 股票列表
 */
export async function fetchStocks(filters = {}) {
  try {
    const allItems = await apiRequest(`${API_BASE_URL}/stocks`);

    // 应用过滤器
    const filteredItems = allItems.filter(item => {
      if (filters.year && filters.year !== '选择年份' && item["年份"] != filters.year) {
        return false;
      }

      const annualReturn = parseFloat(item["年涨跌幅"]);
      const maxDrawdown = parseFloat(item["最大回撤"]);
      const peRatio = parseFloat(item["市盈率"]);
      const pbRatio = parseFloat(item["市净率"]);
      const sharpeRatio = parseFloat(item["夏普比率-普通收益率-日-一年定存利率"]);

      if (filters.annual_return !== undefined && !isNaN(annualReturn) && annualReturn < parseFloat(filters.annual_return)) return false;
      if (filters.max_drawdown !== undefined && !isNaN(maxDrawdown) && maxDrawdown > parseFloat(filters.max_drawdown)) return false;
      if (filters.pe_ratio !== undefined && !isNaN(peRatio) && peRatio > parseFloat(filters.pe_ratio)) return false;
      if (filters.pb_ratio !== undefined && !isNaN(pbRatio) && pbRatio > parseFloat(filters.pb_ratio)) return false;
      if (filters.sharpe_ratio !== undefined && !isNaN(sharpeRatio) && sharpeRatio < parseFloat(filters.sharpe_ratio)) return false;
      
      return true;
    });

    // 映射到前端结构
    return filteredItems.map(item => ({
      code: item["证券代码"],
      name: item["证券名称"],
      year: Number(item["年份"]),
      annual_return: parseFloat(item["年涨跌幅"]),
      max_drawdown: parseFloat(item["最大回撤"]),
      pe_ratio: parseFloat(item["市盈率"]),
      pb_ratio: parseFloat(item["市净率"]),
      sharpe_ratio: parseFloat(item["夏普比率-普通收益率-日-一年定存利率"])
    }));

  } catch (error) {
    handleApiError(error, "fetchStocks");
    return [];
  }
}

/**
 * 获取单个股票的基本信息
 * @param {string} code - 股票代码
 * @param {string|number} year - 年份
 * @returns {Promise<StockItem|null>} 股票信息
 */
export async function fetchStockInfo(code, year) {
  try {
    const allItems = await apiRequest(`${API_BASE_URL}/stocks`);
    
    const stockInfo = allItems.find(item => 
      item["证券代码"] === code && 
      Number(item["年份"]) === Number(year)
    );
    
    if (!stockInfo) {
      console.warn(`Stock with code ${code} and year ${year} not found`);
      return null;
    }

    return {
      code: stockInfo["证券代码"],
      name: stockInfo["证券名称"],
      year: Number(stockInfo["年份"]),
      annual_return: parseFloat(stockInfo["年涨跌幅"]),
      max_drawdown: parseFloat(stockInfo["最大回撤"]),
      pe_ratio: parseFloat(stockInfo["市盈率"]),
      pb_ratio: parseFloat(stockInfo["市净率"]),
      sharpe_ratio: parseFloat(stockInfo["夏普比率-普通收益率-日-一年定存利率"])
    };

  } catch (error) {
    handleApiError(error, "fetchStockInfo");
    return null;
  }
}

/**
 * 获取股票K线数据
 * @param {string} code - 股票代码
 * @returns {Promise<{kline_data: KlineItem[]}}>} K线数据
 */
export async function fetchStockDetail(code) {
  try {
    const kline_data = await apiRequest(`${API_BASE_URL}/kline/${code}`);
    return { kline_data };
  } catch (error) {
    handleApiError(error, "fetchStockDetail");
    return { kline_data: [] };
  }
}

/**
 * 获取用户列表
 * @returns {Promise<Array>} 用户列表
 */
export async function fetchUsers() {
  try {
    return await apiRequest(`${API_BASE_URL}/users`);
  } catch (error) {
    handleApiError(error, "fetchUsers");
    return [];
  }
}

/**
 * 获取订单簿数据
 * @returns {Promise<OrderBookItem[]>} 订单簿列表
 */
export async function fetchOrderBook() {
  try {
    return await apiRequest(`${API_BASE_URL}/order_book`);
  } catch (error) {
    handleApiError(error, "fetchOrderBook");
    return [];
  }
}

/**
 * 发送聊天消息
 * @param {Object} params - 聊天参数
 * @param {string} params.message - 消息内容
 * @param {ChatMessage[]} params.history - 聊天历史
 * @param {string|null} params.stock_id - 股票ID
 * @param {string} params.endpoint - 聊天端点 ('stock' 或 'strategy')
 * @returns {Promise<string>} 响应消息
 */
export async function sendChat({ message, history = [], stock_id = null, endpoint = "stock" }) {
  try {
    const validEndpoints = ["stock", "strategy"];
    if (!validEndpoints.includes(endpoint)) {
      throw new Error(`Invalid endpoint: ${endpoint}. Must be one of: ${validEndpoints.join(", ")}`);
    }

    const data = await apiRequest(`${API_BASE_URL}/chat/${endpoint}`, {
      method: "POST",
      body: JSON.stringify({ message, history, stock_id })
    });
    
    return data.response;
  } catch (error) {
    handleApiError(error, "sendChat");
    return "Error sending message";
  }
}

/**
 * 发送流式聊天消息
 * @param {Object} params - 聊天参数
 * @param {string} params.message - 消息内容
 * @param {ChatMessage[]} params.history - 聊天历史
 * @param {string|null} params.stock_id - 股票ID
 * @param {string} params.endpoint - 聊天端点 ('stock' 或 'strategy')
 * @param {function} params.onChunk - 接收数据块的回调函数
 * @param {function} params.onError - 错误处理回调函数
 * @param {function} params.onComplete - 完成时的回调函数
 * @returns {Promise<void>}
 */
export async function sendChatStream({ message, history = [], stock_id = null, endpoint = "stock", onChunk, onError, onComplete }) {
  try {
    const validEndpoints = ["stock", "strategy"];
    if (!validEndpoints.includes(endpoint)) {
      throw new Error(`Invalid endpoint: ${endpoint}. Must be one of: ${validEndpoints.join(", ")}`);
    }

    const response = await fetch(`${API_BASE_URL}/chat/${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message, history, stock_id })
    });

    if (!response.ok || !response.body) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let partial = '';

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
            onComplete && onComplete();
            return;
          }
          onChunk && onChunk(data);
        }
      }
      partial = lines[lines.length - 1];
    }
    
    onComplete && onComplete();
  } catch (error) {
    console.error('Stream chat error:', error);
    onError && onError(error);
  }
}