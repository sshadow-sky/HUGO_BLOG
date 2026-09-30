// One delegated handler also covers titles replaced during PJAX navigation.
export function initShadowLight() {
  const enabled = window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)')
  let active = null
  let frame = 0
  let pointerX = 0
  let pointerY = 0

  function reset() {
    cancelAnimationFrame(frame)
    frame = 0
    if (!active) return
    active.classList.remove('is-shadow-active')
    for (const property of ['--shadow-x', '--shadow-y', '--shadow-opacity']) {
      active.style.removeProperty(property)
    }
    active = null
  }

  function render() {
    frame = 0
    if (!active?.isConnected || !enabled.matches) return reset()
    const rect = active.getBoundingClientRect()
    if (!rect.width || !rect.height) return reset()
    const clamp = (value) => Math.max(-1, Math.min(1, value))
    const x = clamp((pointerX - rect.left) / rect.width * 2 - 1)
    const y = clamp((pointerY - rect.top) / rect.height * 2 - 1)
    const distance = Math.min(1, Math.hypot(x, y))
    active.style.setProperty('--shadow-x', `${(-x * 0.16).toFixed(4)}em`)
    active.style.setProperty('--shadow-y', `${(-y * 0.16).toFixed(4)}em`)
    active.style.setProperty('--shadow-opacity', (0.6 + distance * 0.4).toFixed(3))
    active.classList.add('is-shadow-active')
  }

  function move(event) {
    if (!enabled.matches || event.pointerType === 'touch') return
    const target = event.target instanceof Element ? event.target.closest('[data-shadow-light]') : null
    if (target !== active) reset()
    if (!target) return
    active = target
    pointerX = event.clientX
    pointerY = event.clientY
    if (!frame) frame = requestAnimationFrame(render)
  }

  document.addEventListener('pointerover', move, { passive: true })
  document.addEventListener('pointermove', move, { passive: true })
  document.addEventListener('pointerout', (event) => {
    if (active && (!(event.relatedTarget instanceof Node) || !active.contains(event.relatedTarget))) reset()
  }, { passive: true })
  document.addEventListener('pointercancel', reset, { passive: true })
  window.addEventListener('scroll', reset, { passive: true, capture: true })
  window.addEventListener('resize', reset, { passive: true })
  window.addEventListener('blur', reset)
  document.addEventListener('visibilitychange', reset)
  enabled.addEventListener('change', reset)
  return reset
}
