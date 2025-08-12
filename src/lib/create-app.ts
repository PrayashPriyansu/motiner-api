import { OpenAPIHono } from '@hono/zod-openapi'
import type { AppBindings } from './types.js'

export function createRouter() {
  return new OpenAPIHono<AppBindings>()
}

export default function createApp() {
  const app = createRouter()
  
  return app
}