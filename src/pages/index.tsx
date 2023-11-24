import Head from "next/head"
import Image from "next/image"
import mariusDuke from "../../public/img/marius_duke.svg"
import javaZoneLogo from "../../public/img/logos/javazone-logo.jpg"
import octocat from "../../public/img/logos/github-logo.png"
import { Region } from "../components/Region"
import regions from "../../data/regions"
import members from "../../data/boardmembers"
import BoardMembers from "../components/BoardMembers"
import Link from "next/link"
import { serverSideTranslations } from "next-i18next/serverSideTranslations"
import nextI18nConfig from "../../next-i18next.config.mjs"
import { Trans, useTranslation } from "next-i18next"
import { InferGetStaticPropsType } from "next/types"
import { load } from "cheerio"
import { z } from "zod"

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
        <div className="container">
          <div className="intro-text">
            <Image priority src={mariusDuke} height={250} alt="Marius Duke" />
            <div className="intro-lead-in">{t("intro")}</div>
            <div className="intro-heading">javaBin</div>
            <Link href="/#about" className="page-scroll btn btn-xl">
              {t("aboutUs")}
            </Link>
          </div>
        </div>
      </header>

      <section id="about">
        <div className="container">
          <div className="row">
            <div className="col-md-12 text-center">
              <h2 className="section-heading">{t("about")}</h2>
            </div>
          </div>
          <br />
          <div className="row">
            <div className="col-xs-12 col-sm-12 col-md-8 col-md-offset-2">
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
        </div>
      </section>

      <section id="contribute">
        <div className="container">
          <div className="row">
            <div className="col-md-12 text-center">
              <h2 className="section-heading">{t("contribute")}</h2>
            </div>
          </div>
          <br />
          <div className="row">
            <div className="col-md-12">
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
        </div>
      </section>

      <section id="locations">
        <div className="container">
          <div className="row">
            <div className="col-md-12  text-center">
              <h2 className="section-heading">{t("branches")}</h2>
            </div>
          </div>
          {props.regions.map((region) => (
            <Region key={region.region} region={region} />
          ))}
        </div>
      </section>

      <section id="board">
        <BoardMembers boardMembers={props.boardMembers} />
      </section>

      {/*<Membership />*/}

      <section id="contact">
        <div className="container">
          <div className="row">
            <div className="col-md-12 text-center">
              <h2 className="section-heading">{t("contact")}</h2>
            </div>
          </div>
          <div className="row">
            <div className="col-md-12 center-justified">
              <div className="">{t("contactHelpText")}</div>
              <form
                action="https://formspree.io/styret@java.no"
                method="POST"
                className="col-xs-offset-1 col-xs-10 col-sm-offset-2 col-sm-8 col-lg-offset-3 col-lg-6"
              >
                <div className="form-group">
                  <label htmlFor="name">{t("name")}</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder={t("yourName")!}
                    name="name"
                    id="name"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="email">{t("email")}</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder={t("yourEmail")!}
                    name="email"
                    id="email"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="message">{t("message")}</label>
                  <textarea
                    name="message"
                    className="form-control"
                    placeholder={t("yourMessage")!}
                    rows={5}
                    id="message"
                  ></textarea>
                </div>
                <div className="form-group">
                  <input
                    type="submit"
                    className="btn btn-primary"
                    value={t("send")!}
                  />
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

const toFormattedDateTimeString = (time: string, locale: string) => {
  const date = new Date(time)
  return date.toLocaleString(locale, {
    weekday: "long",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    hour12: false,
    timeZone: "CET",
  })
}

const nextDataStructure = z.object({
  props: z.object({
    pageProps: z.object({
      __APOLLO_STATE__: z.record(z.string(), z.unknown()),
    }),
  }),
})

const eventStructure = z.object({
  title: z.string(),
  eventUrl: z.string().url(),
  dateTime: z.string().datetime({ offset: true }),
  venue: z
    .object({
      __ref: z.string(),
    })
    .nullable(),
  featuredEventPhoto: z.object({
    __ref: z.string(),
  }),
  going: z.object({
    totalCount: z.number(),
  }),
  'rsvps({"first":5})': z.object({
    edges: z.array(
      z.object({
        node: z.object({
          __ref: z.string(),
        }),
      }),
    ),
  }),
})
const rsvpsStructure = z.array(
  z.object({
    member: z.object({
      __ref: z.string(),
    }),
  }),
)
const membersStructure = z.array(
  z.object({
    name: z.string(),
    memberPhoto: z
      .object({
        __ref: z.string(),
      })
      .nullable(),
  }),
)
const venueStructure = z.object({
  name: z.string(),
})
const photoInfoStructure = z.object({
  highResUrl: z.string(),
})

