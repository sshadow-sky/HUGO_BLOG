export function mountMusicDrawers(root, onChange) {
  const main = root.querySelector('.music-main-card')
  const drawer = root.querySelector('[data-music-drawer]')
  const sheet = root.querySelector('[data-music-sheet]')
  const tabs = [...root.querySelectorAll('[data-music-tab]')]
  const reduced = matchMedia('(prefers-reduced-motion: reduce)')
  const titles = { search: '搜索音乐', lyrics: '歌词时光', queue: '播放队列' }
  let active = '', pageAnimation, paperAnimation, distance = 0, geometry = ''
  const compact = () => root.classList.contains('is-music-compact')
  const targetTransform = () => `translateX(${active ? distance : 0}px)`
  function cancelAnimation() { pageAnimation?.cancel(); paperAnimation?.cancel(); pageAnimation = null; paperAnimation = null }
  function syncMain() {
    const covered = compact() && !!active
    main.inert = covered
    main.setAttribute('aria-hidden', String(covered))
    root.classList.toggle('is-music-page-open', !!active)
  }
  function layout() {
    if (!root.classList.contains('is-open')) return
    const rect = main.getBoundingClientRect()
    const pageWidth = Math.min(320, rect.width - 28)
    const leftFits = rect.left >= pageWidth - 8 + 68
    const rightFits = window.innerWidth - rect.right >= pageWidth - 8 + 68
    const small = !leftFits && !rightFits
    const right = !leftFits && (rightFits || rect.left < 68)
    root.classList.toggle('is-music-compact', small)
    root.classList.toggle('is-drawer-right', right)
    const width = small ? rect.width : pageWidth
    distance = small ? 0 : (right ? 1 : -1) * (width - 8)
    const nextGeometry = `${width}:${rect.height}:${distance}:${right}`
    if (nextGeometry !== geometry) {
      geometry = nextGeometry; cancelAnimation()
      sheet.style.width = `${width}px`; sheet.style.height = `${small ? rect.height : rect.height - 8}px`
      sheet.style.top = small ? '0px' : '4px'
      sheet.style.left = right ? `${rect.width - width}px` : '0px'
      drawer.hidden = !active
    }
    sheet.style.transform = targetTransform()
    syncMain()
  }
  function show(name, immediate = false) {
    const previous = active
    const start = getComputedStyle(sheet).transform
    const paperStart = getComputedStyle(drawer).transform
    const shadeStart = getComputedStyle(drawer).filter
    active = name
    if (name) {
      drawer.dataset.page = name
      root.querySelector('[data-music-drawer-title]').textContent = titles[name]
      root.querySelectorAll('[data-music-pane]').forEach(p => { p.hidden = p.dataset.musicPane !== name })
    }
    drawer.inert = !name; drawer.setAttribute('aria-hidden', String(!name))
    tabs.forEach(tab => {
      const selected = tab.dataset.musicTab === name
      tab.classList.toggle('is-active', selected)
      tab.setAttribute('aria-expanded', String(selected))
    })
    layout(); syncMain(); onChange(name)
    if (immediate || compact() || reduced.matches || typeof drawer.animate !== 'function') {
      cancelAnimation(); sheet.style.transform = targetTransform(); drawer.hidden = !name; return
    }
    // An already extracted page stays put when only its contents change.
    if (previous && name) return
    cancelAnimation(); drawer.hidden = false
    const tactile = matchMedia('(hover: hover) and (pointer: fine)').matches
    const duration = name ? 620 : 420
    // A two-pixel overshoot stays within the eight-pixel overlap with the cover.
    const frames = tactile && name
      ? [{ transform: start }, { transform: `translateX(${distance + Math.sign(distance) * 2}px)`, offset: .82 }, { transform: targetTransform() }]
      : [{ transform: start }, { transform: targetTransform() }]
    const animation = sheet.animate(frames, { duration, easing: 'cubic-bezier(.22,.7,.18,1)', fill: 'both' })
    if (tactile) {
      const direction = Math.sign(distance) * (name ? 1 : -1)
      paperAnimation = drawer.animate([
        { transform: paperStart, filter: shadeStart },
        { transform: `perspective(900px) rotateY(${direction * 3}deg) skewY(${direction * .2}deg)`, filter: 'drop-shadow(0 5px 7px rgba(65,39,9,.18))', offset: .38 },
        { transform: `perspective(900px) rotateY(${-direction * .5}deg)`, filter: 'drop-shadow(0 1px 2px rgba(65,39,9,.06))', offset: .82 },
        { transform: 'none', filter: 'none' },
      ], { duration, easing: 'ease-in-out', fill: 'both' })
    }
    pageAnimation = animation
    animation.onfinish = () => {
      if (pageAnimation !== animation) return
      drawer.hidden = !active; cancelAnimation()
    }
  }
  tabs.forEach(tab => tab.addEventListener('click', () => {
    const name = tab.dataset.musicTab
    show(active === name ? '' : name)
    if (active === 'search') root.querySelector('[data-music-query]').focus({ preventScroll: true })
  }))
  const close = () => {
    const tab = tabs.find(t => t.dataset.musicTab === active)
    show(''); tab?.focus({ preventScroll: true })
  }
  root.querySelector('[data-music-drawer-close]').addEventListener('click', close)
  root.addEventListener('music:layout', layout)
  reduced.addEventListener('change', () => { cancelAnimation(); sheet.style.transform = targetTransform(); drawer.hidden = !active })
  return {
    get active() { return active },
    close() { show('', true) },
    escape() { if (!active) return false; close(); return true },
    focus() { tabs[0]?.focus({ preventScroll: true }) },
  }
}
