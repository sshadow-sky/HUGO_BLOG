import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = readFileSync(new URL('../../themes/aiovtue/assets/js/home-clock.js', import.meta.url), 'utf8')
  .replace(/^import .*\r?\n/gm, '').replaceAll('export function ', 'function ')
const { clockSnapshot } = new Function(source + ';return {clockSnapshot}')()

test('clock uses local calendar boundaries and resets at midnight/new year', () => {
  const start = clockSnapshot(new Date(2026, 0, 1, 0, 0, 0))
  assert.equal(start.time, '00:00:00')
  assert.equal(start.day, 0)
  assert.equal(start.year, 0)
  assert.equal(start.night, true)
  const noon = clockSnapshot(new Date(2026, 0, 1, 12))
  assert.equal(noon.day, .5)
  assert.equal(noon.night, false)
  const end = clockSnapshot(new Date(2026, 11, 31, 23, 59, 59))
  assert(end.year > .9999 && end.year < 1)
  assert.equal(clockSnapshot(new Date(2027, 0, 1)).year, 0)
})

test('leap year progress uses the actual interval between local year boundaries', () => {
  const now = new Date(2024, 2, 1)
  assert.equal(clockSnapshot(now).year, (now - new Date(2024, 0, 1)) / (new Date(2025, 0, 1) - new Date(2024, 0, 1)))
})

test('reinitialization replaces timer; hidden tabs pause; page cleanup removes listeners', () => {
  const document = Object.assign(new EventTarget(), { hidden: false, querySelectorAll: () => [card], querySelector: () => null })
  const card = { querySelector: () => null }
  const timers = new Map(), cleanups = []; let id = 0
  const { initHomeClock } = new Function('document', 'setTimeout', 'clearTimeout', 'registerPageCleanup', 'mountHomeWeather', 'mountHomeWelcome', source + ';return {initHomeClock}')(
    document, fn => { timers.set(++id, fn); return id }, key => timers.delete(key), fn => cleanups.push(fn), () => () => {}, () => ({updateLocation(){},updateTime(){},cleanup(){}}))
  initHomeClock(); initHomeClock()
  assert.equal(timers.size, 1)
  document.hidden = true; document.dispatchEvent(new Event('visibilitychange'))
  assert.equal(timers.size, 0)
  document.hidden = false; document.dispatchEvent(new Event('visibilitychange'))
  assert.equal(timers.size, 1)
  cleanups.forEach(fn => fn())
  assert.equal(timers.size, 0)
  document.dispatchEvent(new Event('visibilitychange'))
  assert.equal(timers.size, 0)
})
