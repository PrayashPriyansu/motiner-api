import { createRoute, z } from '@hono/zod-openapi'
import jsonContent from '../../openapi/helpers/json-content.js'

const tags = ['pingers']

// Schema for ping trigger response
const PingTriggerResponseSchema = z.object({
    message: z.string(),
    sitesChecked: z.number(),
    results: z.array(z.object({
        siteId: z.string(),
        siteName: z.string(),
        url: z.string(),
        status: z.enum(['up', 'down']),
        responseTime: z.number(),
        statusCode: z.number().optional(),
        error: z.string().optional(),
        pingId: z.string(),
        lastPingedBefore: z.string().optional(),
    })),
    skipped: z.array(z.object({
        siteId: z.string(),
        siteName: z.string(),
        reason: z.string(),
        nextPingDue: z.string().optional(),
    })),
    timestamp: z.string(),
})

// Schema for manual trigger request (completely optional)
const ManualTriggerRequestSchema = z.object({
    siteIds: z.array(z.string()).optional(),
}).optional()

/**
 * Route to trigger pinging of sites
 */
export const triggerPings = createRoute({
    tags: tags,
    method: 'post',
    path: '/ping-triggers/trigger',
    summary: 'Trigger site pinging',
    description: 'Triggers pinging of all active sites or specific sites if provided',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: ManualTriggerRequestSchema,
                },
            },
            description: 'Optional trigger parameters',
        },
    },
    responses: {
        200: jsonContent(PingTriggerResponseSchema, 'Ping trigger results'),
        500: jsonContent(z.object({ error: z.string() }), 'Server error'),
    },
})

/**
 * Route to get trigger status and next scheduled pings
 */
export const getTriggerStatus = createRoute({
    method: 'get',
    tags: tags,
    path: '/ping-triggers/status',
    summary: 'Get ping trigger status',
    description: 'Returns information about which sites are due for pinging and when',
    responses: {
        200: jsonContent(z.object({
            totalActiveSites: z.number(),
            sitesDue: z.number(),
            sitesNotDue: z.number(),
            sites: z.array(z.object({
                siteId: z.string(),
                siteName: z.string(),
                url: z.string(),
                interval: z.string(),
                lastPinged: z.string().optional(),
                nextPingDue: z.string(),
                isDue: z.boolean(),
                timeUntilDue: z.string().optional(),
            })),
            timestamp: z.string(),
        }), 'Trigger status information'),
        500: jsonContent(z.object({ error: z.string() }), 'Server error'),
    },
})

// Export route types for handlers
export type TriggerPingsRoute = typeof triggerPings
export type GetTriggerStatusRoute = typeof getTriggerStatus