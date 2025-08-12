import { createRoute } from '@hono/zod-openapi'
import { HttpCode } from '../http/index.js'
import { createRouter } from '../lib/create-app.js'
import jsonContent from '../openapi/helpers/json-content.js'
import createMessageObjectSchema from '../openapi/schema/create-message-object.js'

const router = createRouter().openapi(
  createRoute({
    tags: ['Index'], // this is to show as the header group in scalar ui
    method: 'get',
    path: '/',
    responses: {
      [HttpCode.OK]: jsonContent(createMessageObjectSchema('pong'), 'ping'),
    },
  }),
  (c) => {
    return c.json(
      {
        message: 'pong',
      },
      HttpCode.OK,
    )
  },
)

export default router