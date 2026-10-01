+++
draft = true
title = '正文全格式验收 · 临时草稿 2026-10-02'
date = '2026-10-02T00:30:45+08:00'
math = true
description = '真实保存与预览测试，验收后清理，不发布。'
cover = '/uploads/muprh6g7-46thzisc.jpg'
categories = [
	'验收分类',
]
tags = [
	'验收标签',
]
+++
# 一级标题：真实正文全格式验收

中文段落，English text，数字 0123456789，标点 & < >，emoji 🌌 🚀。

**加粗文字**，*斜体文字*，~~删除线文字~~，以及 `const number = 42`。

软换行第一行
软换行第二行。

硬换行第一行\
硬换行第二行。

## 二级标题：列表

* 无序项目一
  * 二层项目
    * 三层项目 二次编辑确认：中文、公式和媒体继续保留。
* 无序项目二

1. 有序步骤一
2. 有序步骤二
   1. 嵌套步骤

* [x] 已完成任务
* [ ] 待完成任务

### 三级标题：引用与链接

> 第一层引用。
>
> > 嵌套引用。

[Hugo 文档](https://gohugo.io/documentation/ "外部链接")、[邮箱](mailto:test@example.invalid)、[返回标题](#一级标题真实正文全格式验收)。

[引用式链接][hugo-ref]。

[hugo-ref]: https://gohugo.io/ "引用定义"

***

#### 四级标题：表格

| 左对齐  |    居中    | 右对齐 |
| :--- | :------: | --: |
| 中文内容 |  **重点**  | 123 |
| 普通内容 | 行内代码 `x` | 456 |

##### 五级标题：代码

```javascript
const message = "中文 <tag> $ 123";
console.log(message);
```

```python
def add(a, b):
    return a + b
```

```
无语言代码块：$ <tag> 与普通文本
```

###### 六级标题：数学公式

行内美元公式 $E=mc^2$ 和分式 $\frac{a}{b}$。

$$
\int_0^1 x^2\,dx=\frac{1}{3}
$$

$$
\begin{bmatrix}1 & 2 \\ 3 & 4\end{bmatrix}
$$

旧式行内公式 \(a^2+b^2=c^2\)。

\[
f(x)=\sum_{n=1}^{3}n=6
\]

## 图片与图注

![大 PNG，超过 5 MiB](/uploads/muprh6g7-mz5xknby.png "PNG 悬浮标题")

![JPG 格式](/uploads/muprh6g7-46thzisc.jpg)

![JPEG 格式](/uploads/muprh6g7-h7aa8cmi.jpeg)

![WebP 格式](/uploads/muprh6g6-2lp7s61z.webp)

<figure data-shadow-image="true"><img src="/uploads/muprh6g7-46thzisc.jpg" alt="真实替代文字 &amp; 图注"><figcaption>真实图注 &amp; 中文：影是光的拓印</figcaption></figure>

![引用式图片][image-ref]

[image-ref]: /uploads/muprh6g6-2lp7s61z.webp "引用图片标题"

## 动画与视频

![真实 GIF 动画](/uploads/muprh6g6-ahxjzqz1.gif)

<video controls preload="metadata" src="/uploads/muprh6g6-p85li1l1.mp4"></video>

<video controls preload="metadata" src="/uploads/muprh6g7-ujp3vb84.webm"></video>

<video controls preload="metadata" src="/uploads/muprh6g7-tyiaufqo.webm"></video>

## HTML 与 Hugo 短代码

<details><summary>展开 HTML 折叠内容</summary>

折叠内容内的 **加粗** 与普通文字。

</details>

HTML 行内 <u>下划线</u>、H<sub>2</sub>O 与 x<sup>2</sup>。

{{< figure src="/uploads/muprh6g7-46thzisc.jpg" alt="短代码图片" caption="Hugo figure 图注" >}}

结尾文字：保存、重新打开后本句仍然存在。

<figure data-shadow-image="true"><img src="/uploads/muprh6g6-ahxjzqz1.gif" alt=""><figcaption>GIF 图注验收</figcaption></figure>

<figure data-shadow-image="true"><img src="/uploads/muprh6g6-ahxjzqz1.gif" alt="素材库选择 GIF"><figcaption>GIF 图注验收</figcaption></figure>

<video controls preload="metadata" src="/uploads/muprh6g6-p85li1l1.mp4"></video>

<video controls preload="metadata" src="/uploads/muprh6g7-ujp3vb84.webm"></video>



## 脚注与定义列表（源码模式）

这是一条真实脚注[^note]。

[^note]: 脚注正文，包含 **加粗**。

术语一
: 定义说明一。

术语二
: 定义说明二。
