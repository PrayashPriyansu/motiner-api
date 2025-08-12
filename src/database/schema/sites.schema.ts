import { pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'

export const statusEnum = pgEnum('status', ['active', 'archive', 'not_tracking', 'delete'])

export const sites = pgTable('sites', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  url: text('url').notNull(),
  slug: text('slug').notNull(),
  status: statusEnum('status').notNull(),
  interval: text('interval').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().$onUpdate(() => new Date()).notNull(),
})

export const selectSitesSchema = createSelectSchema(sites)

export const insertSitesSchema = createInsertSchema(sites, {
  name: z.string().min(1, 'Name cannot be empty'),
  url: z.string().url('Must be a valid URL').min(1, 'URL cannot be empty'),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export const updateSitesSchema = insertSitesSchema.partial()