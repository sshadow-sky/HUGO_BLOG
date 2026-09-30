import { createMusicApi } from './music-api.js'
import { createMusicController, trackKey } from './music-controller.js'
import { mountMusicDrawers } from './music-drawers.js'
import { mountLyricsView } from './music-lyrics-view.js'

const modes = { order: '顺序', shuffle: '随机', single: '单曲' }
const timeText = value => `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(Math.floor(value % 60)).padStart(2, '0')}`
function icon(name) { const el = document.createElement('iconify-icon'); el.setAttribute('icon', name); el.setAttribute('aria-hidden', 'true'); return el }
function button(label, action, key, glyph) {
  const el = document.createElement('button')
  el.type = 'button'; el.title = label; el.setAttribute('aria-label', label)
  el.dataset.action = action; el.dataset.key = key; el.append(icon(glyph)); return el
}

export function mountMusicView(root) {
  const get = name => root.querySelector(`[data-music-${name}]`)
  const api = createMusicApi({ endpoint: root.dataset.endpoint, source: root.dataset.source })
  const lyrics = mountLyricsView(root, api)
  let drawers, latestState
  const covers = new Map(), coverTracks = new WeakMap()
  let storage
  try { storage = localStorage } catch { /* Private browsing may disallow storage. */ }
  const loadCover = async el => {
    const track = coverTracks.get(el)
    if (!track?.picId || !root.dataset.endpoint) return
    const key = `${track.source}:${track.picId}`
    if (!covers.has(key)) {
      if (covers.size >= 100) covers.delete(covers.keys().next().value)
      covers.set(key, api.resolveCover(track).catch(() => ''))
    }
    const url = await covers.get(key)
    if (!url || !el.isConnected || coverTracks.get(el) !== track) return
    const image = new Image(); image.alt = ''; image.referrerPolicy = 'no-referrer'
    image.onload = () => {
      if (el.isConnected && coverTracks.get(el) === track) {
        const bars = el.querySelector('.music-equalizer'); el.replaceChildren(image); if (bars) el.append(bars)
      }
    }
    image.src = url
  }
  const observer = typeof IntersectionObserver !== 'undefined' ? new IntersectionObserver(entries => {
    entries.forEach(entry => { if (entry.isIntersecting) { observer.unobserve(entry.target); void loadCover(entry.target) } })
  }) : null
  const attachCover = (el, track) => {
    el.replaceChildren(icon('ri:music-2-line')); observer?.unobserve(el)
    if (track) { coverTracks.set(el, track); observer?.observe(el) }
    else coverTracks.delete(el)
  }
  const makeRow = (track, inQueue, currentKey) => {
    const row = document.createElement('li'); row.className = 'music-row'
    row.classList.toggle('is-current', trackKey(track) === currentKey)
    const cover = document.createElement('div'); cover.className = 'music-cover'; attachCover(cover, track)
    const text = document.createElement('div'); text.className = 'music-track-info'
    const title = document.createElement('strong'); title.textContent = track.title; title.title = track.title
    const artist = document.createElement('span'); artist.textContent = track.artist || '未知歌手'; artist.title = track.album || track.artist
    text.append(title, artist)
    row.append(cover, text, button(`立即播放：${track.title}`, 'play', trackKey(track), 'ri:play-fill'))
    row.append(inQueue ? button(`移除：${track.title}`, 'remove', trackKey(track), 'ri:close-line') : button(`加入队列：${track.title}`, 'add', trackKey(track), 'ri:add-line'))
    if (inQueue && trackKey(track) === currentKey) {
      const bars = document.createElement('span'); bars.className = 'music-equalizer'; bars.setAttribute('aria-hidden', 'true')
      for (let i = 0; i < 3; i++) bars.append(document.createElement('i'))
      cover.append(bars)
    }
    return row
  }
  const replaceList = (list, tracks, inQueue, currentKey) => {
    list.querySelectorAll('.music-cover').forEach(el => observer?.unobserve(el))
    list.replaceChildren(...tracks.map(t => makeRow(t, inQueue, currentKey)))
  }
  let resultReference, queueSignature = '', currentKey
  function render(state) {
    latestState = state
    get('search-status').textContent = !root.dataset.endpoint || !root.dataset.source ? '音乐服务尚未配置' : state.searching ? '正在搜索…' : state.searchError || (state.searched ? (state.results.length ? `找到 ${state.results.length} 首 · ▶ 播放 / ＋ 加入队列` : '没有找到相关歌曲，换个关键词试试') : '搜索一首想听的歌')
    get('form').setAttribute('aria-busy', String(state.searching))
    if (state.results !== resultReference) {
      replaceList(get('results'), state.results, false, state.currentKey); resultReference = state.results
      get('results').hidden = !state.results.length
    }
    const signature = `${state.queue.map(trackKey).join('|')}@${state.currentKey}`
    if (signature !== queueSignature) {
      replaceList(get('queue'), state.queue, true, state.currentKey); queueSignature = signature
    }
    const current = state.queue.find(t => trackKey(t) === state.currentKey)
    if (currentKey !== state.currentKey) { attachCover(get('cover'), current); currentKey = state.currentKey }
    get('title').textContent = current?.title || '还没有正在播放的歌曲'
    get('artist').textContent = current?.artist || (current ? '未知歌手' : '从搜索结果中选择，开始聆听')
    get('title').title = current?.title || ''; get('artist').title = current?.artist || ''
    get('state').textContent = state.buffering ? '正在加载' : state.playing ? '正在聆听' : current ? '音乐，稍作停留' : '随时，随心'
    lyrics.update(current, state.time, drawers?.active === 'lyrics' && root.classList.contains('is-open'))
    const active = state.playing || state.buffering
    get('play').setAttribute('aria-label', state.buffering ? '取消加载' : active ? '暂停' : state.error ? '重试播放' : '播放')
    get('play').querySelector('iconify-icon').setAttribute('icon', state.buffering ? 'ri:loader-4-line' : active ? 'ri:pause-fill' : 'ri:play-fill')
    get('play').classList.toggle('is-loading', state.buffering)
    for (const control of ['play', 'prev', 'next', 'clear']) get(control).disabled = !state.queue.length
    get('mode').textContent = modes[state.mode]; get('mode').setAttribute('aria-label', `当前${modes[state.mode]}播放，切换播放模式`)
    get('time').textContent = timeText(state.time); get('duration').textContent = timeText(state.duration)
    get('seek').max = String(state.duration || 100); get('seek').value = String(state.time); get('seek').disabled = !state.duration || state.buffering
    get('volume').value = String(state.volume)
    get('seek').style.setProperty('--music-fill', `${state.duration ? 100 * state.time / state.duration : 0}%`)
    get('volume').style.setProperty('--music-fill', `${state.volume * 100}%`)
    get('error').textContent = state.error; get('error').hidden = !state.error
    get('count').textContent = `播放队列 · ${state.queue.length}`; get('empty').hidden = !!state.queue.length
    get('badge').textContent = String(state.queue.length)
    root.classList.toggle('is-playing', state.playing)
    root.querySelector('#sakura-music-toggle').setAttribute('aria-label', state.playing ? '音乐播放中，打开播放器' : '打开音乐播放器')
  }
  const controller = createMusicController({ api, audio: get('audio'), source: root.dataset.source, storage, onChange: render })
  render(controller.state)
  drawers = mountMusicDrawers(root, name => {
    const current = latestState.queue.find(t => trackKey(t) === latestState.currentKey)
    lyrics.update(current, latestState.time, name === 'lyrics' && root.classList.contains('is-open'))
  })
  let searchTimer, composing = false
  const submit = () => { clearTimeout(searchTimer); if (!composing) void controller.search(get('query').value) }
  const input = () => {
    clearTimeout(searchTimer); controller.cancelSearch()
    if (composing) return
    if (!get('query').value.trim()) { void controller.search(''); return }
    searchTimer = setTimeout(submit, 450)
  }
  get('query').addEventListener('compositionstart', () => { composing = true; clearTimeout(searchTimer); controller.cancelSearch() })
  get('query').addEventListener('compositionend', () => { composing = false; input() })
  get('query').addEventListener('input', input)
  get('form').addEventListener('submit', event => { event.preventDefault(); submit() })
  root.addEventListener('click', event => {
    const action = event.target.closest('button[data-action]')
    if (!action) return
    const track = [...controller.state.results, ...controller.state.queue].find(t => trackKey(t) === action.dataset.key)
    if (!track) return
    if (action.dataset.action === 'remove') controller.remove(trackKey(track))
    else if (controller.add(track) && action.dataset.action === 'play') void controller.play(trackKey(track))
  })
  get('play').addEventListener('click', () => { void controller.toggle() })
  get('prev').addEventListener('click', () => controller.step(-1))
  get('next').addEventListener('click', () => controller.step(1))
  get('clear').addEventListener('click', () => controller.clear())
  get('mode').addEventListener('click', () => { const keys = Object.keys(modes); controller.setMode(keys[(keys.indexOf(controller.state.mode) + 1) % keys.length]) })
  get('volume').addEventListener('input', event => controller.setVolume(Number(event.target.value)))
  get('volume-toggle').addEventListener('click', () => {
    const pop = root.querySelector('#music-volume-pop'); pop.hidden = !pop.hidden
    get('volume-toggle').setAttribute('aria-expanded', String(!pop.hidden))
  })
  get('seek').addEventListener('input', event => controller.seek(Number(event.target.value)))
  return { focus() { drawers.focus() }, escape() { return drawers.escape() }, close() { drawers.close(); root.querySelector('#music-volume-pop').hidden = true; get('volume-toggle').setAttribute('aria-expanded', 'false') } }
}
