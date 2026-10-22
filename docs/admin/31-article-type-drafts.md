# 三种文章形式检查草稿

2026-10-06，按用户要求各新增一篇普通笔记、画廊和画板草稿，保留供用户检查，不自动清理。

| 类型 | 内容位置 | 本地查看 |
| --- | --- | --- |
| 普通笔记 | `content/posts/2026-10-06-note-preview/index.md` | http://localhost:1314/posts/2026-10-06-note-preview/ |
| 画廊 | `content/posts/2026-10-06-gallery-preview/index.md` | http://localhost:1314/posts/2026-10-06-gallery-preview/ |
| 画板 | `content/excalidraw/2026-10-06-drawing-preview/index.md` | http://localhost:1314/excalidraw/2026-10-06-drawing-preview/ |

普通笔记覆盖多级标题、列表、引用、表格、代码、公式、图片图注、GIF、MP4/WebM等；复用原全格式草稿素材。画廊为 `layout = 'gallery-post'`，包含 JPG/GIF/WebP 三张图片及逐图说明。画板的说明与三个几何图元的 `.excalidraw` 附件同处 bundle，后台支持说明编辑与附件替换。

三篇通过已登录后台的真实保存接口写入私有 `sshadow-sky/HUGO_BLOG` 的 `best` 分支，均为 `draft = true`。三个内容提交依次为 `905b2648ba99afcdcc79853fe2bf3e97f067ac32`、`af26cbd10559f2441237285d7a4837a82d4ab482`、`53b6cb1ab5fd39463ed3e605ce500a09efd97cc4`。没有提交或推送其他工作区源码，没有部署。

保存后通过后台重新读取，确认正文与类型、草稿标志一致；本地序列化后的 Git blob SHA 与远端一致，同步到主内容目录和 1314 的独立内容副本。复用的 7 个远端既有媒体从本地预览快照复制到主项目 `static/uploads`，没有重复远端上传。原保留全格式草稿 SHA 未改变。

验收：三个后台编辑页均正常加载；笔记显示 6 个公式节点、视频可用且无媒体错误；画廊切到第二张后计数和 GIF 加载正常；画板进入 `is-ready` 并绘制三个图形。前台截图已检查。正式 Hugo 构建成功，输出中三篇草稿页面均不存在。

后台普通笔记和画廊在「文章」集合，画板在单独「画板」集合。当前 1314 开启草稿预览，所以首页也会出现这些草稿；这不代表正式发布。证据、保存回执与截图位于后台 `.local/article-type-drafts/`；生产验证输出位于 Hugo 同名目录。目录被 Git 忽略。
