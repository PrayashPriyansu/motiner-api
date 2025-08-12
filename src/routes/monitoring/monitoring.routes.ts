import { createRoute, z } from '@hono/zod-openapi'
import jsonContent from '../../openapi/helpers/json-content.js'

// Schema for site check request (by site ID)
const SiteCheckRequestSchema = z.object({
  siteId: z.string().uuid('Must be a valid UUID'),
})

// Schema for site check response (includes site info and ping ID)
const SiteCheckResponseSchema = z.object({
  siteId: z.string(),
  siteName: z.string(),
  url: z.string(),
  status: z.enum(['up', 'down']),
  statusCode: z.number().optional(),
  responseTime: z.number(),
  error: z.string().optional(),
  checkedAt: z.string(),
  pingId: z.string(), // ID of the stored ping record
})

// Schema for all websites data (from database)
const AllWebsitesSchema = z.object({
  websites: z.array(z.object({
    id: z.string(),
    name: z.string(),
    url: z.string(),
    status: z.enum(['active', 'archive', 'not_tracking', 'delete']),
    lastPing: z.object({
      isUp: z.boolean(),
      responseTime: z.number().optional(),
      statusCode: z.number().optional(),
      checkedAt: z.string(),
    }).optional(),
  })),
  totalCount: z.number(),
  timestamp: z.string(),
})

// Schema for ping history response
const PingHistorySchema = z.object({
  siteId: z.string(),
  siteName: z.string(),
  pings: z.array(z.object({
    id: z.string(),
    checkedAt: z.string(),
    isUp: z.boolean(),
    responseTime: z.number().optional(),
    statusCode: z.number().optional(),
    location: z.string().optional(),
    regionCode: z.string().optional(),
    error: z.string().optional(),
  })),
  totalCount: z.number(),
  timestamp: z.string(),
})

/**
 * Route to check a registered site by ID and store ping data
 */
export const checkSite = createRoute({
  method: 'post',
  path: '/monitoring/check-site',
  summary: 'Check registered site status',
  description: 'Checks a registered site by ID and stores ping data in the database',
  request: {
    body: {
      content: {
        'application/json': {
          schema: SiteCheckRequestSchema,
        },
      },
      description: 'Site ID to check',
    },
  },
  responses: {
    200: jsonContent(SiteCheckResponseSchema, 'Site check result with stored ping data'),
    400: jsonContent(z.object({ error: z.string() }), 'Invalid site ID provided'),
    404: jsonContent(z.object({ error: z.string() }), 'Site not found'),
  },
})

/**
 * Route to get ping history for a specific site
 */
export const getSitePings = createRoute({
  method: 'get',
  path: '/monitoring/sites/{siteId}/pings',
  summary: 'Get ping history for a site',
  description: 'Returns recent ping history for a specific site',
  request: {
    params: z.object({
      siteId: z.string().uuid('Must be a valid UUID'),
    }),
    query: z.object({
      limit: z.string().optional(),
      offset: z.string().optional(),
    }),
  },
  responses: {
    200: jsonContent(PingHistorySchema, 'Ping history for the site'),
    404: jsonContent(z.object({ error: z.string() }), 'Site not found'),
    500: jsonContent(z.object({ error: z.string() }), 'Server error'),
  },
})

/**
 * Route to get all websites from database with their latest ping data
 */
export const getAllWebsites = createRoute({
  method: 'get',
  path: '/monitoring/websites',
  summary: 'Get all websites',
  description: 'Returns all websites from database with their latest ping status',
  responses: {
    200: jsonContent(AllWebsitesSchema, 'All websites with status'),
    500: jsonContent(z.object({
      websites: z.array(z.any()).length(0),
      totalCount: z.number(),
      timestamp: z.string(),
    }), 'Server error'),
  },
})

// Export route types for handlers
export type CheckSiteRoute = typeof checkSite
export type GetSitePingsRoute = typeof getSitePings
export type GetAllWebsitesRoute = typeof getAllWebsites