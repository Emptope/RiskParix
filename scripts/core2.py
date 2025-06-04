import pandas as pd
import numpy as np

# Load daily K-line data
data = pd.read_csv('../data/day_klines/all_klines.csv')  # Replace with your file path
data['date'] = pd.to_datetime(data['date'])

# Group by stock and year
data['year'] = data['date'].dt.year
grouped = data.groupby(['code', 'year'])

# Function to calculate metrics
def calculate_metrics(group):
    # Sort by date
    group = group.sort_values('date')
    
    # Annualized return
    start_price = group['close'].iloc[0]
    end_price = group['close'].iloc[-1]
    annualized_return = (end_price / start_price) - 1
    
    # Daily returns
    group['daily_return'] = group['close'].pct_change()
    
    # Maximum drawdown
    cumulative = (1 + group['daily_return']).cumprod()
    max_drawdown = (cumulative / cumulative.cummax() - 1).min()
    
    # Sharpe ratio
    std_dev = group['daily_return'].std()
    if pd.isna(std_dev) or std_dev == 0:
        sharpe_ratio = 0  # Assign 0 if standard deviation is NaN or 0
    else:
        sharpe_ratio = group['daily_return'].mean() / std_dev

    return pd.Series({
        'annualized_return': annualized_return,
        'max_drawdown': max_drawdown,
        'sharpe_ratio': sharpe_ratio
    })

# Apply the function to each group
results = grouped.apply(calculate_metrics).reset_index()

# Save results to CSV
results.to_csv('stock_metrics.csv', index=False)