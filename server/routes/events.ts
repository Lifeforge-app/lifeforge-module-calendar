import { eq } from 'drizzle-orm'
import { createSelectSchema } from 'drizzle-orm/zod'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import fs from 'fs'
import z from 'zod'

import { LocationSchema } from '@lifeforge/server-utils'

import forge from '../forge'
import getEvents from '../functions/getEvents'
import {
  categories,
  events,
  eventsRecurring,
  eventsSingle
} from '../schema.drizzle'

dayjs.extend(utc)

const eventDto = createSelectSchema(events).extend({
  category: z.string(),
  calendar: z.string(),
  location_coords: z.object({ lat: z.number(), lon: z.number() })
})

const eventSingleDto = createSelectSchema(eventsSingle).extend({
  start: z.string(),
  end: z.string()
})

function serializeEvent(row: typeof events.$inferSelect) {
  return {
    ...row,
    category: row.category ?? '',
    calendar: row.calendar ?? '',
    location_coords: row.location_coords ?? { lat: 0, lon: 0 }
  }
}

const CreateAndUpdateEventSchema = eventDto
  .omit({
    type: true,
    location: true,
    location_coords: true,
    created: true,
    updated: true,
    calendar: true,
    id: true
  })
  .extend({
    calendar: z.string().optional(),
    location: LocationSchema.optional()
  })
  .and(
    z.union([
      z.object({ type: z.literal('single') }).and(
        eventSingleDto.omit({
          base_event: true,
          id: true
        })
      ),
      z.object({
        type: z.literal('recurring'),
        rrule: z.string()
      })
    ])
  )

const AggregatedEventDto = z.object({
  id: z.string(),
  type: z.enum(['single', 'recurring']),
  start: z.string(),
  end: z.string(),
  rrule: z.string().optional(),
  title: z.string(),
  calendar: z.string(),
  category: z.string(),
  description: z.string(),
  location: z.string(),
  location_coords: z.object({
    lat: z.number(),
    lon: z.number()
  }),
  reference_link: z.string(),
  is_strikethrough: z.boolean().optional()
})

function parseDuration(rrule: string):
  | {
      rule: string
      amount: number
      unit: 'hour' | 'year' | 'month' | 'day' | 'week'
    }
  | { error: string } {
  const duration = rrule.split('||').pop()

  if (!duration) {
    return { error: 'Invalid duration format' }
  }

  const matched = /duration_amt=(\d+);duration_unit=(\w+)/.exec(duration)

  if (!matched || matched.length < 3) {
    return { error: 'Invalid duration format' }
  }

  const amount = matched[1]

  const unit = matched[2]

  if (
    Number.isNaN(Number(amount)) ||
    !['hour', 'day', 'week', 'month', 'year'].includes(unit)
  ) {
    return { error: 'Invalid duration format' }
  }

  return {
    rule: rrule.split('||')[0],
    amount: Number(amount),
    unit: unit as 'hour' | 'year' | 'month' | 'day' | 'week'
  }
}

export const getByDateRange = forge
  .query({
    description: 'Get events within a date range',
    input: {
      query: z.object({
        start: z.string(),
        end: z.string()
      })
    },
    output: {
      OK: z.array(AggregatedEventDto)
    }
  })
  .callback(
    async ({ db, query: { start, end }, core: { logging }, response }) =>
      response.ok(await getEvents({ db, start, end, logging }))
  )

export const getToday = forge
  .query({
    description: "Get today's events",
    output: {
      OK: z.array(
        eventDto.omit({ created: true, updated: true }).extend({
          start: z.string(),
          end: z.string()
        })
      )
    }
  })
  .callback(async ({ db, core: { logging }, response }) => {
    const day = dayjs().format('YYYY-MM-DD')

    const startMoment = dayjs(day).startOf('day').format('YYYY-MM-DD HH:mm:ss')

    const endMoment = dayjs(day).endOf('day').format('YYYY-MM-DD HH:mm:ss')

    return response.ok(
      await getEvents({ db, start: startMoment, end: endMoment, logging })
    )
  })

