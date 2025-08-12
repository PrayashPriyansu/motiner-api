import type { ZodError } from 'zod'
import { config } from 'dotenv'
import { expand } from 'dotenv-expand'
import { z } from 'zod'

expand(config())

const EnvSchema = z.object({
  PORT: z.coerce.number().default(9999),
  NODE_ENV: z.enum(['development', 'production']).default('development'),
  LOG_LEVEL: z.enum(['info', 'fatal', 'debug', 'warn', 'error', 'trace']).default('info'),
  DATABASE_URL: z.string(),
  
  // Monitoring configuration
  MONITORING_INTERVAL_MS: z.coerce.number().default(300000), // 5 minutes
  PING_TIMEOUT_MS: z.coerce.number().default(10000), // 10 seconds
  MONITORING_LOCATION: z.string().default('Unknown'), // e.g., "Singapore", "Mumbai"
  MONITORING_REGION_CODE: z.string().default('XX'), // e.g., "SG", "IN"
  MAX_CONCURRENT_PINGS: z.coerce.number().default(10), // Max concurrent site pings
  DB_RETRY_ATTEMPTS: z.coerce.number().default(3), // Database retry attempts
  DB_RETRY_DELAY_MS: z.coerce.number().default(1000), // Initial retry delay
})

export type Env = z.infer<typeof EnvSchema>

// eslint-disable-next-line import/no-mutable-exports
let env: Env

try {
  // eslint-disable-next-line node/prefer-global/process
  env = EnvSchema.parse(process.env)
}
catch (err) {
  const error = err as ZodError
  console.error('❌ Invalid env')
  console.error(z.prettifyError(error))
  // eslint-disable-next-line node/prefer-global/process
  process.exit(1)
}
export default env
