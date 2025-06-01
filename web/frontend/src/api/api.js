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

      if (!isNaN(annualReturn) && annualReturn < parseFloat(filters.annual_return || 0)) return false;
      if (!isNaN(maxDrawdown) && maxDrawdown > parseFloat(filters.max_drawdown || 100)) return false;
      if (!isNaN(peRatio) && peRatio > parseFloat(filters.pe_ratio || 100)) return false;
      if (!isNaN(pbRatio) && pbRatio > parseFloat(filters.pb_ratio || 10)) return false;
      if (!isNaN(sharpeRatio) && sharpeRatio < parseFloat(filters.sharpe_ratio || 0)) return false;
      
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
 * @returns {Promise<StockItem|null>} 股票信息
 */
export async function fetchStockInfo(code) {
  try {
    const allItems = await apiRequest(`${API_BASE_URL}/stocks`);
    
    const stockInfo = allItems.find(item => item["证券代码"] === code);
    
    if (!stockInfo) {
      console.warn(`Stock with code ${code} not found`);
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

// TypeScript类型定义（JSDoc格式）
/**
 * @typedef {Object} StockItem
 * @property {string} code - 股票代码
 * @property {string} name - 股票名称
 * @property {number} year - 年份
 * @property {number} annual_return - 年涨跌幅
 * @property {number} max_drawdown - 最大回撤
 * @property {number} pe_ratio - 市盈率
 * @property {number} pb_ratio - 市净率
 * @property {number} sharpe_ratio - 夏普比率
 */

/**
 * @typedef {Object} KlineItem
 * @property {string} date - 日期
 * @property {number} open - 开盘价
 * @property {number} close - 收盘价
 * @property {number} low - 最低价
 * @property {number} high - 最高价
 */

/**
 * @typedef {Object} ChatMessage
 * @property {'user'|'assistant'} role - 角色
 * @property {string} content - 内容
 */

/**
 * @typedef {Object} OrderBookItem
 * @property {string} time - 交易时间
 * @property {string} code - 股票代码
 * @property {string} price - 交易价格
 * @property {string} direction - 交易方向
 * @property {string} result - 交易结果
 */