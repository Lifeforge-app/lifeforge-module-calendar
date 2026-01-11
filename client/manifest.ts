import { lazy } from 'react'
import type { ModuleConfig } from 'shared'

export default {
  routes: {
    '/': lazy(() => import('@'))
  },
  widgets: [
    () => import('@/widgets/MiniCalendar'),
    () => import('@/widgets/TodaysEvent')
  ]
} satisfies ModuleConfig
