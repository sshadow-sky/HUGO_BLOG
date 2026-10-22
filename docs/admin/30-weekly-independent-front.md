# 周报独立前台验证（2026-10-06）

本记录仅覆盖前台、本地内容和隔离构建；后台、真实远端迁移与浏览器集成由主任务记录。

## 内容与展示边界

- 周报根目录改为 `content/weekly`，栏目为 `/weekly/`；导航颜色选择器和详情返回/RSS入口同步更新。
- 首页第一分页展示独立「最新周报」，使用紧凑横向推荐卡；独立周报栏目保留完整交互卡片。普通文章流、文章列表、归档、文章 RSS、分类/标签及文章计数只纳入普通文章与原有画板；残留 `posts/weekly/**` 也被排除。
- 分类/标签元信息仍保留在周报文件及详情中，以普通文字展示，不引导到文章筛选页。全站搜索包含周报并显示「周报」标识，排除草稿和未迁移旧路径。
- 独立 `/weekly/index.xml` 订阅，详情保留公式、评论、灯箱、阅读信息、版权与签名样式。首页分页读取首页设置，周报分页继续遵循周报自己的配置。

## 兼容契约

- 迁移页 `aliases` 保存原 `/posts/weekly/.../` 地址，由 Hugo 生成跳转页。
- `comment_path` 保存原页面路径，如 `/posts/weekly/2026-10-03-003100/`。模板写入 `data-comment-path`，Twikoo/Waline 与隐藏访客挂载均读取它，并沿用现有去尾斜线规范。新页未设置时采用当前地址。
- `weekly_previous_path` 保存原内容路径，如 `content/posts/weekly/2026-10-03-003100/index.md`，供后台历史和本地草稿兼容使用。栏目 `_index.md` 不设置该字段。
- 旧 HTML 页面地址有别名兼容；旧 `/posts/weekly/index.xml` 由首页专用输出格式动态生成，与新订阅使用相同周报集合和RSS partial，规范 self 均指向 `/weekly/index.xml`。不恢复旧内容目录，也不保存静态过期订阅副本。

## 本地迁移与回退

- 迁移前确认源/目标绝对路径在 `D:/new_blog/HUGO_BLOG` 内且目标不存在；完整目录移动，没有删除用户正文或媒体。
- 真实内容只有栏目 `_index.md`；1314 独立副本包含栏目和14篇周报（包括保留草稿），共16个 Markdown 文件迁移。
- 专项备份：`.local/weekly-independent/local-content-before.zip`；全工作区先前备份：`.local/weekly-independent/before.zip`。
- `.local/weekly-independent/local-content-manifest.json` 记录旧/新路径、草稿状态、最终 SHA-256。已逐文件与 ZIP 核对正文和 draft 状态不变，仅更新栏目 type/兼容元数据。
- 不启停本地服务、不编辑后台、不提交推送。1314 原 `contentDir` 参数不变，重启后读取迁移后的目录。

## 实际验收

- 先写 `scripts/tests/weekly-independent.test.mjs`，首次真实 Hugo fixture 构建后5组验收全部因缺失功能而失败；实现后全部通过。
- `D:/node.exe --test scripts/tests/*.test.mjs`：14项通过，包括6组独立前台构建验收、Twikoo/Waline旧评论路径与下一页切换、现有卡片交互及RSS来源测试。
- `D:/node.exe .local/weekly-preview/check-load-more.mjs`：DOMContentLoaded/load重入、唯一卡片、PJAX清理与新挂载、普通分页回归通过。
- Hugo正式构建：33页、3 aliases；确认空周报状态、首页入口、旧栏目HTML跳转及零条周报RSS。
- Hugo使用 `.local/weekly-preview/content` 与现有配置的草稿构建：56页、4分页、17 aliases。
- 构建产物分别位于 `.local/weekly-independent/production` 和 `.local/weekly-independent/preview`。所有测试/构建均为本地，不代表部署。
- 精确生产文件清单 `.local/weekly-independent/frontend-sync-files.json` 以 a9b5fda 为参考，包含当前卡片样式与脚本依赖，排除无关友链模板；远端配置与内容应基于其固定 SHA 窄改，不整体上传脏工作区。

浏览器外观、真实评论读取与后台保存闭环须由主任务继续验收；本记录不声称其已完成。

- 旧RSS兼容追加验收：先确认旧地址缺失（RED），再实现首页 LegacyWeeklyRSS 输出；实际Hugo产物验证新旧feed全部item完全一致、图片绝对地址一致、规范self地址正确，并继续排除草稿和普通文章。

## 首页展示收紧（2026-10-06）

- 用户确认：首页最新周报改为小封面、期号、标题、日期和简短摘要，移除首页导读与大装饰，减少对原文章区的挤压。独立栏目保持已有左右排版、蕾丝边与交互。
- 首页卡片采用独立模板与样式；宽度与文章外层共享响应式规则，随单栏、双栏和侧栏布局变化。手机保留横排，隐藏类型标签与装饰箭头，摘要只显示一行。支持深色、键盘焦点和减少动画偏好。
- 验证：真实 Hugo fixture 的 6 项隔离测试通过；浏览器在 1440、1280、1024、768、390、320px 的深浅主题下检查对齐、卡片高度和溢出，并确认普通文章流无周报、周报栏目保留完整导读，共 14 项通过。桌面及手机截图人工检查通过。
- 调整前的三个源码备份位于 Hugo `.local/home-weekly-compact/`；浏览器结果与截图位于后台 `.local/home-weekly-compact/`。本轮只修改本地展示与记录，未改内容、提交、推送或部署。

### 与文章推荐区统一样式（同日后续）

- 根据用户反馈进一步统一「最新周报」与「要去这些文章看看吗」：同款主题粉色标题、1rem 字号、线条图标；期号改中文淡粉标签，去掉青色装饰箭头。卡片采用相同的 14px 圆角、边框、贴边封面与悬停轻移效果。
- 最新周报收进文章推荐的中间栏，替代上一轮横跨侧栏的宽度。桌面预留侧栏轨道和内边距，手机全宽；首页周报仍位于普通文章流之外，数据与独立栏目样式不变。
- 6 项真实 Hugo 构建验收通过；6 种屏宽各深浅主题的 12 组浏览器检查通过，核验卡片与推荐区边缘对齐、标题颜色字号相同、无溢出及文章流隔离。桌面/手机截图已人工核对，键盘焦点框与减少动画偏好检查通过。
- 本轮备份为 Hugo `.local/home-weekly-harmony/`；截图与浏览器检查为后台同名目录。未修改内容或推送部署。
