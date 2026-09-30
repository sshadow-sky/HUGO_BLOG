let activeController = null
let generation = 0

export function cleanupStatistics() {
  generation++
  activeController?.abort()
  activeController = null
}

function countText(value) {
  if (typeof value !== 'number' && !(typeof value === 'string' && /^\d+$/.test(value))) return '—'
  const count = Number(value)
  return Number.isSafeInteger(count) && count >= 0 ? String(count) : '—'
}

export async function initStatistics() {
  cleanupStatistics()
  const currentGeneration = generation
  const nodes = [...document.querySelectorAll('[data-statistic]')]
  nodes.forEach(node => { node.textContent = '—' })
  const config = document.querySelector('meta[name="sakura-statistics"]')
  const endpoint = config?.dataset.endpoint?.trim()
  if (config?.content !== '1' || !endpoint || !nodes.length) return
  // The provider rejects local hosts. Never count local previews as real visits.
  if (/^(localhost|127(?:\.\d+){3}|\[?::1\]?)$/i.test(location.hostname)) return
  try {
    if (new URL(endpoint).protocol !== 'https:') return
  } catch { return }

  const controller = new AbortController()
  activeController = controller
  const timeout = setTimeout(() => controller.abort(), 8000)
  try {
    // Match the provider's script protocol; do not replace the current URL with the production domain.
    const response = await fetch(endpoint, {
      method: 'POST',
      body: JSON.stringify({ url: location.href, referrer: document.referrer }),
      signal: controller.signal,
    })
    if (!response.ok) return
    const data = await response.json()
    if (controller.signal.aborted || generation !== currentGeneration) return
    nodes.forEach(node => { node.textContent = countText(data?.[node.id]) })
  } catch {
    // A rejected domain, network failure or timeout must not replace counts with an error message.
  } finally {
    clearTimeout(timeout)
    if (activeController === controller) activeController = null
  }
}
