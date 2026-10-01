# Pages CMS A0 兼容性探针

这组脚本用于复现[验证报告](../04-a0-validation.md)，不启动后台、不连接 GitHub 写接口，也不运行统计上报。

## 准备条件

- Node.js 24.13.0（脚本用原生 TypeScript 类型剥离）；Hugo extended 0.163.3。
- 上游源码固定为 `hunvreus/pagescms` 的 `6f4e860a35d934406580287e7042e5e111e207a1`。
- 从本站提交 `0b5dfa7` 用 `git archive` 创建独立快照；不得使用当前博客工作目录。
- 验证目录必须在 `.runtime` 下，快照不得含 `.git`；脚本会写入 `content/posts/a0-*`、`content/excalidraw/a0-board` 样本。

本次目录为 `D:\new_blog\.runtime\pagescms-a0-20261001`。上游源码文件夹为 `hunvreus-pagescms-6f4e860`，快照为 `hugo-site`，输出为 `results`。快照只含已提交文件，不含 Twikoo 数据、环境凭据或本地业务缓存。

依赖安装在验证目录根部，使源码文件通过父目录找到依赖；禁用生命周期脚本。本次直接测试依赖为：`yaml@2.8.3`、`@ltd/j-toml@1.38.0`、`lodash.mergewith@4.6.2`、`date-fns@3.6.0`、`@tiptap/core@3.21.0`、`@tiptap/markdown@3.21.0`、`@tiptap/starter-kit@3.21.0`、`@tiptap/extension-image@3.21.0`、`@tiptap/extension-table@3.21.0`、`jsdom@26.1.0`。完整解析后的 `package-lock.json` 保留在该隔离目录；Hugo 工程依赖没有变化。

## 运行

在 `D:\new_blog\HUGO_BLOG` 下执行，目录不存在时先按上述条件准备，不能把参数改成博客工作目录：

```powershell
node docs/admin/probes/run-a0.mjs D:\new_blog\.runtime\pagescms-a0-20261001\hunvreus-pagescms-6f4e860 D:\new_blog\.runtime\pagescms-a0-20261001\hugo-site D:\new_blog\.runtime\pagescms-a0-20261001\results
node docs/admin/probes/build-a0.mjs D:\new_blog\.tools\hugo\hugo.exe D:\new_blog\.runtime\pagescms-a0-20261001\hugo-site D:\new_blog\.runtime\pagescms-a0-20261001\results
```

第一条命令直接导入上游 `lib/serialization.ts`，从固定源码提取合并、清理和日期函数执行，同时记录未保留结构等观察值；不会假设不兼容观察必须“通过”。第二条依次构建原始样本、保存后样本、生产样本和富文本转换样本，并断言源码保存前后文章 HTML 一致、公式与附件存在、生产排除草稿。

富文本探针只覆盖同版本核心文档 schema，不包括上游 React UI、上传临时属性、媒体 URL 转换及登录保存。它适合发现不兼容，不能替代正式端到端验证。完整保存 API 的字段校验/写入钩子也没有全部执行，只有日期钩子单独验证。

`results.json` 保存具体观察与上游源码哈希；`hugo-results.json` 保存渲染对照。构建日志保存在 `build-*.log`。这次出现的 TypeScript 剥离实验性提示和上游缺少模块类型提示不影响探针退出码。
