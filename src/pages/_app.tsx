// import "../styles/globals.css";
import "../../public/assets/bootstrap/css/bootstrap.min.css"
import "../../public/assets/font-awesome/css/font-awesome.min.css"
import "../styles/style.scss"
import { appWithTranslation } from "next-i18next"
import nextI18nConfig from "../../next-i18next.config.mjs"
import { AppType } from "next/app"
import { Menu } from "../components/Menu"

const MyApp: AppType = ({ Component, pageProps }) => {
  return (
    <>
      <Menu />
      <Component {...pageProps} />
    </>
  )
}

export default appWithTranslation(MyApp, nextI18nConfig)
