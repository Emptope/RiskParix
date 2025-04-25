document.addEventListener('DOMContentLoaded', () => {
    const stockTableBody = document.getElementById('stockTableBody');
    const sortMetricSelect = document.getElementById('sortMetric');
    const applyFiltersButton = document.getElementById('applyFilters');
    const stockCountElement = document.getElementById('stockCount');

    let stockData = [];

    // --- Data Fetching ---
    async function fetchData() {
        stockTableBody.innerHTML = `
            <tr>
                <td colspan="5" class="px-6 py-8 text-center">
                    <div class="flex items-center justify-center">
                        <svg class="animate-spin h-5 w-5 mr-3 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>正在加载股票数据...</span>
                    </div>
                </td>
            </tr>
        `;

        try {
            const response = await fetch('/api/stock_data');
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || '获取数据失败');
            }
            
            stockData = await response.json();
            
            if (!stockData || stockData.length === 0) {
                showEmptyState();
                return;
            }
            
            applySorting();
            
        } catch (error) {
            showErrorState(error.message);
            console.error("数据加载错误:", error);
        }
    }

    // --- Sorting Logic ---
    function applySorting() {
        const metric = sortMetricSelect.value;
        let sortedData = [...stockData];
        
        sortedData.sort((a, b) => {
            // 处理可能缺失的值
            const valueA = a[metric] ?? (metric === 'max_drawdown' ? Infinity : -Infinity);
            const valueB = b[metric] ?? (metric === 'max_drawdown' ? Infinity : -Infinity);
            
            // 最大回撤应该从小到大排序(越小越好)，其他从大到小
            if (metric === 'max_drawdown') {
                return valueA - valueB;
            }
            return valueB - valueA;
        });
        
        renderTable(sortedData);
    }

    // --- Rendering Logic ---
    function renderTable(data) {
        stockTableBody.innerHTML = '';
        stockCountElement.textContent = data.length;
        
        if (data.length === 0) {
            showEmptyState();
            return;
        }
        
        data.forEach(stock => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50 transition-colors';
            
            const annualReturn = (stock.annual_return * 100).toFixed(2);
            const maxDrawdown = (stock.max_drawdown * 100).toFixed(2);
            const sharpe = stock.sharpe.toFixed(2);
            
            // 信号强度计算
            const signalStrength = stock.buy_signal_strength ?? stock.sharpe;
            let signalText, signalClass;
            
            if (signalStrength > 1.5) {
                signalText = "强烈买入 ▲▲";
                signalClass = "buy-signal";
            } else if (signalStrength > 0.5) {
                signalText = "买入 ▲";
                signalClass = "buy-signal";
            } else if (signalStrength > -0.5) {
                signalText = "持有 ●";
                signalClass = "hold-signal";
            } else {
                signalText = "卖出 ▼";
                signalClass = "sell-signal";
            }
            
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="text-sm font-medium text-gray-900 font-mono">${stock.code}</div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm ${parseFloat(annualReturn) >= 0 ? 'text-green-600' : 'text-red-600'}">
                        ${annualReturn}%
                        ${parseFloat(annualReturn) >= 0 ? '↑' : '↓'}
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm ${parseFloat(maxDrawdown) <= -15 ? 'text-red-600' : 'text-amber-600'}">
                        ${maxDrawdown}%
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm ${parseFloat(sharpe) > 1 ? 'text-green-600' : (parseFloat(sharpe) > 0 ? 'text-blue-600' : 'text-red-600')}">
                        ${sharpe}
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm ${signalClass} px-2 py-1 rounded-full text-center">
                        ${signalText}
                        <span class="text-xs opacity-75 ml-1">${signalStrength.toFixed(2)}</span>
                    </div>
                </td>
            `;
            
            stockTableBody.appendChild(row);
        });
    }

    // --- Helper Functions ---
    function showEmptyState() {
        stockTableBody.innerHTML = `
            <tr>
                <td colspan="5" class="px-6 py-8 text-center text-sm text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p class="mt-2">没有找到股票数据</p>
                </td>
            </tr>
        `;
        stockCountElement.textContent = '0';
    }
    
    function showErrorState(message) {
        stockTableBody.innerHTML = `
            <tr>
                <td colspan="5" class="px-6 py-8 text-center text-sm text-red-500">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p class="mt-2 font-medium">数据加载失败</p>
                    <p class="mt-1 text-xs">${message}</p>
                </td>
            </tr>
        `;
        stockCountElement.textContent = '0';
    }

    // --- Event Listeners ---
    sortMetricSelect.addEventListener('change', applySorting);
    applyFiltersButton.addEventListener('click', applySorting);

    // --- Initial Load ---
    fetchData();
});