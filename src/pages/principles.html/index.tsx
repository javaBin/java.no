import { serverSideTranslations } from "next-i18next/serverSideTranslations"
import nextI18nConfig from "../../../next-i18next.config.mjs"
import Principles from "../../components/Principles"

const PrinciplesPage = () => {
  return Principles()
}

export default PrinciplesPage

export const getStaticProps = async ({ locale }: { locale: string }) => {
  return {
    props: {
      ...(await serverSideTranslations(
        locale ?? "no",
        ["common"],
        nextI18nConfig,
        ["no", "en"],
      )),
    },
  }
}
