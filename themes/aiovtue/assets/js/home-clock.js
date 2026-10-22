import { registerPageCleanup } from './page-cleanup.js'
import { mountHomeWeather } from './home-weather.js'
import { mountHomeWelcome } from './home-welcome.js'

const pad = value => String(value).padStart(2, '0')

export function clockSnapshot(now = new Date()) {
  const year = now.getFullYear(), month = now.getMonth(), date = now.getDate()
  const start = new Date(year, month, date), next = new Date(year, month, date + 1)
  const yearStart = new Date(year, 0, 1), yearEnd = new Date(year + 1, 0, 1)
  const hour = now.getHours()
  return {
    time: `${pad(hour)}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`,
    date: `${year}.${pad(month + 1)}.${pad(date)} · ${['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][now.getDay()]}`,
    day: (now - start) / (next - start),
    year: (now - yearStart) / (yearEnd - yearStart),
    night: hour < 6 || hour >= 18,
    scene: hour < 6 || hour >= 18 ? 'night' : 'day',
  }
}

let cleanupClock = null

export function initHomeClock() {
  cleanupClock?.()
  const cards = [...document.querySelectorAll('[data-home-clock]')]
  if (!cards.length) return
  const welcome = mountHomeWelcome(document.querySelector('[data-home-welcome]'))
  const weatherCleanups = cards.map(card => mountHomeWeather(card, welcome.updateLocation))
  let timer = null, stopped = false
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const write = (card, selector, text) => {
    const element = card.querySelector(selector)
    if (element && element.textContent !== text) element.textContent = text
  }
  const update = () => {
    const now = new Date(), value = clockSnapshot(now)
    welcome.updateTime(now)
    for (const card of cards) {
      const scene = card.getAttribute?.('data-weather-day') || value.scene
      card.setAttribute?.('data-scene', scene)
      write(card, '[data-clock-time]', value.time)
      card.querySelector('[data-clock-time]')?.setAttribute('datetime', now.toISOString())
      write(card, '[data-clock-date]', value.date)
      write(card, '[data-clock-phase]', scene === 'night' ? '☾ 夜色' : '☀ 日光')
      write(card, '[data-clock-zone]', `本地时间 · ${zone}`)
      for (const unit of ['day', 'year']) {
        const percent = Math.floor(value[unit] * 1000) / 10
        const progress = card.querySelector(`[data-clock-${unit}]`)
        if (progress) {
          progress.value = value[unit]
          progress.setAttribute('aria-valuetext', `已过 ${percent.toFixed(1)}%`)
        }
        write(card, `[data-clock-${unit}-text]`, `${percent.toFixed(1)}%`)
      }
    }
  }
  const tick = () => {
    clearTimeout(timer)
    if (stopped || document.hidden) return
    update()
    timer = setTimeout(tick, 1000 - (Date.now() % 1000))
  }
  const cleanup = () => {
    stopped = true
    clearTimeout(timer)
    document.removeEventListener('visibilitychange', tick)
    weatherCleanups.forEach(cleanup => cleanup())
    welcome.cleanup()
    if (cleanupClock === cleanup) cleanupClock = null
  }
  cleanupClock = cleanup
  document.addEventListener('visibilitychange', tick)
  tick()
  registerPageCleanup(cleanup)
}
