import { boolean, integer, pgTable, text, timestamp, uuid, index } from 'drizzle-orm/pg-core'
import { createInsertSchema } from 'drizzle-zod'
import { sites } from './sites.schema.js'

export const pings = pgTable('pings', {
  id: uuid('id').defaultRandom().primaryKey(),

  siteId: uuid('site_id').notNull().references(() => sites.id, { onDelete: 'cascade' }),

  checkedAt: timestamp('checked_at', { withTimezone: true }).defaultNow().notNull(),

  isUp: boolean('is_up').notNull(), // true = up, false = down

  responseTime: integer('response_time'), // in ms, optional if down

  statusCode: integer('status_code'), // e.g., 200, 500 — optional

  location: text('location'), // e.g., "Singapore", "Mumbai"

  regionCode: text('region_code'), // e.g., "SG", "IN"

  error: text('error'), // optional error message if isUp === false

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),

}, (table) => ({
  // Index for efficient querying of pings by site and time
  siteIdCheckedAtIdx: index('pings_site_id_checked_at_idx').on(table.siteId, table.checkedAt),
}))

export const insertPingsSchema = createInsertSchema(pings).omit({
  id: true,
  createdAt: true,
})