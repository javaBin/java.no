import Link from "next/link";

export type RegionType = {
  region: string;
  description: string;
  meetupUrl: string;
  events?: MeetingType[];
};
export type MeetingType = {
  event_url: string;
  name: string;
  time: string;
};
type Props = {
  region: RegionType;
};

type MeetingProps = { meetings?: MeetingType[]; meetupUrl: string };

const Meetings = ({ meetings, meetupUrl }: MeetingProps) => {
  if (!meetings || meetings.length === 0) {
    return (
      <p>
        What about proposing a meetup at{" "}
        <Link href={meetupUrl}>meetup.com</Link>?
      </p>
    );
  }

  return (
    <ul>
      {meetings.map((meeting) => (
        <li key={meeting.name}>
          <h3>
            <a href={meeting.event_url}>{meeting.name}</a>
          </h3>
          <p>{new Date(meeting.time).toLocaleString("no")}</p>
        </li>
      ))}
    </ul>
  );
};

export const Region = ({ region }: Props) => {
  const meetupUrl = `https://meetup.com/${region.meetupUrl}`;
  return (
    <>
      <div className="row">
        <div className="col-md-12 center-justified">
          <h3>{region.region}</h3>
          <div>
            <p>
              {region.description} –{" "}
              <Link href={`https://meetup.com/${region.meetupUrl}`}>
                meetup.com/{region.meetupUrl}
              </Link>
              .
            </p>
            <h5>Neste meetups</h5>
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
