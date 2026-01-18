import { ClientError } from '@lifeforge/server-utils'
import z from 'zod'

import forge from '../forge'
import calendarSchemas from '../schema'

export const list = forge
  .query()
  .description('Get all event categories')
  .input({})
  .callback(({ pb }) =>
    pb.getFullList.collection('categories').sort(['name']).execute()
  )

export const getById = forge
  .query()
  .description('Get a specific event category by ID')
  .input({
    query: z.object({
      id: z.string()
    })
  })
  .existenceCheck('query', {
    id: 'categories'
  })
  .callback(({ pb, query: { id } }) =>
    pb.getOne.collection('categories').id(id).execute()
  )

export const create = forge
  .mutation()
  .description('Create a new event category')
  .input({
    body: calendarSchemas.categories
  })
  .statusCode(201)
  .callback(async ({ pb, body }) => {
    if (body.name.startsWith('_')) {
      throw new ClientError('Category name cannot start with _')
    }

    return await pb.create.collection('categories').data(body).execute()
  })

export const update = forge
  .mutation()
  .description('Update event category details')
  .input({
    query: z.object({
      id: z.string()
    }),
    body: calendarSchemas.categories
  })
  .existenceCheck('query', {
    id: 'categories'
  })
  .callback(async ({ pb, query: { id }, body }) => {
    if (body.name.startsWith('_')) {
      throw new ClientError('Category name cannot start with _')
    }

    return await pb.update.collection('categories').id(id).data(body).execute()
  })

export const remove = forge
  .mutation()
  .description('Delete an event category')
  .input({
    query: z.object({
      id: z.string()
    })
  })
  .existenceCheck('query', {
    id: 'categories'
  })
  .statusCode(204)
  .callback(({ pb, query: { id } }) =>
    pb.delete.collection('categories').id(id).execute()
  )
