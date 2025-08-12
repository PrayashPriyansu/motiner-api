import { createRouter } from '../../lib/create-app.js'
import * as handlers from './sites.handlers.js'
import * as routes from './sites.routes.js'

const router = createRouter()
  .openapi(routes.getAll, handlers.getAll)
  .openapi(routes.create, handlers.create)
  .openapi(routes.getById, handlers.getById)
  .openapi(routes.update, handlers.update)
  .openapi(routes.remove, handlers.remove)

export default router