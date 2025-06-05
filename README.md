<div align="center">

# RiskParix

#### Trade with the risk.

</div>

## 整体架构

- **script/** 数据处理

- **desktop/** 桌面端
  - **chat.py** AI 聊天板块
  - **detail.py** 个股展示面板
  - **home.py** 主面板
  - **strategy.py** 策略选择面板

- **web/** 网页端

  - **backend/** 后端（FastAPI）
    - **api/**
      - **chat.py** ai 聊天接口
      - **deepseek.py** 接入 deepseek api
      - **kline.py** K 线数据 (all_klines.parquet)
      - **stocks.py** 个股详细数据 (details.parquet)
      - **users.py** 用户账本数据 (user_summary.parquet)
    - **app.py** 路由注册

  - **frontend/** 前端（React + Vite）
    - **src/**
      - **api/**
        - **api.js** 接口函数定义
      - **components/**
        - **AIChatAssistant.jsx** AI 聊天助手
        - **KLineChart.jsx** K 线图
        - **NavBar.jsx** 导航栏
        - **StockInfo.jsx** 个股卡片
        - **StockList.jsx** 个股列表
        - **TradingPanel.jsx** 交易面板
      - **context/**
        - **ThemeContext.jsx** 浅色/深色模式切换
      - **pages/**
        - **Detail.jsx** 个股详情页
        - **Home.jsx** 主页
        - **Strategy.jsx** 策略选择页面
        - **Trade.jsx** 交易页面
      - **App.jsx** 应用框架
      - **index.css** 全局 CSS
      - **main.jsx** 程序入口
    - **index.html**
    - **package.json** Node.js 包配置文件
    - **postcss.config.js** PostCSS 配置文件
    - **tailwind.config.js** Tailwind CSS 配置文件
    - **vite.config.js** Vite 配置

  - **start.bat** Windows 系统启动脚本
  - **start.sh** Shell 启动脚本

## Highlights

- 模块化设计：项目结构清晰，划分为 script/ 数据处理、desktop/ 桌面端、web/ 网页端，便于协作与维护

- 前端使用 React + Vite 构建：启动迅速、热更新流畅

- FastAPI 提供高效后端接口：使用 FastAPI 编写 api/ 接口，轻量、异步、快速响应

- 数据存储优化：使用 Parquet 格式存储 K线与账本数据，节省空间，读取快速

- TailwindCSS 快速样式开发：结合 PostCSS 与 Tailwind 配置，UI 开发灵活高效

## 快速上手

1. 将 data 文件夹放置于项目根目录以及 web/backend/ 目录下
2. `cd web/frontend` 切换到 frontend 目录，运行 `npm install` 安装 Nodejs 所需的包
3. `cd ../backend` 切换到 backend 目录，运行 `pip install -r requirements.txt` 安装 Python 所需的包
4. `cd ..` ，然后

- Windows
  - 桌面端：`cd desktop` ，在 desktop 目录下运行 `pip install -r requirements.txt` 然后运行 desktop/home.py
  - 网页端：Powershell 中输入`cd web`切换到 web 目录，然后输入 `.\start.bat` 运行，关闭新打开的终端停止运行
- MacOS / Linux
  - 桌面端：`cd desktop` ，在 desktop 目录下运行 `pip install -r requirements.txt` 然后运行 desktop/home.py
  - 网页端：在终端中输入 `cd web` 切换到 web 目录，输入 `chmod +x start.sh` 加上执行权限，最后输入 `./start.sh` 运行，按 `Ctrl-C` 停止运行