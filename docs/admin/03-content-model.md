# ShadowSky 内容与配置适配

本文件依据 2026-10-01 本地仓库基线 `a1860ad` 编写，列出后台应适配的真实文件与兼容要求。它是拟实施映射，不代表根目录已有 `.pages.yml`。[返回开发计划](../superpowers/plans/2026-10-01-admin-development-plan.md)。

## 内容映射

以下路径均相对 `HUGO_BLOG` 仓库根目录。

| 内容 | 现有位置/判定方式 | 拟编辑内容 | 约束 |
| --- | --- | --- | --- |
| 普通文章 | `content/posts/`；`archetypes/default.md` 使用 TOML front matter | 标题、日期、草稿、简介、封面、分类、标签、正文 | 新文章默认 `draft: true`；排除 `_index.md` |
| 画廊文章 | `archetypes/gallery-post.md` 使用 YAML，`layout: gallery-post` | 文章元信息、图片与说明 | 属于文章，不与独立相册混淆；保持图片顺序 |
| 画板文章 | `content/excalidraw/<slug>/index.md` 与 `.excalidraw` 附件 | 标题、说明、分类、标签、评论开关、画板附件 | 模板优先读取 `excalidraw` 参数指定的资源，否则匹配 `*.excalidraw` |
| 动态 | `content/moments/` | 单条动态正文及经模板核实的元信息 | 栏目 `_index.md` 含 `cascade`，不作为动态记录编辑 |
| 关于页 | `content/about.md` | 页面元信息与正文 | 保留布局和其他未公开字段 |
| 友链 | `data/links.yaml` | 页头、分组、链接信息、RSS 地址 | 当前 `linkGroups: []`；不恢复原作者数据 |
| 相册 | `content/gallery/bizhi/index.md`、`content/gallery/jiamio/index.md` | 首版只读 | 用户明确保留相册，不清空、转换或迁移素材 |
| 站点资料 | `hugo.toml` | 先只读，再逐项开放本站资料字段 | 不让通用表单重写全部配置 |

其他栏目索引与功能页默认不列入“文章”。后台计数也排除 `_index.md`，文章与动态/相册分别统计。

