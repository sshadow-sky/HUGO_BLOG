export function mountMusicDrawers(root, onChange) {
  const panel = root.querySelector('#sakura-music-panel')
  const drawer = root.querySelector('[data-music-drawer]')
  const tabs = [...root.querySelectorAll('[data-music-tab]')]
  const pin = root.querySelector('[data-music-pin]')
  let active = '', pinned = false, timer
  const titles = { search: '搜索音乐', lyrics: '歌词时光', queue: '播放队列' }
  const compact = () => root.classList.contains('is-music-compact')
  function layout() {
    if (!root.classList.contains('is-open')) return
    const rect = panel.getBoundingClientRect()
    const leftFits = rect.left >= 372, rightFits = window.innerWidth - rect.right >= 372
    root.classList.toggle('is-music-compact', window.innerWidth < 760 || (!leftFits && !rightFits))
    root.classList.toggle('is-drawer-right', !leftFits && rightFits)
    if (!compact()) {
      const height = Math.min(400, window.innerHeight - 24)
      drawer.style.left = `${leftFits ? rect.left - 360 : rect.right + 40}px`
      drawer.style.top = `${Math.max(12, Math.min(rect.bottom - height, window.innerHeight - height - 12))}px`
      drawer.style.height = `${height}px`
    } else { drawer.style.left = ''; drawer.style.top = ''; drawer.style.height = '' }
  }
  function show(name, fixed = false) {
    clearTimeout(timer); active = name; pinned = !!name && fixed
    drawer.hidden = !name
    tabs.forEach(tab => {
      const selected = tab.dataset.musicTab === name
      tab.classList.toggle('is-active', selected); tab.classList.toggle('is-pinned', selected && pinned)
      tab.setAttribute('aria-expanded', String(selected))
    })
    root.querySelectorAll('[data-music-pane]').forEach(p => { p.hidden = p.dataset.musicPane !== name })
    if (name) root.querySelector('[data-music-drawer-title]').textContent = titles[name]
    pin.setAttribute('aria-pressed', String(pinned)); pin.title = pinned ? '取消固定' : '固定抽屉'
    pin.setAttribute('aria-label', pin.title)
    layout(); onChange(name)
  }
  const scheduleClose = () => {
    clearTimeout(timer)
    if (pinned || compact()) return
    timer = setTimeout(() => {
      if (pinned || panel.matches(':hover') || drawer.contains(document.activeElement)) return
      show('')
    }, 250)
  }
  tabs.forEach(tab => {
    const name = tab.dataset.musicTab
    tab.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse' && !compact() && !pinned) show(name) })
    tab.addEventListener('click', () => {
      if (active === name && pinned) show('')
      else { show(name, true); if (name === 'search') root.querySelector('[data-music-query]').focus({ preventScroll: true }) }
    })
  })
  panel.addEventListener('pointerenter', () => clearTimeout(timer))
  panel.addEventListener('pointerleave', scheduleClose)
  panel.addEventListener('focusout', scheduleClose)
  // Input focus pins the drawer so entering a query cannot make it disappear.
  drawer.addEventListener('focusin', event => { if (active && !pinned && !event.target.closest('[data-music-pin], [data-music-drawer-close]')) show(active, true) })
  pin.addEventListener('click', () => show(active, !pinned))
  const close = () => { const tab = tabs.find(t => t.dataset.musicTab === active); show(''); tab?.focus({ preventScroll: true }) }
  root.querySelector('[data-music-drawer-close]').addEventListener('click', close)
  root.addEventListener('music:layout', layout)
  return {
    get active() { return active },
    close() { show('') },
    escape() { if (!active) return false; close(); return true },
    focus() { tabs[0]?.focus({ preventScroll: true }) },
  }
}
