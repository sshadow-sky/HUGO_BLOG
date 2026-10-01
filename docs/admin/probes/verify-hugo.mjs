// Run after building before/after fixtures into results/build-before and build-after.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const out = resolve(process.argv[2]);
const { JSDOM } = createRequire(join(dirname(out), 'package.json'))('jsdom');
const routes = ['posts/a0-中文文章', 'posts/a0-gallery', 'excalidraw/a0-board'];
const results = [];
for (const route of routes) {
  const before = new JSDOM(readFileSync(join(out, 'build-before', route, 'index.html'), 'utf8'));
  const after = new JSDOM(readFileSync(join(out, 'build-after', route, 'index.html'), 'utf8'));
  const a = before.window.document.querySelector('#content article');
  const b = after.window.document.querySelector('#content article');
  assert(a && b, `Missing rendered article: ${route}`);
  assert.equal(a.outerHTML, b.outerHTML, `Rendered article differs after serializer save: ${route}`);
  results.push({ route, articleHtmlIdentical: true, formulaCount: b.querySelectorAll('.katex').length, detailsCount: b.querySelectorAll('details').length });
  if (route.includes('中文')) { assert.equal(b.querySelectorAll('.katex').length, 4); assert.equal(b.querySelectorAll('details').length, 1); assert(b.querySelector('figure')); }
  if (route.includes('gallery')) assert(b.classList.contains('sakura-gallery-post-page'));
  if (route.includes('board')) {
    const src = b.querySelector('[data-excalidraw-src]')?.getAttribute('data-excalidraw-src');
    assert(src?.endsWith('/diagram.excalidraw'));
    assert(existsSync(join(out, 'build-after', src)));
  }
  before.window.close(); after.window.close();
}
if (existsSync(join(out, 'build-richtext'))) {
  const dom = new JSDOM(readFileSync(join(out, 'build-richtext/posts/a0-中文文章/index.html'), 'utf8'));
  results.push({ route: 'rich-text-schema-output', formulaCount: dom.window.document.querySelector('#content article').querySelectorAll('.katex').length, detailsCount: dom.window.document.querySelector('#content article').querySelectorAll('details').length });
  dom.window.close();
}
if (existsSync(join(out, 'build-production'))) {
  for (const route of routes) assert(!existsSync(join(out, 'build-production', route, 'index.html')), `Draft leaked: ${route}`);
  results.push({ productionDraftRoutesExcluded: true });
}
writeFileSync(join(out, 'hugo-results.json'), JSON.stringify(results, null, 2) + '\n');
console.log(JSON.stringify(results, null, 2));
