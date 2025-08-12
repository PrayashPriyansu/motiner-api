import { pgTable, text, timestamp, uuid, real, integer } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { sites } from './sites.schema.js'

export const siteStats = pgTable('site_stats', {
  id: uuid('id').defaultRandom().primaryKey(),

  siteId: uuid('site_id').notNull().unique().references(() => sites.id, { onDelete: 'cascade' }),

  totalChecks: integer('total_checks').notNull().default(1),
  successfulChecks: integer('successful_checks').notNull().default(0),

  // Uptime percentages for different time periods
  uptime1h: real('uptime_1h').notNull().default(0), // percentage 0-100
  uptime24h: real('uptime_24h').notNull().default(0), // percentage 0-100
  uptime7d: real('uptime_7d').notNull().default(0), // percentage 0-100

  // Average response times for different time periods (in milliseconds)
  avgResponseTime1h: integer('avg_response_time_1h').notNull().default(0),
  avgResponseTime24h: integer('avg_response_time_24h').notNull().default(0),
  avgResponseTime7d: integer('avg_response_time_7d').notNull().default(0),

  // All-time statistics
  uptimeAllTime: real('uptime_all_time').notNull().default(0), // percentage 0-100
  avgResponseTimeAllTime: integer('avg_response_time_all_time').notNull().default(0), // in milliseconds

  // Current status and last check info
  currentStatus: text('current_status').notNull().default('down'), // 'up' or 'down'
  lastChecked: timestamp('last_checked', { withTimezone: true }).notNull(),

  // Metadata
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().$onUpdate(() => new Date()).notNull(),
})

export const insertSiteStatsSchema = createInsertSchema(siteStats).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export const selectSiteStatsSchema = createSelectSchema(siteStats)

export const updateSiteStatsSchema = insertSiteStatsSchema.partial()