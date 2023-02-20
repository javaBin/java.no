import Link from "next/link"
import Head from "next/head"
import { serverSideTranslations } from "next-i18next/serverSideTranslations"
import nextI18nConfig from "../../../next-i18next.config.mjs"
import { useTranslation } from "next-i18next"

const Policy = () => {
  const { t } = useTranslation("common", { keyPrefix: "main" })

  return (
    <>
      <Head>
        <title>{t("title")}</title>
        <meta name="description" content={t("title")} />
      </Head>
      <div className="policy container">
        <div style={{ padding: "60px" }}></div>

        <h2 id="disclaimer-and-limitation-of-liability---terms-and-conditions">
          Disclaimer and Limitation of Liability - Terms and Conditions
        </h2>

        <p>
          These Terms and Conditions (“Terms”) apply to any and all use of
          services and information related to “javaBin” or “JavaZone”, hereby
          referred to as “javaBin”. You should make sure that you read through
          the Terms carefully before using our application or services. By using
          our applications or services, you agree to have read and understood
          the Terms and that you accept that they are binding to you.
        </p>

        <p>
          Warning: javaBin does not guarantee the accuracy of the contents or
          that it is up to date at any point of time.
        </p>

        <h3 id="1-about">1. About</h3>
        <h4 id="javabin">
          <a href="https://java.no">javaBin</a>
        </h4>
        <p>
          javaBin is one of the largest community groups in Norway. It is driven
          by volunteer enthusiasts from across the country. We have branches
          throughout the country – Stavanger, Bergen, Trondheim, Vestfold,
          Southern Norway and Oslo.
        </p>

        <p>
          javaBin organizes meetups, student events, and technology related
          events for kids in all javaBin branches.
        </p>

        <h4 id="javazone">
          <a href="https://javazone.no">JavaZone</a>
        </h4>
        <p>
          JavaZone is an independent conference and a forum for knowledge
          exchange, recruitment and branding.
        </p>

        <p>javaBin is the organization hosting the conference.</p>

        <h3 id="2-modification-of-terms">2. Modification of Terms</h3>

        <p>
          javaBin reserves the right to at any time modify the Terms. Your
          continued use of our application and services constitutes consent to
          these changes.
        </p>

        <h3 id="3-delivery-and-access">3. Delivery and Access</h3>

        <p>
          Applications and services is offered “as is”. javaBin is not liable
          for any inconvenience, loss or damage due to the fact that our
          applications or services is unavailable to the user over a shorter or
          longer period of time, for any reason, and regardless of consequence
          to the user. javaBin reserves the right, without notice, to block
          access to our applications or services partly or wholly, where such
          closure is necessary for safety or any other reasons.
        </p>

        <h3 id="4-treatment-and-disclosure-of-user-information--personal-information">
          4. Treatment and disclosure of user information / personal information
        </h3>

        <p>
          javaBin needs access to the storing capabilities of your device in
          order to enable offline use, and access to your calendar to save
          events. The application needs access to your contacts and phone for
          the application to be able to communicate with other users. The
          application needs access to the camera in order to be able to scan bar
          codes.
        </p>

        <p>
          Data regarding users and groups will be stored securely and shared
          with other registered users off the app. javaBin uses no data from
          third party applications, and no data will be shared with third
          parties.
        </p>

        <h3 id="5-responsibility">5. Responsibility</h3>

        <p>
          Despite that javaBin do their best to ensure that the applications and
          services is updated and functioning, javaBin cannot guarantee that
          errors and omissions will not occur. javaBin is not responsible for
          direct or indirect losses arising from the use of the applications or
          services. This also applies to cases where there are errors or defects
          in the applications or services.
        </p>
      </div>
      <div style={{ paddingBottom: "60px" }}></div>
    </>
  )
}

export default Policy

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
