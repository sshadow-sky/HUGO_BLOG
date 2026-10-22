import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = readFileSync(new URL('../../themes/aiovtue/assets/js/comments.js', import.meta.url), 'utf8')
const normalize = source.slice(source.indexOf('export function normalizeCommentPath('), source.indexOf('function isWalineCommentSuccess(')).replace('export ', '')
const mount = source.slice(source.indexOf('async function mountPageCommentsNow('), source.indexOf('export function initPageComments('))

for (const provider of ['twikoo', 'waline']) {
  test(`${provider} keeps the migrated thread identity and picks up the next PJAX page`, async () => {
    const calls = []
    const section = { dataset: { commentProvider: provider, commentPath: '/posts/weekly/retained/' } }
    const root = { dataset: {} }
    const document = { getElementById: id => id === 'page-comment-section' ? section : root }
    const window = { location: { pathname: '/weekly/retained/' } }
    const run = new Function('document', 'window', 'waitForCommentMountSurface', 'getCommentProvider', 'mountTwikoo', 'mountWaline', 'TWIKOO_COMMENT_PLACEHOLDER', `${normalize}\n${mount}\nreturn mountPageCommentsNow`)(document, window, async () => {}, () => provider, async (_, options) => calls.push(options.path), async (_, options) => calls.push(options.path), '')
    await run()
    assert.deepEqual(calls, ['/posts/weekly/retained'])
    section.dataset.commentPath = ''
    window.location.pathname = '/weekly/new/'
    await run()
    assert.deepEqual(calls, ['/posts/weekly/retained', '/weekly/new'])
    section.dataset.commentPath = '/posts/ordinary/'
    window.location.pathname = '/posts/ordinary/'
    await run()
    assert.deepEqual(calls, ['/posts/weekly/retained', '/weekly/new', '/posts/ordinary'])
  })
}
