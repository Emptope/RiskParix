<div align="center">

# RiskParix

#### Trade with the risk.

</div>

# 整体架构

- **script/** 处理数据
- **desktop/** 应用面板
  - **chat.py** ai 聊天板块
  - **detail.py** 个股展示面板
  - **home.py** 主面板
  - **strategy.py** 策略选择面板
- **web/** 网页
  - **backend/** 后端 FastAPI
    - **api/**
      - **chat.py** ai 聊天接口
      - **deepseek.py** 接入 deepseek api
      - **kline.py** K 线数据 (all_klines.parquet)
      - **stocks.py** 个股详细数据 (details.parquet)
      - **users.py** 用户账本数据 (user_summary.parquet)
    - **app.py** 路由注册
  - **frontend/** 前端 React + Vite
    - **src/** 
      - **api/**
        - **api.js** 接口函数定义
      - **components/**
        - **NavBar.jsx** 导航栏
      - **context/**
        - **ThemeContext.jsx** 浅色深色模式切换
      - **pages/**
        - **Detail.jsx** 个股详情页
        - **Home.jsx** 主页
        - **Strategy.jsx** 策略选择页面
      - **App.jsx** App 框架
      - **index.css** 全局 CSS
      - **main.jsx** 全局框架
    - **index.html**
    - **package.json** nodejs 包配置文件
    - **postcss.config.js** postcss 配置文件
    - **tailwind.config.js** tailwindcss 配置文件
    - **vite.config.js** vite 配置文件
  - **start.bat** Windows 系统启动脚本
  - **start.sh** Shell 启动脚本