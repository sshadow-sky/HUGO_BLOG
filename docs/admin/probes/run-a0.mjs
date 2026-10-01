// A0 only: run against a pinned, locally downloaded Pages CMS tree and a disposable Hugo snapshot.
// Usage: node run-a0.mjs <upstream-dir> <snapshot-dir> <output-dir>
// Test dependencies belong to the parent of upstream-dir, not the Hugo project.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire, stripTypeScriptTypes } from 'node:module';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

const [upstreamArg, siteArg, outputArg] = process.argv.slice(2);
assert(upstreamArg && siteArg && outputArg, 'Provide upstream, disposable Hugo snapshot and output paths');
const upstream = resolve(upstreamArg), site = resolve(siteArg), out = resolve(outputArg);
assert(site.includes('.runtime'), 'Refusing to write fixtures outside a disposable .runtime snapshot');
assert(!existsSync(join(site, '.git')), 'Do not run on a Git working tree');
mkdirSync(out, { recursive: true });
const requireProbe = createRequire(join(dirname(upstream), 'package.json'));
const mergeWith = requireProbe('lodash.mergewith');
const YAML = requireProbe('yaml');
const { parse, stringify } = await import(pathToFileURL(join(upstream, 'lib/serialization.ts')));
const read = path => readFileSync(join(upstream, path), 'utf8');
const schemaSource = read('lib/schema.ts');
const sanitizeFragment = schemaSource.slice(schemaSource.indexOf('const sanitizeObject ='), schemaSource.indexOf('const getSchemaGroupTrail ='));
assert(sanitizeFragment.includes('return object;'), 'Unexpected upstream sanitizer structure');
const sanitizeObject = new Function(`${stripTypeScriptTypes(sanitizeFragment)}; return sanitizeObject;`)();
const route = read('app/api/[owner]/[repo]/[branch]/files/[path]/route.ts');
const mergeFragment = route.slice(route.indexOf('finalContentObject = mergeWith('), route.indexOf('\n            }', route.indexOf('finalContentObject = mergeWith(')));
assert(mergeFragment.includes('return srcValue;'), 'Unexpected upstream merge structure');
const mergeContent = new Function('mergeWith', 'existingContentObject', 'unwrappedContentObject', `let finalContentObject; ${stripTypeScriptTypes(mergeFragment)}; return finalContentObject;`);
const observations = [];
const record = (name, details) => { observations.push({ name, ...details }); console.log(name, JSON.stringify(details)); };
const write = (path, value) => { mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, value); };
const save = (source, submitted, format, merge) => stringify(sanitizeObject(merge ? mergeContent(mergeWith, parse(source, { format }), submitted) : submitted), { format });

