import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

export const env = createEnv({
  server: {
    CONFLUENCE_CLOUD_ID: z.string().min(1).optional(),
    CONFLUENCE_EMAIL: z.string().email().optional(),
    CONFLUENCE_API_TOKEN: z.string().min(1).optional(),
  },
  client: {},
  runtimeEnv: {
    CONFLUENCE_CLOUD_ID: process.env.CONFLUENCE_CLOUD_ID,
    CONFLUENCE_EMAIL: process.env.CONFLUENCE_EMAIL,
    CONFLUENCE_API_TOKEN: process.env.CONFLUENCE_API_TOKEN,
  },
})
