import { ne } from 'drizzle-orm'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import { type BuiltModuleSchema, scopeDbForModule } from '@lifeforge/drizzle'
import {
  ModuleRegistry,
  type CoreContext
} from '@lifeforge/server-utils'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import fs from 'fs'
import path from 'path'

import type { CalendarSchema } from '../forge'
import { calendars } from '../schema.drizzle'
import { ICalSyncService } from './icalSyncing'

dayjs.extend(utc)

type CalendarDb = PostgresJsDatabase<BuiltModuleSchema<CalendarSchema>>

export interface AggregatedEvent {
  id: string
  type: 'single' | 'recurring'
  start: string
  end: string
  rrule?: string
  title: string
  calendar: string
  category: string
  description: string
  location: string
  location_coords: { lat: number; lon: number }
  reference_link: string
  is_strikethrough?: boolean
}

export default async function getEvents({
  db,
  start,
  end,
  logging
}: {
  db: CalendarDb
  start: string
  end: string
  logging: CoreContext['logging']
}): Promise<AggregatedEvent[]> {
  const calendarsWithIcs = await db
    .select()
    .from(calendars)
    .where(ne(calendars.link, ''))

  const syncService = new ICalSyncService(db)

  for (const calendar of calendarsWithIcs) {
    if (await syncService.shouldSync(calendar.id)) {
      // Sync in background (don't await to avoid blocking)
      syncService.syncCalendar(calendar.id, calendar.link).catch(console.error)
    }
  }

  const startMoment = dayjs(start).startOf('day').toDate()

  const endMoment = dayjs(end).endOf('day').toDate()

  const allEvents: AggregatedEvent[] = []

  // Get single events
  const singleCalendarEvents = await db.query.eventsSingle.findMany({
    where: {
      AND: [
        { OR: [{ start: { gte: startMoment } }, { end: { gte: startMoment } }] },
        { OR: [{ start: { lte: endMoment } }, { end: { lte: endMoment } }] }
      ]
    },
    with: { base: true }
  })

  for (const event of singleCalendarEvents) {
    const baseEvent = event.base

    if (!baseEvent) continue

    allEvents.push({
      id: baseEvent.id,
      type: 'single',
      start: event.start ? event.start.toISOString() : '',
      end: event.end ? event.end.toISOString() : '',
      title: baseEvent.title,
      calendar: baseEvent.calendar ?? '',
      category: baseEvent.category ?? '',
      description: baseEvent.description,
      location: baseEvent.location,
      location_coords: baseEvent.location_coords ?? { lat: 0, lon: 0 },
      reference_link: baseEvent.reference_link
    })
  }

  // Get recurring events
  const recurringCalendarEvents = await db.query.eventsRecurring.findMany(
    {
      with: { base: true }
    }
  )

  const { RRule } = await import('rrule')

  for (const event of recurringCalendarEvents) {
    const baseEvent = event.base

    if (!baseEvent) continue

    const parsed = RRule.fromString(event.recurring_rule)

    const eventsInRange = parsed.between(
      dayjs(startMoment)
        .subtract(event.duration_amount, event.duration_unit)
        .toDate(),
      dayjs(endMoment).toDate(),
      true
    )

    for (const eventDate of eventsInRange) {
      const eventStart = dayjs(eventDate).utc().format('YYYY-MM-DD HH:mm:ss')

      if (
        event.exceptions?.some(
          (exception: string) =>
            dayjs(exception).format('YYYY-MM-DD HH:mm:ss') === eventStart
        )
      ) {
        continue
      }

      const eventEnd = dayjs(eventDate)
        .add(event.duration_amount, event.duration_unit)
        .utc()
        .format('YYYY-MM-DD HH:mm:ss')

      allEvents.push({
        id: `${baseEvent.id}-${dayjs(eventDate).format('YYYYMMDD_HH:mm:ss')}`,
        type: 'recurring',
        start: eventStart,
        end: eventEnd,
        rrule: `${event.recurring_rule}||duration_amt=${event.duration_amount};duration_unit=${event.duration_unit}`,
        title: baseEvent.title,
        calendar: baseEvent.calendar ?? '',
        category: baseEvent.category ?? '',
        description: baseEvent.description,
        location: baseEvent.location,
        location_coords: baseEvent.location_coords ?? { lat: 0, lon: 0 },
        reference_link: baseEvent.reference_link
      })
    }
  }

  // Get iCal events
  const icalEvents = await db.query.eventsIcal.findMany({
    where: {
      AND: [
        { OR: [{ start: { gte: startMoment } }, { end: { gte: startMoment } }] },
        { OR: [{ start: { lte: endMoment } }, { end: { lte: endMoment } }] }
      ]
    },
    with: { calendar_info: true }
  })

  for (const event of icalEvents) {
    allEvents.push({
      id: `ical-${event.id}`,
      type: 'single',
      start: event.start ? event.start.toISOString() : '',
      end: event.end ? event.end.toISOString() : '',
      title: event.title,
      calendar: event.calendar_info?.id ?? '',
      category: '_external',
      description: event.description,
      location: event.location,
      location_coords: { lat: 0, lon: 0 },
      reference_link: ''
    })
  }

  const externalEventGetterFiles = fs.globSync(
    '../../modules/*/server/events.ts'
  )

  logging.debug(
    `Found ${externalEventGetterFiles.length} external event getter files`
  )

  for (const file of externalEventGetterFiles) {
    try {
      const { default: getExternalEvents } = await import(path.resolve(file))

      const getterModuleId = file
        .replace(/\\/g, '/')
        .match(/\/modules\/([^/]+)\//)?.[1]

      const entries = await getExternalEvents({
        db: scopeDbForModule(
          db,
          getterModuleId
            ? ModuleRegistry.getModuleKeyMap(getterModuleId)
            : undefined
        ),
        start: dayjs(startMoment).format('YYYY-MM-DD HH:mm:ss'),
        end: dayjs(endMoment).format('YYYY-MM-DD HH:mm:ss')
      })

      allEvents.push(...entries)
    } catch (err) {
      logging.warn(`Cannot import external events from ${file}: ${err}`)
    }
  }

  return allEvents
}
