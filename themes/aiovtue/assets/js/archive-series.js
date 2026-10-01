function monthNumber(value) {
  const month = String(value || '').slice(0, 7)
  if (!/^[1-9]\d{3}-(0[1-9]|1[0-2])$/.test(month)) return null
  const [year, index] = month.split('-').map(Number)
  return year * 12 + index - 1
}

export function buildArchiveSeries(posts, { startMonth = '', now = new Date() } = {}) {
  // Article months come from Hugo's displayed dates, never UTC-parsed date strings.
  const dates = posts.map(post => monthNumber(post.date)).filter(month => month !== null)
  const parts = new Intl.DateTimeFormat('en', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit' }).formatToParts(now)
  const current = Number(parts.find(p => p.type === 'year').value) * 12 + Number(parts.find(p => p.type === 'month').value) - 1
  const earliest = dates.length ? Math.min(...dates) : current
  const configured = monthNumber(startMonth)
  const start = Math.min(configured ?? earliest, earliest, current)
  const end = Math.max(current, ...dates)
  const totals = new Map()
  dates.forEach(month => totals.set(month, (totals.get(month) || 0) + 1))
  const months = [], counts = []
  for (let month = start; month <= end; month++) {
    months.push(`${Math.floor(month / 12)}-${String(month % 12 + 1).padStart(2, '0')}`)
    counts.push(totals.get(month) || 0)
  }
  return { months, counts }
}
