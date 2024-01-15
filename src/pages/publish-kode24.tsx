import Head from "next/head"
import regions from "../../data/regions"
import members from "../../data/boardmembers"
import { serverSideTranslations } from "next-i18next/serverSideTranslations"
import nextI18nConfig from "../../next-i18next.config.mjs"
import { InferGetStaticPropsType } from "next/types"
import { load } from "cheerio"
import { z } from "zod"
import { PublishEvents } from "../components/PublishEvents"

const Home = ({ regions }: InferGetStaticPropsType<typeof getStaticProps>) => {
  return (
    <>
      <Head>
        <title>Kode24 Publish links</title>
        <meta
          name="description"
          content="Links that help autofill the kode24 event form"
        />
      </Head>
      <section id="locations">
        <div className="container">
          {regions.map((region) => (
            <PublishEvents key={region.region} region={region} />
          ))}
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
  description: z.string(),
  eventUrl: z.string().url(),
  // Confirmed to be 'PHYSICAL', 'ONLINE', can't confirm if other possibilities exist.
  eventType: z.string(),
  dateTime: z.string().datetime({ offset: true }),
  venue: z
    .object({
      __ref: z.string(),
    })
    .nullable(),
  featuredEventPhoto: z
    .object({
      __ref: z.string(),
    })
    .nullable(),
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
  const featuredEventPhotoRef = event.featuredEventPhoto
  if (!featuredEventPhotoRef) {
    return null
  }
  const eventPhotoUnknown = data[featuredEventPhotoRef.__ref]
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
        // Uae flatMap to noop the error case, by returning an array.
        .flatMap(([, eventData]) => {
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
          const timestamp = Date.parse(event.dateTime)
          const datetimeAsDate = new Date(Date.parse(event.dateTime))
          return {
            name: event.title,
            description: event.description,
            eventUrl: event.eventUrl,
            eventType: event.eventType,
            timestamp: timestamp,
            time: datetimeAsDate.toLocaleString("no", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
              timeZone: "CET",
            }),
            date: event.dateTime.split("T")[0],
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
