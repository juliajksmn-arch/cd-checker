# 部署指南：上传到 GitHub 并在 Vercel 部署

按以下步骤将项目放到 GitHub，并在 Vercel 上部署与测试。

---

## 一、上传到 GitHub

### 方式 A：网页上传（无需安装 Git）

1. **在 GitHub 创建空仓库**
   - 打开 [GitHub](https://github.com) 并登录
   - 点击右上角 **+** → **New repository**
   - **Repository name** 填：`cd-checker`（或你喜欢的名字）
   - **Description** 可选：Discogs 专辑条形码查询
   - 选择 **Public**
   - **不要**勾选 “Add a README file”
   - 点击 **Create repository**

2. **上传项目文件**
   - 创建完成后，在仓库页面点击 **uploading an existing file**（或 **Add file** → **Upload files**）
   - 打开本机的 `c:\Users\ADMIN\Desktop\cd-checker` 文件夹
   - 选中该文件夹**里面的所有内容**（`app`、`public`、`.env.example`、`.gitignore`、`next.config.js`、`package.json`、`README.md`、`tsconfig.json`、`next-env.d.ts`、`DEPLOY.md` 等），**不要**选外层“cd-checker”文件夹本身
   - 把选中的这些文件和文件夹一起**拖拽**到浏览器里的上传区域（或点击 “choose your files” 多选）
   - 若以 `.` 开头的文件（如 `.env.example`、`.gitignore`）在资源管理器中看不到，可在“查看”里打开“隐藏的项目”，或直接在上传页用“选择文件”从 `cd-checker` 里选
   - 页面底部 **Commit message** 可填：`Initial commit`
   - 点击 **Commit changes**

3. **如需上传隐藏文件**
   - 若第一次没传 `.env.example`、`.gitignore`，可再点 **Add file** → **Upload files**，在 `cd-checker` 里选中这两个文件上传，保持仓库根目录有它们即可

完成后，仓库里应能看到 `app`、`public`、`package.json`、`README.md` 等，然后直接进行下面的 **二、在 Vercel 部署**。

**⚠️ 重要：验证上传是否成功**

上传后，在 GitHub 仓库页面确认以下结构存在：

```
你的仓库名/
├── app/                    ← 必须有这个文件夹！
│   ├── api/
│   │   ├── discogs/
│   │   └── upload/
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx
│   └── page.module.css
├── public/                  ← 必须有这个文件夹（可为空）
├── .env.example
├── .gitignore
├── next.config.js
├── package.json             ← 必须有这个文件！
├── README.md
├── tsconfig.json
└── DEPLOY.md
```

**如果看不到 `app` 文件夹**：说明上传时文件夹结构丢失了。需要重新上传：
1. 在 GitHub 仓库页面，点击 **Add file** → **Create new file**
2. 文件名填 `app/.gitkeep`（这会创建 `app` 文件夹）
3. 点击 **Commit new file**
4. 然后再次 **Add file** → **Upload files**，这次**只上传 `app` 文件夹里的所有内容**（`api`、`globals.css`、`layout.tsx` 等），拖到上传区域后，确保文件路径显示为 `app/xxx` 而不是直接是 `xxx`

---

### 方式 B：使用 Git 命令行（已安装 Git 时可用）

```bash
cd c:\Users\ADMIN\Desktop\cd-checker
git init
git add .
git commit -m "Initial commit: CD Checker with Discogs API"
```

在 GitHub 创建新仓库（名称如 `cd-checker`，不勾选 README），然后：

```bash
git remote add origin https://github.com/你的用户名/cd-checker.git
git branch -M main
git push -u origin main
```

---

## 二、在 Vercel 部署

### 1. 登录 Vercel

1. 打开 [Vercel](https://vercel.com)
2. 使用 **Continue with GitHub** 登录并授权

### 2. 导入项目

1. 点击 **Add New…** → **Project**
2. 在 **Import Git Repository** 里找到并选择 `cd-checker`（或你的仓库名）
3. 点击 **Import**

### 3. 配置环境变量

在 **Configure Project** 页面展开 **Environment Variables**，添加：

| Name | Value | 说明 |
|------|--------|------|
| `DISCOGS_TOKEN` | 你的 Discogs Personal Access Token | 必填，否则无法查专辑 |

获取 Token：

1. 打开 [Discogs Developer Settings](https://www.discogs.com/settings/developers)
2. 创建应用（或使用已有）
3. 生成 **Personal Access Token** 并复制到 Vercel

（可选）若要启用**图片上传并持久化**：

1. 在 Vercel 项目里进入 **Storage** 标签
2. **Create Database** → 选择 **Blob**
3. 创建后，Vercel 会自动为项目添加 `BLOB_READ_WRITE_TOKEN`
4. 重新部署一次（Deployments → 最新部署右侧 **…** → **Redeploy**）

### 4. 部署

1. 保持 **Framework Preset** 为 **Next.js**（一般会自动识别）
2. 点击 **Deploy**
3. 等待构建完成，会得到类似 `https://cd-checker-xxx.vercel.app` 的地址

### 5. 后续更新

- **若已安装 Git**：在项目目录执行 `git add .` → `git commit -m "描述"` → `git push`，Vercel 会自动重新部署。
- **若未安装 Git**：在 GitHub 仓库里点进要改的文件 → **Edit** 在线修改并 **Commit**；或再次用 **Add file** → **Upload files** 上传替换后的文件。保存后到 Vercel 的 **Deployments** 里可手动 **Redeploy** 一次以触发新构建。

---

## 三、本地与 Vercel 差异说明

| 项目 | 本地 | Vercel |
|------|------|--------|
| 条形码查询 | 需配置 `DISCOGS_TOKEN` | 同上，在 Vercel 环境变量中配置 |
| 图片上传 | 存到 `public/uploads/` | 配置 Blob 后存到 Vercel Blob；不配置则上传接口会走本地逻辑（在 Vercel 上会失败，建议配置 Blob） |

未配置 `BLOB_READ_WRITE_TOKEN` 时，在 Vercel 上上传会失败，但条形码查询和专辑展示不受影响。

---

## 四、常见问题

**Q: Vercel 部署报错 "Couldn't find any `pages` or `app` directory"**  
A: 这说明 GitHub 仓库中缺少 `app` 文件夹。解决方法：
1. 在 GitHub 仓库页面检查是否能看到 `app` 文件夹
2. 如果看不到，说明上传时文件夹结构丢失了
3. 重新上传：**Add file** → **Upload files**，这次**只选择 `app` 文件夹**（不是里面的文件），拖到上传区域
4. 确保上传后仓库根目录能看到 `app` 文件夹，点进去能看到 `api`、`layout.tsx`、`page.tsx` 等
5. 如果还是不行，可以尝试：先创建 `app` 文件夹（用 **Create new file** 创建 `app/.gitkeep`），然后再上传 `app` 里的文件

**Q: 部署后打开页面显示"未配置 DISCOGS_TOKEN"**  
A: 在 Vercel 项目 **Settings → Environment Variables** 里添加 `DISCOGS_TOKEN` 并重新部署。

**Q: 图片上传在 Vercel 上不工作**  
A: 在 Vercel 项目 **Storage** 中创建 **Blob**，让 Vercel 自动注入 `BLOB_READ_WRITE_TOKEN`，然后重新部署。

**Q: 想用自定义域名**  
A: 在 Vercel 项目 **Settings → Domains** 中添加你的域名并按提示配置 DNS。

**Q: 如何确认 GitHub 仓库结构正确？**  
A: 在 GitHub 仓库页面，应该能看到：
- 根目录有 `app`、`public`、`package.json` 等
- 点击 `app` 文件夹，应该能看到 `api`、`layout.tsx`、`page.tsx` 等
- 点击 `app/api`，应该能看到 `discogs` 和 `upload` 两个文件夹
