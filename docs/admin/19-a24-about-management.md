# A2.4 关于页管理

2026-10-02，用户确认继续关于页管理。本地实现及隔离验收完成。入口：[关于页编辑](http://localhost:3000/sshadow-sky/hugo_blog/best/file/about)。

## 使用与范围

侧栏“关于页”直接编辑固定页面，无需新建文章。开放页面标题、简介、封面、数学公式开关和正文；正文复用已验证的可视编辑/Markdown源码、图片/GIF/视频/公式能力，封面复用图片库。“关于页预览”继续使用已保存提交的本站Hugo主题。

原文件content/about.md的date为2026-09-30，无时分秒；它是不可编辑元信息，不套用普通文章ISO日期校验。原layout:about、目录层级、comment及其他未公开字段保留；不提供草稿开关、新建、改名或删除。站点名称/社交配置等全局资料仍未开放，本步只编辑关于页。

## 实现

本地配置能力新增type:file的about项，不改变远端.pages.yml及SHA。GET/POST只允许content/about.md，POST必须携带现有SHA；字段白名单拒绝从请求注入布局、日期、cascade等额外设置。保存采用独立saveHugoAbout，保留YAML/TOML格式、原正文空白与未编辑字段；YAML文档节点更新保留原注释，TOML直接使用原生对象往返，避免日期/时间类型被JSON克隆改为字符串。

Entry/EntryForm单文件模式接入光影工作台，可视/源码切换及A1请求失败/限流/登录恢复/离页提醒继续复用。页面设置不显示文章日期或分类标签。预览白名单只新增固定关于页，仍校验文件SHA和提交。

## 验收

- 全套171项测试通过、0失败；TypeScript检查退出0；git diff --check通过。
- 保存函数覆盖当前YAML源、无日期TOML、布局/未知字段/目录设置/注释/正文保留、非法字段类型及请求额外字段忽略。独立审查发现原生TOML日期可能被通用序列化改为字符串，已增加先失败后通过的date/customDate/customTime/带时区customTimestamp往返测试并修复。
- 真实HTTP处理器配隔离GitHub适配器验证关于页读取→字段初始化→保存、原date/layout/toc不变、缺SHA/旧SHA/跨路径拒绝、非法math拒绝；只允许固定about预览路径。
- 专用已登录浏览器读取真实关于页及保留PNG/GIF；验证可视显示、页面设置无日期字段、深浅主题/390px无横向溢出。保存被CDP拦截：模拟401后原输入保留、重试正文一致、刷新重读成功，随后取消拦截重新载入真实原页面。没有用测试正文覆盖远端关于页。
- 当前Hugo源码复制到忽略目录，将浏览器提交内容与原关于页合并后独立构建；/about/使用sakura-about-page模板，原联系方式/RSS和新增隔离正文正确，元信息值不变，浏览器PNG/GIF加载成功。
- 验证期间Next开发服务因内存阈值自动重启，一次CDP检查超时；服务恢复后完整流程重跑通过。媒体检查也排除了ProseMirror用于光标定位的无src占位图片，避免将其误判为实际媒体失败。

远端只读复核：head仍为2baa2cad9803efc1e1cbf6496aa3ee9c637eb032，tree仍为b0db1f939242e8aeda9e0dcaea4a4ec091aec974；关于页、原测试文章/8素材及相册未变。没有真实远端关于页保存、推送或部署。首次实际保存仍应观察GitHub与网络结果，不把隔离适配器/浏览器拦截当作线上写入验收。

证据：后台.local/about/的browser-result、payload、hugo-result、hugo-browser-result、all-tests及截图；.local/live-formats/a24-after.json。临时测试源码、快照、运行日志及凭据不提交。

## 后续

下一步为友链/RSS管理：适配现有分组数据和RSS来源字段，避免编辑后丢失第一组或改动来源逻辑；随后完善站点资料。相册保留，统计与部署后TODO继续按原约定。
