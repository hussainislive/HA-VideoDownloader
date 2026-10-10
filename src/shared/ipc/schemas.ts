import { z } from 'zod'

export const EmptyInputSchema = z.undefined()

export const OpenExternalInputSchema = z.object({
  url: z.string().min(1).max(2_048),
})

export type OpenExternalInput = z.infer<typeof OpenExternalInputSchema>
