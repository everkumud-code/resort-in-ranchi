export interface SearchBoxLocation {
  slug: string;
  name: string;
}

/**
 * Submits a GET to /search using the same `q` and `location` params the
 * search page already reads (see src/app/(site)/search/page.tsx) — no new
 * query params or search logic introduced here, just a friendlier form.
 */
export default function SearchBox({ locations }: { locations: SearchBoxLocation[] }) {
  return (
    <form
      action="/search"
      method="get"
      className="flex w-full max-w-2xl flex-col gap-2 rounded-xl border border-brand/10 bg-white p-2 shadow-lg sm:flex-row sm:items-stretch sm:gap-0 sm:rounded-full sm:p-1.5"
    >
      <div className="flex-1 px-3 py-1.5 sm:border-r sm:border-brand/10">
        <label htmlFor="hero-search-q" className="block text-[11px] font-medium tracking-wide text-brand/50 uppercase">
          What are you looking for?
        </label>
        <input
          id="hero-search-q"
          type="text"
          name="q"
          placeholder="Resorts, hotels, restaurants…"
          className="mt-0.5 w-full bg-transparent text-sm text-brand-dark placeholder:text-brand/40 focus:outline-none"
        />
      </div>
      <div className="px-3 py-1.5 sm:w-44">
        <label htmlFor="hero-search-location" className="block text-[11px] font-medium tracking-wide text-brand/50 uppercase">
          Where?
        </label>
        <select
          id="hero-search-location"
          name="location"
          defaultValue=""
          className="mt-0.5 w-full bg-transparent text-sm text-brand-dark focus:outline-none"
        >
          <option value="">Anywhere in Ranchi</option>
          {locations.map((l) => (
            <option key={l.slug} value={l.slug}>
              {l.name}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        className="shrink-0 rounded-full bg-brand-orange px-6 py-3 text-sm font-semibold text-white shadow-sm hover:brightness-95 sm:m-0.5"
      >
        Search
      </button>
    </form>
  );
}
