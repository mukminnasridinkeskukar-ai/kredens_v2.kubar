import { format } from 'date-fns'
import { id } from 'date-fns/locale'

export function formatTanggal(value?: string | Date | null): string {
  if (!value) return '-'
  try {
    const d = typeof value === 'string' ? new Date(value) : value
    if (isNaN(d.getTime())) return String(value)
    return format(d, 'd MMMM yyyy', { locale: id })
  } catch {
    return String(value)
  }
}

export function formatTanggalInput(value?: string | null): string {
  if (!value) return ''
  try {
    const d = new Date(value)
    if (isNaN(d.getTime())) return String(value)
    return format(d, 'yyyy-MM-dd')
  } catch {
    return String(value)
  }
}
