const STORAGE_KEY = 'shadowsky-music-v1'
export const trackKey = track => `${track.source}:${track.id}`
const MODES = ['order', 'shuffle', 'single']

export function createMusicController({ api, audio, storage, source, onChange = () => {} }) {
  const state = { queue: [], currentKey: '', mode: 'order', volume: 0.7, playing: false, buffering: false, error: '', searchError: '', searching: false, searched: false, results: [], time: 0, duration: 0 }
  let searchController, playController, playTimer, searchSequence = 0, playSequence = 0
  const cleanTrack = t => {
    if (!t || t.source !== source || typeof t.id !== 'string' || !t.id || typeof t.title !== 'string') return null
    return { id: t.id.slice(0, 200), playId: String(t.playId || t.id).slice(0, 200), lyricId: String(t.lyricId || t.id).slice(0, 200), source, title: t.title.slice(0, 300), artist: String(t.artist || '').slice(0, 300), album: String(t.album || '').slice(0, 300), picId: String(t.picId || '').slice(0, 200) }
  }
  try {
    const saved = JSON.parse(storage?.getItem(STORAGE_KEY) || 'null')
    if (saved?.version === 1) {
      state.queue = [...new Map((Array.isArray(saved.queue) ? saved.queue : []).map(cleanTrack).filter(Boolean).map(t => [trackKey(t), t])).values()].slice(0, 100)
      state.currentKey = state.queue.some(t => trackKey(t) === saved.currentKey) ? saved.currentKey : ''
      if (MODES.includes(saved.mode)) state.mode = saved.mode
      if (Number.isFinite(saved.volume)) state.volume = Math.max(0, Math.min(1, saved.volume))
    }
  } catch { /* Empty or unavailable storage starts a fresh session. */ }
  audio.volume = state.volume
  audio.preload = 'none'
  const emit = () => onChange(state)
  const save = () => {
    try { storage?.setItem(STORAGE_KEY, JSON.stringify({ version: 1, queue: state.queue, currentKey: state.currentKey, mode: state.mode, volume: state.volume })) } catch { /* Playback works without persistent storage. */ }
  }
  const cancelPlay = () => {
    playSequence++
    playController?.abort()
    clearTimeout(playTimer)
    audio.pause()
    state.playing = false
    state.buffering = false
  }
  const unload = () => { audio.removeAttribute('src'); audio.load(); state.time = 0; state.duration = 0 }
  const fail = message => { cancelPlay(); unload(); state.error = message; emit() }
  const add = track => {
    const t = cleanTrack(track)
    if (!t) return false
    if (state.queue.some(item => trackKey(item) === trackKey(t))) return true
    if (state.queue.length >= 100) { state.error = '队列最多保留 100 首，请先移除一些歌曲'; emit(); return false }
    state.queue.push(t); save(); emit(); return true
  }
  async function play(key) {
    const track = state.queue.find(t => trackKey(t) === key)
    if (!track) return
    cancelPlay(); unload()
    const seq = playSequence
    playController = new AbortController()
    state.currentKey = key; state.buffering = true; state.error = ''; save(); emit()
    try {
      const url = await api.resolveUrl(track, playController.signal)
      if (seq !== playSequence) return
      audio.src = url
      playTimer = setTimeout(() => { if (seq === playSequence && state.buffering) fail('歌曲加载超时，请重试或换一首') }, 15000)
      await audio.play()
      if (seq !== playSequence) return
    } catch (error) {
      if (seq !== playSequence) return
      fail(error?.name === 'NotAllowedError' ? '浏览器暂未允许播放，请再次点击播放' : (error?.message || '歌曲无法播放，请重试或换一首'))
    }
  }
  const cancelSearch = () => {
    searchSequence++; searchController?.abort(); state.searching = false
  }
  async function search(keyword) {
    cancelSearch()
    const seq = searchSequence
    state.results = []; state.searchError = ''; state.searched = false
    const query = keyword.trim().slice(0, 100)
    if (!query) { emit(); return }
    state.searching = true; emit()
    searchController = new AbortController()
    try {
      const results = await api.search(query, searchController.signal)
      if (seq !== searchSequence) return
      state.results = [...new Map(results.map(cleanTrack).filter(Boolean).map(t => [trackKey(t), t])).values()]
      state.searched = true
    } catch (error) {
      if (seq === searchSequence) state.searchError = error?.name === 'AbortError' ? '搜索超时，请稍后重试' : (error?.message || '搜索失败，请稍后重试')
    } finally {
      if (seq === searchSequence) { state.searching = false; emit() }
    }
  }
  function step(direction) {
    if (!state.queue.length) return
    const index = state.queue.findIndex(t => trackKey(t) === state.currentKey)
    const offset = state.mode === 'shuffle' && state.queue.length > 1
      ? 1 + Math.floor(Math.random() * (state.queue.length - 1)) : direction
    const next = index < 0 ? 0 : (index + offset + state.queue.length) % state.queue.length
    void play(trackKey(state.queue[next]))
  }
  const toggle = async () => {
    if (state.buffering || !audio.paused) { cancelPlay(); emit(); return }
    if (!state.queue.length) return
    if (audio.src && !audio.ended && !state.error) {
      try { await audio.play() } catch { state.error = '无法继续播放，请重试'; emit() }
    } else await play(state.currentKey || trackKey(state.queue[0]))
  }
  audio.addEventListener('playing', () => { clearTimeout(playTimer); state.playing = true; state.buffering = false; state.error = ''; emit() })
  audio.addEventListener('pause', () => { state.playing = false; emit() })
  audio.addEventListener('waiting', () => {
    state.buffering = true; emit(); clearTimeout(playTimer)
    playTimer = setTimeout(() => { if (state.buffering) fail('音频缓冲超时，请重试') }, 15000)
  })
  audio.addEventListener('error', () => { if (audio.getAttribute?.('src')) fail('歌曲无法播放，请重试或换一首') })
  const syncTime = () => { state.time = Number.isFinite(audio.currentTime) ? audio.currentTime : 0; state.duration = Number.isFinite(audio.duration) ? audio.duration : 0; emit() }
  audio.addEventListener('timeupdate', syncTime)
  audio.addEventListener('loadedmetadata', syncTime)
  audio.addEventListener('ended', () => {
    state.playing = false; state.buffering = false; clearTimeout(playTimer)
    const index = state.queue.findIndex(t => trackKey(t) === state.currentKey)
    if (index < 0) return
    if (state.mode === 'single') void play(state.currentKey)
    else if (state.mode === 'shuffle' && state.queue.length > 1) step(1)
    else if (state.mode === 'order' && index + 1 < state.queue.length) step(1)
    else emit()
  })
  return {
    state, add, play, toggle, search, cancelSearch, step,
    remove(key) {
      if (key === state.currentKey) { cancelPlay(); unload(); state.currentKey = ''; state.error = '' }
      state.queue = state.queue.filter(t => trackKey(t) !== key); save(); emit()
    },
    clear() { cancelPlay(); unload(); state.queue = []; state.currentKey = ''; state.error = ''; save(); emit() },
    setMode(mode) { if (MODES.includes(mode)) { state.mode = mode; save(); emit() } },
    setVolume(value) { if (Number.isFinite(value)) { state.volume = Math.max(0, Math.min(1, value)); audio.volume = state.volume; save(); emit() } },
    seek(value) { if (Number.isFinite(value) && state.duration > 0) { audio.currentTime = Math.max(0, Math.min(state.duration, value)); syncTime() } },
  }
}
