# A3.0 基线盘点与发布方案准备

最新安排：用户已明确“先不考虑部署服务”，本阶段部署准备暂缓；改为先开展[周报栏目与混合内容](../superpowers/plans/2026-10-02-weekly.md)。以下是暂缓前的盘点记录，不再等待部署选项答复。

日期：2026-10-02。状态：基线盘点、同步清单与方案草案已准备；部署目标仍等待用户选择，尚未合并、提交、推送或部署。此记录接续 [A2收尾](25-a2-closeout.md)。

## 核实的仓库状态

| 项目 | 本地 HEAD / 分支 | 远端现状 | 本轮初始工作树 |
| --- | --- | --- | --- |
| HUGO_BLOG | aaa4e7c1628f8ea0d5af239f55c394f24a776b6c / best | 私有 sshadow-sky/HUGO_BLOG；GitHub API核实best为2baa2cad9803efc1e1cbf6496aa3ee9c637eb032 | 8个已跟踪修改、21个未跟踪，其中7个是缓存 |
| HUGO_BLOG_ADMIN | 0b2d4882361f9876666643204d1c0b7f5816a182 / best | 尚无远端 | 25个已跟踪修改、68个未跟踪；暂存区为空 |

上述数量是本轮文档和忽略规则更新前的快照。后台证据：.local/a30/inventory.json；GitHub只读快照：.local/live-formats/a30-baseline.json。远端仓库的默认分支也是best，实际安装权限为contents:write、actions:read、checks/metadata/statuses:read。

本地origin/best仍为旧e297d84，“领先8个提交”仅相对于该旧引用，不能作为远端同步结论。本轮原生git fetch尝试未成功：默认Windows TLS返回SEC_E_NO_CREDENTIALS，单次OpenSSL后端尝试也未成功；没有关闭TLS验证或修改全局Git配置。远端状态经现有GitHub App的只读API重新核实。原生Git传输恢复属于下一步基线整合前事项。

## 必须保留的远端文件

将本地HEAD树与本轮远端树逐文件比较，远端有10个本地没有的文件：

- 用户要求保留的content/posts/2026-10-02-005855/index.md。
- 8个全格式验收素材（muprh6g6/muprh6g7前缀）。
- 另一张现有图片static/uploads/mupdik1v-7seei9th.png。

全部10个文件均保留，不因它们在当前本地缺失而删除。具体blob SHA保存在只读快照中。另有6篇较早的本地文档不在远端，.pages.yml/AGENTS/总计划两侧内容不同。

## 待整合的明确范围

### Hugo

| 类别 | 文件/范围 | 处理方向 |
| --- | --- | --- |
| CMS媒体配置 | .pages.yml | 远端仍为PNG/JPEG/WebP图片配置，本地增加GIF/MP4/WebM及“文章素材”标签；保留内容集合规则 |
| 友链前台 | themes/aiovtue/layouts/_default/links.html | 读取data的标题与封面；与后台已实现字段一致 |
| RSS解析 | scripts/fetch-links-rss.mjs、scripts/lib/links-rss-sources.mjs、scripts/tests/links-rss-sources.test.mjs | 结构化解析第一组来源；保存仍不抓取 |
| 依赖 | package.json、package-lock.json、pnpm-lock.yaml | 同步yaml依赖及对应锁文件 |
| 文档与协作记录 | AGENTS.md、开发总计划、docs/admin/08–26等本地记录 | 合并两侧有效记录，保留最新用户要求 |
| 忽略规则 | .gitignore | 本轮补排除.cache/.runtime/.tools/.backups |

### 独立后台

按A1恢复、A2各类型、站点资料、公共接线/预览、文档与测试归组。必须同时保留已修改文件和新增文件，不能只提交新组件而漏掉Entry、序列化、保存API、配置扩展与侧栏改动。源码清单位于.local/a30/inventory.json。

当前后台package/lockfile/db/scripts相对HEAD没有本批功能差异，数据库迁移已跟踪0000–0012共13个；本批A2没有新增迁移。后台远端仓库的建立和推送尚未执行，源码继续与Hugo分开。

