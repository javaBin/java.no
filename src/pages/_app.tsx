import "../styles/globals.css"
import { useState } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { appWithTranslation } from "next-i18next"
import nextI18nConfig from "../../next-i18next.config.mjs"
import { AppType } from "next/app"
import { Menu } from "@/components/Menu"
import Head from "next/head"
import { Footer } from "@/components/Footer"

const MyApp: AppType = ({ Component, pageProps }) => {
  // Created in state so each client gets one instance that survives re-renders,
  // rather than a module-level client shared across SSR requests.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 60 * 1000, retry: 1 } },
      }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      <Head>
        <meta charSet="UTF-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/icon" href="/img/favicon.ico" />
      </Head>
      <Menu />
      <Component {...pageProps} />
      <Footer />
    </QueryClientProvider>
  )
}

export default appWithTranslation(MyApp, nextI18nConfig)
