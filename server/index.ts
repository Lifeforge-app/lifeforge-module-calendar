import { forgeRouter } from '@lifeforge/server-utils'

import * as calendarsRouter from './routes/calendars'
import * as categoriesRouter from './routes/categories'
import * as eventsRouter from './routes/events'

export default forgeRouter({
  events: eventsRouter,
  calendars: calendarsRouter,
  categories: categoriesRouter
})
