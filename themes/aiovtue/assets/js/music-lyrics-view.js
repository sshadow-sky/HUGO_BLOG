import { createLyricsLoader, lyricIndex } from './music-lyrics.js'

export function mountLyricsView(root, api) {
  const get = name => root.querySelector(`[data-music-lyrics${name ? '-' + name : ''}]`)
  const list = get(''), follow = get('follow'), retry = get('retry')
  let time = 0, visible = false, current = -1, reference, autoFollow = true, trackKey = ''
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches
  function sync(force = false) {
    if (!visible) return
    const index = lyricIndex(loader.state.lines, time)
    if (index === current && !force) return
    if (current >= 0) list.children[current]?.removeAttribute('aria-current')
    current = index
    const line = list.children[index]
    if (line) {
      line.setAttribute('aria-current', 'true')
      if (autoFollow) list.scrollTo({ top: line.offsetTop - list.clientHeight / 2 + line.offsetHeight / 2, behavior: reduced() ? 'instant' : 'smooth' })
    } else if (autoFollow) list.scrollTop = 0
  }
  const messages = { idle: '选一首歌，让文字随音乐流动', loading: '正在寻找歌词…', synced: '跟随播放进度', plain: '此歌词没有时间轴', empty: '暂无歌词，静静听一会儿' }
  const loader = createLyricsLoader({ api, onChange(state) {
    get('status').textContent = state.status === 'error' ? state.error : messages[state.status]
    retry.hidden = state.status !== 'error'
    if (reference !== state.lines) {
      reference = state.lines; current = -1
      list.replaceChildren(...state.lines.map(line => { const p = document.createElement('p'); p.textContent = line.text || '♪'; return p }))
      if (state.plain) { const p = document.createElement('p'); p.className = 'music-lyrics-plain'; p.textContent = state.plain; list.append(p) }
      list.scrollTop = 0
    }
    follow.hidden = autoFollow || state.status !== 'synced'
    requestAnimationFrame(() => sync(true))
  } })
  const pauseFollow = () => { if (loader.state.status === 'synced') { autoFollow = false; follow.hidden = false } }
  list.addEventListener('wheel', pauseFollow, { passive: true })
  list.addEventListener('touchstart', pauseFollow, { passive: true })
  list.addEventListener('pointerdown', pauseFollow)
  list.addEventListener('keydown', e => { if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(e.key)) pauseFollow() })
  follow.addEventListener('click', () => { autoFollow = true; follow.hidden = true; sync(true) })
  retry.addEventListener('click', () => loader.retry())
  return {
    update(track, nextTime, open) {
      const key = track ? `${track.source}:${track.id}` : ''
      if (key !== trackKey) { trackKey = key; autoFollow = true; follow.hidden = true }
      const opening = open && !visible
      time = nextTime; visible = open
      loader.update(track, visible)
      sync(opening)
    },
  }
}
