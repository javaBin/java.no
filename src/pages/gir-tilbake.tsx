import { serverSideTranslations } from "next-i18next/serverSideTranslations"
import nextI18nConfig from "../../next-i18next.config.mjs"
import { useTranslation } from "next-i18next"
import Head from "next/head"
import DOMPurify from "isomorphic-dompurify"

const CONFLUENCE_PAGE_URL =
  "https://javabin.atlassian.net/wiki/spaces/javabin/pages/3083567105/javaBin+gir+tilbake"

interface GirTilbakeProps {
  title: string | null
  html: string | null
  lastUpdated: string | null
  error: boolean
  errorMessage?: string // Shown in dev for debugging
}

const GirTilbake = ({
  title,
  html,
  lastUpdated,
  error,
  errorMessage,
}: GirTilbakeProps) => {
  const { t } = useTranslation("common", { keyPrefix: "girTilbake" })

  return (
    <>
      <Head>
        <title>javaBin | {title}</title>
        <meta name="description" content={t("description")!} />
      </Head>
      <div className="policy confluence-content container">
        <div style={{ padding: "60px" }}></div>

        {!error && title && <h1 className="confluence-page-title">{title}</h1>}

        {error ? (
          <div className="confluence-error">
            <p>{t("unavailable")}</p>
            {process.env.NODE_ENV === "development" && errorMessage && (
              <p className="confluence-debug-error">
                <code>{errorMessage}</code>
              </p>
            )}
            <p>
              <a
                href={CONFLUENCE_PAGE_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t("viewInConfluence")}
              </a>
            </p>
          </div>
        ) : (
          <>
            {lastUpdated && (
              <p className="confluence-last-updated">
                {t("lastUpdated")}: {lastUpdated}
              </p>
            )}
            {html && (
              <div
                className="confluence-body"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            )}
            <p className="confluence-source-link">
              <a
                href={CONFLUENCE_PAGE_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t("viewInConfluence")}
              </a>
            </p>
          </>
        )}
      </div>
      <div style={{ paddingBottom: "60px" }}></div>
    </>
  )
}

export default GirTilbake

export const getStaticProps = async ({ locale }: { locale?: string }) => {
  const { fetchConfluencePage } = await import("../lib/confluence")

  const result = await fetchConfluencePage()

  let title: string | null = null
  let html: string | null = null
  let lastUpdated: string | null = null
  let error = true
  let errorMessage: string | undefined

  if (result.success) {
    const { page } = result
    title = page.title ?? null
    const viewHtml = page.body?.view?.value
    const storageHtml = page.body?.storage?.value

    if (viewHtml) {
      html = DOMPurify.sanitize(viewHtml, {
        ALLOWED_TAGS: [
          "h1",
          "h2",
          "h3",
          "h4",
          "h5",
          "h6",
          "p",
          "br",
          "span",
          "div",
          "ul",
          "ol",
          "li",
          "a",
          "strong",
          "em",
          "b",
          "i",
          "table",
          "thead",
          "tbody",
          "tr",
          "th",
          "td",
          "blockquote",
          "pre",
          "code",
          "img",
        ],
        ALLOWED_ATTR: ["href", "src", "alt", "title", "class", "id"],
      })
      error = false
    } else if (storageHtml) {
      // Confluence storage format: unwrap ac: tags so content is preserved, then sanitize
      let rawHtml = storageHtml
        .replace(/<ac:structured-macro[^>]*>/gi, "")
        .replace(/<\/ac:structured-macro>/gi, "")
        .replace(/<ac:rich-text-body[^>]*>/gi, "<div>")
        .replace(/<\/ac:rich-text-body>/gi, "</div>")
        .replace(/<ac:plain-text-body[^>]*>/gi, "<div>")
        .replace(/<\/ac:plain-text-body>/gi, "</div>")
      html = DOMPurify.sanitize(rawHtml, {
        ALLOWED_TAGS: [
          "h1",
          "h2",
          "h3",
          "h4",
          "h5",
          "h6",
          "p",
          "br",
          "span",
          "div",
          "ul",
          "ol",
          "li",
          "a",
          "strong",
          "em",
          "b",
          "i",
          "table",
          "thead",
          "tbody",
          "tr",
          "th",
          "td",
          "blockquote",
          "pre",
          "code",
          "img",
        ],
        ALLOWED_ATTR: ["href", "src", "alt", "title", "class", "id"],
      })
      error = false
    } else {
      errorMessage = "Confluence returned empty body. Try body-format=storage."
    }

    if (page.version?.createdAt) {
      try {
        const date = new Date(page.version.createdAt)
        lastUpdated = date.toLocaleDateString(
          locale === "en" ? "en-GB" : "no-NO",
          {
            year: "numeric",
            month: "long",
            day: "numeric",
          },
        )
      } catch {
        lastUpdated = page.version.createdAt
      }
    }
  } else {
    errorMessage = result.error
  }

  return {
    props: {
      title,
      html,
      lastUpdated,
      error,
      ...(process.env.NODE_ENV === "development" && errorMessage
        ? { errorMessage }
        : {}),
      ...(await serverSideTranslations(
        locale ?? "no",
        ["common"],
        nextI18nConfig,
        ["no", "en"],
      )),
    },
    revalidate: 86400, // Revalidate at most once per day
  }
}