Pages CMS 原生支持集合与单文件，也支持 TOML/YAML front matter 等内容格式；具体 `.pages.yml` 配置需以 A0 固定版本验证。[内容配置文档](https://pagescms.org/docs/configuration/content/)

## 普通文章字段与保存约定

| 字段 | 表单 | 保存规则 |
| --- | --- | --- |
| `title` | 必填文本 | 不用标题变化自动重命名已有文件 |
| `date` | 日期时间 | 保留时区与原有类型，默认采用 Asia/Shanghai 语义 |
| `draft` | 草稿开关 | 新建为 true，不能因为表单缺值而变为已发布 |
| `description` | 简介 | 可空，不自动截断覆盖正文 |
| `cover` | 媒体选择/路径 | 保留已有外链，新增本地图片使用正确公开路径 |
| `categories` / `tags` | 多值输入 | 保存为数组，保留中文，不悄悄改变大小写或重命名分类 |
| 正文 | Markdown 编辑 | 不把正文写成新的 front matter 字段；复杂结构提供源码模式 |

新建路径建议 `content/posts/<slug>/index.md`，沿用当前普通文章 TOML 格式；已有平铺文件不自动搬家。画廊 archetype 当前使用 YAML，不能假设同一集合的固定 `format` 自动兼容所有混合文件。A0 需验证按原格式写回；如原生配置做不到，先只开放普通文章，A2 增加格式适配，不批量转换旧内容。

重命名与日期调整要检查文章 URL、资源引用及 RSS。改变已发布 URL 时应保留经过验证的旧地址兼容方式，不能仅改文件名就宣告整理完成。

## 媒体与正文编辑

建议新增上传目录 `static/uploads/`，保存到正文的公开路径为 `/uploads/...`。现有 `static/hero/`、主题资源与相册外链保留；媒体库首版只管理明确开放的目录，避免直接删除全站共用图片。

Pages CMS 可分别定义仓库中的媒体输入目录和写入内容的公开输出路径，这适合 Hugo 的 `static/` 映射。[媒体文档](https://pagescms.org/docs/configuration/media/)

上传校验文件类型、内容和体积，图片需通过解码验证；首版优先 PNG/JPEG/WebP 等位图，SVG/HTML 等可能包含脚本的上传默认不开放。资源命名避免重名覆盖；上传失败不写入失效正文路径。画板文件单独按 JSON 结构校验，不作为图片上传。

画板附件必须属于对应页面 bundle，模板中的资源引用不能简单改为全局 `/uploads/` 地址。更新画板时应检查附件存在、指向正确、页面能渲染；不接受只有一份 Markdown 而遗漏附件的成功状态。

原生富文本编辑器提供编辑/源码切换，但这不是 Hugo 所有语法可无损处理的保证。最终预览使用本站 Hugo 主题。[富文本字段文档](https://pagescms.org/docs/configuration/fields/rich-text/)

## 友链的额外兼容风险

拟编辑的分组字段包括 `name`、`desc`、`type`、`shuffle`、`links`；链接字段包括 `url`、`name`、`blog`、`desc`、`avatar`、`rss`、`color`、`siteshot`、`pinLast`，以当前主题模板为依据。

现有 `scripts/fetch-links-rss.mjs` 的 `parseFirstGroupRssLinks` 使用逐行正则，而非完整 YAML 解析：它依赖 `- name:` 开始分组和 `- url:` 开始链接，并只读取第一组。CMS 重新排序字段后，文件可能仍是合法 YAML，但 RSS 来源会读取错误。

因此，A2 开放友链保存前，优先改为结构化 YAML 解析，保持当前“第一组 RSS”范围；用字段重排、两组数据、空分组及中文含冒号值的样本回归。未经这一步验证，不把“表单保存成功”当作 RSS 功能兼容。

## 站点配置的安全编辑范围

初始只读展示现有名称、域名、备案、作者、简介、社交入口、公告与各服务状态。新增可编辑字段时采用白名单，先验证在开发/生产配置合并后仍生效；生产 URL、评论端点等修改需显示影响。

`hugo.toml` 含大量说明与主题参数，首版不直接用精简 schema 覆盖整份文件。Pages CMS 的 `settings.content.merge` 默认 false；设置 true 可以保留未纳入表单的键，但不保证注释、排序和格式原样保留。[保存设置文档](https://pagescms.org/docs/configuration/settings/)

开放写入前需验证语义和文本差异；若上游不能满足，采用保留格式的定向修改器，或经过独立迁移验证后拆分配置。不能只设置 merge 就宣布配置写回安全。`.env`、`.local/`、评论数据、构建产物、工作流及源码不纳入普通内容编辑器。

## 必须通过的适配验收

| 编号 | 场景 | 合格标准 |
| --- | --- | --- |
| C01 | TOML/YAML 元信息、未知字段、false 与空数组 | 保存后类型和含义保持，不丢字段，不把 false 当作缺省 |
| C02 | 中文标题、正文列表、表格、代码块 | 再打开无内容丢失，代码缩进与语言标记保持 |
| C03 | 行内/独立公式、反斜杠、Hugo 短代码、内嵌 HTML | 修改其他字段不会转义或删除这些结构，Hugo 渲染与预期一致 |
| C04 | 图片路径、替代文字、相对资源、重复上传 | 预览能加载，名称冲突不覆盖，失败不插入坏链接 |
| C05 | 画廊文章与画板 bundle | 前者进入画廊文章模板，后者找到正确画板附件 |
| C06 | 友链字段重排与多个分组 | 主题显示正常，RSS 仍只读取约定分组与来源 |
| C07 | 用户同时在本地或 GitHub 修改文件 | CMS 检测旧版本并保留输入，不静默覆盖新修改 |
| C08 | 相册和无关配置 | 开放其他模块后仍未被重写、删除或恢复旧数据 |
| C09 | 保存草稿、正式构建与完整变更预览 | 草稿不进入生产，构建和发布对应指定提交 |

样本放在隔离验证位置，不向现有空文章栏目插入永久演示内容。测试产生的媒体、画板和草稿只在确认属于本次样本后清理。