const body = String.raw`## 中文正文

普通文字与 **加粗**、[链接](https://shadowssky.com/)。

- 第一项
- 第二项

| 项目 | 值 |
| --- | --- |
| 数字 | 42 |

行内公式 $E=mc^2$，另一种分隔符 \(a^2+b^2=c^2\)。

$$
\frac{a}{b} + \sqrt{x}
$$

\[
\sum_{i=1}^{n} i
\]

![图片说明](/hero/tt3.png)

{{< figure src="/hero/tt3.png" title="短代码图片" >}}

<details><summary>更多说明</summary><p>HTML 内容</p></details>
` + '\n```js\nconst path = "C:\\\\sample";\nconsole.log(path);\n```\n';
const toml = '+++\n# front matter comment\ntitle = "A0 中文普通文章"\ndate = 2026-10-01T08:30:00+08:00\ndraft = true\nmath = true\ncomment = false\ntags = ["旧标签"]\ncategories = []\ncustom_note = "保留未知字段"\n[custom]\nflag = false\n+++\n\n' + body;
const yaml = '---\n# front matter comment\ntitle: A0 画廊文章\ndate: "2026-10-01T08:30:00+08:00"\ndraft: true\nlayout: gallery-post\ncomment: false\ncategories: []\ncustom_note: 保留未知字段\n---\n\n![首图](/hero/tt3.png)\n第一张说明。\n\n![次图](/hero/avatar.png)\n第二张说明。\n';
const drawing = '---\ntitle: A0 画板\ndate: "2026-10-01T08:30:00+08:00"\ndraft: true\nexcalidraw: diagram.excalidraw\ncomment: false\n---\n\n画板附件兼容性验证。\n';
const fixtures = [
  { name: '中文普通文章', relative: 'content/posts/a0-中文文章/index.md', source: toml, format: 'toml-frontmatter' },
  { name: '画廊文章', relative: 'content/posts/a0-gallery/index.md', source: yaml, format: 'yaml-frontmatter' },
  { name: '画板文章', relative: 'content/excalidraw/a0-board/index.md', source: drawing, format: 'yaml-frontmatter' },
];
for (const f of fixtures) {
  const obj = parse(f.source, { format: f.format });
  const submitted = { title: obj.title, date: obj.date, draft: obj.draft, comment: false, body: obj.body };
  const saved = save(f.source, submitted, f.format, true);
  const after = parse(saved, { format: f.format });
  assert.equal(after.body, obj.body, `${f.name}: body changed in serializer/save-fragment probe`);
  assert.equal(after.draft, true);
  assert.equal(after.comment, false);
  if (obj.custom_note) assert.equal(after.custom_note, obj.custom_note);
  if (obj.layout) assert.equal(after.layout, obj.layout);
  if (obj.excalidraw) assert.equal(after.excalidraw, obj.excalidraw);
  write(join(out, 'before', f.relative), f.source);
  write(join(out, 'after', f.relative), saved);
  write(join(site, f.relative), f.source);
  record(f.name, { bodyExact: after.body === obj.body, falsePreserved: after.comment === false, unknownPreserved: after.custom_note === obj.custom_note, emptyArrayPreserved: Object.hasOwn(after, 'categories'), dateBefore: obj.date, dateAfter: after.date, frontmatterCommentPreserved: saved.includes('# front matter comment') });
}
const drawingData = JSON.stringify({ type: 'excalidraw', version: 2, source: 'https://excalidraw.com', elements: [], appState: { viewBackgroundColor: '#ffffff' }, files: {} });
for (const root of [site, join(out, 'before'), join(out, 'after')]) write(join(root, 'content/excalidraw/a0-board/diagram.excalidraw'), drawingData);

const changed = parse(save(toml, { title: '新标题', tags: [], body }, 'toml-frontmatter', true), { format: 'toml-frontmatter' });
const replaced = parse(save(toml, { title: '新标题', body }, 'toml-frontmatter', false), { format: 'toml-frontmatter' });
record('merge-and-sanitize', { unknownWithMerge: changed.custom_note, unknownWithoutMerge: Object.hasOwn(replaced, 'custom_note'), emptyTagsKeySurvives: Object.hasOwn(changed, 'tags'), oldTagsGone: !changed.tags?.includes('旧标签'), falseSurvives: changed.comment === false });
const misparsed = parse(yaml, { format: 'toml-frontmatter' });
record('mixed-format', { titleRecognizedWithWrongSchema: Object.hasOwn(misparsed, 'title'), wholeFileBecomesBody: misparsed.body === yaml });
const dateSource = read('fields/core/date/index.ts');
const dateFragment = dateSource.slice(dateSource.indexOf('const read ='), dateSource.indexOf('const schema ='));
const dateFns = requireProbe('date-fns');
const dateHooks = new Function('parse', 'format', 'isValid', `${stripTypeScriptTypes(dateFragment)}; return { read, write };`)(dateFns.parse, dateFns.format, dateFns.isValid);
const oldTZ = process.env.TZ;
process.env.TZ = 'Asia/Shanghai';
const dateValue = '2026-10-01T08:30:45+08:00';
const dateField = { name: 'date', options: { time: true, format: "yyyy-MM-dd'T'HH:mm:ssXXX" } };
const dateInput = dateHooks.read(dateValue, dateField);
record('date-field-hooks', { original: dateValue, defaultFieldValue: dateHooks.read(dateValue, { name: 'date' }), configuredInput: dateInput, configuredSaved: dateHooks.write(dateInput, dateField), secondsPreserved: dateHooks.write(dateInput, dateField) === dateValue });
if (oldTZ === undefined) delete process.env.TZ; else process.env.TZ = oldTZ;
const originalConfig = readFileSync(join(site, 'hugo.toml'), 'utf8');
const configAfter = save(originalConfig, { title: 'A0 probe only' }, 'toml', true);
write(join(out, 'hugo-roundtrip.toml'), configAfter);
record('whole-config', { commentsBefore: originalConfig.split('\n').filter(l => l.trimStart().startsWith('#')).length, commentsAfter: configAfter.split('\n').filter(l => l.trimStart().startsWith('#')).length, emptySignatureSrcSurvives: Object.hasOwn(parse(configAfter, { format: 'toml' }).params.signature, 'src') });

