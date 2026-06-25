import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

import { Card } from '@lifeforge/ui'

import EventDetails from '@/components/Calendar/components/EventDetails'
import { useInternalCategories } from '@/hooks/useInternalCategories'
import { forgeAPI } from '@/manifest'

import type { CalendarCategory, CalendarEvent } from '../..'

function AgendaEventItem({ event }: { event: CalendarEvent }) {
  const categoriesQuery = useQuery(forgeAPI.categories.list.queryOptions())
  const { map: internalCategoryMap } = useInternalCategories()

  const category = useMemo(() => {
    if (event.category.startsWith('_')) {
      return (internalCategoryMap[event.category] ?? {}) as
        | CalendarCategory
        | undefined
    }

    return categoriesQuery.data?.find(
      category => category.id === event.category
    )
  }, [categoriesQuery, event.category, internalCategoryMap])

  return (
    <Card
      className="relative min-w-96 pl-9 before:absolute before:top-4 before:left-4 before:h-[calc(100%-2rem)] before:w-1 before:rounded-full before:bg-(--bg-color)"
      style={{
        // @ts-expect-error - CSS variable
        '--bg-color': category?.color ?? ''
      }}
    >
      <EventDetails category={category} event={event} />
    </Card>
  )
}

export default AgendaEventItem
