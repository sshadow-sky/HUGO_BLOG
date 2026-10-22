# 普通文章与周报本地评论恢复

日期：2026-10-03。用户要求为当前文章和周报接通评论区。

## 原因与本次处理

- 普通文章和周报共用的 single 模板已经包含评论组件，无须重复添加。
- 1314 周报排版样例此前显式设置了 `comment = false`，本次移除隔离样例中的关闭字段。
- 本地 Twikoo 8080 服务已停止。本次通过现有 `services/twikoo/start.cjs` 恢复，继续使用原本的本地数据库，仅监听 127.0.0.1。
- 将保留的全格式文章和真实周报草稿复制到 `.local/weekly-preview/content`，1314 开启草稿预览，并挂载已有快照中的静态素材；两篇文章的 draft 字段保持 true，正式 content 和远端均未修改。
- 加入全格式文章时旧 Hugo 热更新发生 `site is fully initialized` 错误和 `close of closed channel` panic。重新启动 1314 后完整构建成功（55 页），不再依赖那次失败的热更新结果。

## 可检查入口

- 普通文章：http://localhost:1314/posts/2026-10-02-005855/#page-comment-section
- 真实周报草稿：http://localhost:1314/posts/weekly/2026-10-03-003100/#page-comment-section
- 周报排版样例：http://localhost:1314/posts/weekly/mixed/#page-comment-section

1314 是独立开发预览，包含草稿；这里可见不表示已正式发布。CMS 固定版本临时预览仍按原规则关闭评论和统计，本次未修改后台预览隔离策略。生产评论地址仍待后续部署。

## 验证

- 两篇真实草稿均显示评论表单，分别通过浏览器填写并发送一条带唯一标记的本地测试评论，API 重读成功。
- 验证文章路径隔离，周报评论不会出现在普通文章下。
- 周报到普通文章的实际 PJAX 导航通过，页面未整页刷新，只有一个评论表单。
- 桌面与 390px 手机深浅主题检查通过，无横向溢出；浏览器无未捕获异常，普通文章正文图片无加载失败。
- 两条本轮测试评论已经通过管理员 API 精确删除；最终页面显示零评论。
- 三个入口最终均返回 HTTP 200，包含评论区。

证据：独立后台 `.local/comments-reconnect/verify.mjs`、`results.json`、手机与桌面截图；Hugo `.local/comments-reconnect/` 保存本次运行日志、PID 和修改前预览配置。手机截图摄于清除测试评论前，最终桌面截图摄于清除后。

## 后续启动

本地评论需要与 Hugo 分别运行。在 Hugo 根目录使用 `npm run comments:start` 启动已有评论服务；不要在 8080 已运行时重复启动。数据仍保存在被忽略的 `.local/twikoo`，管理员凭据未输出或提交。

本次没有 GitHub 写入、提交、推送或部署；未清理用户保留的文章、素材、相册。
