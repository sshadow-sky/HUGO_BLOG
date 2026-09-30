export function mediaUrl(value) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' ? url.href : ''
  } catch { return '' }
}

export function createMusicApi({ endpoint, source, fetcher = (...args) => fetch(...args) }) {
  async function request(params, signal) {
    if (!endpoint?.trim() || !source?.trim()) throw new Error('音乐服务尚未配置')
    let url
    try { url = new URL(endpoint, globalThis.location?.href || 'https://localhost/') }
    catch { throw new Error('音乐接口地址无效') }
    if (url.protocol !== 'https:' && url.origin !== globalThis.location?.origin) throw new Error('音乐接口需使用 HTTPS 或同源地址')
    Object.entries({ ...params, source }).forEach(([key, value]) => url.searchParams.set(key, value))
    const controller = new AbortController()
    const abort = () => controller.abort()
    if (signal?.aborted) abort()
    signal?.addEventListener('abort', abort, { once: true })
    const timeout = setTimeout(abort, 12000)
    try {
      const response = await fetcher(url, { signal: controller.signal })
      if (!response.ok) throw new Error(`音乐服务暂不可用（${response.status}）`)
      return await response.json()
    } catch (error) {
      if (signal?.aborted) throw error
      if (controller.signal.aborted) throw new Error('音乐服务响应超时，请稍后重试')
      if (error instanceof TypeError) throw new Error('无法连接音乐服务，请检查网络后重试')
      if (error instanceof SyntaxError) throw new Error('音乐服务返回格式异常')
      throw error
    } finally {
      clearTimeout(timeout)
      signal?.removeEventListener('abort', abort)
    }
  }
  return {
    async search(keyword, signal) {
      const data = await request({ types: 'search', name: keyword, count: '10', pages: '1' }, signal)
      if (!Array.isArray(data)) throw new Error('音乐服务返回格式异常')
      return data.filter(t => t && (typeof t.id === 'string' || typeof t.id === 'number') && typeof t.name === 'string').slice(0, 10).map(t => ({
        id: String(t.id), playId: String(t.url_id || t.id), source,
        title: t.name, artist: Array.isArray(t.artist) ? t.artist.join(' / ') : '',
        album: typeof t.album === 'string' ? t.album : '', picId: String(t.pic_id || ''),
      }))
    },
    async resolveUrl(track, signal) {
      const data = await request({ types: 'url', id: track.playId || track.id, br: '320' }, signal)
      const url = mediaUrl(data?.url)
      if (!url) throw new Error('暂无可用播放地址，请换一首或稍后重试')
      return url
    },
    async resolveCover(track, signal) {
      if (!track.picId) return ''
      const data = await request({ types: 'pic', id: track.picId, size: '300' }, signal)
      return mediaUrl(data?.url)
    },
  }
}
