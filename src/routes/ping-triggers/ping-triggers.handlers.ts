import type { AppRouteHandler } from '../../lib/types.js'
import type { TriggerPingsRoute, GetTriggerStatusRoute } from './ping-triggers.routes.js'
import { db, sites, pings } from '../../database/index.js'
import { eq, inArray, and } from 'drizzle-orm'
import { checkWebsiteStatus, updateSiteStats } from '../../utils/monitoring.utils.js'
import env from '../../env.js'

/**
 * Handler for POST /ping-triggers/trigger
 * Fetches site IDs and calls monitoring routes to perform pings
 */
export const triggerPings: AppRouteHandler<TriggerPingsRoute> = async (c) => {
    try {
        console.log('🚀 Triggering intelligent ping checks...')

        // Get request body for optional site ID filter
        const body = await c.req.json().catch(() => ({}))
        const { siteIds } = body || {}

        let activeSites

        // Filter out empty/invalid site IDs
        const validSiteIds = siteIds && Array.isArray(siteIds)
            ? siteIds.filter((id: any) => id && typeof id === 'string' && id.trim().length > 0)
            : []

        if (validSiteIds.length > 0) {
            // Use provided site IDs (filter by active status)
            console.log(`📋 Filtering by provided site IDs: ${validSiteIds.join(', ')}`)
            activeSites = await db
                .select({
                    id: sites.id,
                    name: sites.name,
                    url: sites.url,
                })
                .from(sites)
                .where(and(eq(sites.status, 'active'), inArray(sites.id, validSiteIds)))
        } else {
            // Get all active sites
            console.log('📋 Getting all active sites')
            activeSites = await db
                .select({
                    id: sites.id,
                    name: sites.name,
                    url: sites.url,
                })
                .from(sites)
                .where(eq(sites.status, 'active'))
        }

        console.log(`📋 Found ${activeSites.length} active sites`)

        // Fire and forget - start all pings in parallel but don't wait for them
        console.log(`🚀 Triggering ${activeSites.length} site pings in background (fire-and-forget)`)

        // Start all pings in parallel without awaiting - do everything directly
        activeSites.forEach(async (site: any) => {
            try {
                console.log(`📡 Starting background ping for site: ${site.id} (${site.url})`)

                // Check the website status
                const result = await checkWebsiteStatus(site.url)
                const checkedAt = new Date()

                // Store the ping data with location information
                await db.insert(pings).values({
                    siteId: site.id,
                    checkedAt,
                    isUp: result.status === 'up',
                    responseTime: result.responseTime,
                    statusCode: result.statusCode,
                    error: result.error,
                    location: env.MONITORING_LOCATION,
                    regionCode: env.MONITORING_REGION_CODE,
                })

                console.log(`📊 Stored ping data for site ${site.id}`)

                // Update site stats
                try {
                    await updateSiteStats(site.id, result, checkedAt)
                } catch (statsError) {
                    console.error('🚨 Failed to update site stats:', statsError)
                }

                console.log(`✅ Background ping completed for site ${site.id}: ${result.status}`)

            } catch (pingError) {
                console.error(`🚨 Background ping error for site ${site.id}:`, pingError)
                if (pingError instanceof Error) {
                    console.error(`🚨 Error details:`, pingError.message, pingError.stack)
                } else {
                    console.error(`🚨 Error details:`, String(pingError))
                }
            }
        })

        const message = `Triggered ${activeSites.length} background pings`

        console.log(`🎯 ${message}`)

        // Return immediately without waiting for pings to complete
        return c.json({
            message,
            sitesChecked: activeSites.length,
            results: [], // Empty since we're not waiting for results
            skipped: [], // Empty since we're not waiting for results
            timestamp: new Date().toISOString(),
        }, 200)

    } catch (error) {
        console.error('🚨 Error in ping trigger:', error)
        return c.json({
            error: 'Failed to trigger pings'
        }, 500)
    }
}

/**
 * Handler for GET /ping-triggers/status
 * Returns basic information about active sites
 */
export const getTriggerStatus: AppRouteHandler<GetTriggerStatusRoute> = async (c) => {
    try {
        console.log('📊 Getting ping trigger status...')

        // Get all active sites
        const activeSites = await db
            .select({
                id: sites.id,
                name: sites.name,
                url: sites.url,
                interval: sites.interval,
            })
            .from(sites)
            .where(eq(sites.status, 'active'))

        const siteStatuses = activeSites.map((site: any) => ({
            siteId: site.id,
            siteName: site.name,
            url: site.url,
            interval: site.interval,
            lastPinged: undefined, // Let monitoring routes handle this
            nextPingDue: new Date().toISOString(), // Always ready to ping
            isDue: true, // Always ready to ping
            timeUntilDue: undefined,
        }))

        console.log(`📈 Found ${activeSites.length} active sites`)

        return c.json({
            totalActiveSites: activeSites.length,
            sitesDue: activeSites.length,
            sitesNotDue: 0,
            sites: siteStatuses,
            timestamp: new Date().toISOString(),
        }, 200)

    } catch (error) {
        console.error('🚨 Error getting trigger status:', error)
        return c.json({
            error: 'Failed to get trigger status'
        }, 500)
    }
}