import { mountMusicView } from './music-view.js'
const DEFAULT_STORAGE_KEY = 'sakura-music-state'
function readState(key) { try { return JSON.parse(localStorage.getItem(key) || '{}') || {} } catch { return {} } }
function writeState(key, state) { try { localStorage.setItem(key, JSON.stringify(state)) } catch {} }
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function readMusicGap(root) {
  const raw = getComputedStyle(root).getPropertyValue('--sakura-music-gap').trim()
  const parsed = Number.parseFloat(raw)
  return Number.isFinite(parsed) ? parsed : 10
}

function clampMusicRootPosition(root, x, y) {
  const maxX = Math.max(0, window.innerWidth - root.offsetWidth)
  const maxY = Math.max(0, window.innerHeight - root.offsetHeight)
  return {
    x: clamp(x, 0, maxX),
    y: clamp(y, 0, maxY),
  }
}

function resetMusicPanelPosition(panel) {
  if (!panel) return
  panel.style.top = ''
  panel.style.left = ''
  panel.style.bottom = ''
  panel.style.right = ''
  panel.style.transform = ''
  panel.classList.remove('is-fitted')
}

function fitMusicPanelInViewport(root, panel, toggle) {
  if (!panel || !toggle) return
  if (!panel.classList.contains('is-visible')) return

  const margin = 12
  const gap = readMusicGap(root)
  const toggleRect = toggle.getBoundingClientRect()
  const rootRect = root.getBoundingClientRect()
  const panelWidth = panel.offsetWidth
  if (!panelWidth) return

  const toggleCenterX = toggleRect.left + toggleRect.width / 2
  let left = toggleCenterX - panelWidth / 2
  if (left + panelWidth > window.innerWidth - margin) {
    left = window.innerWidth - margin - panelWidth
  }
  if (left < margin) {
    left = margin
  }

  panel.style.right = 'auto'
  panel.style.transform = 'none'
  panel.style.left = `${left - rootRect.left}px`

  // 底部对齐按钮上方，歌单展开时面板向上增高，避免压住按钮或突变
  panel.style.bottom = `calc(var(--sakura-music-size) + var(--sakura-music-gap))`
  panel.style.top = 'auto'

  const panelRect = panel.getBoundingClientRect()
  const topMargin = margin
  if (panelRect.top < topMargin) {
    panel.style.bottom = 'auto'
    const panelHeight = panel.offsetHeight
    const minTop = topMargin - rootRect.top
    const maxTop = window.innerHeight - margin - panelHeight - rootRect.top
    const belowTop = toggleRect.bottom + gap - rootRect.top
    panel.style.top = `${clamp(belowTop, minTop, Math.max(minTop, maxTop))}px`
  }

  panel.classList.add('is-fitted')
  root.dispatchEvent(new Event('music:layout'))
}

function scheduleMusicPanelFit(root, panel, toggle) {
  window.requestAnimationFrame(() => {
    fitMusicPanelInViewport(root, panel, toggle)
  })
}

