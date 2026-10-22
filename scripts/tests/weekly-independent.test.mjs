import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs'
import { resolve, join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const parent = join(root, '.local/weekly-independent')
mkdirSync(parent, { recursive: true })
const fixture = mkdtempSync(join(parent, 'acceptance-'))
const put = (name, content) => { const p = join(fixture, name); mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, content) }
put('content/posts/_index.md', '---\ntitle: Articles\n---\n')
put('content/weekly/_index.md', '---\ntitle: Weekly\naliases: ["/posts/weekly/"]\noutputs: ["HTML", "RSS"]\n---\n')
put('content/posts/ordinary/index.md', '---\ntitle: Ordinary fixture\ndate: 2026-01-01\ntags: [shared, article-tag]\ncategories: [shared, article-category]\n---\nOrdinary body')
put('content/weekly/one/index.md', '---\ntitle: Weekly fixture\ndate: 2026-02-01\nissue: 1\nmath: true\naliases: ["/posts/weekly/one/"]\ncomment_path: /posts/weekly/one/\ntags: [shared, weekly-tag]\ncategories: [shared, weekly-category]\n---\n## Weekly heading\n\nFormula \\(x^2\\).\n\n![Photo](/photo.png)\n')
put('content/weekly/draft/index.md', '---\ntitle: Weekly private draft\ndate: 2026-03-01\ndraft: true\n---\nPrivate')
put('content/posts/weekly/unmigrated/index.md', '---\ntitle: Unmigrated weekly\ndate: 2026-01-02\ntags: [legacy-only]\ncategories: [legacy-only]\n---\nLegacy')
for (const taxonomy of ['archives', 'tags', 'categories']) put(`content/${taxonomy}/_index.md`, `---\ntitle: ${taxonomy}\n---\n`)
put('content/search.md', '---\ntitle: Search\nlayout: search\n---\n')
put('config.toml', '[params.home]\nlayout="list"\n[params.live2d]\nenable=false\n[params.music]\nenable=false\n[params.effects]\nenable=false\n')
execFileSync(process.env.HUGO_BIN || 'D:/new_blog/.tools/hugo/hugo.exe', ['--source', root, '--config', `${join(root, 'hugo.toml')},${join(fixture, 'config.toml')}`, '--contentDir', join(fixture, 'content'), '--destination', join(fixture, 'public'), '--cacheDir', join(fixture, 'cache'), '--baseURL', 'https://example.test/', '--quiet'], { cwd: root, stdio: 'pipe' })
const page = path => readFileSync(join(fixture, 'public', path), 'utf8')
const json = (html, id) => { const value = JSON.parse(html.match(new RegExp(`<script[^>]+id="${id}"[^>]*>([\\s\\S]*?)</script>`))[1]); return typeof value === 'string' ? JSON.parse(value) : value }

test('homepage has latest weekly outside the ordinary article stream', () => {
  const html = page('index.html')
  assert.match(html, /id="home-latest-weekly"/)
  assert.match(html, /class="home-list-main">\s*<section[^>]+class="home-latest-weekly"/)
  const weekly = html.match(/<section[^>]+class="home-latest-weekly"[\s\S]*?<\/section>/)[0]
  assert.match(weekly, /Weekly fixture/)
  assert.doesNotMatch(html.replace(weekly, ''), /Weekly fixture|Weekly private draft|Unmigrated weekly/)
  assert.match(html, /Ordinary fixture/)
})
test('weekly list, RSS and legacy redirects use independent canonical URLs', () => {
  assert.match(page('weekly/index.html'), /weekly-card--featured/)
  assert.match(page('weekly/index.html'), /Weekly fixture/)
  assert.doesNotMatch(page('weekly/index.html'), /Ordinary fixture|Weekly private draft/)
  assert.match(page('weekly/index.xml'), /https:\/\/example.test\/weekly\/one\//)
  assert.doesNotMatch(page('weekly/index.xml'), /Ordinary fixture|Weekly private draft/)
  assert.match(page('posts/weekly/one/index.html'), /https:\/\/example.test\/weekly\/one\//)
})
test('legacy weekly RSS stays dynamic and advertises the canonical weekly feed', () => {
  const legacy = page('posts/weekly/index.xml')
  const canonical = page('weekly/index.xml')
  assert.match(legacy, /<title>Weekly fixture<\/title>/)
  assert.match(legacy, /<atom:link href="https:\/\/example.test\/weekly\/index.xml" rel="self"/)
  assert.deepEqual(legacy.match(/<item>[\s\S]*?<\/item>/g), canonical.match(/<item>[\s\S]*?<\/item>/g))
  assert.doesNotMatch(legacy, /Ordinary fixture|Unmigrated weekly|Weekly private draft/)
})
test('article archive, taxonomy, article RSS and counts exclude new and old weekly paths', () => {
  for (const name of ['archives/index.html', 'posts/index.html', 'tags/index.html', 'categories/index.html', 'index.xml', 'posts/index.xml']) {
    assert.doesNotMatch(page(name), /Weekly fixture|Unmigrated weekly|weekly-tag|weekly-category|legacy-only/, name)
    assert.match(page(name), /Ordinary fixture/, name)
  }
  const categories = json(page('categories/index.html'), 'categories-chart-data')
  assert.equal(categories.find(x => x.categoryKey === 'shared').value, 1)
  const stats = page('index.html').match(/home-list-sidebar-site-info__stats">([\s\S]*?)<\/div>/)[1]
  assert.deepEqual([...stats.matchAll(/stat-value">(\d+)/g)].map(x => +x[1]), [1, 2, 2])
})
test('search includes marked weekly results and excludes drafts', () => {
  const items = json(page('search/index.html'), 'search-index-data')
  assert.equal(items.find(x => x.title === 'Weekly fixture').kind, 'weekly')
  assert.equal(items.find(x => x.title === 'Ordinary fixture').kind, 'article')
  assert(!items.some(x => x.title === 'Weekly private draft'))
  assert(!items.some(x => x.title === 'Unmigrated weekly'))
})
test('weekly detail retains math, comment identity, lightbox, copyright and return navigation', () => {
  const html = page('weekly/one/index.html')
  assert.match(html, /sakura-weekly-post/)
  assert.match(html, /class="katex/)
  assert.match(html, /data-comment-path="\/posts\/weekly\/one\/"/)
  assert.match(html, /data-sakura-page-style="lightbox"/)
  assert.match(html, /class="post-copyright"/)
  assert.match(html, /href="\/weekly\/"/)
  assert.match(html, /href="\/weekly\/index.xml"/)
  assert.doesNotMatch(html, /href="\/categories\/"\?category=weekly/)
})
console.log(`Fixture output: ${fixture}`)
