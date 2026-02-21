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
      <header className="bg-hero bg-cover bg-center bg-no-repeat text-center text-white">
        <div className="mx-auto max-w-content px-4">
          <div className="flex flex-col items-center pb-[50px] pt-[100px] text-center md:pb-[100px] md:pt-[120px]">
            <Image priority src={mariusDuke} height={250} alt="Marius Duke" />
            <div className="mb-6 font-serif text-[22px] italic leading-[22px] md:text-[40px] md:leading-[40px]">
              {t("intro")}
            </div>
            <div className="mb-6 font-montserrat text-[50px] font-bold uppercase leading-[50px] md:text-[75px] md:leading-[75px]">
              javaBin
            </div>
            <Link
              href="/#about"
              className="inline-block rounded border border-[#fed136] bg-[#fed136] px-10 py-5 font-['Montserrat'] text-lg font-bold uppercase text-white hover:border-[#fec503] hover:bg-[#fec503]"
            >
              {t("aboutUs")}
            </Link>
          </div>
        </div>
      </header>

      <section
        className="py-12 odd:bg-[#eee] md:py-[130px] md:pb-[150px]"
        id="about"
      >
        <div className="mx-auto max-w-content px-4">
          <div className="text-center">
            <h2 className="mb-4 mt-0 text-[40px]">{t("about")}</h2>
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

      <section
        className="py-12 odd:bg-[#eee] md:py-[130px] md:pb-[150px]"
        id="contribute"
      >
        <div className="mx-auto max-w-content px-4">
          <div className="text-center">
            <h2 className="mb-4 mt-0 text-[40px]">{t("contribute")}</h2>
          </div>
          <br />
          <div className="relative">
            <ul className="relative z-10 list-none p-0">
              <li className="relative min-h-[50px] sm:mb-[30px] md:mb-0 md:min-h-[100px] lg:min-h-[150px] xl:min-h-[170px]">
                <div
                  className="absolute bottom-[-30px] left-[40px] top-0 z-0 ml-[-1px] w-[2px] bg-[#f1f1f1] md:bottom-[-50px] md:left-1/2"
                  aria-hidden
                />
                <div className="absolute left-0 z-[1] flex h-[80px] w-[80px] overflow-hidden rounded-full border-[3px] border-[#ddd] bg-white text-center md:left-1/2 md:-ml-[50px] md:h-[100px] md:w-[100px] lg:-ml-[75px] lg:h-[150px] lg:w-[150px] xl:-ml-[85px] xl:h-[170px] xl:w-[170px]">
                  <Image
                    src={mariusDuke}
                    alt="Marius Duke"
                    width={170}
                    height={170}
                    className="block h-full w-full rounded-full object-cover align-middle"
                  />
                </div>
                <div className="relative float-right w-full pl-[100px] pr-5 text-left md:float-left md:w-[41%] md:pb-5 md:pl-5 md:pr-[30px] md:text-right">
                  <div className="relative z-10 rounded-lg bg-white p-4 shadow md:p-5 md:px-6">
                    <div
                      className="absolute right-0 top-[40px] -mr-[15px] hidden h-0 w-0 border-y-[15px] border-l-[15px] border-r-0 border-solid border-y-transparent border-l-white md:block lg:top-[75px] xl:top-[85px]"
                      style={{ transform: "translateY(-50%)" }}
                      aria-hidden
                    />
                    <h4 className="mt-0 font-montserrat text-[10px] font-bold uppercase leading-[14px] md:text-[13px] md:leading-[18px] lg:text-[18px] lg:leading-[26px]">
                      {t("becomeActive")}
                    </h4>
                    <div className="mt-2 text-sm leading-[1.3] tracking-tight lg:text-base [&>p]:mb-0 [&>ul]:mb-0">
                      <Trans
                        i18nKey="aboutBecomingActive"
                        t={t}
                        components={{
                          teknologiHustetLocationLink: (
                            <Link href="https://goo.gl/maps/wpaA5nxxHM5ao3Rr9" />
                          ),
                        }}
                      />
                    </div>
                  </div>
                </div>
                <div className="clear-both" />
              </li>

              <li className="relative mb-[30px] min-h-[50px] md:mb-[50px] md:min-h-[100px] lg:min-h-[150px] xl:min-h-[170px]">
                <div
                  className="absolute bottom-[-30px] left-[40px] top-0 z-0 ml-[-1px] w-[2px] bg-[#f1f1f1] md:bottom-[-50px] md:left-1/2"
                  aria-hidden
                />
                <div className="absolute left-0 z-[1] flex h-[80px] w-[80px] overflow-hidden rounded-full border-[3px] border-[#ddd] bg-white text-center md:left-1/2 md:-ml-[50px] md:h-[100px] md:w-[100px] lg:-ml-[75px] lg:h-[150px] lg:w-[150px] xl:-ml-[85px] xl:h-[170px] xl:w-[170px]">
                  <Image
                    src={javaZoneLogo}
                    alt="JavaZone logo"
                    width={170}
                    height={170}
                    className="block h-full w-full rounded-full object-cover align-middle"
                  />
                </div>
                <div className="relative float-right w-full pl-[100px] pr-5 text-left md:float-right md:w-[41%] md:pb-5 md:pl-[30px] md:pr-5 md:text-left">
                  <div className="relative z-10 rounded-lg bg-white p-4 shadow md:p-5 md:px-6">
                    <div
                      className="absolute left-0 top-[40px] -ml-[15px] hidden h-0 w-0 border-y-[15px] border-l-0 border-r-[15px] border-solid border-y-transparent border-r-white md:block lg:top-[75px] xl:top-[85px]"
                      style={{ transform: "translateY(-50%)" }}
                      aria-hidden
                    />
                    <h4 className="mt-0 font-montserrat text-[10px] font-bold uppercase leading-[14px] md:text-[13px] md:leading-[18px] lg:text-[18px] lg:leading-[26px]">
                      {t("ideasJavaZone")}
                    </h4>
                    <div className="mt-4 text-sm lg:text-base [&>p]:mb-0 [&>ul]:mb-0">
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
                    </div>
                  </div>
                </div>
                <div className="clear-both" />
              </li>

              <li className="relative min-h-[50px] md:min-h-[100px] lg:min-h-[150px] xl:min-h-[170px]">
                <div
                  className="absolute bottom-auto left-[40px] top-0 z-0 ml-[-1px] h-[40px] w-[2px] bg-[#f1f1f1] md:left-1/2 md:h-[50px] lg:h-[75px] xl:h-[85px]"
                  aria-hidden
                />
                <div className="absolute left-0 z-[1] flex h-[80px] w-[80px] overflow-hidden rounded-full border-[3px] border-[#ddd] bg-white text-center md:left-1/2 md:-ml-[50px] md:h-[100px] md:w-[100px] lg:-ml-[75px] lg:h-[150px] lg:w-[150px] xl:-ml-[85px] xl:h-[170px] xl:w-[170px]">
                  <Image
                    src={octocat}
                    alt="Github Octocat"
                    width={170}
                    height={170}
                    className="block h-full w-full rounded-full object-cover align-middle"
                  />
                </div>
                <div className="relative float-right w-full pl-[100px] pr-5 text-left md:float-left md:w-[41%] md:pb-5 md:pl-5 md:pr-[30px] md:text-right">
                  <div className="relative z-10 rounded-lg bg-white p-4 shadow md:p-5 md:px-6">
                    <div
                      className="absolute right-0 top-[40px] -mr-[15px] hidden h-0 w-0 border-y-[15px] border-l-[15px] border-r-0 border-solid border-y-transparent border-l-white md:block lg:top-[75px] xl:top-[85px]"
                      style={{ transform: "translateY(-50%)" }}
                      aria-hidden
                    />
                    <h4 className="mt-0 font-montserrat text-[10px] font-bold uppercase leading-[14px] md:text-[13px] md:leading-[18px] lg:text-[18px] lg:leading-[26px]">
                      {t("github")}
                    </h4>
                    <div className="mt-4 text-sm lg:text-base [&>p]:mb-0 [&>ul]:mb-0">
                      <Trans
                        i18nKey="aboutGithub"
                        t={t}
                        components={{
                          githubLink: <Link href="http://github.com/javabin" />,
                        }}
                      />
                    </div>
                  </div>
                </div>
                <div className="clear-both" />
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section
        className="py-12 odd:bg-[#eee] md:py-[130px] md:pb-[150px]"
        id="locations"
      >
        <div className="mx-auto max-w-content px-4">
          <div className="text-center">
            <h2 className="mb-4 mt-0 text-[40px]">{t("branches")}</h2>
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

      <section
        className="py-12 odd:bg-[#eee] md:py-[130px] md:pb-[150px]"
        id="board"
      >
        <BoardMembers boardMembers={props.boardMembers} />
      </section>

      {/*<Membership />*/}

      <section
        className="py-12 odd:bg-[#eee] md:py-[130px] md:pb-[150px]"
        id="contact"
      >
        <div className="mx-auto max-w-content px-4">
          <div className="text-center">
            <h2 className="mb-4 mt-0 text-[40px]">{t("contact")}</h2>
          </div>
          <div className="mx-auto max-w-xl text-center">
            <div>{t("contactHelpText")}</div>
            <form
              action="https://formspree.io/styret@java.no"
              method="POST"
              className="mt-4 flex w-full flex-col gap-4"
            >
              <div className="w-full">
                <label
                  htmlFor="name"
                  className="mb-1 block text-sm font-medium"
                >
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
                <label
                  htmlFor="email"
                  className="mb-1 block text-sm font-medium"
                >
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
