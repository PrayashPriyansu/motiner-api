import { z } from 'zod'

const notFoundSchema = z.object({
  message: z.string(),
})

export default notFoundSchema