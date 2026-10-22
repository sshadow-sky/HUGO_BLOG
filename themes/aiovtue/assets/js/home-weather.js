const REFRESH = 15 * 60 * 1000


export function parseWeather(data) {
  const current = data?.current
  if (!current || !Number.isFinite(current.temperature_2m) || ![0, 1].includes(current.is_day) ||
      !Number.isFinite(current.time) || Math.abs(Date.now() - current.time * 1000) > 90 * 60 * 1000) throw new Error('Invalid weather')
  const code = current.weather_code
  const groups = [
    [[0, 1], 'clear', '晴'], [[2, 3], 'cloud', '多云 / 阴'], [[45, 48], 'fog', '雾'],
    [[51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82], 'rain', '雨'],
    [[71, 73, 75, 77, 85, 86], 'snow', '雪'], [[95, 96, 99], 'storm', '雷雨'],
  ]
  const group = groups.find(([codes]) => codes.includes(code))
  if (!group) throw new Error('Unknown weather')
  return { scene: group[1], label: group[2], temperature: `${Math.round(current.temperature_2m)}°C`, day: current.is_day ? 'day' : 'night' }
}

// Always active while mounted; browser location permission remains authoritative.
export function mountHomeWeather(card, onLocation = () => {}) {
  const status = card.querySelector('[data-weather-status]')
  const temperature = card.querySelector('[data-weather-temperature]')
  if (!status || !temperature) return () => {}
  let disposed = false, busy = false, generation = 0, nextUpdate = 0, hasWeather = false
  let controller, refreshTimer, deadline
  const clearScene = () => { card.removeAttribute('data-weather'); card.removeAttribute('data-weather-day') }
  const request = () => {
    if (disposed || busy || document.hidden) return
    busy = true
    const version = ++generation
    let located = false, finished = false
    clearTimeout(refreshTimer)
    if (!hasWeather) {
      status.textContent = '天气加载中'
      temperature.textContent = ''
      card.setAttribute('data-weather-state', 'loading')
    }
    const valid = () => !disposed && !finished && version === generation
    const finish = message => {
      if (!valid()) return
      finished = true; busy = false; clearTimeout(deadline)
      if (message) {
        hasWeather = false; clearScene(); temperature.textContent = ''; status.textContent = message
        card.setAttribute('data-weather-state', 'unavailable')
      }
      nextUpdate = Date.now() + REFRESH
      if (!document.hidden) refreshTimer = setTimeout(request, REFRESH)
    }
    if (!navigator.geolocation || !window.isSecureContext) { onLocation(null); finish('定位暂不可用'); return }
    deadline = setTimeout(() => {
      if (!valid()) return
      if (!located) onLocation(null)
      finish('天气暂时不可用'); controller?.abort()
    }, 25000)
    navigator.geolocation.getCurrentPosition(async position => {
      if (!valid()) return
      const {latitude, longitude, accuracy} = position.coords
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) { onLocation(null); finish('定位暂不可用'); return }
      located = true
      onLocation({latitude, longitude, accuracy})
      const params = new URLSearchParams({latitude: latitude.toFixed(2), longitude: longitude.toFixed(2), current: 'temperature_2m,weather_code,is_day', timeformat: 'unixtime', forecast_days: '1'})
      controller = new AbortController()
      try {
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, {signal: controller.signal, credentials: 'omit', referrerPolicy: 'no-referrer'})
        if (!response.ok) throw new Error('Weather unavailable')
        const weather = parseWeather(await response.json())
        if (!valid()) return
        hasWeather = true
        card.setAttribute('data-weather', weather.scene); card.setAttribute('data-weather-day', weather.day)
        card.setAttribute('data-scene', weather.day); card.setAttribute('data-weather-state', 'ready')
        status.textContent = weather.label; temperature.textContent = weather.temperature
        finish()
      } catch { finish('天气暂时不可用') }
    }, error => {
      if (!valid()) return
      onLocation(null); finish(error.code === 1 ? '定位未授权' : '定位暂不可用')
    }, {enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000})
  }
  const visibility = () => {
    clearTimeout(refreshTimer)
    if (!document.hidden && !busy) {
      if (Date.now() >= nextUpdate) request()
      else refreshTimer = setTimeout(request, nextUpdate - Date.now())
    }
  }
  document.addEventListener('visibilitychange', visibility)
  request()
  return () => {
    disposed = true; generation++; controller?.abort(); clearTimeout(refreshTimer); clearTimeout(deadline); clearScene()
    document.removeEventListener('visibilitychange', visibility)
  }
}