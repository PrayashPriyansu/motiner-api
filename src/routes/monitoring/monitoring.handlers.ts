import type { AppRouteHandler } from '../../lib/types.js'
import type { CheckSiteRoute, GetSitePingsRoute, GetAllWebsitesRoute } from './monitoring.routes.js'
import { db, sites, pings } from '../../database/index.js'
import { eq, desc } from 'drizzle-orm'
import { checkWebsiteStatus, updateSiteStats } from '../../utils/monitoring.utils.js'
import env from '../../env.js'

/**
 * Handler for POST /monitoring/check-site
 * Takes a site ID and checks the site, storing ping data
 */
export const checkSite: AppRouteHandler<CheckSiteRoute> = async (c) => {
  try {
    // Get site ID from request body
    const body = await c.req.json()
    const { siteId } = body

    console.log(`🔍 Checking registered site: ${siteId}`)

    // Get the site from database
    const site = await db
      .select({
        id: sites.id,
        name: sites.name,
        url: sites.url,
      })
      .from(sites)
      .where(eq(sites.id, siteId))
      .limit(1)

    if (site.length === 0) {
      return c.json({
        error: 'Site not found'
      }, 404)
    }

    const siteData = site[0]
    console.log(`📍 Found site: ${siteData.name} (${siteData.url})`)

    // Check the website status
    const result = await checkWebsiteStatus(siteData.url)
    const checkedAt = new Date()

    // Store the ping data with location information
    const pingResult = await db.insert(pings).values({
      siteId: siteData.id,
      checkedAt,
      isUp: result.status === 'up',
      responseTime: result.responseTime,
      statusCode: result.statusCode,
      error: result.error,
      location: env.MONITORING_LOCATION,
      regionCode: env.MONITORING_REGION_CODE,
    }).returning({ id: pings.id })

    const pingId = pingResult[0].id
    console.log(`📊 Stored ping data with ID: ${pingId}`)

    // Update site stats
    try {
      await updateSiteStats(siteData.id, result, checkedAt)
    } catch (statsError) {
      console.error('🚨 Failed to update site stats:', statsError)
    }

    // Return the result - success response (200)
    return c.json({
      siteId: siteData.id,
      siteName: siteData.name,
      url: siteData.url,
      status: result.status,
      statusCode: result.statusCode,
      responseTime: result.responseTime,
      error: result.error,
      checkedAt: checkedAt.toISOString(),
      pingId,
    }, 200)

  } catch (error) {
    console.error('🚨 Error checking site:', error)
    // Return error response (400)
    return c.json({
      error: 'Failed to check site'
    }, 400)
  }
}

/**
 * Handler for GET /monitoring/sites/{siteId}/pings
 * Returns ping history for a specific site
 */
export const getSitePings: AppRouteHandler<GetSitePingsRoute> = async (c) => {
  try {
    const { siteId } = c.req.param()
    const { limit, offset } = c.req.query()

    console.log(`📊 Fetching ping history for site: ${siteId}`)

    // First, verify the site exists and get its name
    const site = await db
      .select({
        id: sites.id,
        name: sites.name,
      })
      .from(sites)
      .where(eq(sites.id, siteId))
      .limit(1)

    if (site.length === 0) {
      return c.json({
        error: 'Site not found'
      }, 404)
    }

    const siteData = site[0]

    // Get ping history for the site
    const pingHistory = await db
      .select({
        id: pings.id,
        checkedAt: pings.checkedAt,
        isUp: pings.isUp,
        responseTime: pings.responseTime,
        statusCode: pings.statusCode,
        location: pings.location,
        regionCode: pings.regionCode,
        error: pings.error,
      })
      .from(pings)
      .where(eq(pings.siteId, siteId))
      .orderBy(desc(pings.checkedAt))
      .limit(parseInt(limit || '50'))
      .offset(parseInt(offset || '0'))

    console.log(`✅ Retrieved ${pingHistory.length} ping records`)

    return c.json({
      siteId: siteData.id,
      siteName: siteData.name,
      pings: pingHistory.map(ping => ({
        id: ping.id,
        checkedAt: ping.checkedAt.toISOString(),
        isUp: ping.isUp,
        responseTime: ping.responseTime ?? undefined,
        statusCode: ping.statusCode ?? undefined,
        location: ping.location ?? undefined,
        regionCode: ping.regionCode ?? undefined,
        error: ping.error ?? undefined,
      })),
      totalCount: pingHistory.length,
      timestamp: new Date().toISOString(),
    }, 200)

  } catch (error) {
    console.error('🚨 Error fetching ping history:', error)
    return c.json({
      error: 'Failed to fetch ping history'
    }, 500)
  }
}

/**
 * Handler for GET /monitoring/websites
 * Returns all websites from database with their latest ping status
 */
export const getAllWebsites: AppRouteHandler<GetAllWebsitesRoute> = async (c) => {
  try {
    console.log('📊 Fetching all websites from database')

    // Get all sites from database
    const allSites = await db
      .select({
        id: sites.id,
        name: sites.name,
        url: sites.url,
        status: sites.status,
      })
      .from(sites)
      .orderBy(sites.name)

    // For each site, get the latest ping data
    const websitesWithPings = await Promise.all(
      allSites.map(async (site) => {
        try {
          // Get the most recent ping for this site
          const latestPing = await db
            .select({
              isUp: pings.isUp,
              responseTime: pings.responseTime,
              statusCode: pings.statusCode,
              checkedAt: pings.checkedAt,
            })
            .from(pings)
            .where(eq(pings.siteId, site.id))
            .orderBy(desc(pings.checkedAt))
            .limit(1)

          return {
            id: site.id,
            name: site.name,
            url: site.url,
            status: site.status,
            lastPing: latestPing.length > 0 ? {
              isUp: latestPing[0].isUp,
              responseTime: latestPing[0].responseTime ?? undefined,
              statusCode: latestPing[0].statusCode ?? undefined,
              checkedAt: latestPing[0].checkedAt.toISOString(),
            } : undefined,
          }
        } catch (error) {
          console.warn(`⚠️ Failed to get ping data for site ${site.id}:`, error)
          return {
            id: site.id,
            name: site.name,
            url: site.url,
            status: site.status,
            lastPing: undefined,
          }
        }
      })
    )

    console.log(`✅ Retrieved ${websitesWithPings.length} websites`)

    return c.json({
      websites: websitesWithPings,
      totalCount: websitesWithPings.length,
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    console.error('🚨 Error fetching websites:', error)
    return c.json({
      websites: [],
      totalCount: 0,
      timestamp: new Date().toISOString(),
    }, 500)
  }
}