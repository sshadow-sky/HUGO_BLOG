---
title: URL 嵌入测试：图片、视频与 B站
date: 2026-10-25T15:31:44.886Z
description: URL素材发布闭环 URL-LIFECYCLE-V1-599cba42：本地图片、外链视频和B站播放器一起核验。
draft: false
categories:
  - 测试
tags:
  - URL嵌入
  - 待检查
content_id: 599cba42-9e03-4d9c-b923-7efc2c73dd34
editorial_kind: note
lastmod: 2026-10-25T15:50:02.123Z
editorial_assets:
  - name: lifecycle-local.png
    path: static/uploads/editorial/599cba42-9e03-4d9c-b923-7efc2c73dd34/f03c226330c2f38b793262f05a7faef47e681cb1fd5a298571c6ae3828e11aeb.png
    url: /uploads/editorial/599cba42-9e03-4d9c-b923-7efc2c73dd34/f03c226330c2f38b793262f05a7faef47e681cb1fd5a298571c6ae3828e11aeb.png
    sha: fc1090929bda2de2e1e8a528f3d9dc01ed5df146
    size: 33547
    mime: image/png
---
发布验收版本：URL-LIFECYCLE-V1-599cba42。这篇文章用于本地与模拟生产的发布验收；测试结束后撤下远端并保留本地。请对照下面各节查看“填入URL”后的真实展示：图片应显示为图片，视频直链应显示播放器，B站网页地址会转换为官方嵌入播放器。

## 1. JPG 图片直链与图注

输入地址：

`https://developer.mozilla.org/shared-assets/images/examples/grapefruit-slice.jpg`

<figure data-shadow-image="true"><img src="https://developer.mozilla.org/shared-assets/images/examples/grapefruit-slice.jpg" alt="MDN 示例：切片葡萄柚"><figcaption>外链 JPG 测试：来自 MDN 官方 img 示例；图片仍由原站提供。</figcaption></figure>

## 2. PNG 图片直链

输入地址：

`https://developer.mozilla.org/shared-assets/images/examples/favicon144.png`

![MDN PNG 示例图标](https://developer.mozilla.org/shared-assets/images/examples/favicon144.png)

## 3. MP4 视频直链

输入地址：

`https://developer.mozilla.org/shared-assets/videos/flower.mp4`

<video controls preload="metadata" src="https://developer.mozilla.org/shared-assets/videos/flower.mp4"></video>

这是 MDN video 文档中的花朵示例。点击播放检查画面，默认不自动播放。

## 4. WebM 视频直链

输入地址：

`https://developer.mozilla.org/shared-assets/videos/flower.webm`

<video controls preload="metadata" src="https://developer.mozilla.org/shared-assets/videos/flower.webm"></video>

与上节为同一示例的另一种容器格式，可以对照浏览器兼容情况。

## 5. B站完整网页链接

在编辑器“视频”窗口填写：

`https://www.bilibili.com/video/BV1B7411m7LV/`

{{< bilibili bvid="BV1B7411m7LV" p="1" >}}

预期：可视编辑时显示 B站卡片；博客预览显示 16:9 官方播放器和“在B站打开”入口，不自动播放。这个 BV 号来自官方播放器说明的示例。

## 6. B站 BV号与起播时间

另一个输入形式是直接填写 BV 号；带时间的完整链接也可以使用：

`https://www.bilibili.com/video/BV1B7411m7LV/?p=1&t=15`

{{< bilibili bvid="BV1B7411m7LV" p="1" t="15" >}}

本节检查参数保留。起播时间和最终播放行为由 B站播放器处理，仍设置关闭自动播放。

## 7. B站 av号

输入地址或直接填写 av 号：

`https://www.bilibili.com/video/av170001/`

{{< bilibili aid="170001" p="1" >}}

本节检查旧式 av 地址生成官方播放器的结果；如果视频已不可用，可以使用下方原站入口确认。

## 8. 普通链接与嵌入的区别

[这是一条普通的 MDN 页面链接](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/video)，点击后才打开页面，不会自动变成播放器。

下面只是源码示例，不会实际插入，也不会进入素材引用清单：

```text
https://b23.tv/示例短链接 → 先在浏览器打开，再复制完整B站视频地址。
https://www.bilibili.com.evil.example/video/BV1B7411m7LV/ → 应拒绝，不能作为B站链接。
/uploads/not-in-this-article.png → 站内文件未纳入本篇附件时，正式上传会被阻止。
```

## 素材与来源说明

本篇保留外部URL，并新增一张随稿上传的本地测试图片；原有外链没有下载到本站。外链的可用性受原站、网络和访问权限影响；“素材检查通过”表示引用结构合规，并不表示已保证第三方始终可访问。

来源：[MDN 图片示例](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/img)、[MDN 视频示例](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/video)、[B站官方播放器说明](https://player.bilibili.com/)。

## 9. 本地素材与版本验收

验收标记：URL-LIFECYCLE-V1-599cba42

![本地素材：ShadowSky发布闭环测试图](/uploads/editorial/599cba42-9e03-4d9c-b923-7efc2c73dd34/f03c226330c2f38b793262f05a7faef47e681cb1fd5a298571c6ae3828e11aeb.png)

这张图片通过后台附件接口上传，随正式稿一起提交；原有外部图片和视频继续保留各自URL。
