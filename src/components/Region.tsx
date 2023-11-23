import Link from "next/link"
import { Trans, useTranslation } from "next-i18next"
import { Region as RegionType } from "../../data/regions"
import { InferGetStaticPropsType } from "next/types"
import { getStaticProps } from "../pages"
import Image from "next/image"

export type RegionWithEvents = RegionType & {
  events: Meeting[]
}

export type Meeting = InferGetStaticPropsType<
  typeof getStaticProps
>["regions"][number]["events"][number]
type Props = {
  region: RegionWithEvents
}

type MeetingProps = {
  meetings?: Meeting[]
  meetupUrl: string
}

const Meetings = ({ meetings, meetupUrl }: MeetingProps) => {
  const { t } = useTranslation("common", { keyPrefix: "region" })

  if (!meetings || meetings.length === 0) {
    return (
      <p>
        <Trans
          i18nKey="proposeMeetup"
          t={t}
          components={{ meetupLink: <Link href={meetupUrl} /> }}
        />
      </p>
    )
  }

  return (
    <ul className="flex flex-col space-y-5">
      {meetings.map((meeting) => {
        return (
          <li key={meeting.name}>
            <div id="e-1" className="rounded-md bg-white p-4 shadow-sm sm:p-5 ">
              <a
                id="event-card-e-1"
                data-event-label="event-card-1"
                data-event-category="GroupHome"
                href={meeting.eventUrl}
                className="flex h-full flex-col justify-between space-y-5 outline-offset-8 hover:no-underline"
              >
                <div className="flex flex-col space-y-5 overflow-hidden">
                  <div className="grid gap-2">
                    <div className="flex w-full flex-col space-y-3">
                      <time
                        className="font-medium uppercase text-black"
                        dateTime={`${meeting.time}`}
                      >
                        {meeting.dateTimeFormatted}
                      </time>
                      <h4 className="block break-words leading-7">
                        {meeting.name}
                      </h4>
                      <div className="flex items-start space-x-1.5 text-muted">
                        {meeting.venue}
                      </div>
                      <div className="flex space-x-2" />
                    </div>
                    <div className="relative aspect-video rounded-lg shadow-lg">
                      <Image
                        alt="event photo"
                        className="aspect-video min-w-[180px] rounded-lg object-cover object-top"
                        fill={true}
                        src={meeting.eventImage}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-medium text-gray6">
                    <div className="relative flex  space-x-2">
                      <ul>
                        {meeting.memberImages.map((image, index) => (
                          <li
                            key={image}
                            style={{
                              zIndex: 5 - index,
                              position: "absolute",
                              margin: `0 ${index * 25}px`,
                              bottom: -7
                            }}
                            className="l1w37v0b"
                          >
                            <Image
                              alt="Photo of antendee"
                              src={image}
                              width={34}
                              height={34}
                              className="bg-gray2 rounded-full rounded-full border border-white object-cover"
                            />
                          </li>
                        ))}
                      </ul>
                      <span
                        style={{
                          margin: `0 ${
                            meeting.memberImages.length * 25 + 15
                          }px`,
                        }}
                      >
                        +
                        {meeting.numberOfAttendees -
                          meeting.memberImages.length}
                      </span>
                    </div>
                  </div>
                </div>
              </a>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

export const Region = ({ region }: Props) => {
  const { t } = useTranslation("common", { keyPrefix: "region" })
  const meetupUrl = `https://meetup.com/${region.meetupName}`

  return (
    <>
      <div className="row">
        <div className="col-md-11 col-md-offset-3 max-w-screen-md">
          <h3>{region.region}</h3>
          <div>
            <p>
              {t(region.region.toLowerCase() + ".description")} –{" "}
              <Link href={`https://meetup.com/${region.meetupName}`}>
                meetup.com/{region.meetupName}
              </Link>
              .
            </p>
            <h5>{t("nextMeetups")}</h5>
            <div>
              <Meetings meetings={region.events} meetupUrl={meetupUrl} />
            </div>
          </div>
        </div>
      </div>
      <br />
    </>
  )
}
