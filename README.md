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

## 部署到 Vercel (推荐)

本项目已优化，可一键部署至 Vercel：

1.  **连接 GitHub**：在 Vercel 中导入此仓库。
2.  **设置环境变量**：在 Vercel Project Settings -> Environment Variables 中添加：
    - `DISCOGS_TOKEN`: 你的 Discogs 令牌。
    - `DISCOGS_USER_AGENT` (可选): 你的 User Agent。
3.  **部署**：Vercel 会自动根据 `vercel.json` 和 `requirements.txt` 完成构建。

> [!NOTE]
> 在 Vercel 等 Serverless 环境中，上传的图片将存储在 `/tmp` 目录。由于 Serverless 的特性，这些文件是**临时**的，在实例重启后会丢失。如需持久化存储，建议接入 S3 或 OSS。

## 云端运行（GitHub Codespaces / Replit / Railway 等）

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