const rssSource = readFileSync(join(site, 'scripts/fetch-links-rss.mjs'), 'utf8');
const rssStart = rssSource.indexOf('function unquote(');
const rssEnd = rssSource.indexOf('\nasync function', rssSource.indexOf('function parseFirstGroupRssLinks'));
assert(rssStart >= 0 && rssEnd > rssStart, 'RSS function boundaries changed');
const rssParser = new Function(`${rssSource.slice(rssStart, rssEnd)}; return parseFirstGroupRssLinks;`)();
const linksGood = 'linkGroups:\n  - name: 测试分组\n    links:\n      - url: https://example.org/\n        name: 测试站点\n        rss: https://example.org/feed.xml\n';
const linksReordered = YAML.stringify({ linkGroups: [{ name: '测试分组', links: [{ name: '测试站点', url: 'https://example.org/', rss: 'https://example.org/feed.xml' }] }] });
record('rss-key-order', { originalCount: rssParser(linksGood).length, reorderedCount: rssParser(linksReordered).length });

// Probe the same document schema libraries as the upstream editor, without its React UI,
// media transforms, or upload lifecycle. This is not an end-to-end editor test.
const { JSDOM } = requireProbe('jsdom');
const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.window = dom.window; globalThis.document = dom.window.document;
globalThis.DOMParser = dom.window.DOMParser; globalThis.Node = dom.window.Node;
globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true });
const { Editor } = requireProbe('@tiptap/core');
const { StarterKit } = requireProbe('@tiptap/starter-kit');
const { Markdown } = requireProbe('@tiptap/markdown');
const { Image } = requireProbe('@tiptap/extension-image');
const { Table, TableRow, TableHeader, TableCell } = requireProbe('@tiptap/extension-table');
const editor = new Editor({ element: document.createElement('div'), extensions: [StarterKit, Image, Table, TableRow, TableHeader, TableCell, Markdown], content: body, contentType: 'markdown' });
const richAfter = editor.getMarkdown();
write(join(out, 'richtext.before.md'), body);
write(join(out, 'richtext.after.md'), richAfter);
record('richtext-schema-probe', { exact: richAfter === body, inlineDollars: richAfter.includes('$E=mc^2$'), backslashDelimiters: richAfter.includes(String.raw`\(a^2+b^2=c^2\)`), latexFraction: richAfter.includes(String.raw`\frac{a}{b}`), shortcodeExact: richAfter.includes('{{< figure src="/hero/tt3.png" title="短代码图片" >}}'), htmlDetailsPreserved: richAfter.includes('<details>'), imagePathPreserved: richAfter.includes('/hero/tt3.png') });
editor.destroy(); dom.window.close();

const hashes = Object.fromEntries(['lib/serialization.ts', 'lib/schema.ts', 'app/api/[owner]/[repo]/[branch]/files/[path]/route.ts', 'components/ui/editor/index.tsx', 'fields/core/date/index.ts'].map(path => [path, createHash('sha256').update(read(path)).digest('hex')]));
write(join(out, 'results.json'), JSON.stringify({ upstreamVersion: JSON.parse(read('package.json')).version, hashes, limitations: ['No GitHub App login or remote save', 'Save probes call actual serialization plus extracted merge/sanitize functions; only date field hooks are separately probed, the complete HTTP route is not executed', 'Rich-text probe uses document schema libraries, not the complete React editor'], observations }, null, 2) + '\n');
console.log('Probe complete; original fixtures are ready in the disposable Hugo snapshot.');