### 已完成的准备调整

两个仓库的.gitignore均补充/.cache/、/.runtime/、/.tools/、/.backups/。Hugo中原本暴露在未跟踪列表里的7个缓存/日志文件现已忽略，未删除文件。git check-ignore及diff --check通过。

更新后台LOCAL_SETUP.md的旧说明：补A2入口、可视编辑/GIF视频、198项测试与本地预览现状，说明真实新增写入联调边界。未运行构建、迁移或改动实际环境配置。

## 分支与发布行为草案

本阶段沿用用户既有best分支。早期cms-content建议暂不执行，因为媒体/画板/动态/关于/友链的五处本地能力配置含best限定，仅改允许分支环境变量不足以迁移。独立内容分支需要先做配置适配、权限和内容同步验证。

建议第一版采用：编辑保存到best → 选择明确提交SHA → 对该SHA生成预览 → 审阅该版本完整差异 → 构建该SHA的生产产物 → 发布 → 保留上次成功产物供回滚。保存不会直接上线，正式构建不带草稿参数。发布过程中分支前进不改变目标版本。

如果采用GitHub Actions，工作流必须用单独的受校验target SHA参数固定检出内容；dispatch的ref本身是工作流所在分支或标签。触发权限需要Actions写，而当前安装只有读权限。来源：[GitHub工作流API](https://docs.github.com/en/rest/actions/workflows#create-a-workflow-dispatch-event)。本站proxy和Actions handler仍主动拒绝访问，不能仅显示上游按钮代替发布实现。

## 部署方向待确定

已经向用户询问：使用此前提到的腾讯云服务器、其他托管平台，或先本地演练。答复前不假定服务器可用，不连接生产服务器或更改DNS。

| 方案 | 本阶段适用方式 | 额外工作 |
| --- | --- | --- |
| 静态博客部署，后台先留本机 | 建议作为第一版候选，沿用已验证本地写作/预览 | 明确目标主机、产物上传与回滚；后台数据继续本地独立备份 |
| 博客与后台都部署服务器 | 可在需要跨设备管理时选择 | 必须改造公网预览入口、认证与资源代理、任务生命周期，配置数据库及应用进程 |
| 先本地发布演练 | 尚未选定服务器时先验证版本/产物/切换/回滚 | 之后接入选定平台；不得称为上线 |

现有后台预览限定HTTP本机来源，返回127.0.0.1随机端口，任务在进程内，构建依赖本机Hugo和可写缓存；不是可以直接搬到公网的预览服务。若公网部署Next.js，反向代理和应用运行环境需要单独安排，参考[Next.js自托管指南](https://nextjs.org/docs/app/guides/self-hosting)。

当前npm run build还会自动运行postbuild→db:migrate，不能当作只编译不改状态的验证命令。生产数据库、密钥备份和迁移步骤必须先明确；本轮未触发迁移。使用哪个平台尚未确定，因此没有生成假定可用的服务器地址或部署凭据。

## 接下来按此顺序执行

- [x] 盘点本地与真实远端树，保留10个远端独有文件，修正缓存忽略规则和旧使用说明。
- [ ] 用户选定部署方向；进一步确认后台是否继续留本机及正式主机运行条件。
- [ ] 恢复原生Git只读传输，核实最新远端；在独立整合工作区保留两侧历史和明确改动，不强推、不拿本地目录覆盖远端树。
- [ ] 形成可审阅的同步提交，核对10个文件及blob SHA、所有配置差异、依赖与构建；同步后再读取固定远端提交验证友链新模板。
- [ ] 为A2新增类型安排受控真实写入联调。关于页/根配置不直接以测试文字覆盖现有内容；专用验收分支还需解决best限定和权限，不能先切分支再假定可用。
- [ ] 按选定平台实现固定版本预览、发布状态和产物回滚，再做首次发布。

本轮不重复A2全量测试：没有应用逻辑变更；最近A2收尾198项后台测试、2项RSS测试和tsc通过。后续整合与发布代码改变后重新执行对应验收。A3.0尚未标记整体完成。
