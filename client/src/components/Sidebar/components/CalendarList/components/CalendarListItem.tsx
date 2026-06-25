import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback, useMemo } from 'react'

import {
  ConfirmationModal,
  Flex,
  Icon,
  SidebarItem,
  useModalStore
} from '@lifeforge/ui'

import type { CalendarCalendar } from '@/components/Calendar'
import ModifyCalendarModal from '@/components/modals/ModifyCalendarModal'
import { forgeAPI } from '@/manifest'

import ActionMenu from './ActionMenu'

function CalendarListItem({
  item,
  isSelected,
  onSelect,
  onCancelSelect,
  modifiable = true
}: {
  item: CalendarCalendar
  isSelected: boolean
  onSelect: (item: CalendarCalendar) => void
  onCancelSelect: () => void
  modifiable?: boolean
}) {
  const queryClient = useQueryClient()
  const { open } = useModalStore()

  const deleteMutation = useMutation(
    forgeAPI.calendars.remove.input({ id: item.id }).mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: forgeAPI.calendars.list.key
        })
        queryClient.invalidateQueries({
          queryKey: forgeAPI.events.key
        })
        onCancelSelect()
      }
    })
  )

  const handleEdit = useCallback(() => {
    open(ModifyCalendarModal, {
      initialData: item,
      type: 'update'
    })
  }, [item])

  const handleDelete = useCallback(() => {
    open(ConfirmationModal, {
      title: 'Delete Calendar',
      description: `Are you sure you want to delete the calendar "${item.name}"?`,
      onConfirm: async () => {
        await deleteMutation.mutateAsync(undefined)
      },
      confirmationPrompt: item.name
    })
  }, [item])

  const contextMenuItems = useMemo(
    () =>
      modifiable ? (
        <ActionMenu onDelete={handleDelete} onEdit={handleEdit} />
      ) : undefined,
    []
  )

  const handleClick = useCallback(() => {
    onSelect(item)
  }, [])

  return (
    <SidebarItem
      active={isSelected}
      contextMenuItems={contextMenuItems}
      label={
        <Flex align="center" gap="xs">
          {item.name}
          {item.link && (
            <Icon
              color={{ base: 'bg-400', dark: 'bg-600' }}
              icon="tabler:bell"
            />
          )}
        </Flex>
      }
      namespace={false}
      sideStripColor={item.color}
      onCancelButtonClick={onCancelSelect}
      onClick={handleClick}
    />
  )
}

export default CalendarListItem
