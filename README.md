# CD Checker

从 Discogs 查询 CD 专辑信息、Matrix 编码与 SID 码。

## 技术栈

- **后端**：Python + Flask
- **前端**：原生 HTML / CSS / JavaScript
- **API**：Discogs REST API

## 快速开始

### 1. 安装依赖

```bash
pip install -r requirements.txt
```

### 2. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env`，填入你的 Discogs Personal Access Token：

```
DISCOGS_TOKEN=your_token_here
```

获取 Token：打开 [Discogs Developer Settings](https://www.discogs.com/settings/developers)，创建或使用已有应用，生成 Personal Access Token。

### 3. 启动服务

```bash
python app.py
```

打开浏览器访问 `http://localhost:5000`

## 云端运行（GitHub Codespaces / Replit / Railway 等）

任何支持 Python 的云平台均可运行，无需构建步骤：

```bash
pip install -r requirements.txt
python app.py
```

- **GitHub Codespaces**：打开仓库 → Code → Codespaces → New，终端运行上述命令，浏览器会自动转发端口
- **Replit**：Import from GitHub，运行 `python app.py`
- **Railway**：连接 GitHub 仓库，自动识别 `requirements.txt` 并部署

## 功能

- 输入条形码查询 Discogs 专辑数据库
- 按国家/地区筛选结果
- 点击专辑卡片查看详情（封面大图、Matrix / Outer SID / Inner SID 编码）
- 支持图片上传（本地存储至 `static/uploads/`）
- 拖拽上传支持

## 项目结构

```
cd-checker/
├── app.py               ← Flask 后端
├── requirements.txt     ← Python 依赖
├── .env.example         ← 环境变量示例
├── templates/
│   └── index.html       ← 页面模板
└── static/
    ├── style.css        ← 样式
    ├── app.js           ← 前端逻辑
    └── uploads/         ← 上传图片（自动创建）
```
