import { lazy } from 'react'
import type { ModuleConfig } from 'shared'

export default {
  name: 'Calendar',
  icon: 'tabler:calendar',
  routes: {
    calendar: lazy(() => import('@'))
  },
  category: 'Productivity'
} satisfies ModuleConfig
