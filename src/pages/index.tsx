import Head from "next/head"
import Image from "next/image"
import mariusDuke from "../../public/img/marius_duke.svg"
import javaZoneLogo from "../../public/img/logos/javazone-logo.jpg"
import octocat from "../../public/img/logos/github-logo.png"
import { RegionCard } from "../components/Region"
import regions from "../data/regions"
import members from "../data/boardmembers"
import BoardMembers from "../components/BoardMembers"
import Link from "next/link"
import { serverSideTranslations } from "next-i18next/serverSideTranslations"
import nextI18nConfig from "../../next-i18next.config.mjs"
import { Trans, useTranslation } from "next-i18next"
import { InferGetStaticPropsType } from "next/types"
import { getRegionWithEvents } from "../lib/meetup-scraper"
import dynamic from "next/dynamic"

const RegionsMap = dynamic(() => import("../components/RegionsMap"), {
  ssr: false,
})

const Home = (props: InferGetStaticPropsType<typeof getStaticProps>) => {
  const { t } = useTranslation("common", { keyPrefix: "main" })
  const yearsArrangingJavaZone = new Date().getFullYear() - 2002

  return (
    <>
      <Head>
        <title>{t("title")}</title>
        <meta name="description" content={t("title")!} />
      </Head>
      <header>
        <div className="mx-auto max-w-[1200px] px-4">
          <div className="intro-text flex flex-col items-center text-center">
            <Image priority src={mariusDuke} height={250} alt="Marius Duke" />
            <div className="intro-lead-in">{t("intro")}</div>
            <div className="intro-heading">javaBin</div>
            <Link
              href="/#about"
              className="inline-block rounded border border-[#fed136] bg-[#fed136] px-10 py-5 font-['Montserrat'] text-lg font-bold uppercase text-white hover:border-[#fec503] hover:bg-[#fec503]"
            >
              {t("aboutUs")}
            </Link>
          </div>
        </div>
      </header>

      <section className="section" id="about">
        <div className="mx-auto max-w-[1200px] px-4">
          <div className="text-center">
            <h2 className="section-heading">{t("about")}</h2>
          </div>
          <br />
          <div className="mx-auto max-w-3xl">
              <p>{t("aboutJavaBin")}</p>
              <p>
                <Trans
                  i18nKey="aboutJavaZone"
                  t={t}
                  components={{
                    javaZoneLink: <Link href="http://javazone.no" />,
                  }}
                />
              </p>
              <p>{t("aboutMeetups")}</p>
          </div>
        </div>
      </section>

      <section className="section" id="contribute">
        <div className="mx-auto max-w-[1200px] px-4">
          <div className="text-center">
            <h2 className="section-heading">{t("contribute")}</h2>
          </div>
          <br />
          <div>
              <ul className="timeline">
                <li className="timeline-default">
                  <div className="timeline-image">
                    <Image
                      className="img-circle img-responsive"
                      height={170}
                      src={mariusDuke}
                      alt="Marius Duke"
                    />
                  </div>
                  <div className="timeline-panel">
                    <div className="timeline-heading">
                      <h4>{t("becomeActive")}</h4>
                    </div>
                    <div className="timeline-body">
                      <p>
                        <Trans
                          i18nKey="aboutBecomingActive"
                          t={t}
                          components={{
                            teknologiHustetLocationLink: (
                              <Link href="https://goo.gl/maps/wpaA5nxxHM5ao3Rr9" />
                            ),
                          }}
                        />
                      </p>
                    </div>
                  </div>
                </li>

                <li className="timeline-inverted">
                  <div className="timeline-image">
                    <Image
                      className="img-circle img-responsive"
                      height={170}
                      src={javaZoneLogo}
                      alt="JavaZone logo"
                    />
                  </div>
                  <div className="timeline-panel">
                    <div className="timeline-heading">
                      <h4>{t("ideasJavaZone")}</h4>
                    </div>
                    <div className="timeline-body">
                      <p>
                        <Trans
                          i18nKey="aboutIdeasJavaZone"
                          t={t}
                          values={{
                            yearsArrangingJavaZone: yearsArrangingJavaZone,
                          }}
                          components={{
                            javaZoneLink: <Link href="http://javazone.no" />,
                            javaZoneEmail: (
                              <Link href="mailto:javazone@java.no" />
                            ),
                          }}
                        />
                      </p>
                    </div>
                  </div>
                </li>

                <li className="timeline-default">
                  <div className="timeline-image">
                    <Image
                      className="img-circle img-responsive"
                      height={170}
                      src={octocat}
                      alt="Github Octocat"
                    />
                  </div>
                  <div className="timeline-panel">
                    <div className="timeline-heading">
                      <h4>{t("github")}</h4>
                    </div>
                    <div className="timeline-body">
                      <p>
                        <Trans
                          i18nKey="aboutGithub"
                          t={t}
                          components={{
                            githubLink: (
                              <Link href="http://github.com/javabin" />
                            ),
                          }}
                        />
                      </p>
                    </div>
                  </div>
                </li>
              </ul>
          </div>
        </div>
      </section>

      <section className="section" id="locations">
        <div className="mx-auto max-w-[1200px] px-4">
          <div className="text-center">
            <h2 className="section-heading">{t("branches")}</h2>
          </div>
          <div className="mx-auto mt-8 flex max-w-5xl flex-col gap-6 lg:h-[600px] lg:flex-row-reverse">
            <div className="min-h-0 overflow-hidden lg:w-1/2">
              <RegionsMap regions={props.regions} />
            </div>
            <div className="lg:w-1/2">
              <div className="grid h-full grid-cols-2 gap-3">
                {props.regions.map((region) => (
                  <RegionCard key={region.name} region={region} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="board">
        <BoardMembers boardMembers={props.boardMembers} />
      </section>

      {/*<Membership />*/}

      <section className="section" id="contact">
        <div className="mx-auto max-w-[1200px] px-4">
          <div className="text-center">
            <h2 className="section-heading">{t("contact")}</h2>
          </div>
          <div className="mx-auto max-w-xl text-center">
            <div>{t("contactHelpText")}</div>
            <form
              action="https://formspree.io/styret@java.no"
              method="POST"
              className="mt-4 flex w-full flex-col gap-4"
            >
              <div className="w-full">
                <label htmlFor="name" className="mb-1 block text-sm font-medium">
                  {t("name")}
                </label>
                <input
                  type="text"
                  className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  placeholder={t("yourName")!}
                  name="name"
                  id="name"
                />
              </div>
              <div className="w-full">
                <label htmlFor="email" className="mb-1 block text-sm font-medium">
                  {t("email")}
                </label>
                <input
                  type="email"
                  className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  placeholder={t("yourEmail")!}
                  name="email"
                  id="email"
                />
              </div>
              <div className="w-full">
                <label
                  htmlFor="message"
                  className="mb-1 block text-sm font-medium"
                >
                  {t("message")}
                </label>
                <textarea
                  name="message"
                  className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  placeholder={t("yourMessage")!}
                  rows={5}
                  id="message"
                />
              </div>
              <div className="text-center">
                <input
                  type="submit"
                  className="cursor-pointer rounded border border-[#fed136] bg-[#fed136] px-4 py-2 font-['Montserrat'] text-sm font-bold uppercase text-white hover:bg-[#fec503]"
                  value={t("send")!}
                />
              </div>
            </form>
          </div>
        </div>
      </section>
    </>
  )
}

export const getStaticProps = async ({ locale }: { locale: string }) => {
  const regionsWithData = await Promise.all(
    regions.map(async (region) => {
      const regionData = await getRegionWithEvents(region, locale)
      if (!regionData) {
        return {
          ...region,
          events: [],
          memberCount: 0,
          description: "",
          meetupLink: "",
          location: { lat: 0, lng: 0 },
          image: null,
          organizer: null,
        }
      }

      return {
        ...regionData,
        events: regionData.events.filter((event) => event.status === "ACTIVE"),
      }
    }),
  )

  return {
    props: {
      regions: regionsWithData,
      boardMembers: members,
      ...(await serverSideTranslations(
        locale ?? "no",
        ["common"],
        nextI18nConfig,
        ["no", "en"],
      )),
    },
    // Recreates the page server-side at most once per hour
    revalidate: 3600,
  }
}

export default Home
