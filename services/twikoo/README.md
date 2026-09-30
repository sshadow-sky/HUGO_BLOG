# ShadowSky 本地评论服务

当前采用官方 `tkserver@1.7.12`，与博客现有前端版本一致。使用 LokiJS 文件存储，无需另装 MongoDB。官方部署说明：https://twikoo.js.org/backend.html#私有部署

## 启动

在仓库根目录运行（Windows 可使用 `npm.cmd`）：

```sh
npm run comments:install
npm run comments:start
```

第一次或依赖变更后才需要安装。另一个终端执行 `npm run dev`（需要 Hugo 在 PATH 中）。本机现有博客启动脚本 `D:\new_blog\start-preview.ps1` 也可继续使用。

- 博客留言页：<http://localhost:1313/comment/>
- 友链评论区：<http://localhost:1313/links/>
- 后端：<http://127.0.0.1:8080/>（显示 JSON 状态，不是管理网页）
- 仅开发环境的 `config/development/params.toml` 指向本机后端。
- `hugo.toml` 的生产端点仍为原占位值，尚未接通公网评论；正式构建不会使用 127.0.0.1:8080。

`start.cjs` 固定监听 127.0.0.1:8080，并拒绝继承 MongoDB 环境变量，防止本地测试误连外部数据库。不要重复启动占用同一个端口。

## 数据与管理

数据目录为仓库下 `.local/twikoo/`，包括 `db.json` 及 `db.json.*` 分片。它在 `static` 和 `public` 之外，且 `.local/` 已被 Git 忽略。删除或只迁移源码不会保留评论，必须另行备份数据。

2026-09-30 本机实例已设置随机管理员密码，保存在 `.local/twikoo-admin-password.txt`。点击评论列表右上方齿轮进入管理面板并输入密码。该文件仅供本机使用，不提交、不发布；新克隆的空数据库应自行初始化管理员密码。

当前站点名为 ShadowSky，站点地址和跨域来源为本地预览。未配置 SMTP、即时消息通知、图床或外部审核服务。评论前端仍沿用主题的 jsDelivr CDN，访客头像等也可能请求外部服务；“后端在本机”不等于整个网站离线运行。

## 停止与备份

前台运行时按 Ctrl+C，等待 `Twikoo server stopped` 后，复制整个 `.local/twikoo` 目录到备份位置。正常停止会保存数据库；运行中自动保存约每 4 秒一次，勿依赖强制终止保证最新数据完整。

本次后台实例 PID 记录在 `D:\new_blog\.runtime\local-comments\twikoo.pid`，日志在同一目录；这些是当前机器的运行记录，不随仓库迁移。未设置系统服务或开机自启。

## 后续迁移到服务器

1. 停止本地服务并备份完整数据库目录，单独保管管理密码。
2. 服务器安装 Node.js，通过此目录的锁文件 `npm ci --ignore-scripts --no-audit --no-fund` 安装同版服务。
3. 将数据库全部文件复制到服务器持久目录，为服务账号赋予读写权限。
4. 服务器不要使用面向本机的 `start.cjs`；使用官方入口并配置实际数据路径，例如 Linux：

   ```sh
   TWIKOO_HOST=127.0.0.1 TWIKOO_PORT=8080 TWIKOO_DATA=/srv/shadowsky/twikoo-data node node_modules/tkserver/server.js
   ```

5. 配置进程管理、HTTPS 反向代理和评论子域名，再将博客生产 `params.twikoo.envId` 改为真实 HTTPS 地址。后台 `SITE_URL`、`CORS_ALLOW_ORIGIN` 同时改为正式博客域名。
6. 验证历史评论、管理登录、提交与读取后再切换。版本升级、邮件通知与定期备份单独安排。

此步骤只完成本地运行，不代表已完成公网部署。
