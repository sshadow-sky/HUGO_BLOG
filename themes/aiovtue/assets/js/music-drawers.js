export function mountMusicDrawers(root, onChange) {
  const panel = root.querySelector('#sakura-music-panel')
  const drawer = root.querySelector('[data-music-drawer]')
  const tabs = [...root.querySelectorAll('[data-music-tab]')]
  const pin = root.querySelector('[data-music-pin]')
  let active = '', pinned = false, timer, pageAnimation
  const titles = { search: '搜索音乐', lyrics: '歌词时光', queue: '播放队列' }
  const compact = () => root.classList.contains('is-music-compact')
  function layout() {
    if (!root.classList.contains('is-open')) return
    const rect = panel.getBoundingClientRect()
    const leftFits = rect.left >= 372, rightFits = window.innerWidth - rect.right >= 372
    root.classList.toggle('is-music-compact', window.innerWidth < 760 || (!leftFits && !rightFits))
    root.classList.toggle('is-drawer-right', !leftFits && rightFits)
    if (!compact()) {
      const height = root.querySelector('.music-main-card').getBoundingClientRect().height
      drawer.style.left = `${leftFits ? rect.left - 360 : rect.right + 40}px`
      drawer.style.top = `${rect.top}px`
      drawer.style.height = `${height}px`
    } else { drawer.style.left = ''; drawer.style.top = ''; drawer.style.height = '' }
  }
  function animatePage(open) {
    pageAnimation?.cancel(); pageAnimation = null
    if (compact() || matchMedia('(prefers-reduced-motion: reduce)').matches || typeof drawer.animate !== 'function') { drawer.hidden = !open; return }
    drawer.hidden = false
    const right = root.classList.contains('is-drawer-right')
    const folded = { clipPath: right ? 'inset(0 100% 0 0 round 12px)' : 'inset(0 0 0 100% round 12px)', transform: `translateX(${right ? -24 : 24}px)`, opacity: .5 }
    const unfolded = { clipPath: 'inset(0 0 0 0 round 12px)', transform: 'translateX(0)', opacity: 1 }
    const animation = drawer.animate(open ? [folded, unfolded] : [unfolded, folded], { duration: open ? 420 : 240, easing: 'cubic-bezier(.22,.7,.18,1)', fill: 'both' })
    pageAnimation = animation
    animation.onfinish = () => {
      if (pageAnimation !== animation) return
      drawer.hidden = !open; animation.cancel(); pageAnimation = null
    }
  }
  function show(name, fixed = false, replay = false, immediate = false) {
    const previous = active
    clearTimeout(timer); active = name; pinned = !!name && fixed
    if (name) { drawer.hidden = false; drawer.dataset.page = name }
    drawer.inert = !name
    drawer.setAttribute('aria-hidden', String(!name))
    tabs.forEach(tab => {
      const selected = tab.dataset.musicTab === name
      tab.classList.toggle('is-active', selected); tab.classList.toggle('is-pinned', selected && pinned)
      tab.setAttribute('aria-expanded', String(selected))
    })
    if (name) root.querySelectorAll('[data-music-pane]').forEach(p => { p.hidden = p.dataset.musicPane !== name })
    if (name) root.querySelector('[data-music-drawer-title]').textContent = titles[name]
    pin.setAttribute('aria-pressed', String(pinned)); pin.title = pinned ? '取消固定' : '固定抽屉'
    pin.setAttribute('aria-label', pin.title)
    layout(); onChange(name)
    if (immediate) { pageAnimation?.cancel(); pageAnimation = null; drawer.hidden = !name }
    else if (previous !== name || replay) animatePage(!!name)
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
      else { show(name, true, true); if (name === 'search') root.querySelector('[data-music-query]').focus({ preventScroll: true }) }
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
    close() { show('', false, false, true) },
    escape() { if (!active) return false; close(); return true },
    focus() { tabs[0]?.focus({ preventScroll: true }) },
  }
}