export const getById = forge
  .query({
    description: 'Get a specific event by ID',
    input: {
      query: z.object({
        id: forge.existsIn(z.string(), events)
      })
    },
    output: {
      OK: eventDto
    }
  })
  .callback(async ({ db, query: { id }, response }) => {
    const row = await db.query.events.findFirst({ where: { id } })

    if (!row) {
      return response.notFound()
    }

    return response.ok(serializeEvent(row))
  })

export const create = forge
  .mutation({
    description: 'Create a new event',
    input: {
      body: CreateAndUpdateEventSchema
    },
    output: {
      CREATED: eventDto
    }
  })
  .callback(async ({ db, body, response }) => {
    const eventData = body

    const [baseEvent] = await db
      .insert(events)
      .values({
        title: eventData.title,
        category: eventData.category || null,
        calendar: eventData.calendar || null,
        location: eventData.location?.name || '',
        location_coords: {
          lat: eventData.location?.location.latitude || 0,
          lon: eventData.location?.location.longitude || 0
        },
        reference_link: eventData.reference_link || '',
        description: eventData.description || '',
        type: eventData.type
      })
      .returning()

    if (eventData.type === 'recurring') {
      const parsed = parseDuration(eventData.rrule)

      if ('error' in parsed) {
        return response.badRequest(parsed.error)
      }

      await db.insert(eventsRecurring).values({
        base_event: baseEvent.id,
        recurring_rule: parsed.rule,
        duration_amount: parsed.amount,
        duration_unit: parsed.unit,
        exceptions: []
      })
    } else {
      if (!('start' in eventData) || !('end' in eventData)) {
        return response.badRequest(
          'Single events must have start and end times'
        )
      }

      await db.insert(eventsSingle).values({
        base_event: baseEvent.id,
        start: dayjs(eventData.start).utc().toDate(),
        end: dayjs(eventData.end).utc().toDate()
      })
    }

    return response.created(serializeEvent(baseEvent))
  })

export const scanImage = forge
  .mutation({
    description: 'Extract event details from image using AI',
    media: {
      file: {
        optional: false,
        multiple: false
      }
    },
    output: {
      OK: z.object({
        title: z.string(),
        start: z.string(),
        end: z.string(),
        location: z.string(),
        location_coords: z.object({ lat: z.number(), lon: z.number() }),
        description: z.string(),
        category: z.string()
      })
    }
  })
  .callback(
    async ({
      db,
      media: { file },
      core: {
        api: { fetchAI, getAPIKey, searchLocations }
      },
      response
    }) => {
      if (!file || typeof file === 'string') {
        return response.badRequest('No file uploaded')
      }

      const gcloudKey = await getAPIKey('gcloud')

      const allCategories = await db
        .select({ id: categories.id, name: categories.name })
        .from(categories)

      const categoryList = allCategories.map(category => category.name)

      const responseStructure = z.object({
        title: z.string(),
        start: z.string(),
        end: z.string(),
        location: z.string().nullable(),
        description: z.string().nullable(),
        category: z.string().nullable()
      })

      const base64Image = fs.readFileSync(file.path, {
        encoding: 'base64'
      })

      const aiResponse = await fetchAI({
        provider: 'openai',
        model: 'gpt-5.4-mini',
        structure: responseStructure,
        messages: [
          {
            role: 'system',
            content: `You are a calendar assistant. Extract the event details from the image. If no event can be extracted, respond with null. Assume that today is ${dayjs().format(
              'YYYY-MM-DD'
            )} unless specified otherwise. 

          The title should be the name of the event.

          The dates should be in the format of YYYY-MM-DD HH:mm:ss
          
          Parse the description (event details) from the image and express it in the form of markdown. If there are multiple lines of description seen in the image, try not to squeeze everything into a single paragraph. If possible, break the details into multiple sections, with each section having a h3 heading. For example:

          ### Section Title:
          Section details here.

          ### Another Section Title:
          Another section details here.
          
          The categories should be one of the following (case sensitive): ${categoryList.join(
            ', '
          )}. Try to pick the most relevant category instead of just picking the most general one, unless you're really not sure`
          },
          {
            role: 'user',
            content: [
              {
                type: 'input_image',
                image_url: `data:${file.mimeType};base64,${base64Image}`,
                detail: 'auto'
              }
            ]
          }
        ] as any
      })

      if (!aiResponse) {
        return response.badRequest('Failed to scan image')
      }

      const finalResponse = {
        title: aiResponse.title,
        start: aiResponse.start,
        end: aiResponse.end,
        location: aiResponse.location || '',
        location_coords: { lat: 0, lon: 0 },
        description: aiResponse.description || '',
        category:
          allCategories.find(category => category.name === aiResponse.category)
            ?.id || ''
      }

      if (finalResponse.location && gcloudKey) {
        const locationInGoogleMap = await searchLocations(
          gcloudKey,
          finalResponse.location
        )

        if (locationInGoogleMap.length > 0) {
          finalResponse.location = locationInGoogleMap[0].name
          finalResponse.location_coords = {
            lat: locationInGoogleMap[0].location.latitude,
            lon: locationInGoogleMap[0].location.longitude
          }
        }
      }

      return response.ok(finalResponse)
    }
  )

