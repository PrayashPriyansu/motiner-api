import type { Context } from 'hono'
import type { OpenAPIHono, RouteHandler, RouteConfig } from '@hono/zod-openapi'

export type AppBindings = {}

export type AppOpenAPI = OpenAPIHono<AppBindings>

export type AppRouteHandler<T extends RouteConfig> = RouteHandler<T, AppBindings>