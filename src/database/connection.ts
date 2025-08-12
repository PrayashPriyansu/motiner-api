import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import * as schema from './schema/index.js'
import env from '../env.js'

// Create Neon connection using validated env
export const connection = neon(env.DATABASE_URL)

// Create Drizzle database instance
export const db = drizzle(connection, {
  schema,
})

// Export type for use in consuming applications
export type DatabaseConnection = typeof db