function parseCssPx(value, fallback) {
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function getMusicEdgeInsets(root) {
  const style = getComputedStyle(root)
  const isMobile = window.matchMedia('(max-width: 480px)').matches
  const fallbackX = isMobile ? 12 : 16
  const fallbackY = isMobile ? 16 : 20
  const inset = parseCssPx(style.getPropertyValue('--sakura-music-edge-x'), fallbackX)
  const bottom = parseCssPx(style.getPropertyValue('--sakura-music-edge-y'), fallbackY)
  return {
    left: inset,
    right: inset,
    top: bottom,
    bottom,
  }
}

function isEdgeDockEnabled(root) {
  if (!root || root.dataset.edgeDock === 'false') return false
  return root.classList.contains('sakura-music--left') || root.classList.contains('sakura-music--right')
}

function syncEdgeDock(root) {
  if (!root) return
  const enabled = isEdgeDockEnabled(root)
  root.classList.toggle('is-edge-dock', enabled)
  if (!enabled) root.classList.remove('is-edge-expanded')
}

function bindEdgeDock(root) {
  if (!root || root.dataset.edgeDockBound === '1') return
  root.dataset.edgeDockBound = '1'

  let collapseTimer = 0

  const canAutoCollapse = () => isEdgeDockEnabled(root)
    && !root.classList.contains('is-open')
    && !root.classList.contains('is-dragging')

  const expand = () => {
    if (!isEdgeDockEnabled(root)) return
    window.clearTimeout(collapseTimer)
    root.classList.add('is-edge-expanded')
  }

  const scheduleCollapse = () => {
    if (!canAutoCollapse()) return
    window.clearTimeout(collapseTimer)
    collapseTimer = window.setTimeout(() => {
      root.classList.remove('is-edge-expanded')
    }, 320)
  }

  root.addEventListener('mouseenter', expand)
  root.addEventListener('mouseleave', scheduleCollapse)
  root.addEventListener('focusin', expand)
  root.addEventListener('focusout', scheduleCollapse)
  root.addEventListener('pointerdown', (event) => {
    if (!isEdgeDockEnabled(root)) return
    if (root.classList.contains('is-open') || root.classList.contains('is-dragging')) return
    if (event.pointerType === 'mouse' && root.classList.contains('is-edge-expanded')) return
    expand()
  }, { capture: true })
}

function applyMusicDock(root, dock) {
  root.classList.toggle('sakura-music--left', dock === 'left')
  root.classList.toggle('sakura-music--right', dock === 'right')
  root.dataset.position = dock
  syncEdgeDock(root)
}

function snapMusicRootPosition(root, x, y) {
  const width = root.offsetWidth
  const height = root.offsetHeight
  const maxX = Math.max(0, window.innerWidth - width)
  const maxY = Math.max(0, window.innerHeight - height)
  const insets = getMusicEdgeInsets(root)
  const edgeDock = isEdgeDockEnabled(root)

  const pickNearest = (current, options) => {
    let best = options[0]
    let bestDist = Math.abs(current - best.value)
    options.slice(1).forEach((option) => {
      const dist = Math.abs(current - option.value)
      if (dist < bestDist) {
        best = option
        bestDist = dist
      }
    })
    return best
  }

  const snapX = pickNearest(x, [
    { value: edgeDock ? 0 : insets.left, dock: 'left' },
    { value: edgeDock ? maxX : maxX - insets.right, dock: 'right' },
  ])
  const snapY = pickNearest(y, [
    { value: insets.top, vDock: 'top' },
    { value: maxY - insets.bottom, vDock: 'bottom' },
  ])

  return {
    x: clamp(snapX.value, 0, maxX),
    y: clamp(snapY.value, 0, maxY),
    dock: snapX.dock,
    vDock: snapY.vDock,
  }
}

function applySnappedMusicPosition(root, storageKey, snapped) {
  applyMusicDock(root, snapped.dock)
  root.classList.add('is-custom-position')
  root.style.left = `${snapped.x}px`
  root.style.top = `${snapped.y}px`
  root.style.right = 'auto'
  root.style.bottom = 'auto'

  const state = readState(storageKey)
  writeState(storageKey, {
    ...state,
    position: { x: snapped.x, y: snapped.y },
    dock: snapped.dock,
    vDock: snapped.vDock,
  })
}

function resolveMusicPositionFromState(root, state) {
  const width = root.offsetWidth
  const height = root.offsetHeight
  const maxX = Math.max(0, window.innerWidth - width)
  const maxY = Math.max(0, window.innerHeight - height)
  const insets = getMusicEdgeInsets(root)
  const edgeDock = isEdgeDockEnabled(root)
  const dock = state.dock || root.dataset.position || 'left'
  const vDock = state.vDock || 'bottom'

  const x = dock === 'right'
    ? (edgeDock ? maxX : maxX - insets.right)
    : (edgeDock ? 0 : insets.left)
  const y = vDock === 'top' ? insets.top : maxY - insets.bottom

  return snapMusicRootPosition(root, x, y)
}

function applyMusicPosition(root, storageKey) {
  if (root.dataset.draggable !== 'true') return

  const state = readState(storageKey)
  const position = state.position

  if (state.dock) {
    applyMusicDock(root, state.dock)
  }

  if (position && Number.isFinite(position.x) && Number.isFinite(position.y)) {
    const snapped = state.dock && state.vDock
      ? resolveMusicPositionFromState(root, state)
      : snapMusicRootPosition(root, position.x, position.y)
    applySnappedMusicPosition(root, storageKey, snapped)
  }
}

function bindMusicDrag(root, storageKey, toggle, panel) {
  if (root.dataset.draggable !== 'true' || !toggle) return

  let pointerId = null
  let startX = 0
  let startY = 0
  let originX = 0
  let originY = 0
  let moved = false

  toggle.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return
    pointerId = event.pointerId
    startX = event.clientX
    startY = event.clientY
    const rect = root.getBoundingClientRect()
    originX = rect.left
    originY = rect.top
    moved = false
    toggle.setPointerCapture(event.pointerId)
  })

  toggle.addEventListener('pointermove', (event) => {
    if (pointerId !== event.pointerId) return
    const dx = event.clientX - startX
    const dy = event.clientY - startY
    if (!moved && Math.hypot(dx, dy) < 8) return

    moved = true
    root.dataset.dragMoved = '1'
    root.classList.add('is-custom-position', 'is-dragging')

    const maxX = Math.max(0, window.innerWidth - root.offsetWidth)
    const maxY = Math.max(0, window.innerHeight - root.offsetHeight)
    const x = clamp(originX + dx, 0, maxX)
    const y = clamp(originY + dy, 0, maxY)

    root.style.left = `${x}px`
    root.style.top = `${y}px`
    root.style.right = 'auto'
    root.style.bottom = 'auto'
  })

  const finishDrag = (event) => {
    if (pointerId !== event.pointerId) return
    pointerId = null
    root.classList.remove('is-dragging')
    if (toggle.hasPointerCapture(event.pointerId)) {
      toggle.releasePointerCapture(event.pointerId)
    }
    if (moved) {
      const rect = root.getBoundingClientRect()
      const snapped = snapMusicRootPosition(root, rect.left, rect.top)
      applySnappedMusicPosition(root, storageKey, snapped)
      if (panel?.classList.contains('is-visible')) {
        scheduleMusicPanelFit(root, panel, toggle)
      }
    }
  }

  toggle.addEventListener('pointerup', finishDrag)
  toggle.addEventListener('pointercancel', finishDrag)
}

