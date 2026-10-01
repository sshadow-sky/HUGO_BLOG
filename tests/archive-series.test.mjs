import test from 'node:test'
import assert from 'node:assert/strict'
import { buildArchiveSeries } from '../themes/aiovtue/assets/js/archive-series.js'

const now = new Date('2026-10-01T02:00:00Z')
test('archive starts at the first published month and fills gaps', () => {
  assert.deepEqual(buildArchiveSeries([{ date: '2026-08-23' }, { date: '2026-10-01' }, { date: '2026-10-01' }], { now }), {
    months: ['2026-08', '2026-09', '2026-10'], counts: [1, 0, 2],
  })
})
test('empty archive data uses the current site month, including the Shanghai month boundary', () => {
  assert.deepEqual(buildArchiveSeries([], { now: new Date('2026-09-30T17:00:00Z') }), { months: ['2026-10'], counts: [0] })
})
test('a manual earlier start is preserved, but a late start never drops articles', () => {
  const posts = [{ date: '2026-08-10' }]
  assert.equal(buildArchiveSeries(posts, { now, startMonth: '2026-07' }).months[0], '2026-07')
  assert.equal(buildArchiveSeries(posts, { now, startMonth: '2026-12' }).months[0], '2026-08')
})
test('invalid dates and invalid configured start are ignored', () => {
  assert.deepEqual(buildArchiveSeries([{ date: '2026-13-01' }, { date: '' }, {}, { date: '2026-10-01' }], { now, startMonth: 'bad' }), { months: ['2026-10'], counts: [1] })
})
test('year boundaries and explicitly rendered future articles stay in range', () => {
  assert.deepEqual(buildArchiveSeries([{ date: '2026-12-01' }, { date: '2027-01-01' }], { now: new Date('2026-12-15T00:00:00Z') }), { months: ['2026-12', '2027-01'], counts: [1, 1] })
})
