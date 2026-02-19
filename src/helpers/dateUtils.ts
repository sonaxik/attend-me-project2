export function formatDateTime(date: Date | undefined): string {
  if (!date) return '-'
  return new Date(date).toLocaleString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatDateOnly(date: Date | undefined): string {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function formatTimeOnly(date: Date | undefined): string {
  if (!date) return '-'
  return new Date(date).toLocaleTimeString('pl-PL', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function isSessionActive(dateStart?: Date, dateEnd?: Date): boolean {
  if (!dateStart || !dateEnd) return false
  const now = new Date()
  return new Date(dateStart) <= now && new Date(dateEnd) >= now
}

export function isSessionPast(dateEnd?: Date): boolean {
  if (!dateEnd) return false
  return new Date(dateEnd) < new Date()
}