export function initMusicPlayer() {
  const root = document.getElementById('sakura-music')
  if (!root || root.dataset.shellReady === '1') return
  root.dataset.shellReady = '1'
  const toggle = root.querySelector('#sakura-music-toggle')
  const panel = root.querySelector('#sakura-music-panel')
  const close = root.querySelector('#sakura-music-close')
  const storageKey = root.dataset.storageKey || DEFAULT_STORAGE_KEY
  applyMusicPosition(root, storageKey)
  syncEdgeDock(root)
  bindEdgeDock(root)
  bindMusicDrag(root, storageKey, toggle, panel)
  const view = mountMusicView(root)
  const surface = panel.querySelector('.music-panel-surface')
  const reduced = matchMedia('(prefers-reduced-motion: reduce)')
  let panelAnimation
  let open = false
  let foldedTransform = 'translate(0, 12px) scale(.96)'
  const settlePanel = () => {
    panelAnimation?.cancel(); panelAnimation = null
    if (open) fitMusicPanelInViewport(root, panel, toggle)
    else {
      // Keep the extracted paper in place until the whole book has faded out.
      panel.classList.remove('is-visible')
      view.close(); resetMusicPanelPosition(panel)
      root.classList.remove('is-edge-expanded')
    }
  }
  const setOpen = value => {
    if (value === open) return
    const visible = panel.classList.contains('is-visible')
    const current = getComputedStyle(surface)
    const start = { opacity: visible ? current.opacity : '0', transform: current.transform }
    panelAnimation?.cancel(); panelAnimation = null
    open = value
    if (!open && panel.contains(document.activeElement)) toggle.focus({ preventScroll: true })
    panel.inert = !open
    panel.setAttribute('aria-hidden', String(!open))
    toggle.setAttribute('aria-expanded', String(open))
    root.classList.toggle('is-open', open)
    if (open) {
      panel.classList.add('is-visible'); root.classList.add('is-edge-expanded')
      fitMusicPanelInViewport(root, panel, toggle)
      if (!visible) {
        const book = panel.getBoundingClientRect(), icon = toggle.getBoundingClientRect()
        const x = clamp(icon.left + icon.width / 2 - book.left, 0, book.width)
        const below = icon.top + icon.height / 2 >= book.top + book.height / 2
        surface.style.transformOrigin = `${x}px ${below ? book.height : 0}px`
        const compact = matchMedia('(pointer: coarse)').matches
        foldedTransform = `translate(${x > book.width / 2 ? 3 : -3}px, ${(below ? 1 : -1) * (compact ? 8 : 12)}px) scale(${compact ? .985 : .96})`
        start.transform = foldedTransform
      }
      view.focus()
    }
    writeState(storageKey, { ...readState(storageKey), panelOpen: open })
    if (reduced.matches || typeof surface.animate !== 'function') { settlePanel(); return }
    const compact = matchMedia('(pointer: coarse)').matches
    const duration = (open ? (compact ? 260 : 380) : (compact ? 180 : 220))
      * Math.max(.25, open ? 1 - Number(start.opacity) : Number(start.opacity))
    const animation = surface.animate([start, {
      opacity: open ? 1 : 0, transform: open ? 'none' : foldedTransform,
    }], { duration, easing: open ? 'cubic-bezier(.22,.78,.2,1)' : 'cubic-bezier(.4,0,.6,1)', fill: 'both' })
    panelAnimation = animation
    animation.onfinish = () => { if (panelAnimation === animation) settlePanel() }
  }
  panel.inert = true
  reduced.addEventListener('change', () => { if (reduced.matches) settlePanel() })
  toggle.addEventListener('click', event => {
    event.stopPropagation()
    if (root.dataset.dragMoved === '1') { root.dataset.dragMoved = '0'; return }
    setOpen(!open)
  })
  close.addEventListener('click', () => { setOpen(false); toggle.focus() })
  // Queue actions can remove their button before this event reaches document.
  document.addEventListener('click', event => { if (open && !event.composedPath().includes(root)) setOpen(false) })
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && open) {
      if (view.escape()) return
      setOpen(false); toggle.focus()
    }
  })
  window.addEventListener('resize', () => {
    if (panelAnimation) settlePanel()
    if (root.classList.contains('is-custom-position')) {
      const rect = root.getBoundingClientRect()
      const { x, y } = clampMusicRootPosition(root, rect.left, rect.top)
      root.style.left = `${x}px`; root.style.top = `${y}px`
    }
    if (open) scheduleMusicPanelFit(root, panel, toggle)
  })
  if (typeof ResizeObserver !== 'undefined') {
    const observer = new ResizeObserver(() => {
      if (open) scheduleMusicPanelFit(root, panel, toggle)
    })
    observer.observe(panel)
    observer.observe(root) // Dock expansion changes the anchor's width and position.
  }
  // Always start collapsed. A restored queue must never trigger playback on page load.
}
export function scheduleMusicPlayerInit() {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initMusicPlayer, { once: true })
  else initMusicPlayer()
}
