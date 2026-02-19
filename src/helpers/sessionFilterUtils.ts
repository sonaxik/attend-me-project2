import type {
  CourseSessionListFilters,
  CourseSessionListFiltersPagedListParams,
  CourseSessionListItem,
} from '@/backend/AttendMeBackendClientBase'

export type TeacherFilterType =
  | 'today'
  | 'tomorrow'
  | 'nextWeek'
  | 'past'
  | 'all_date'
  | 'all_text'

export type StudentFilterType = 'all' | 'today' | 'tomorrow' | 'week' | 'month' | 'past'

function getDateRanges(now: Date) {
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const endOfToday = new Date(startOfToday)
  endOfToday.setDate(startOfToday.getDate() + 1)

  const startOfTomorrow = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000)
  const endOfTomorrow = new Date(startOfTomorrow.getTime() + 24 * 60 * 60 * 1000 - 1)

  const dayOfWeek = now.getDay() || 7
  const daysUntilNextMonday = 8 - dayOfWeek
  const startOfNextWeek = new Date(startOfToday.getTime() + daysUntilNextMonday * 24 * 60 * 60 * 1000)
  const endOfNextWeek = new Date(startOfNextWeek.getTime() + 7 * 24 * 60 * 60 * 1000 - 1)

  const startOfWeek = new Date(startOfToday.getTime() - (dayOfWeek - 1) * 24 * 60 * 60 * 1000)
  const endOfWeek = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000 - 1)

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  return {
    startOfToday,
    endOfToday,
    startOfTomorrow,
    endOfTomorrow,
    startOfNextWeek,
    endOfNextWeek,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
  }
}

export function buildTeacherSessionsQuery(
  filterStatus: TeacherFilterType,
  searchTerm: string,
): CourseSessionListFiltersPagedListParams {
  const now = new Date()
  const ranges = getDateRanges(now)
  const filters: CourseSessionListFilters = {}

  if (searchTerm.trim()) {
    filters.search = searchTerm.trim()
  }

  switch (filterStatus) {
    case 'today':
      filters.dateStart = ranges.startOfToday
      filters.dateEnd = ranges.endOfToday
      break
    case 'tomorrow':
      filters.dateStart = ranges.startOfTomorrow
      filters.dateEnd = ranges.endOfTomorrow
      break
    case 'nextWeek':
      filters.dateStart = ranges.startOfNextWeek
      filters.dateEnd = ranges.endOfNextWeek
      break
    case 'past':
      filters.dateEnd = now
      break
    case 'all_date':
    case 'all_text':
      break
  }

  return {
    pageNumber: 1,
    pageSize: 999999,
    filters: Object.keys(filters).length ? filters : undefined,
  }
}

export function buildStudentSessionsQuery(
  filterStatus: StudentFilterType,
  searchTerm: string,
): CourseSessionListFiltersPagedListParams {
  const now = new Date()
  const ranges = getDateRanges(now)
  const filters: CourseSessionListFilters = {}

  if (searchTerm.trim()) {
    filters.search = searchTerm.trim()
  }

  switch (filterStatus) {
    case 'today':
      filters.dateStart = ranges.startOfToday
      filters.dateEnd = ranges.endOfToday
      break
    case 'tomorrow':
      filters.dateStart = ranges.startOfTomorrow
      filters.dateEnd = ranges.endOfTomorrow
      break
    case 'week':
      filters.dateStart = ranges.startOfWeek
      filters.dateEnd = ranges.endOfWeek
      break
    case 'month':
      filters.dateStart = ranges.startOfMonth
      filters.dateEnd = ranges.endOfMonth
      break
    case 'past':
      filters.dateEnd = now
      break
    case 'all':
    default:
      break
  }

  return {
    pageNumber: 1,
    pageSize: 999999,
    filters: Object.keys(filters).length ? filters : undefined,
  }
}

export function filterTeacherSessions(
  sessions: CourseSessionListItem[],
  filterStatus: TeacherFilterType,
  searchTerm: string,
): CourseSessionListItem[] {
  let result = [...sessions]
  const now = new Date()

  const { startOfToday, endOfToday, startOfTomorrow, endOfTomorrow, startOfNextWeek, endOfNextWeek } =
    getDateRanges(now)

  switch (filterStatus) {
    case 'today':
      result = result.filter((s) => {
        if (!s.dateStart) return false
        const d = new Date(s.dateStart)
        return d >= startOfToday && d < endOfToday
      })
      break
    case 'tomorrow':
      result = result.filter((s) => {
        if (!s.dateStart) return false
        const d = new Date(s.dateStart)
        return d >= startOfTomorrow && d < endOfTomorrow
      })
      break
    case 'nextWeek':
      result = result.filter((s) => {
        if (!s.dateStart) return false
        const d = new Date(s.dateStart)
        return d >= startOfNextWeek && d <= endOfNextWeek
      })
      break
    case 'past':
      result = result.filter((s) => (s.dateEnd ? new Date(s.dateEnd) <= now : false))
      break
    case 'all_date':
    case 'all_text':
      break
  }

  if (searchTerm.trim()) {
    const term = searchTerm.toLowerCase()
    result = result.filter(
      (s) =>
        s.courseName?.toLowerCase().includes(term) ||
        s.courseGroupName?.toLowerCase().includes(term) ||
        s.locationName?.toLowerCase().includes(term),
    )
  }

  result.sort((a, b) => {
    const dateA = a.dateStart ? new Date(a.dateStart).getTime() : 0
    const dateB = b.dateStart ? new Date(b.dateStart).getTime() : 0
    if (filterStatus === 'past') return dateB - dateA
    return dateA - dateB
  })

  return result
}

export function filterStudentSessions(
  sessions: CourseSessionListItem[],
  filterStatus: StudentFilterType,
  searchTerm: string,
): CourseSessionListItem[] {
  let result = [...sessions]
  const now = new Date()

  const { startOfToday, endOfToday, startOfTomorrow, endOfTomorrow, startOfWeek, endOfWeek, startOfMonth, endOfMonth } =
    getDateRanges(now)

  if (searchTerm.trim()) {
    const term = searchTerm.toLowerCase()
    result = result.filter(
      (s) =>
        s.courseName?.toLowerCase().includes(term) ||
        s.courseGroupName?.toLowerCase().includes(term) ||
        s.locationName?.toLowerCase().includes(term),
    )
  }

  switch (filterStatus) {
    case 'today':
      result = result.filter((s) => {
        if (!s.dateStart) return false
        const d = new Date(s.dateStart)
        return d >= startOfToday && d <= endOfToday
      })
      break
    case 'tomorrow':
      result = result.filter((s) => {
        if (!s.dateStart) return false
        const d = new Date(s.dateStart)
        return d >= startOfTomorrow && d <= endOfTomorrow
      })
      break
    case 'week':
      result = result.filter((s) => {
        if (!s.dateStart) return false
        const d = new Date(s.dateStart)
        return d >= startOfWeek && d <= endOfWeek
      })
      break
    case 'month':
      result = result.filter((s) => {
        if (!s.dateStart) return false
        const d = new Date(s.dateStart)
        return d >= startOfMonth && d <= endOfMonth
      })
      break
    case 'past':
      result = result.filter((s) => (s.dateEnd ? new Date(s.dateEnd) < now : false))
      break
    case 'all':
    default:
      break
  }

  result.sort((a, b) => {
    const dateA = a.dateStart ? new Date(a.dateStart).getTime() : 0
    const dateB = b.dateStart ? new Date(b.dateStart).getTime() : 0
    if (filterStatus === 'past') return dateB - dateA
    return dateA - dateB
  })

  return result
}
