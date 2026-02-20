# CD Checker 改进方案与开发实施指南 (Codespace 专用)

本实施指南旨在用于 Github Codespace 或其他 AI 代码生成工具中作为 Prompt 依据，按此文档逐步对现有的 CD Checker 程序进行功能升级。

## 目标与改版思路
当前程序仅能查询 Discogs 文本信息，且上传图片完全无用。
本次优化的核心逻辑是提供极简入囗，将重心完全转移到**辅助用户进行实体 CD 真伪鉴定（人工比对）**。

1. **入口二选一**：UI 初始界面仅提供明确的两种选择：“利用条形码图片识别” 或 “手动输入下方的一串数字”。
2. **正版对照展示**：查询结果划分为【正版 CD 鉴别图集预留区】（显示 Discogs 上的官方实物正版图片）和【正版编码特征区】（高亮展示提取的所有版本 Matrix 母版编码与解析过产地的 IFPI SID 码）。
3. **本地静态 IFPI 数据支持**：在后端程序直接内置一份爬取自 Wiki 的压片厂数据 json，当 Discogs 数据里有 SID 码时，直接从该 json 查询具体对应的工厂名称返回给前端。

---

## Architecture (系统流程)

```mermaid
graph TD
    A[前端: 识别入口] --> B{用户操作选择}
    B -->|方式1: 手动输入条码数字| C[Barcode Number]
    B -->|方式2: 上传/拍摄条码图片| D[调用 Backend: /api/upload 解析条码]
    D -->|使用 pyzbar 解析条码图片| C
    
    C -->|GET /api/discogs?barcode=...| F(后端 Discogs 查询服务)
    
    F -->|查询专辑发行版本| G[(Discogs API)]
    G -->|返回| H[基础信息, Identifiers(包含Matrix/SID), Images(实物图片)]

    H --> I(后端装配验证数据)
    J[(本地 ifpi_db.json)] -->|匹配 SID 前缀翻译厂家与国家| I
    
    I -->|返回展示数据 JSON| K[前端页面重组UI]
    
    K --> L[鉴别特征区: Matrix 排版, IFPI 工厂来源]
    K --> M[图鉴区: 正版光盘图/封面盘底缩略图]
    L --> N(用户手持实体 CD 执行人工肉眼比对)
    M --> N
```

---

## 阶段执行任务列表 (Phase Task List)

请按照下列步骤，按顺序在代码中逐步实现。

### 第一步：构建本地 IFPI 静态数据库
我们需要将维基百科上的 IFPI 厂牌代号数据整理成一个本地字典。
1. **新建脚本**：创建 `scripts/scraper_ifpi.py`。
   - 使用 Python 的 `urllib` 与正则表达式或 `BeautifulSoup` 从 `http://wiki.musik-sammler.de/index.php?title=Herstellungsland_(CDs_/_DVDs)` 抓取表格。
   - 提取规则代码（Code，如 `01**` 则提取 `01`），Presswerk（压片厂/制作方），以及 Land（国家）。
2. **生成 JSON**：抓取后，将字典数据写入为文件 `data/ifpi_db.json`。格式形如：
   ```json
   {
      "01": {"factory": "Universal M & L", "country": "Deutschland"},
      "12": {"factory": "MPO", "country": "Frankreich"}
   }
   ```

### 第二步：后端应用改造之图像扫码 (app.py & requirements)
需要修改原有的图片上传端点，将其改造为条形码识别工具。
1. **安装依赖**：在工程入口的 `requirements.txt` 中添加 `pyzbar` 和 `Pillow`。
2. **编写逻辑**：新建 `utils/barcode.py`（如果需要拆分）或直接在 `app.py` 中重构 `@app.route('/api/upload', methods=['POST'])` 接口。
   - 接收图片后，使用 `Image.open(file)` 载入，传入 `pyzbar.decode(image)`。
   - 如果成功，提取并返回一维条形码的纯数字，如 `{"barcode": "501239... "}`。
   - 如果失败或未检测到条形码，返回明确的 400 错误：`{"error": "未能从图片中正确识别条形码，请尝试手动输入"}`。不再保存图片至服务器。

### 第三步：后端应用改造之 Discogs 数据装配 (app.py)
需要在向前端响应之前，进行 IFPI 数据的映射翻译。
1. **加载字典**：在 `app.py` 启动或顶部位置，载入 `data/ifpi_db.json` 到内存变量 `IFPI_DB`。
2. **拦截并翻译**：在原有的 Discogs 查询逻辑（返回 Releases 之前），做如下数据加工：
   - 遍历每个 version/release 下的 `identifiers` 列表。
   - 若类型为 `Matrix / Runout`、`Mastering SID Code` 或 `Mould SID Code` 时予以保留并将其置于优先位。
   - 如果包含 IFPI 字眼（例如 `IFPI 8211`），去除 "IFPI " 等前缀，根据其前两个字符/特定机制去 `IFPI_DB` 搜索。若命中，则在该 identifier 的返回值中插入 `factory_info: "XXX, Germany"`。

### 第四步：前端 UI 与交互全面替换 (index.html & style.css)
重构前端页面，使其看起来像一个专业的“正版 CD 鉴定仪”。
1. **重构输入区**：
   - 删除原有的单纯“上传预览清空”组件。
   - 并排放置两个大按钮或卡片：**【扫码识别反面条形码】** (调用 file input 发送接口) vs **【手动键入条码数字】**。
   - 扫码接口一旦返回成功，自动将数字填入输入框，并**自动触发**后端查询查询。
2. **重构结果展现区**：
   - 添加一句显著提示：“鉴定指南：请对比手中的 CD 内侧圈与下方正版数据的 Matrix 排版和 IFPI 码是否一致。”
   - 划分出 **【真伪鉴定参考图区】**：如果 Discogs 该版本对象中存在 `images` 数组，则抽取前几张（最好是标注了 CD、Disc、Back 的照片）呈现出来，供参照排版与色差。
   - 划分出 **【正版编码特征区】**：将其以数据表格 (Table) 形式罗列。将所有的 Matrix 排版样式、带有翻译说明的 IFPI 发行工厂明确、高亮地展示给用户。
   - 删除原有的无关痛痒的其它多余文本信息展示以降低阅读噪音。
