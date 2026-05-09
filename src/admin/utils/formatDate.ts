export function formatAdminDate(value: unknown, fallback = '—') {
  if (value === null || value === undefined) return fallback

  if (value instanceof Date) {
    const time = value.getTime()
    return Number.isFinite(time) ? value.toISOString().slice(0, 10) : fallback
  }

  if (typeof value === 'number') {
    const date = new Date(value)
    const time = date.getTime()
    return Number.isFinite(time) ? date.toISOString().slice(0, 10) : fallback
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return fallback
    const date = new Date(trimmed)
    const time = date.getTime()
    if (Number.isFinite(time)) return date.toISOString().slice(0, 10)
    return trimmed.slice(0, 10)
  }

  return String(value).slice(0, 10) || fallback
}

export function formatAdminDateTime(value: unknown, fallback = '—') {
  if (value === null || value === undefined) return fallback
  const date = value instanceof Date ? value : new Date(value as any)
  const time = date.getTime()
  if (!Number.isFinite(time)) return fallback
  // `YYYY-MM-DD HH:mm` in UTC for deterministic SSR/CSR output
  return date.toISOString().replace('T', ' ').slice(0, 16)
}
