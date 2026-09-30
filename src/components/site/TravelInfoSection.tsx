/**
 * Getting to Ranchi — real, stable facts only (station/airport codes),
 * deliberately with no timetable hosted here: train and flight schedules
 * change often enough that copying them into this page would go stale and
 * could mislead someone about when to leave for the station/airport. Each
 * card links straight to a real, live official/tracking source instead.
 */
export default function TravelInfoSection() {
  return (
    <section className="border-t border-brand/10 bg-white py-14">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="font-serif text-2xl font-semibold text-brand-dark">Getting to Ranchi</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-brand-dark/70">
          Quick reference for travellers, with links to live, official status — we don&apos;t host our own train or
          flight timetable here.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-brand/10 p-5">
            <h3 className="font-serif text-lg font-semibold text-brand-dark">By Train — Ranchi Junction (RNC)</h3>
            <p className="mt-1 text-sm leading-6 text-brand-dark/70">
              Ranchi&apos;s main railway station, with a large number of daily trains connecting it to major cities
              across India.
            </p>
            <a
              href="https://enquiry.indianrail.gov.in/ntes/"
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="mt-3 inline-block text-sm font-semibold text-brand-teal hover:underline"
            >
              Check live train status on NTES (Indian Railways) →
            </a>
          </div>

          <div className="rounded-lg border border-brand/10 p-5">
            <h3 className="font-serif text-lg font-semibold text-brand-dark">By Air — Birsa Munda Airport (IXR)</h3>
            <p className="mt-1 text-sm leading-6 text-brand-dark/70">
              Ranchi&apos;s airport, serving domestic flights from IndiGo, Air India and other carriers.
            </p>
            <a
              href="https://www.flightradar24.com/data/airports/ixr/departures"
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="mt-3 inline-block text-sm font-semibold text-brand-teal hover:underline"
            >
              Check live flight status on Flightradar24 →
            </a>
          </div>
        </div>

        <p className="mt-5 rounded-md bg-brand-cream px-4 py-3 text-xs leading-5 text-brand-dark/70">
          <strong>Disclaimer:</strong> This is general information only, not a live timetable. Train and flight
          schedules change — always check the official/live source above and confirm directly with the railway or
          airline before you travel.
        </p>
      </div>
    </section>
  );
}
