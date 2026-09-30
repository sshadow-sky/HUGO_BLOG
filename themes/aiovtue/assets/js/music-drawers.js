export function mountMusicDrawers(root, onChange) {
  const main = root.querySelector('.music-main-card')
  const drawer = root.querySelector('[data-music-drawer]')
  const sheet = root.querySelector('[data-music-sheet]')
  const paperLight = root.querySelector('.music-paper-light')
  const tabs = [...root.querySelectorAll('[data-music-tab]')]
  const reduced = matchMedia('(prefers-reduced-motion: reduce)')
  const titles = { search: '搜索音乐', lyrics: '歌词时光', queue: '播放队列' }
  let active = '', pageAnimation, paperAnimation, lightAnimation, distance = 0, geometry = ''
  const compact = () => root.classList.contains('is-music-compact')
  const targetTransform = () => `translateX(${active ? distance : 0}px)`
  function cancelAnimation() {
    pageAnimation?.cancel(); paperAnimation?.cancel(); lightAnimation?.cancel()
    pageAnimation = null; paperAnimation = null; lightAnimation = null
  }
  function syncMain() {
    const covered = compact() && !!active
    main.inert = covered
    main.setAttribute('aria-hidden', String(covered))
    root.classList.toggle('is-music-page-open', !!active)
  }
  function layout() {
    if (!root.classList.contains('is-open')) return
    // The book surface can animate; measure its unscaled positioning container.
    const bounds = root.querySelector('#sakura-music-panel').getBoundingClientRect()
    const rect = { left: bounds.left, right: bounds.right, width: main.offsetWidth, height: main.offsetHeight }
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
    const shadeStart = getComputedStyle(drawer).boxShadow
    const lightStart = getComputedStyle(paperLight).opacity
    const lightTransform = getComputedStyle(paperLight).transform
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
    // Preserve position on reversal, and shorten the return for a partly extracted page.
    const remaining = Math.min(1, Math.abs((name ? distance : 0) - new DOMMatrixReadOnly(start).m41) / Math.max(1, Math.abs(distance)))
    const duration = Math.max(120, (name ? 600 : 420) * Math.sqrt(remaining))
    const animation = sheet.animate([{ transform: start }, { transform: targetTransform() }], {
      duration, easing: 'cubic-bezier(.22,.78,.2,1)', fill: 'both',
    })
    if (tactile) {
      const direction = Math.sign(distance)
      const shadeRest = getComputedStyle(drawer).boxShadow
      paperAnimation = drawer.animate([
        { boxShadow: shadeStart },
        { boxShadow: '0 3px 0 -1px var(--book-paper), 0 4px 0 -1px var(--book-edge), 0 14px 28px rgba(48,32,19,.18)', offset: .35 },
        { boxShadow: shadeRest },
      ], { duration, easing: 'ease-in-out', fill: 'both' })
      // Only the decorative layer bends/lightens; text and tab attachment stay stable.
      lightAnimation = paperLight.animate([
        { opacity: lightStart, transform: lightTransform },
        { opacity: name ? .75 : .4, transform: `translateX(${direction * 3}px) scaleX(.98)`, offset: .3 },
        { opacity: .2, transform: 'translateX(0) scaleX(1)', offset: .75 },
        { opacity: 0, transform: 'none' },
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
