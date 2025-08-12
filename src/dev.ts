import { serve } from '@hono/node-server'
import app from './app.js'
import env from './env.js'

console.log('🚀 Starting API server...')

serve({
  fetch: app.fetch,
  port: Number(env.PORT) || 3000,
}, (info) => {
  console.log(`✅ Server is running on http://localhost:${info.port}`)
  console.log(`📖 API documentation available at http://localhost:${info.port}/scalar`)
})