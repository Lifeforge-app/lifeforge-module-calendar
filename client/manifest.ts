import { lazy } from 'react'

import { createForgeModuleClient } from '@lifeforge/federation'

import contract from './contract'

const { forgeAPI, ...manifest } = createForgeModuleClient({
  routes: {
    '/': lazy(() => import('@'))
  },
  widgets: [
    () => import('@/widgets/MiniCalendar'),
    () => import('@/widgets/TodaysEvent')
  ],
  contract
})

export default manifest

export { forgeAPI }
