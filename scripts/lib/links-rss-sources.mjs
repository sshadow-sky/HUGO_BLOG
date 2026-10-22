import { parseDocument } from 'yaml'

// Read structure, never YAML indentation/key order. The first group remains the
// explicitly selected RSS scope, even when it is empty.
export function parseFirstGroupRssLinks(source) {
  const document = parseDocument(source)
  if (document.errors.length) throw new Error('友链 YAML 无效，未更新 RSS 缓存。')
  const data = document.toJS({ maxAliasCount: 100 })
  if (!data || typeof data !== 'object' || !Array.isArray(data.linkGroups)) throw new Error('linkGroups 必须是数组，未更新 RSS 缓存。')
  if (!data.linkGroups.length) return []
  const group = data.linkGroups[0]
  if (!group || typeof group !== 'object' || !Array.isArray(group.links)) throw new Error('第一组 links 必须是数组，未更新 RSS 缓存。')
  return group.links.filter(item => {
    if (!item || typeof item.rss !== 'string') return false
    try { const url = new URL(item.rss); return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password } catch { return false }
  }).map(item => ({
    url: String(item.url || ''), name: String(item.name || ''), blog: String(item.blog || ''),
    desc: String(item.desc || ''), color: String(item.color || '#0078e7'),
    avatar: String(item.avatar || ''), rss: item.rss.trim(),
  }))
}
