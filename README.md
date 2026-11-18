# 中洲志 · Atlas of Middle-earth

一份把「魔戒中文维基」整理成可检索、可漫游的静态站点：5,303 个条目、10,063 条有出处的关系、1,519 张插图，
以及一个真正连着数据的知识图谱。

> 个人非商业项目。条目文字与图片版权归魔戒中文维基贡献者与原作者所有。

---

## 这个站点做了什么

| 能力 | 说明 |
| --- | --- |
| 百科浏览 | 5,303 个条目，按 17 种实体类型与 5 个纪元筛选，支持中文名、英文名、别名搜索，筛选状态写进 URL |
| 实体详情 | 信息框结构化事实、正文、双向关联、时间信息、来源链接、1 跳关系小图 |
| 关系图谱 | Cytoscape 力导向图，类型/关系筛选、1–3 跳展开、固定节点、全屏、分享链接、两点最短连接 |
| 时代年表 | 按纪元分轴（双树 / 第一 / 第二 / 第三 / 第四），年份分组，附年份索引与代表人物 |
| 地理浏览 | 没有可靠坐标，因此用「地区 → 地点」层级替代地图，明确标注不伪造地理 |
| 数据说明 | 来源、覆盖率、结构化方法、数据质量报告、已知缺失、图片署名 |

## 线上地址

- 生产环境：**https://atlas-of-middle-earth.vercel.app**
- Vercel 项目：`pamus/atlas-of-middle-earth`（Framework: Astro，Build: `npm run build`，Output: `dist`）
- 环境变量：`SITE_URL=https://atlas-of-middle-earth.vercel.app`（生产环境，用于 canonical / sitemap）
## 技术栈

- **Astro 7** 静态生成，`output: static`，无 SSR、无 API、无数据库连接
- **React 19** 交互岛：搜索、筛选、图谱
- **Cytoscape.js** 关系图谱，按需动态加载
- **TypeScript** + 原生 CSS（设计变量，无 UI 框架）
- 构建产物：`dist/`，可直接托管到 Vercel / Netlify / GitHub Pages

## 本地运行

要求 Node 20+（开发环境使用 Node 24）。

```bash
npm install          # 或 pnpm install
npm run dev          # http://localhost:4321
npm run build        # 生成 dist/
npm run preview      # 预览构建产物
```

## 部署到 Vercel

在 Vercel 导入仓库后填写：

| 配置项 | 值 |
| --- | --- |
| Framework Preset | Astro |
| Root Directory | `.`（仓库根目录） |
| Install Command | `npm install` |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Node Version | 20.x 或 22.x |
| 环境变量 | 无需配置；可选 `SITE_URL`（如 `https://your-domain.com`）用于生成 canonical 与 sitemap 的绝对地址 |

`SITE_URL` 不填时，构建会使用占位域名 `https://atlas-of-middle-earth.example`，不会假装成某个真实站点。
若之后绑定自定义域名，请在 Vercel 里加上 `SITE_URL` 重新构建一次，sitemap 与分享链接才会指向正式域名。

## 数据管线

原始数据来自魔戒中文维基（MediaWiki API，渲染后 HTML），已经整理成本地 Markdown 知识库。
站点数据由脚本从该知识库重新生成，**原始数据不被修改**：

```
知识库（条目/*.md + 图片/*.webp）
        │  scripts/build-data.mjs
        ▼
src/data/entities.json     5,303 个实体（类型、别名、摘要、信息框事实）
src/data/relations.json    10,063 条关系（含出处字段）
src/data/bodies/*.html     5,303 段正文
public/data/graph.json     图谱载荷（2,110 节点 / 8,716 边）
public/data/search.json    搜索索引
        │  astro build
        ▼
dist/                      5,328 个静态页面
```

常用命令：

```bash
node scripts/build-data.mjs      # 重新生成站点数据（需先准备知识库路径）
python scripts/optimize-images.py # 图片转 WebP（720px 宽，82.7MB → 31.3MB）
node scripts/serve.mjs           # 本地静态预览 dist/
node scripts/shot.mjs            # 用 CDP 驱动 Edge 截图（见 screenshots/）
```

