# A2.2 画板说明与附件管理

2026-10-02，用户在 A2.1 后要求继续。本小步已完成本地实现及隔离验收。入口：[画板管理](http://localhost:3000/sshadow-sky/hugo_blog/best/collection/drawings)，[新建画板](http://localhost:3000/sshadow-sky/hugo_blog/best/collection/drawings/new)。

## 使用方式

后台侧栏点击“画板”，新建后填写标题、日期与说明，选择 Excalidraw 导出的 `.excalidraw` 文件。支持版本2，最大20MiB；选中后显示文件名、图元/内嵌图片数量、大小及待保存状态。说明继续支持现有可视编辑与 Markdown 源码。新建默认草稿；本步不内嵌绘图工具。

文件选择只在当前页面暂存，点击“保存”才把说明和绘图文件一起保存到 GitHub。保存后可用已有本站 Hugo 预览检查画板。保存不等于网站发布；未保存内容尚无持久化本地草稿。

只改说明时保留原附件；更换时生成新的内容散列文件名，旧文件不自动删除。首版不开放画板删除和重命名。画板管理只列出 `content/excalidraw/<单级目录>/index.md`，不把普通附件 Markdown 或多层目录错误显示为可编辑画板。

## 实现与保护

- `drawings` 集合由后台本地能力配置添加，沿用本站文章字段和光影工作台；远端 `.pages.yml` 及其 SHA 不变。
- 说明与附件位于同一 Hugo page bundle，元信息 `excalidraw` 由服务端指定直接文件名；客户端不能通过元信息切换 layout 或引用其他目录。对无显式引用的旧画板，只在同目录有唯一候选时采用，否则提示重新选择。
- `lib/drawing-save.ts` 固定读取时的分支提交，校验文章 SHA，把说明与新附件放入同一 Git 树/提交，并以 `force:false` 更新分支。分支并发变化返回409。设计依据为 [GitHub Git trees](https://docs.github.com/en/rest/git/trees) 和 [Git references](https://docs.github.com/en/rest/git/refs)。
- 网络丢失成功响应时，重试固定原创建路径；只有文章和附件的 SHA 都吻合才确认成功，不重复提交。缓存更新失败仍返回成功保存回执，并提示列表刷新问题。
- UTF-8 严格读取与文件原内容保留；客户端/服务器均验证文件大小和 Excalidraw 基础结构。非完整 Excalidraw 格式规范验证，不提供修复绘图或绘图编辑功能。
- 沿用 A1 登录/限流/网络/冲突提示、未保存提醒及版本保护；失败保留选择与说明，旧保存响应不会清除保存期间新选择的附件。干净表单采用远端新版本时，附件名称同时刷新。

## 验收结果与边界

- 全套 `node --test tests/*.test.mjs`：162项通过，0失败；`tsc --noEmit`：退出0；`git diff --check`：通过。
- 核心与真实 HTTP handler 配合隔离 GitHub 适配器：两文件一次分支更新、精确重试、文章 SHA/分支冲突、目录限制、JSON/大小拒绝、说明独立更新、未知元信息保留、替换保留旧文件、缓存失败回执、详情读取附件名与列表范围均通过。
- 已登录专用浏览器真实读取配置与空画板集合；验证选择/无效文件保留/深浅主题/390px无横向溢出。五次保存被 CDP 拦截并返回隔离响应：401后输入保留与固定路径重试、保存期间换文件不丢失、说明单独保存不上传附件、远端重读时名称同步通过。没有真实远端画板写入。
- 将浏览器提交内容放进忽略目录内的当前 Hugo 副本，独立构建说明页和绘图附件；附件字节完全一致，实际浏览器画板进入 `is-ready`，2个 Excalidraw canvas 正常绘制蓝色矩形，说明正确。前台继续使用现有 jsDelivr `excalidraw-embed@0.18.4` 依赖，本次网络下成功加载；没有改为本地化依赖。
- 独立审查未发现阻塞问题；已修复附件名称在干净重读时滞后、列表包含不支持的 Markdown 两项问题，并补齐相应浏览器/列表断言。

远端只读复核：best head仍为 `2baa2cad9803efc1e1cbf6496aa3ee9c637eb032`，tree为 `b0db1f939242e8aeda9e0dcaea4a4ec091aec974`。保留测试文章和8个素材；相册未变；未推送后台或 Hugo、未部署。真实 GitHub Git Data 多文件写入尚未在用户仓库实测，本步以隔离适配器验证写入逻辑；第一次真实内容保存仍需观察服务授权和网络结果。

后台证据位于 `.local/drawing/` 的 browser-result、payload、hugo-result、hugo-browser-result、test-result及截图；只读远端记录 `.local/live-formats/a22-after.json`。这些运行文件与凭据均不提交。

## 下一步

A2.2完成，A2整体尚未完成。下一小步为动态管理：先对应现有动态的数据结构，再制作卡片式编辑与日期/图片输入；随后逐项处理关于页、友链/RSS和站点资料。相册继续保留，统计仍按部署后 TODO，正式发布未实施。
