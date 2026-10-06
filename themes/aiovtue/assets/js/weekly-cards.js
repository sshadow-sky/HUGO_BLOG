import { registerPageCleanup } from './page-cleanup.js'

const instances = new WeakMap()
const properties = ['--weekly-rotate-x', '--weekly-rotate-y', '--weekly-light-x', '--weekly-light-y']

export function weeklyCardMotion(x, y, width, height) {
  const u = Math.max(0, Math.min(1, x / Math.max(1, width)))
  const v = Math.max(0, Math.min(1, y / Math.max(1, height)))
  return { rx: (0.5 - v) * 6, ry: (u - 0.5) * 6, x: u * 100, y: v * 100 }
}

export function initWeeklyCards() {
  const root = document.getElementById('weekly-post-list')
  if (!root || instances.has(root)) return
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)')
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
  let active = null, pending = 0, pointer = null
  const reset = () => {
    if (pending) cancelAnimationFrame(pending)
    pending = 0
    if (active) {
      active.classList.remove('is-interacting')
      properties.forEach(property => active.style.removeProperty(property))
    }
    active = null
  }
  const move = event => {
    if (!fine.matches || reduced.matches || event.pointerType === 'touch' || event.buttons) { reset(); return }
    const card = event.target?.closest?.('.weekly-card')
    if (!card || !root.contains(card)) { reset(); return }
    if (active !== card) { reset(); active = card }
    pointer = { x: event.clientX, y: event.clientY }
    if (pending) return
    pending = requestAnimationFrame(() => {
      pending = 0
      if (!active || !pointer) return
      // Measure the stationary outer card, not the moving surface.
      const rect = active.getBoundingClientRect()
      const motion = weeklyCardMotion(pointer.x - rect.left, pointer.y - rect.top, rect.width, rect.height)
      active.style.setProperty('--weekly-rotate-x', `${motion.rx.toFixed(2)}deg`)
      active.style.setProperty('--weekly-rotate-y', `${motion.ry.toFixed(2)}deg`)
      active.style.setProperty('--weekly-light-x', `${motion.x.toFixed(1)}%`)
      active.style.setProperty('--weekly-light-y', `${motion.y.toFixed(1)}%`)
      active.classList.add('is-interacting')
    })
  }
  const out = event => { if (active && !active.contains?.(event.relatedTarget)) reset() }
  const hidden = () => { if (document.visibilityState === 'hidden') reset() }
  root.addEventListener('pointermove', move, { passive: true })
  root.addEventListener('pointerout', out)
  root.addEventListener('pointerleave', reset)
  root.addEventListener('pointercancel', reset)
  window.addEventListener('scroll', reset, { passive: true, capture: true })
  window.addEventListener('resize', reset, { passive: true })
  document.addEventListener('visibilitychange', hidden)
  fine.addEventListener('change', reset)
  reduced.addEventListener('change', reset)
  const cleanup = () => {
    reset()
    root.removeEventListener('pointermove', move)
    root.removeEventListener('pointerout', out)
    root.removeEventListener('pointerleave', reset)
    root.removeEventListener('pointercancel', reset)
    window.removeEventListener('scroll', reset, true)
    window.removeEventListener('resize', reset)
    document.removeEventListener('visibilitychange', hidden)
    fine.removeEventListener('change', reset)
    reduced.removeEventListener('change', reset)
    instances.delete(root)
  }
  instances.set(root, cleanup)
  registerPageCleanup(cleanup)
}
