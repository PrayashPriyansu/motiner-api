import { z } from 'zod'

const IdParamsSchema = z.object({
  id: z.string().uuid(),
})

export default IdParamsSchema