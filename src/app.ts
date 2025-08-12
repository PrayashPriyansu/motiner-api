import sites from './routes/sites/sites.index.js'
import monitoring from './routes/monitoring/monitoring.index.js'
import pingTriggers from './routes/ping-triggers/ping-triggers.index.js'
import { cors } from 'hono/cors'
import configureOpenApi from './lib/configure-open-api.js'
import createApp from './lib/create-app.js'
import index from './routes/index.route.js'

const app = createApp()

app.use('*', cors())
configureOpenApi(app)

const routes = [
  index,
  sites, // Routes for managing sites to monitor
  monitoring, // Simple monitoring routes for website checking
  pingTriggers, // Intelligent ping trigger system (easily extractable for scaling)
]

routes.forEach(route => app.route('/', route))

export default app