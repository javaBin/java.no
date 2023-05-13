import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

export const env = createEnv({
  server: {
    // OPEN_AI_API_KEY: z.string().min(1),
  },
  client: {
  },
  runtimeEnv: {
    // OPEN_AI_API_KEY: process.env.OPEN_AI_API_KEY,
  },
})
