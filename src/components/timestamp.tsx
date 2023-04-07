import { DateTime } from "luxon";

function Timestamp(props: { timestamp: number | string | Date }) {
  const { timestamp } = props;
  const date = new Date(timestamp);

  if (typeof timestamp === "string") {
    return (
      <time dateTime={timestamp} suppressHydrationWarning>
        {DateTime.fromISO(timestamp).toRelative()}
      </time>
    );
  }

  if (timestamp instanceof Date) {
    return (
      <time dateTime={timestamp.toISOString()} suppressHydrationWarning>
        {DateTime.fromJSDate(timestamp).toRelative()}
      </time>
    );
  }

  return (
    <time dateTime={date.toISOString()} suppressHydrationWarning>
      {DateTime.fromSeconds(props?.timestamp as number).toRelative()}
    </time>
  );
}

export default Timestamp;
