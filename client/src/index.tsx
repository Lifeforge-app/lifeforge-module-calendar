import { useQuery } from '@tanstack/react-query'
import { parseAsString, useQueryState } from 'nuqs'
import { useCallback, useEffect } from 'react'

import {
  Box,
  ContentWrapperWithSidebar,
  ContextMenu,
  ContextMenuItem,
  FAB,
  LayoutWithSidebar,
  ModuleHeader,
  Scrollbar,
  useModalStore
} from '@lifeforge/ui'

import { forgeAPI } from '@/manifest'

import CalendarComponent from './components/Calendar'
import Sidebar from './components/Sidebar'
import ModifyEventModal from './components/modals/ModifyEventModal'
import ScanImageModal from './components/modals/ScanImageModal'
import { useCalendarStore } from './hooks/useCalendarStore'
import './index.css'

function CalendarModule() {
  const { open } = useModalStore()
  const { start, end } = useCalendarStore()

  const rawEventsQuery = useQuery(
    forgeAPI.events.getByDateRange
      .input({
        start,
        end
      })
      .queryOptions()
  )

  const [selectedCategory, setSelectedCategory] = useQueryState(
    'category',
    parseAsString.withDefault('')
  )

  const [selectedCalendar, setSelectedCalendar] = useQueryState(
    'calendar',
    parseAsString.withDefault('')
  )

  const handleScanImageModalOpen = useCallback(() => {
    open(ScanImageModal, {})
  }, [])

  const handleCreateEvent = useCallback(() => {
    open(ModifyEventModal, {
      type: 'create'
    })
  }, [])

  useEffect(() => {
    useCalendarStore
      .getState()
      .setIsEventLoading(rawEventsQuery.isFetching || rawEventsQuery.isLoading)
  }, [rawEventsQuery.isFetching, rawEventsQuery.isLoading])

  return (
    <>
      <ModuleHeader />
      <LayoutWithSidebar>
        <Sidebar
          selectedCalendar={selectedCalendar}
          selectedCategory={selectedCategory}
          setSelectedCalendar={setSelectedCalendar}
          setSelectedCategory={setSelectedCategory}
        />
        <ContentWrapperWithSidebar>
          <Scrollbar>
            <Box height="100%" pb="xl" pr="md" width="100%">
              <CalendarComponent
                events={rawEventsQuery.data ?? []}
                selectedCalendar={selectedCalendar}
                selectedCategory={selectedCategory}
              />
            </Box>
          </Scrollbar>
        </ContentWrapperWithSidebar>
      </LayoutWithSidebar>
      <ContextMenu
        buttonComponent={<FAB position="static" visibilityBreakpoint="md" />}
        styles={{
          wrapper: {
            position: 'fixed',
            bottom: '1.5em',
            right: '1.5em'
          }
        }}
      >
        <ContextMenuItem
          icon="tabler:photo"
          label="Scan from Image"
          onClick={handleScanImageModalOpen}
        />
        <ContextMenuItem
          icon="tabler:plus"
          label="Input Manually"
          onClick={handleCreateEvent}
        />
      </ContextMenu>
    </>
  )
}

export default CalendarModule
