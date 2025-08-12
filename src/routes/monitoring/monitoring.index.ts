import { createRouter } from '../../lib/create-app.js'
import * as routes from './monitoring.routes.js'
import * as handlers from './monitoring.handlers.js'

/**
 * Simple monitoring routes for checking website status
 * - POST /monitoring/check-site - Check a registered site by ID and store ping data
 * - GET /monitoring/sites/{siteId}/pings - Get ping history for a specific site
 * - GET /monitoring/websites - Get all websites from database with their latest status
 */
const router = createRouter()
  .openapi(routes.checkSite, handlers.checkSite)
  .openapi(routes.getSitePings, handlers.getSitePings)
  .openapi(routes.getAllWebsites, handlers.getAllWebsites)

export default router