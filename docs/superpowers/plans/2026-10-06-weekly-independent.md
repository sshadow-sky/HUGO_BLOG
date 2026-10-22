# 周报完整独立实施计划

用户已确认完整独立方案；首页保留单独「最新周报」区，普通文章流排除周报。沿用当前 best 工作目录和已有未提交改动，以 .local/weekly-independent/before.zip 保存本轮前快照，不另开缺少现有改动的工作树。

## 设计边界

- Hugo 内容根：文章 content/posts，周报 content/weekly；周报 /weekly/，已有 /posts/weekly/ 链接兼容。
- CMS 集合 posts / weekly 各自管理；文章集合不列出也不能通过 posts 写入周报。素材、可视编辑、SHA 保存保护、本地草稿、历史恢复复用。
- 新栏目沿用已认可卡片样式。首页最新周报独立区域；文章列表/归档/统计/分类标签范围排除周报；全站搜索可同时查两者，周报有独立 RSS。
- 原周报内容/草稿状态、媒体保持。迁移旧页保留评论标识和旧链接；历史查询须支持明确的旧路径入口，不虚构 Git 跟随改名能力。本地草稿在旧路径仍有记录时提供迁移保护，不静默丢弃。
- 本轮先实现本地代码、可复核的迁移工具和预览。真实 GitHub 迁移仅针对周报与所需配置，固定读到的 SHA 后原子提交，不将整个脏工作树推送。若正常授权不可用则记录具体阻碍并保留可运行本地展示。

## 步骤与验收

- [x] 前台独立：themes/aiovtue/layouts 的 weekly 识别、列表、详情共用能力、首页区域、标签/搜索/RSS；hugo.toml 导航和 content 栏目迁移。隔离 fixture 构建验证普通页/周报页、旧链接、评论、RSS、数学公式和分类边界。
- [x] 后台独立：lib/weekly-content、site-weekly-config、内容策略、collections/entries/files 路由、编辑器与周报工作台；独立 schema、列表、新建和保存；测试合法/越界路径、空栏目、未知字段保留、周报 issue 校验及普通文章回归。
- [x] 关联兼容：article-history、preview/version、迁移清单/备份和本地草稿路径；支持新周报路径，迁移前旧路径有显式入口；旧记录不可错归其他文章。
- [x] 数据与运行：迁移本地 1314 fixture 的周报，启动 localhost；验证真实 CMS 授权状态及远端内容，按原子迁移方案衔接（有阻碍则清楚记录，不宣称真实后台已迁移）。保留两篇测试草稿与媒体。
- [x] 集成验收：Node 全套测试、tsc --noEmit、Hugo 正式/草稿构建、浏览器两栏入口与隔离范围；独立复审；更新两仓宪章及使用说明。不运行会触发数据库迁移的 npm build，不部署。

执行采用 writing-plans、subagent-driven-development 和 verification-before-completion 工作流；前台与后台职责分开，协调者处理跨层迁移兼容。每一项完成后记录实际证据，失败项不得标为通过。

完成记录：后台310测试与tsc，前台14测试与构建，26项浏览器断言通过；精确远端迁移729a29457624be4dc90ffdef4d980581819b6cba，其他文件SHA不变，未部署。详情见独立后台 docs/superpowers/weekly-independent-validation.md。
