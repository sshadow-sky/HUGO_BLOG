# 搜索式音乐播放器

点击右下角吸边的音乐入口，输入歌名或歌手。输入停止约 450 毫秒后搜索，也可回车或点击搜索按钮。中文输入法组词过程中不搜索。

- 每次显示最多 10 条结果。三角按钮立即播放该曲；加号只加入队列，不打断当前播放。
- 队列按来源与歌曲 ID 去重，最多 100 首。可移除单曲或清空队列；移除当前歌曲会停止播放。
- 提供暂停、进度拖动、音量、上一首/下一首、顺序/随机/单曲模式。顺序播放到队列末尾停止；随机模式的自动切歌和手动上一首/下一首均随机选择其他曲目；单曲模式自动重复当前歌曲，手动切歌仍可选择相邻曲目。
- 普通站内 PJAX 切页保留同一音频实例；完整刷新会停止音频，只恢复队列、当前歌曲信息、音量和模式，需主动点击继续播放。
- 播放失败停留当前歌曲，显示重试/换歌提示；不自动轮询其他第三方服务。

## 配置

`hugo.toml`：

```toml
[params.music]
  enable = true
  position = 'right'
  endpoint = 'https://music-api.gdstudio.xyz/api.php'
  source = 'netease'
```

`endpoint` 需支持 GD 协议的 `types=search/url/pic` 和相应 JSON 格式，可使用 HTTPS 服务或同源 API；不是任意音乐网页地址。浏览器直连第三方时需要对方允许 CORS。本项目当前使用 GD Studio 的网易云来源。音频与图片 URL 仅接受 HTTPS。

没有默认歌单、账号或自动播放。首次页面加载及空队列打开面板均不请求音乐接口；搜索后请求结果，可见封面按需获取。已有队列在打开面板后可能获取封面，点击播放才解析音频。接口或来源留空会提示未配置，不使用默认代理回退。

全局 `enable=false` 不输出播放器及专用脚本；单页 `musicPlayer:true` 不能覆盖全局关闭。`musicPlayer:false` 可控制该页面直达时的渲染；已创建的全局播放器会跨普通 PJAX 切页保留，支持持续播放。

## 数据保存和隐私

访客队列保存在自己浏览器的 `localStorage`，键名为 `shadowsky-music-v1`；只保存版本号、曲目 ID/标题/歌手/封面 ID 等元数据、当前曲目键、音量及播放模式，不保存音频文件、临时播放地址或登录凭据。清空队列即可删除保存的曲目。存储不可用时仍可在当前页面会话使用。

搜索关键词及曲目 ID 会发送到配置的音乐服务；封面和音频可能来自其返回的其他 HTTPS 域名。没有默认歌单请求，也不再加载 APlayer/Meting 或三个旧解析代理。

## 维护

- `themes/aiovtue/assets/js/music-api.js`：接口参数、超时、数据校验。
- `themes/aiovtue/assets/js/music-controller.js`：队列、搜索/播放竞争、音频事件和本地保存。
- `themes/aiovtue/assets/js/music-view.js`：DOM、输入法、封面按需加载和控制按钮。
- `themes/aiovtue/assets/js/music-player.js`：悬浮入口、吸边、位置和开合。

测试：`node --test tests/music-search.test.mjs`。实现与浏览器验证记录见 [实施记录](superpowers/plans/2026-09-30-music-search.md)。第三方服务的返回与播放能力可能变化；本地一次播放成功不代表所有歌曲或以后均可用。
