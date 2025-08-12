/**
 * Shared monitoring utilities to eliminate code duplication
 */

import { db, siteStats } from '../database/index.js'
import { eq } from 'drizzle-orm'
import env from '../env.js'

/**
 * Check if a website is up and return status information
 */
export async function checkWebsiteStatus(url: string) {
  const startTime = performance.now()

  try {
    // Create timeout controller using env config
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), env.PING_TIMEOUT_MS)

    // Make HTTP request to the website
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Website-Monitor/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    })

    clearTimeout(timeoutId)
    const responseTime = Math.round(performance.now() - startTime)

    // Check if status code indicates the site is up (2xx or 3xx)
    const isUp = response.status >= 200 && response.status < 400

    return {
      status: isUp ? 'up' as const : 'down' as const,
      statusCode: response.status,
      responseTime,
      error: isUp ? undefined : `HTTP ${response.status}`,
    }

  } catch (error) {
    const responseTime = Math.round(performance.now() - startTime)
    let errorMessage = 'Unknown error'

    // Categorize different types of errors
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorMessage = `Request timeout (${env.PING_TIMEOUT_MS / 1000}s)`
      } else if (error.message.includes('ENOTFOUND')) {
        errorMessage = 'DNS resolution failed'
      } else if (error.message.includes('ECONNREFUSED')) {
        errorMessage = 'Connection refused'
      } else if (error.message.includes('network')) {
        errorMessage = 'Network error'
      } else {
        errorMessage = error.message
      }
    }

    return {
      status: 'down' as const,
      statusCode: undefined,
      responseTime,
      error: errorMessage,
    }
  }
}

/**
 * Calculate running average response time
 */
function calculateRunningAverage(currentAvg: number, newValue: number, totalCount: number): number {
  if (totalCount <= 1) return newValue
  return Math.round(((currentAvg * (totalCount - 1)) + newValue) / totalCount)
}

/**
 * Update site statistics after a ping
 */
export async function updateSiteStats(siteId: string, pingResult: any, checkedAt: Date) {
  try {
    console.log(`🔄 Starting site stats update for site ${siteId}`)

    // Try to get existing stats first
    const existingStats = await db
      .select()
      .from(siteStats)
      .where(eq(siteStats.siteId, siteId))
      .limit(1)

    const isUp = pingResult.status === 'up'
    const responseTime = pingResult.responseTime || 0

    if (existingStats.length === 0) {
      // Insert new record
      console.log(`📊 Creating new site stats for site ${siteId}`)
      await db.insert(siteStats).values({
        siteId,
        totalChecks: 1,
        successfulChecks: isUp ? 1 : 0,
        currentStatus: isUp ? 'up' : 'down',
        lastChecked: checkedAt,
        uptime1h: isUp ? 100 : 0,
        uptime24h: isUp ? 100 : 0,
        uptime7d: isUp ? 100 : 0,
        uptimeAllTime: isUp ? 100 : 0,
        avgResponseTime1h: isUp ? responseTime : 0,
        avgResponseTime24h: isUp ? responseTime : 0,
        avgResponseTime7d: isUp ? responseTime : 0,
        avgResponseTimeAllTime: isUp ? responseTime : 0,
      })
    } else {
      // Update existing record
      const current = existingStats[0]
      const newTotalChecks = current.totalChecks + 1
      const newSuccessfulChecks = current.successfulChecks + (isUp ? 1 : 0)
      const newUptimePercentage = (newSuccessfulChecks / newTotalChecks) * 100

      // Calculate new running average for response time (only for successful checks)
      let newAvgResponseTime = current.avgResponseTimeAllTime
      if (isUp && responseTime > 0) {
        newAvgResponseTime = calculateRunningAverage(
          current.avgResponseTimeAllTime,
          responseTime,
          newSuccessfulChecks
        )
      }

      console.log(`📊 Updating site stats for site ${siteId}: ${newSuccessfulChecks}/${newTotalChecks} (${newUptimePercentage.toFixed(1)}%)`)

      await db
        .update(siteStats)
        .set({
          totalChecks: newTotalChecks,
          successfulChecks: newSuccessfulChecks,
          currentStatus: isUp ? 'up' : 'down',
          lastChecked: checkedAt,
          uptime1h: newUptimePercentage,
          uptime24h: newUptimePercentage,
          uptime7d: newUptimePercentage,
          uptimeAllTime: newUptimePercentage,
          avgResponseTime1h: newAvgResponseTime,
          avgResponseTime24h: newAvgResponseTime,
          avgResponseTime7d: newAvgResponseTime,
          avgResponseTimeAllTime: newAvgResponseTime,
          updatedAt: new Date(),
        })
        .where(eq(siteStats.siteId, siteId))
    }

    console.log(`📈 Successfully updated site stats for site ${siteId}`)
  } catch (statsError) {
    console.error('🚨 Failed to update site stats:', statsError)
    throw statsError
  }
}