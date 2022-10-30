import Link from "next/link";
import { Trans, useTranslation } from "next-i18next";
import { useRouter } from "next/router";

export type RegionType = {
  region: string;
  description: string;
  meetupUrl: string;
  events?: MeetingType[];
};
export type MeetingType = {
  event_url: string;
  name: string;
  time: number;
};
type Props = {
  region: RegionType;
};

type MeetingProps = { meetings?: MeetingType[]; meetupUrl: string };

const Meetings = ({ meetings, meetupUrl }: MeetingProps) => {
  const { t } = useTranslation("common", { keyPrefix: "region" });
  const router = useRouter();

  if (!meetings || meetings.length === 0) {
    return (
      <p>
        <Trans
          i18nKey="proposeMeetup"
          t={t}
          components={{ meetupLink: <Link href={meetupUrl} /> }}
        />
      </p>
    );
  }

  return (
    <ul>
      {meetings.map((meeting) => {
        const date = new Date(meeting.time);
        const weekDay = date.toLocaleString(router.locale, { weekday: "long" });
        const month = date.toLocaleString(router.locale, { month: "long" });
        // Force norwegian time formatting
        const time = date.toLocaleTimeString("no", {
          hour: "2-digit",
          minute: "2-digit",
        });

        return (
          <li key={meeting.name}>
            <h3>
              <a href={meeting.event_url}>{meeting.name}</a>
            </h3>
            <p>{`${weekDay}, ${month} ${date.getDay()}, ${time}`}</p>
          </li>
        );
      })}
    </ul>
  );
};

export const Region = ({ region }: Props) => {
  const { t } = useTranslation("common", { keyPrefix: "region" });
  const meetupUrl = `https://meetup.com/${region.meetupUrl}`;

  return (
    <>
      <div className="row">
        <div className="col-md-12 center-justified">
          <h3>{region.region}</h3>
          <div>
            <p>
              {t(region.region.toLowerCase() + ".description")} –{" "}
              <Link href={`https://meetup.com/${region.meetupUrl}`}>
                meetup.com/{region.meetupUrl}
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
  );
};
