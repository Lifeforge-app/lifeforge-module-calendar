import ical from 'node-ical'
import z from 'zod'

import forge from '../forge'
import { ICalSyncService } from '../functions/icalSyncing'
import calendarSchemas from '../schema'

export const list = forge
  .query()
  .description('Get all calendars')
  .input({})
  .callback(({ pb }) =>
    pb.getFullList.collection('calendars').sort(['link', 'name']).execute()
  )

export const getById = forge
  .query()
  .description('Get a specific calendar by ID')
  .input({
    query: z.object({
      id: z.string()
    })
  })
  .existenceCheck('query', {
    id: 'calendars'
  })
  .callback(({ pb, query: { id } }) =>
    pb.getOne.collection('calendars').id(id).execute()
  )

export const create = forge
  .mutation()
  .description('Create a new calendar with optional ICS sync')
  .input({
    body: calendarSchemas.calendars
      .pick({
        name: true,
        color: true
      })
      .extend({
        icsUrl: z.url().optional()
      })
  })
  .statusCode(201)
  .callback(async ({ pb, body }) => {
    const newCalendar = await pb.create
      .collection('calendars')
      .data({
        name: body.name,
        color: body.color,
        link: body.icsUrl ? body.icsUrl : null
      })
      .execute()

    if (body.icsUrl) {
      const icalService = new ICalSyncService(pb)

      await icalService
        .syncCalendar(newCalendar.id, body.icsUrl)
        .catch(console.error)
    }

    return newCalendar
  })

export const update = forge
  .mutation()
  .description('Update calendar name and color')
  .input({
    query: z.object({
      id: z.string()
    }),
    body: calendarSchemas.calendars.pick({
      name: true,
      color: true
    })
  })
  .existenceCheck('query', {
    id: 'calendars'
  })
  .callback(({ pb, query: { id }, body }) =>
    pb.update.collection('calendars').id(id).data(body).execute()
  )

export const remove = forge
  .mutation()
  .description('Delete a calendar')
  .input({
    query: z.object({
      id: z.string()
    })
  })
  .existenceCheck('query', {
    id: 'calendars'
  })
  .statusCode(204)
  .callback(({ pb, query: { id } }) =>
    pb.delete.collection('calendars').id(id).execute()
  )

export const validateICS = forge
  .mutation()
  .description('Validate if an ICS URL is accessible')
  .input({
    body: z.object({
      icsUrl: z.url()
    })
  })
  .callback(async ({ body: { icsUrl } }) => {
    try {
      const response = await fetch(icsUrl).then(res => {
        if (!res.ok) {
          throw new Error('Failed to fetch ICS URL')
        }

        return res.text()
      })

      const parsed = ical.sync.parseICS(response)

      if (Object.keys(parsed).length === 0) {
        throw new Error('No events found in ICS file')
      }

      return true
    } catch {
      return false
    }
  })
