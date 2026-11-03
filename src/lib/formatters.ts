export function formatCurrency(value?: number | null): string {
  if (value === undefined || value === null || isNaN(value)) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatDateBR(dateStr?: string | null): string {
  if (!dateStr) return ''
  try {
    const parts = dateStr.split('T')[0].split('-')
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`
    }
    return dateStr
  } catch {
    return dateStr
  }
}

export function formatHours(hours?: number | null): string {
  if (hours === undefined || hours === null || isNaN(hours)) return '0,0h (00:00)'
  const decimal = hours.toFixed(1).replace('.', ',')
  const totalMinutes = Math.round(hours * 60)
  const h = Math.floor(totalMinutes / 60)
  const m = Math.abs(totalMinutes % 60)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${decimal}h (${pad(h)}:${pad(m)})`
}

export function formatHoursShort(hours?: number | null): string {
  if (hours === undefined || hours === null || isNaN(hours)) return '0,0h'
  return `${hours.toFixed(1).replace('.', ',')}h`
}
