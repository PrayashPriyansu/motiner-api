import type { ZodSchema } from 'zod'

export default function jsonContentRequired<T extends ZodSchema>(schema: T, description: string) {
  return {
    content: {
      'application/json': {
        schema,
      },
    },
    description,
    required: true,
  }
}