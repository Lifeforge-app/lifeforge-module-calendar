import { INTERNAL_CATEGORIES } from '@/constants/internalCategories'
import forgeAPI from '@/utils/forgeAPI'
import { useQuery } from '@tanstack/react-query'
import { memo, useMemo } from 'react'

import type { CalendarCategory, CalendarEvent } from '../../index.js'
import EventItemButton from './components/EventItemButton.js'
import EventItemTooltip from './components/EventItemTooltip.js'

function EventItem({ event }: { event: CalendarEvent }) {
  const categoriesQuery = useQuery(
    forgeAPI.calendar.categories.list.queryOptions()
  )

  const calendarsQuery = useQuery(
    forgeAPI.calendar.calendars.list.queryOptions()
  )

  const category = useMemo(() => {
    if (event.category.startsWith('_')) {
      return {
        ...INTERNAL_CATEGORIES[
          event.category as keyof typeof INTERNAL_CATEGORIES
        ]
      } as CalendarCategory | undefined
    }

    return categoriesQuery.data?.find(
      category => category.id === event.category
    )
  }, [categoriesQuery, event.category])

  const calendar = useMemo(() => {
    return calendarsQuery.data?.find(calendar => calendar.id === event.calendar)
  }, [calendarsQuery, event.calendar])

  return (
    <>
      <EventItemButton
        color={category?.color || calendar?.color || ''}
        icon={category?.icon ?? ''}
        id={event.id}
        isStrikethrough={event.is_strikethrough}
        title={event.title}
      />
      <EventItemTooltip category={category} event={event} />
    </>
  )
}

export default memo(EventItem)
