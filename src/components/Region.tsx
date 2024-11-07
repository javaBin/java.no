import Link from "next/link"
import { Trans, useTranslation } from "next-i18next"
import { InferGetStaticPropsType } from "next/types"
import { getStaticProps } from "../pages"
import Image from "next/image"
import { RegionWithEvents } from "../lib/meetup-scraper"

export type Meeting = InferGetStaticPropsType<
  typeof getStaticProps
>["regions"][number]["events"][number]
type Props = {
  region: RegionWithEvents
}

type MeetingProps = {
  meetings?: Meeting[]
  meetupUrl?: string
}

export const Meetings = ({ meetings, meetupUrl }: MeetingProps) => {
  const { t } = useTranslation("common", { keyPrefix: "region" })

  if (!meetings || meetings.length === 0) {
    if (meetupUrl) {
      return (
        <p>
          <Trans
            i18nKey="proposeMeetup"
            t={t}
            components={{ meetupLink: <Link href={meetupUrl} /> }}
          />
        </p>
      )
    } else {
      return <></>
    }
  }

  return (
    <ul className="flex flex-col space-y-3">
      {meetings.map((meeting) => {
        return (
          <li key={meeting.eventUrl}>
            <div className="rounded-lg bg-white shadow-sm hover:bg-gray-50">
              <a
                href={meeting.eventUrl}
                className="flex h-full flex-col justify-between p-5 outline-offset-8 hover:no-underline"
              >
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center justify-between ">
                    <div className="flex w-full flex-col space-y-3">
                      <time
                        className="font-bold text-red-800"
                        dateTime={`${meeting.time}`}
                      >
                        {meeting.dateTimeFormatted}
                      </time>
                      <h4 className="block break-words leading-4">
                        {meeting.name}
                      </h4>
                      <div className="text-muted flex items-start">
                        {meeting.venue}
                      </div>
                      <div
                        className="relative flex items-center"
                        style={{ height: "34px" }}
                      >
                        <ul>
                          {meeting.memberImages.map((attendee, index) => (
                            <li
                              key={attendee.photoUrl}
                              className="absolute top-0"
                              style={{
                                zIndex: 5 - index,
                                margin: `0 ${index * 25}px`,
                              }}
                            >
                              <Image
                                alt={t("attendeePhoto", {
                                  name: attendee.name,
                                })}
                                src={attendee.photoUrl}
                                width={34}
                                height={34}
                                className="rounded-full border border-solid border-red-400 object-cover"
                              />
                            </li>
                          ))}
                        </ul>
                        <span
                          style={{
                            marginLeft: `${
                              meeting.memberImages.length * 25 + 15
                            }px`,
                          }}
                        >
                          {t("attendees", {
                            count: meeting.numberOfAttendees,
                          })}
                        </span>
                      </div>
                    </div>
                    {meeting.eventPhoto && (
                      <Image
                        alt="event photo"
                        className="tw-hidden aspect-video rounded-lg object-cover shadow-lg sm:block"
                        height={101}
                        width={180}
                        src={meeting.eventPhoto}
                      />
                    )}
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
          <h3>{region.name}</h3>
          <div>
            <p>
              {t(region.name.toLowerCase() + ".description")} –{" "}
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
