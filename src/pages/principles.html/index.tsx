import Head from "next/head"
import { serverSideTranslations } from "next-i18next/serverSideTranslations"
import nextI18nConfig from "../../../next-i18next.config.mjs"
import { useTranslation } from "next-i18next"

const Principles = () => {
  const { t } = useTranslation("common", { keyPrefix: "main" })

  return (
    <>
      <Head>
        <title>{t("title")}</title>
        <meta name="description" content={t("title")} />
      </Head>
      <div className="policy container">
        <div style={{ padding: "60px" }}></div>

        <h2 id="a-few-very-important-principles">
          A few very important principles
        </h2>

        <h4 id="code-of-conduct">Code of Conduct</h4>

        <p>
          javaBin aims to create a community for Java technologists in Norway
          that is open to all and independent of commercial interests. To make
          this possible, we have created the following regulations for events
          and activities conducted by javaBin:
        </p>

        <ul>
          <li>
            We do not tolerate any form of harassment against event
            participants, our members or our partners. In particular, we ask
            that all refrain from commentary that unnecessarily targets gender,
            sexual orientation, disability, race, nationality, religion or
            physical appearance. This applies especially but not exclusively to
            presented content and displayed advertisement. We also ask that all
            refrain from undesired contact or unwanted photography during
            javaBin events.
          </li>
          <li>
            Unless an explicit sponsorship agreement was made, active
            participants of javaBin events are required to represent the
            interest of the Java community before any commercial interest. While
            it is acceptable to discuss a product or a professional affiliation,
            advertisement must never be the focus of a participation.
          </li>
        </ul>

        <p>
          Violations of these requirements can lead to expulsion from an event
          and, potentially, exclusion from future javaBin events. javaBin also
          reserves the right to withhold any refund of entrance fees or other
          payments and to void a membership.
        </p>

        <h4 id="if-you-observe-or-are-affected-by-a-violation-of-these-regulations">
          If you observe or are affected by a violation of these regulations
        </h4>

        <p>
          If you observe or are affected by a violation of the above
          regulations, please take immediate contact with a javaBin
          representative (who can normally be identified by their branded
          clothing and/or badges). If you are accused of a violation of these
          regulations and disagree with the accusation, please also get in
          touch. If you want to discuss a violation after an event or if you
          have any questions about these regulations, you can email us at:{" "}
          <a href="mailto:styret@java.no">styret@java.no</a>.
        </p>

        <p>
          In case of a violation, our primary goal will be to provide support
          and help to those affected. A secondary goal, where applicable, will
          be to resolve the conflict.
        </p>

        <p>
          In the case of disagreement in the interpretation or application of
          these regulations, a session of the javaBin board will rule on a case
          by case basis.
        </p>
      </div>
      <div style={{ paddingBottom: "60px" }}></div>
    </>
  )
}

export default Principles

export const getStaticProps = async ({ locale }: { locale: string }) => {
  return {
    props: {
      ...(await serverSideTranslations(
        locale ?? "no",
        ["common"],
        nextI18nConfig,
        ["no", "en"]
      )),
    },
  }
}
