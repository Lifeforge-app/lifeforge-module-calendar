import dayjs from 'dayjs'
import {
  parseAsString,
  parseAsStringEnum,
  useQueryState,
  useQueryStates
} from 'nuqs'

export default function useFilter() {
  const [searchQuery, setSearchQuery] = useQueryState(
    'q',
    parseAsString.withDefault('')
  )

  const [filter, setFilter] = useQueryStates({
    category: parseAsString.withDefault(''),
    calendar: parseAsString.withDefault(''),
    start: parseAsString.withDefault(
      dayjs().startOf('month').format('YYYY-MM-DD')
    ),
    end: parseAsString.withDefault(dayjs().endOf('month').format('YYYY-MM-DD')),
    view: parseAsStringEnum([
      'month',
      'week',
      'work_week',
      'day',
      'agenda'
    ] as const).withDefault('month'),
    date: parseAsString.withDefault(dayjs().format('YYYY-MM-DD'))
  })

  function updateFilter<K extends keyof typeof filter>(
    keyOrUpdates: K | Partial<typeof filter>,
    value?: (typeof filter)[K]
  ) {
    if (typeof keyOrUpdates === 'string') {
      setFilter({ [keyOrUpdates]: value } as Partial<typeof filter>)
    } else {
      setFilter(keyOrUpdates)
    }
  }

  return {
    searchQuery,
    setSearchQuery,
    ...filter,
    updateFilter
  }
}
