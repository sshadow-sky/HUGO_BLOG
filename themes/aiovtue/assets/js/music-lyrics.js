// LRC timestamps are seconds; positive offset makes lyrics appear sooner.
export function parseLyrics(value) {
  const text = typeof value === 'string' ? value.slice(0, 200000) : ''
  const offset = Number(text.match(/\[offset:([+-]?\d+)\]/i)?.[1] || 0) / 1000
  const lines = [], plain = []
  for (const row of text.split(/\r?\n/)) {
    const stamps = [...row.matchAll(/\[(\d{1,3}):([0-5]\d)(?:\.(\d{1,3}))?\]/g)]
    const content = row.replace(/\[[^\]]*\]/g, '').trim()
    for (const stamp of stamps) lines.push({ time: Math.max(0, Number(stamp[1]) * 60 + Number(stamp[2]) + Number(`0.${stamp[3] || 0}`) - offset), text: content })
    if (!stamps.length && content) plain.push(content)
  }
  lines.sort((a, b) => a.time - b.time)
  return { lines, plain: lines.length ? '' : plain.join('\n') }
}

export function lyricIndex(lines, time) {
  let low = 0, high = lines.length - 1, found = -1
  while (low <= high) {
    const mid = (low + high) >> 1
    if (lines[mid].time <= time) { found = mid; low = mid + 1 } else high = mid - 1
  }
  return found
}

export function createLyricsLoader({ api, onChange = () => {} }) {
  const state = { status: 'idle', lines: [], plain: '', error: '' }
  let key = '', track, visible = false, controller, sequence = 0
  const cancel = () => { sequence++; controller?.abort() }
  const emit = () => onChange(state)
  async function load() {
    if (!track || !visible) return
    cancel(); const seq = sequence
    controller = new AbortController(); state.status = 'loading'; state.error = ''; emit()
    try {
      const data = parseLyrics(await api.resolveLyrics(track, controller.signal))
      if (seq !== sequence) return
      Object.assign(state, data, { status: data.lines.length ? 'synced' : data.plain ? 'plain' : 'empty' })
    } catch (error) {
      if (seq !== sequence) return
      state.status = 'error'; state.error = error?.message || '歌词加载失败'
    }
    if (seq === sequence) emit()
  }
  return {
    state,
    update(next, open) {
      const nextKey = next ? `${next.source}:${next.lyricId || next.id}` : ''
      visible = open; track = next
      if (nextKey !== key) {
        cancel(); key = nextKey
        Object.assign(state, { status: 'idle', lines: [], plain: '', error: '' }); emit()
      }
      if (!visible && state.status === 'loading') { cancel(); state.status = 'idle'; emit() }
      if (visible && track && state.status === 'idle') void load()
    },
    retry() { if (state.status === 'error') void load() },
  }
}
