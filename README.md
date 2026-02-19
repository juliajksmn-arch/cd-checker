# CD Checker - Discogs 专辑查询工具

一个基于 Next.js 的 Web 应用，可以通过上传封面图片或输入条形码来查询 Discogs 数据库中的专辑信息。

## 功能特性

- 📸 **图片上传**：支持拖拽或点击上传专辑封面图片
- 🔢 **条形码查询**：输入条形码快速搜索专辑
- 🎵 **Discogs API 集成**：调用 Discogs API 获取详细的专辑信息
- 📋 **详细信息展示**：显示专辑标题、艺术家、年份、格式、厂牌、流派、曲目列表等

## 技术栈

- **Next.js 14** (App Router)
- **React 18**
- **TypeScript**
- **CSS Modules**

## 安装与运行

### 1. 安装依赖

```bash
npm install
```

### 2. 配置 Discogs API

1. 访问 [Discogs Developer Settings](https://www.discogs.com/settings/developers)
2. 创建一个新的应用
3. 获取 Personal Access Token
4. 复制 `.env.example` 为 `.env.local`：

```bash
cp .env.example .env.local
```

5. 在 `.env.local` 中填入你的 Discogs Token：

```
DISCOGS_TOKEN=your_discogs_personal_access_token
```

### 3. 运行开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

### 4. 构建生产版本

```bash
npm run build
npm start
```

## 使用说明

1. **上传图片**：将专辑封面图片拖拽到上传区域，或点击选择文件
2. **输入条形码**：在输入框中输入专辑的条形码（例如：`5012394144777`）
3. **查询**：点击"查询"按钮或按 Enter 键
4. **查看结果**：浏览搜索结果，点击任意专辑卡片查看详细信息
5. **查看详情**：在详情页面可以看到完整的专辑信息，包括曲目列表

## 项目结构

```
cd-checker/
├── app/
│   ├── api/
│   │   ├── discogs/      # Discogs API 代理路由
│   │   └── upload/        # 图片上传 API 路由
│   ├── globals.css        # 全局样式
│   ├── layout.tsx         # 根布局
│   ├── page.tsx           # 主页面组件
│   └── page.module.css    # 页面样式
├── public/
│   └── uploads/           # 上传的图片存储目录（自动创建）
├── .env.example           # 环境变量示例
├── next.config.js         # Next.js 配置
└── package.json           # 项目依赖
```

## API 说明

### Discogs API

应用通过 `/api/discogs` 路由代理 Discogs API 请求：

- `GET /api/discogs?barcode={barcode}` - 通过条形码搜索专辑
- `GET /api/discogs?releaseId={id}` - 获取专辑详细信息

### 图片上传 API

- `POST /api/upload` - 上传图片文件，返回文件 URL

## 注意事项

- Discogs API 有速率限制：认证请求每分钟 60 次，未认证请求每分钟 25 次
- 上传的图片存储在 `public/uploads/` 目录中
- 请遵守 [Discogs API 使用条款](https://support.discogs.com/hc/articles/360009334593-API-Terms-of-Use)

## 部署到 GitHub + Vercel

详细步骤见 **[DEPLOY.md](./DEPLOY.md)**，包括：

- 如何把项目推送到 GitHub
- 如何在 Vercel 上导入项目并配置环境变量（`DISCOGS_TOKEN`、可选 `BLOB_READ_WRITE_TOKEN`）
- 部署后如何更新

## 许可证

MIT