export const addException = forge
  .mutation({
    description: 'Add exception date to recurring event',
    input: {
      query: z.object({
        id: forge.existsIn(z.string(), events),
        date: z.string()
      })
    },
    output: {
      OK: z.boolean()
    }
  })
  .callback(async ({ db, query: { id, date }, response }) => {
    const event = await db.query.eventsRecurring.findFirst({
      where: { base_event: id }
    })

    if (!event) {
      return response.ok(false)
    }

    const exceptions = event.exceptions || []

    if (exceptions.includes(date)) {
      return response.ok(false)
    }

    exceptions.push(date)

    await db
      .update(eventsRecurring)
      .set({ exceptions })
      .where(eq(eventsRecurring.id, event.id))

    return response.ok(true)
  })

export const update = forge
  .mutation({
    description: 'Update event details',
    input: {
      query: z.object({
        id: forge.existsIn(z.string(), events)
      }),
      body: CreateAndUpdateEventSchema
    },
    output: {
      OK: eventDto
    }
  })
  .callback(async ({ db, query: { id }, body, response }) => {
    const eventData = body

    const location = eventData.location

    await db
      .update(events)
      .set({
        title: eventData.title,
        category: eventData.category || null,
        calendar: eventData.calendar || null,
        reference_link: eventData.reference_link || '',
        description: eventData.description || '',
        updated: new Date(),
        ...(typeof location === 'object'
          ? {
              location: location.name,
              location_coords: {
                lat: location.location.latitude,
                lon: location.location.longitude
              }
            }
          : {})
      })
      .where(eq(events.id, id))

    if (eventData.type === 'recurring') {
      const parsed = parseDuration(eventData.rrule)

      if ('error' in parsed) {
        return response.badRequest(parsed.error)
      }

      const subEvent = await db.query.eventsRecurring.findFirst({
        where: { base_event: id }
      })

      if (subEvent) {
        await db
          .update(eventsRecurring)
          .set({
            recurring_rule: parsed.rule,
            duration_amount: parsed.amount,
            duration_unit: parsed.unit
          })
          .where(eq(eventsRecurring.id, subEvent.id))
      }
    } else {
      if (!('start' in eventData) || !('end' in eventData)) {
        return response.badRequest(
          'Single events must have start and end times'
        )
      }

      const subEvent = await db.query.eventsSingle.findFirst({
        where: { base_event: id }
      })

      if (subEvent) {
        await db
          .update(eventsSingle)
          .set({
            start: dayjs(eventData.start).utc().toDate(),
            end: dayjs(eventData.end).utc().toDate()
          })
          .where(eq(eventsSingle.id, subEvent.id))
      }
    }

    const row = await db.query.events.findFirst({ where: { id } })

    if (!row) {
      return response.notFound()
    }

    return response.ok(serializeEvent(row))
  })

export const remove = forge
  .mutation({
    description: 'Delete an event',
    input: {
      query: z.object({
        id: forge.existsIn(z.string(), events)
      })
    },
    output: {
      NO_CONTENT: true
    }
  })
  .callback(async ({ db, query: { id }, response }) => {
    await db.delete(events).where(eq(events.id, id))

    return response.noContent()
  })