function parseFirstFiveAttendees(
  event: z.infer<typeof eventStructure>,
  data: Record<string, unknown>,
) {
  const first5rsvps = event['rsvps({"first":5})']
  const rsvpRefs = first5rsvps.edges.map((edge) => edge.node.__ref)
  const rsvpUnknowns = rsvpRefs.map((ref) => data[ref])
  const parsedRsvps = rsvpsStructure.safeParse(rsvpUnknowns)
  if (!parsedRsvps.success) {
    console.error(
      `Failed to parse rsvps for ${event.eventUrl}:`,
      parsedRsvps.error.format(),
      rsvpUnknowns,
    )
    return []
  }
  const membersUnknown = parsedRsvps.data.map((ref) => data[ref.member.__ref])
  const parsedMembers = membersStructure.safeParse(membersUnknown)
  if (!parsedMembers.success) {
    console.error(
      `Failed to parse members for ${event.eventUrl}:`,
      parsedMembers.error.format(),
      membersUnknown,
    )
    return []
  }
  return parsedMembers.data.flatMap((member) => {
    const ref = member.memberPhoto?.__ref ?? null
    const parsedPhotoInfo = photoInfoStructure.safeParse(ref && data[ref])
    // If a member doesn't have a photo, just filter them out.
    if (!parsedPhotoInfo.success) {
      return []
    }
    return {
      name: member.name,
      photoUrl: parsedPhotoInfo.data.highResUrl,
    }
  })
}

function parseVenue(
  event: z.infer<typeof eventStructure>,
  data: Record<string, unknown>,
) {
  const venueRef = event.venue
  if (!venueRef) {
    return null
  }
  const venueUnknown = data[venueRef.__ref]
  const parsedVenue = venueStructure.safeParse(venueUnknown)
  if (!parsedVenue.success) {
    console.error(
      `Failed to parse venue for ${event.eventUrl}:`,
      parsedVenue.error.format(),
      venueUnknown,
    )
    return null
  }
  return parsedVenue.data.name
}

function parseEventPhoto(
  event: z.infer<typeof eventStructure>,
  data: Record<string, unknown>,
) {
  const eventPhotoUnknown = data[event.featuredEventPhoto.__ref]
  const parsedEventPhoto = photoInfoStructure.safeParse(eventPhotoUnknown)
  if (!parsedEventPhoto.success) {
    console.error(
      `Failed to parse event photo for ${event.eventUrl}:`,
      parsedEventPhoto.error.format(),
      eventPhotoUnknown,
    )
    return null
  }
  return parsedEventPhoto.data.highResUrl
}

export const getStaticProps = async ({ locale }: { locale: string }) => {
  const regionsWithUpcomingMeetups = await Promise.all(
    regions.map(async (region) => {
      const meetupEventsPageHtml = await fetch(
        `https://www.meetup.com/${region.meetupName}/events/`,
      )
        .then((res) => res.text())
        // If the call fails for some reason, return an empty string, so the whole thing becomes a noop.
        .catch((err) => {
          console.error(err)
          return ""
        })

      const $ = load(meetupEventsPageHtml)

      // Scraping the HTML was becoming troublesome, but I found out they are now using Next.js
      // and Next.js drops all static data into a script tag with id __NEXT_DATA__,
      // so we just grab all the data from there.
      const nextData = JSON.parse($("#__NEXT_DATA__").text())
      const nextDataParsed = nextDataStructure.safeParse(nextData)

      if (!nextDataParsed.success) {
        console.error(
          `Failed to parse __NEXT_DATA__ for ${region.region}:`,
          JSON.stringify(nextDataParsed.error.format()),
          nextData,
        )
        return { ...region, events: [] }
      }

      // The data is in the __APOLLO_STATE__ field, since they are grabbing from GraphQL
      const data = nextDataParsed.data.props.pageProps.__APOLLO_STATE__

      // The data is a map of keys to objects, where the keys are the GraphQL objects with their IDs.
      // Since we only want events, we're filtering where the key starts with 'Event:'.
      const events = Object.entries(data)
        .filter(([key]) => key.startsWith("Event:"))
        // Uae flatMap to to noop the error case, by returning an array.
        .flatMap(([_, eventData]) => {
          const parsedEvent = eventStructure.safeParse(eventData)
          if (!parsedEvent.success) {
            console.error(
              `Failed to parse event for ${region.region}:`,
              parsedEvent.error.format(),
              eventData,
            )
            return []
          }
          const event = parsedEvent.data
          const venue = parseVenue(event, data)
          const eventPhoto = parseEventPhoto(event, data)
          const first5Attendees = parseFirstFiveAttendees(event, data)
          return {
            name: event.title,
            eventUrl: event.eventUrl,
            time: Date.parse(event.dateTime),
            dateTimeFormatted: toFormattedDateTimeString(
              event.dateTime,
              locale,
            ),
            numberOfAttendees: event.going.totalCount,
            venue: venue,
            memberImages: first5Attendees,
            eventPhoto: eventPhoto,
          }
        })

      return {
        events,
        ...region,
      }
    }),
  )

  return {
    props: {
      regions: regionsWithUpcomingMeetups,
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
