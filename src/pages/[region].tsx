import { serverSideTranslations } from "next-i18next/serverSideTranslations"
import nextI18nConfig from "../../next-i18next.config.mjs"
import { GetStaticPaths, GetStaticPropsContext } from "next"
import regions, { getRegionDukePath } from "../data/regions"
import { useTranslation } from "next-i18next"
import Head from "next/head"
import { InferGetStaticPropsType } from "next/types"
import { Meetings } from "../components/Region"
import Image from "next/image"
import { getRegionWithEvents } from "../lib/meetup-scraper"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export default function RegionPage({
  region,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  const { t } = useTranslation("common")
  const dukePath = getRegionDukePath(region.name)
  const [dukeError, setDukeError] = useState(false)
  const regionEmail = `${region.name
    .toLowerCase()
    .replace(/ø/g, "o")
    .replace(/å/g, "a")
    .replace(/æ/g, "ae")}@java.no`
  const upcomingEvents = [...region.events]
    .filter((event) => event.status === "ACTIVE")
    .sort((a, b) => a.timestamp - b.timestamp)
  const pastEvents = [...region.events]
    .filter((event) => event.status === "PAST")
    .sort((a, b) => b.timestamp - a.timestamp)
  const nextEvent = upcomingEvents[0]
  const restUpcomingEvents = upcomingEvents.slice(1)

  return (
    <>
      <Head>
        <title>{t("region.title", { name: region.name })}</title>
        <meta
          name="description"
          content={region.description.replace(/<(?:.|\n)*?>/gm, "")}
        />
      </Head>
      <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200">
        <div className="mx-auto max-w-5xl px-4 pb-8 pt-16 sm:px-6 sm:pt-20 md:pb-12 lg:px-10 lg:pt-24">
          <main className="space-y-6">
            <section className="overflow-hidden rounded-2xl bg-white/95 shadow-lg">
              <div className="flex flex-col gap-6 p-5 sm:p-6 lg:flex-row lg:items-start lg:gap-8 lg:p-8">
                <div className="w-full shrink-0 lg:w-[340px]">
                  {!dukeError ? (
                    <Image
                      alt=""
                      aria-hidden
                      className="aspect-[4/3] w-full rounded-xl bg-[#a11c38] object-contain p-6"
                      height={255}
                      width={340}
                      src={dukePath}
                      onError={() => setDukeError(true)}
                    />
                  ) : (
                    <div className="aspect-[4/3] rounded-xl bg-gray-100" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h1 className="mb-4 text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
                    {region.name}
                  </h1>

                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                    <div className="inline-flex w-fit items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 ring-1 ring-gray-200/80">
                      <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
                        {t("region.members")}
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        {t("region.memberCount", { count: region.memberCount })}
                      </span>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[#a11c38]/30 bg-[#a11c38]/5 px-3 py-2 text-sm font-medium text-[#a11c38] transition hover:border-[#a11c38]/50 hover:bg-[#a11c38]/10 focus:outline-none focus:ring-2 focus:ring-[#a11c38]/40 focus:ring-offset-2"
                        >
                          {t("region.aboutRegion", { name: region.name })}
                          <span className="text-[#a11c38]/70" aria-hidden>
                            →
                          </span>
                        </button>
                      </DialogTrigger>
                      <DialogContent className="max-h-[85vh] overflow-y-auto sm:rounded-xl">
                        <DialogTitle className="text-xl font-semibold text-gray-900">
                          {t("region.aboutRegion", { name: region.name })}
                        </DialogTitle>
                        <div
                          className="mt-2 leading-relaxed text-gray-700 [&_a]:text-[#a11c38] [&_a]:underline hover:[&_a]:text-[#a11c38]/90"
                          dangerouslySetInnerHTML={{
                            __html: region.description.replaceAll(
                              "\n",
                              "<br/>",
                            ),
                          }}
                        />
                      </DialogContent>
                    </Dialog>
                  </div>

                  {region.organizer && (
                    <div className="mb-5 inline-flex w-fit items-center gap-3 rounded-lg bg-gray-50/80 py-2.5 pl-2.5 pr-3 ring-1 ring-gray-200/80">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        alt={region.organizer.name}
                        className="size-10 rounded-full object-cover shadow-sm ring-2 ring-white"
                        src={region.organizer.photoUrl}
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                          {t("region.organizer")}
                        </p>
                        <a
                          className="truncate font-medium text-[#a11c38] transition hover:text-[#7f162c]"
                          href={region.organizer.profileUrl}
                          rel="noreferrer"
                          target="_blank"
                        >
                          {region.organizer.name}
                        </a>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3">
                    <a
                      className="inline-flex items-center rounded-lg bg-[#a11c38] px-4 py-2.5 text-sm font-medium text-white no-underline shadow-sm transition hover:bg-[#7f162c] hover:shadow"
                      href={region.meetupLink}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {t("region.visitMeetup")}
                    </a>
                    <a
                      className="hover:bg-[#a11c38]/8 inline-flex items-center justify-center rounded-xl border-2 border-[#a11c38] bg-white px-5 py-3 text-sm font-semibold text-[#a11c38] no-underline transition focus:outline-none focus:ring-2 focus:ring-[#a11c38] focus:ring-offset-2"
                      href={`mailto:${regionEmail}`}
                    >
                      {t("region.proposeMeetupButton")}
                    </a>
                  </div>
                </div>
              </div>
            </section>

            {nextEvent && (
              <section className="overflow-hidden rounded-2xl bg-white/95 p-5 shadow-lg sm:p-6">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">
                  {t("region.nextMeetup")}
                </h2>
                <Meetings
                  meetings={[nextEvent]}
                  meetupUrl={region.meetupLink}
                />
              </section>
            )}

            {restUpcomingEvents.length > 0 && (
              <section className="overflow-hidden rounded-2xl bg-white/95 p-5 shadow-lg sm:p-6">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">
                  {t("region.moreUpcomingMeetups")}
                </h2>
                <Meetings
                  meetings={restUpcomingEvents}
                  meetupUrl={region.meetupLink}
                />
              </section>
            )}

            <section className="overflow-hidden rounded-2xl bg-white/95 p-5 shadow-lg sm:p-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                {t("region.pastMeetups")}
              </h2>
              <Meetings meetings={pastEvents} />
            </section>
          </main>
        </div>
      </div>
    </>
  )
}

export const getStaticProps = async ({
  params,
  locale,
}: GetStaticPropsContext<{
  region: string
}>) => {
  if (!params || !locale) {
    return { notFound: true }
  }
  const currentRegion = regions.find(
    (regionObj) => regionObj.name.toLowerCase() === params.region,
  )
  if (!currentRegion) {
    return { notFound: true }
  }
  const regionWithEvents = await getRegionWithEvents(currentRegion, locale)
  if (!regionWithEvents) {
    return { notFound: true }
  }

  return {
    props: {
      region: regionWithEvents,
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

export const getStaticPaths = (() => {
  return {
    paths: regions.flatMap((region) => [
      {
        params: {
          region: region.name.toLowerCase(),
        },
        locale: "no",
      },
      {
        params: {
          region: region.name.toLowerCase(),
        },
        locale: "en",
      },
    ]),
    fallback: false, // false or "blocking"
  }
}) satisfies GetStaticPaths
