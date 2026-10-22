# ShadowSky · HUGO_BLOG

**影是光的拓印**

Through code we inscribe the tomorrow we yearn

ShadowSky 的个人博客，用于记录技术笔记、分享开源资讯，也收纳画廊、画板和日常动态。项目基于 Hugo 与 AIOVTUE 主题逐步重构，加入本站的视觉风格、独立周报栏目和可视化内容管理能力。

- **站长：** ShadowSky / [sshadow-sky](https://github.com/sshadow-sky)
- **配置域名：** `https://shadowssky.com/`（域名配置不代表已经部署上线）
- **内容仓库：** [sshadow-sky/HUGO_BLOG](https://github.com/sshadow-sky/HUGO_BLOG)，私有仓库，工作分支 `best`
- **当前阶段：** 本地开发与功能验收；部署和线上服务验收另行安排。

## 博客包含什么

| 板块 | 内容与能力 |
| --- | --- |
| 文章 | 普通 Markdown 笔记、图片卡片画廊、Excalidraw 画板；支持标题、引用、代码、链接、图片/GIF、视频和按文章开启的数学公式 |
| 独立周报 | 与文章分开的栏目、交互卡片、期号与导读；后台可组合原创内容与 RSS 资讯候选 |
| 内容浏览 | 搜索、归档、分类、标签，以及动态、相册、友链和朋友动态 |
| 随心听 | 搜索歌曲、播放队列与歌词；浏览器保存个人播放状态，刷新不自动播放 |
| 侧栏 | 时钟、日夜与天气动画、以武汉为起点的距离和城市招待语 |
| 评论 | Twikoo；本地评论服务可单独启动 |
| 可视化管理 | 独立的 Pages CMS 定制后台，提供文章编辑、媒体库及部分站点资料管理 |

博客前台由 Hugo 生成静态文件；评论服务和管理后台是独立进程。天气、音乐等功能仍依赖外部服务。天气使用浏览器定位权限，拒绝授权时不能取得访客的精确当地天气。桌宠保留现状，后续调整列入 TODO。

## 快速启动博客

### 环境准备

本地已验证的环境为 **Hugo Extended 0.163.3** 和 **Node.js 24.13.0**，包管理使用 npm。请确保 `hugo`、`node`、`npm` 在终端可用；无需以管理员身份运行。

首次获取项目时，需要有私有仓库访问权限：

```powershell
git clone --branch best https://github.com/sshadow-sky/HUGO_BLOG.git
cd HUGO_BLOG
npm ci
```

已有工作区直接进入 `D:\new_blog\HUGO_BLOG`，不要重新克隆或使用旧副本。依赖未安装或锁文件更新时，再执行 `npm ci`。

### 常规开发预览：1313

在项目根目录执行：

```powershell
hugo version
npm run dev -- --bind 127.0.0.1 --port 1313 --baseURL http://localhost:1313/
```

打开 [博客首页](http://localhost:1313/)。此模式读取仓库的 `content/`，包含草稿，修改内容或主题后自动刷新。

保持终端运行；按 `Ctrl+C` 停止服务。关闭终端或重启电脑后需重新启动，这些命令不会安装开机自启服务。

当前 Windows 工作区的 Hugo 位于 `D:\new_blog\.tools\hugo\hugo.exe`。若提示找不到 `hugo`，可先在当前 PowerShell 设置：

```powershell
$env:PATH = 'D:\new_blog\.tools\hugo;' + $env:PATH
```

若 PowerShell 的执行策略阻止 `npm.ps1`，将命令中的 `npm` 改为 `npm.cmd` 即可。

### 继续查看现有测试草稿：1314

当前用于检查界面和示例内容的 [1314 预览](http://localhost:1314/) 使用本机 `.local/weekly-preview/` 中的独立内容副本。要恢复相同的预览内容，在 PowerShell 执行：

```powershell
Set-Location D:\new_blog\HUGO_BLOG
& D:\new_blog\.tools\hugo\hugo.exe server `
  --config 'hugo.toml,.local/weekly-preview/config.toml' `
  --contentDir '.local/weekly-preview/content' `
  --destination '.local/weekly-preview/server-public' `
  --cacheDir 'D:/new_blog/HUGO_BLOG/.local/weekly-preview/cache' `
  --bind 127.0.0.1 --port 1314 `
  --baseURL 'http://localhost:1314/' `
  --buildDrafts --disableFastRender
```

**这是当前机器专用的预览方式。** `.local/` 不提交到 Git，新克隆的项目应使用上面的常规启动方式。1314 的内容不会随 CMS 保存或主目录 `content/` 的修改自动同步；主题仍取自当前项目。背景说明见 [预览与首页结构](docs/admin/32-preview-and-home-structure.md)。

## 可选服务

### 本地评论

在博客根目录另开一个终端，首次安装后启动：

```powershell
npm run comments:install
npm run comments:start
```

服务监听 `127.0.0.1:8080`，开发配置自动使用该地址。评论数据保存在 `.local/twikoo/`，应单独备份，不提交到 Git。

博客和评论进程需要分别运行。生产评论后端尚需独立部署，不能把本机地址用作线上接口。详细说明见 [Twikoo 本地运行与迁移](services/twikoo/README.md)。

### 可视化后台

后台是独立项目，位于当前机器的 `D:\new_blog\HUGO_BLOG_ADMIN`，不包含在本仓库中。已完成本地环境配置后，在 PowerShell 执行：

```powershell
Set-Location D:\new_blog\HUGO_BLOG_ADMIN
.\scripts\start-local.ps1
```

打开 [后台登录页](http://localhost:3000/sign-in)，使用已授权的 GitHub 账号登录。首次配置或迁移机器请阅读后台目录中的 `LOCAL_SETUP.md`，需要准备数据库及 GitHub App 配置；密钥放在本地环境文件中。

后台保存会写入 GitHub 的 `best` 分支，**不等于已发布，也不会自动更新本机博客或 1314 内容副本**。查看保存后的版本，可使用编辑页中的预览功能；更新本机内容前需先核对并同步 Git 差异，保留未提交工作。

## 写作与内容目录

| 位置 | 用途 |
| --- | --- |
| `content/posts/` | 普通文章、画廊文章；画廊使用 `layout: gallery-post` |
| `content/excalidraw/` | 画板文章 |
| `content/weekly/` | 独立周报，对应 `/weekly/` |
| `content/moments/`、`content/gallery/` | 动态、相册 |
| `static/uploads/` | 文章媒体，正文使用 `/uploads/文件名` 引用 |
| `data/links.yaml` | 友链资料与朋友 RSS 配置 |
| `themes/aiovtue/` | 当前使用的主题模板、样式与交互 |
| `hugo.toml`、`config/development/` | 站点配置、开发环境覆盖配置 |
| `.pages.yml` | CMS 内容与媒体配置 |
| `services/twikoo/` | 本地评论服务 |
| `scripts/`、`docs/` | 维护脚本、开发计划与验收记录 |

普通文章可新建为 `content/posts/my-first-post/index.md`：

```markdown
---
title: "第一篇笔记"
date: 2026-10-22T10:00:00+08:00
draft: true
description: "记录学习与创作。"
math: true
tags: ["笔记"]
---

## 从这里开始

正文支持 **Markdown**，也可以插入图片：

![图片说明](/uploads/example.jpg)

行内公式：$E = mc^2$
```

将示例图片路径替换为实际素材。`draft: true` 的文章仅在启用草稿的预览中显示，正式构建会排除；准备发布时再改为 `false`，并检查日期和资源。三类文章的检查说明见 [文章类型草稿](docs/admin/31-article-type-drafts.md)。

本站内容订阅为 `/index.xml`，周报订阅为 `/weekly/index.xml`，均由 Hugo 构建生成；朋友动态抓取的是其他站点的 RSS，与这两个订阅入口不同。

## 构建与手动更新

以下命令均在博客根目录运行：

| 命令 | 用途 |
| --- | --- |
| `npm run build` | 生成压缩后的正式静态文件到 `public/`，不包含草稿，不执行部署 |
| `npm run update:links` | 根据友链配置手动抓取朋友 RSS 动态 |
| `npm run update:bangumi` | 根据本站 Bilibili 配置手动更新追番缓存 |

启动与构建不会自动抓取 RSS、追番或补下载资源。手动更新需要对应来源可访问，追番结果还受账号隐私设置影响。

正式构建前先停止正在使用该项目的 Hugo 开发服务；如提示构建锁占用，不要直接删除运行中的锁。`public/` 是生成目录，不在其中编辑源文件。

## 常见问题

- **localhost 打不开：** 检查对应服务终端是否仍在运行，以及实际启动的是 1313 还是 1314。后台 3000 和评论 8080 需单独启动。
- **端口已被占用：** 可用 `netstat -ano | findstr :1314` 查看监听进程；按实际端口替换数字，确认进程用途后再处理。博客可换端口，评论后端与前台地址则需保持一致。
- **后台保存后首页没变化：** CMS 写入远端，常规预览读本地工作区，1314 还使用独立内容副本；三者不是自动同步关系。
- **本地没有访问量：** 开发环境关闭第三方统计上报；线上统计和服务验收见 [部署后 TODO](docs/post-deployment-todo.md)。

## 维护说明与致谢

CMS 会直接向远端 `best` 保存内容。本地开发前先检查工作区并执行 `git fetch origin best`；工作区干净且本地仅落后时，用 `git merge --ff-only origin/best` 同步。若两边都有新提交，需合并并验证后再推送，不使用强制推送覆盖 CMS 内容。完整说明见 [Git 同步与分叉处理](docs/admin/35-git-history-reconciliation.md)。

协作约定见 [项目宪章](AGENTS.md)。功能说明可从 [音乐播放器](docs/music-player.md)、[可视化编辑器](docs/admin/12-visual-editor-integration.md)、[GIF 与视频上传](docs/admin/13-gif-video-upload.md)、[周报独立栏目](docs/admin/30-weekly-independent-front.md) 进入。

请保留用户待检查的草稿和素材；`.local/`、`.runtime/`、`.tools/`、`.cache/`、备份及环境密钥不上传仓库。正式部署、评论迁移与第三方服务验收按计划单独推进。

本项目基于 [AIOVTUE/hugo-theme-aiovtue](https://github.com/AIOVTUE/hugo-theme-aiovtue) 二次开发，感谢上游主题及所使用的开源项目。主题、第三方依赖和素材的许可分别遵循其来源声明；本站改名与个性化不改变这些来源归属。
