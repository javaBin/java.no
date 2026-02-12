import { env } from "../env.mjs"

const CONFLUENCE_PAGE_ID = "3083567105"

function isConfluenceConfigured(): boolean {
  return !!(
    env.CONFLUENCE_CLOUD_ID &&
    env.CONFLUENCE_EMAIL &&
    env.CONFLUENCE_API_TOKEN
  )
}

export interface ConfluencePage {
  id: string
  title: string
  body: {
    view?: { value: string }
    storage?: { value: string }
  }
  version?: {
    createdAt: string
    number: number
  }
  _links?: {
    webui?: string
  }
}

export interface ConfluenceFetchResult {
  success: true
  page: ConfluencePage
}

export interface ConfluenceFetchError {
  success: false
  error: string
  status?: number
}

export type ConfluenceFetchResponse =
  | ConfluenceFetchResult
  | ConfluenceFetchError

export async function fetchConfluencePage(): Promise<ConfluenceFetchResponse> {
  if (!isConfluenceConfigured()) {
    return {
      success: false,
      error:
        "Confluence is not configured. Set CONFLUENCE_CLOUD_ID, CONFLUENCE_EMAIL, and CONFLUENCE_API_TOKEN.",
    }
  }

  const baseUrl = `https://api.atlassian.com/ex/confluence/${env.CONFLUENCE_CLOUD_ID}`
  const auth = Buffer.from(
    `${env.CONFLUENCE_EMAIL}:${env.CONFLUENCE_API_TOKEN}`
  ).toString("base64")

  const headers = {
    Authorization: `Basic ${auth}`,
    Accept: "application/json",
  }

  async function fetchWithFormat(
    bodyFormat: "view" | "storage"
  ): Promise<ConfluenceFetchResponse> {
    const url = `${baseUrl}/wiki/api/v2/pages/${CONFLUENCE_PAGE_ID}?body-format=${bodyFormat}`
    const response = await fetch(url, { headers })
    if (!response.ok) {
      return {
        success: false,
        error: `Confluence API error (${bodyFormat}): ${response.status} ${response.statusText}`,
        status: response.status,
      }
    }
    const page = (await response.json()) as ConfluencePage
    return { success: true, page }
  }

  try {
    let result = await fetchWithFormat("view")
    if (
      result.success &&
      !result.page.body?.view?.value &&
      !result.page.body?.storage?.value
    ) {
      result = await fetchWithFormat("storage")
    }
    return result
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return {
      success: false,
      error: `Failed to fetch Confluence page: ${message}`,
    }
  }
}