### 关系是怎么来的

维基信息框是「字段 → 值」两列表，值里通常带指向其他条目的链接。脚本只保留
「字段名能映射到明确关系类型 + 值里含现存条目链接」的行，所以每条关系都带着出处（如 `信息框 · 父亲`）。

正文里的超链接**不会**被当作事实关系，只统计为「被引用次数」用于排序——
「某段文字提到过某人」不等于「两人存在设定关系」。

### 数据校验

`scripts/build-data.mjs` 在生成时会统计并写入 `src/data/stats.json`：

- 实体数、类型分布、关系数、关系类型分布
- 缺图条目数、缺摘要数、缺原始链接数
- 失效关系（端点不存在）、重复标题、引用但缺失的图片文件

这些数字会直接渲染在 `/about` 的数据质量报告里，不在页面里手写。

## 目录结构

```
.
├─ src/
│  ├─ components/     Header、Footer、EntityCard、QuickSearch、BrowseApp、GraphApp、MiniGraph
│  ├─ data/           构建产物（entities / relations / stats / bodies）
│  ├─ layouts/        Base.astro（SEO、OG、JSON-LD）
│  ├─ lib/            types.ts（类型元数据）、relations.ts、regions.ts、entryData.ts
│  ├─ pages/          index / browse / graph / timeline / atlas / about / entry/[slug]
│  └─ styles/         global.css（设计变量）、pages.css（页面级样式）
├─ public/
│  ├─ images/         1,519 张 WebP 插图
│  ├─ data/           graph.json、search.json、home-graph.json
│  ├─ favicon.svg
│  └─ robots.txt
├─ scripts/           数据管线、图片优化、预览服务、截图
├─ screenshots/       桌面 / 平板 / 手机实拍
└─ docs/              数据质量报告
```

## 设计说明

视觉遵循参考图的 **Organic Biophilic** 语言，并落成可复用的规则（`src/styles/global.css` 的 CSS 变量）：

- **画布**：浅苔白 `#ECF1E5` 打底，叠加两层低饱和径向渐变（右上米色、右下鼠尾草绿）与极淡纸纹，让页面像有自然光的纸面。
- **卡片**：所有内容块是浮在画布上的白色圆角卡片（22–34px 圆角、柔和多层阴影），没有硬边框；信息层级靠"卡片 + 留白"而不是分割线。
- **主色**：深林绿 `#4F7A34` 作强调、植物绿 `#6E8A4E` 作辅助、鼠尾草 `#B9C8A4` 做浅底、米沙 `#E7D5BE` 做暖色块；文字近黑绿 `#14251A`。
- **排版**：超大号粗黑无衬线标题（`clamp(3rem, 6.4vw, 5.4rem)`，字距 −0.04em），小号全大写宽字距标签（eyebrow / 元信息），正文 0.95–1.06rem。
- **首页主视觉**：左侧是眉标、巨型标题、正文与胶囊入口；右侧是一张浮起的白卡，内部左为有机色块 + 椭圆裁切的人物图，右为堆叠的数据块（条目 / 关系 / 纪元），对应参考图的 "PRIMARY MOVE / SURFACE BEHAVIOR / VISUAL SIGNATURE" 结构。
- **组件语言**：胶囊按钮与筛选 chip、圆点类型标识、方形图标的类型入口、悬浮卡片列表。
- **动效**：只在 hover 抬升与图谱布局时出现，全部被 `prefers-reduced-motion` 关闭。
## 已知限制

- 没有可信坐标，所以**没有地图**；地理页是分类层级，不是示意图伪装的真实地图。
- 3,784 个条目原站就没有插图，使用统一占位，不使用 AI 生成的假肖像。
- 事件多数只有年份，缺少月日；不同纪元年份不可直接比较，故分轴展示。
- 实体类型由章节与分类关键词自动判定，个别条目可能落在相邻类型。
- 原站个别条目存在 Lua 报错、未填模板参数或断链，站点如实保留。

完整清单见 `/about#limits` 与 `docs/data-quality.md`。
