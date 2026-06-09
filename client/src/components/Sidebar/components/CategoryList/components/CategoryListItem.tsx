import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback, useMemo } from 'react'

import { ConfirmationModal, SidebarItem , useModalStore } from '@lifeforge/ui'

import type { CalendarCategory } from '@/components/Calendar'
import ModifyCategoryModal from '@/components/modals/ModifyCategoryModal'
import { forgeAPI } from '@/manifest'

import ActionMenu from './ActionMenu'

function CategoryListItem({
  item,
  isSelected,
  onSelect,
  onCancelSelect,
  modifiable = true
}: {
  item: CalendarCategory
  isSelected: boolean
  onSelect: (item: CalendarCategory) => void
  onCancelSelect: () => void
  modifiable?: boolean
}) {
  const queryClient = useQueryClient()

  const { open } = useModalStore()

  const deleteMutation = useMutation(
    forgeAPI.categories.remove.input({ id: item.id }).mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: forgeAPI.categories.list.key
        })
        onCancelSelect()
      }
    })
  )

  const handleEdit = useCallback(() => {
    open(ModifyCategoryModal, {
      initialData: item,
      type: 'update'
    })
  }, [item])

  const handleDelete = useCallback(() => {
    open(ConfirmationModal, {
      title: 'Delete Category',
      description: `Are you sure you want to delete the category "${item.name}"?`,
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
      icon={item.icon}
      label={item.name}
      sideStripColor={item.color}
      onCancelButtonClick={onCancelSelect}
      onClick={handleClick}
    />
  )
}

export default CategoryListItem
