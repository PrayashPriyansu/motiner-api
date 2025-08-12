import { createRoute, z } from '@hono/zod-openapi'
import { insertSitesSchema, selectSitesSchema, updateSitesSchema } from '../../database/index.js'
import { HttpCode } from '../../http/index.js'
import jsonContent from '../../openapi/helpers/json-content.js'
import jsonContentRequired from '../../openapi/helpers/json-content-required.js'
import IdParamsSchema from '../../openapi/schema/id-params.js'
import notFoundSchema from '../../openapi/schema/no-found.js'

const tags = ['Sites']

export const getAll = createRoute({
  path: '/sites',
  tags,
  method: 'get',
  responses: {
    [HttpCode.OK]: jsonContent(
      z.array(selectSitesSchema),
      'List of all sites',
    ),
  },
})

export const getById = createRoute({
  path: '/sites/{id}',
  tags,
  method: 'get',
  request: {
    params: IdParamsSchema,
  },
  responses: {
    [HttpCode.OK]: jsonContent(
      selectSitesSchema,
      'Requested site',
    ),
    [HttpCode.NOT_FOUND]: jsonContent(
      notFoundSchema,
      'Site Not Found',
    ),
  },
})

export const create = createRoute({
  path: '/sites',
  tags,
  method: 'post',
  request: {
    body: jsonContentRequired(insertSitesSchema, 'The site to be created'),
  },
  responses: {
    [HttpCode.OK]: jsonContent(
      selectSitesSchema,
      'Create a new site',
    ),
    [HttpCode.UNPROCESSABLE_ENTITY]: jsonContent(
      z.object({}),
      'Validation error',
    ),
  },
})

export const update = createRoute({
  path: '/sites/{id}',
  tags,
  method: 'patch',
  request: {
    params: IdParamsSchema,
    body: jsonContentRequired(updateSitesSchema, 'The site updates'),
  },
  responses: {
    [HttpCode.OK]: jsonContent(
      selectSitesSchema,
      'Updated site',
    ),
    [HttpCode.NOT_FOUND]: jsonContent(
      notFoundSchema,
      'Site not found',
    ),
    [HttpCode.UNPROCESSABLE_ENTITY]: jsonContent(
      z.object({}),
      'Validation error',
    ),
  },
})

export const remove = createRoute({
  path: '/sites/{id}',
  tags,
  method: 'delete',
  request: {
    params: IdParamsSchema,
  },
  responses: {
    [HttpCode.OK]: jsonContent(
      selectSitesSchema,
      'Updated site',
    ),
    [HttpCode.NOT_FOUND]: jsonContent(
      notFoundSchema,
      'Site not found',
    ),
    [HttpCode.UNPROCESSABLE_ENTITY]: jsonContent(
      z.object({}),
      'Validation error',
    ),
  },
})

export type GetAllRoute = typeof getAll
export type GetByIdRoute = typeof getById
export type CreateRoute = typeof create
export type UpdateRoute = typeof update
export type RemoveRoute = typeof remove