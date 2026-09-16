import { formatDay, upcomingElections } from "@data/elections";

/**
 * The top of every page: the wordmark, what the site is, and today's date in
 * Melbourne — the day every countdown on the page is counted from.
 */
export function Masthead({ now }: { now: Date }) {
  const [next] = upcomingElections(now);

  // The election's own string carries its Melbourne offset, so its first four
  // characters are the year the election falls in there.
  const tagline = next
    ? `Census figures for Victoria · ${next.at.slice(0, 4)} state election`
    : "Census figures for Victoria";

  return (
    <header className="masthead">
      <p className="masthead__wordmark">CivicLens</p>
      <p className="masthead__tagline caps">{tagline}</p>
      <p className="masthead__date caps">
        <time dateTime={now.toISOString()}>{formatDay(now)}</time>
      </p>
    </header>
  );
}

/** The foot of every page: where the figures come from, in one line. */
export function Colophon({ sources }: { sources: string }) {
  return (
    <footer className="colophon">
      <p className="caps">Sources · {sources}</p>
      <p className="caps">CivicLens</p>
    </footer>
  );
}
