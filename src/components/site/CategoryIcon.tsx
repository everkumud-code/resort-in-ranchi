/**
 * Small, original line icons per category — hand-drawn SVG paths, not the
 * brand logo artwork and not emoji. Deliberately minimal (single stroke
 * weight, currentColor) so they sit quietly inside a card rather than
 * competing with it.
 */
const ICON_PATHS: Record<string, React.ReactNode> = {
  resorts: (
    <>
      <path d="M3 18l5.5-8L12 15l2-3 4 6H3z" />
      <circle cx="17" cy="6.5" r="2" />
    </>
  ),
  hotels: (
    <>
      <path d="M5 21V5a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v16" />
      <path d="M14 21v-9a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v9" />
      <path d="M8 8h.01M8 11h.01M8 14h.01M3 21h18" />
    </>
  ),
  restaurants: (
    <>
      <path d="M7 3v7a2 2 0 0 0 2 2v9" />
      <path d="M7 3v4M10 3v4" />
      <path d="M17 3c-1.2 0-2 1.3-2 3v3a2 2 0 0 0 2 2v10" />
    </>
  ),
  cafes: (
    <>
      <path d="M4 9h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V9Z" />
      <path d="M17 10h1.5a2.5 2.5 0 0 1 0 5H17" />
      <path d="M8 3c0 .8-1 1.2-1 2s1 1.2 1 2M12 3c0 .8-1 1.2-1 2s1 1.2 1 2" />
    </>
  ),
  "banquet-halls": (
    <>
      <path d="M4 21V10a8 8 0 0 1 16 0v11" />
      <path d="M4 21h16M8 21v-6M16 21v-6" />
    </>
  ),
  "wedding-venues": (
    <>
      <circle cx="9" cy="14" r="4" />
      <circle cx="15" cy="14" r="4" />
      <path d="M9 6l1.5 4h-3L9 6ZM15 6l1.5 4h-3L15 6Z" />
    </>
  ),
  "party-halls": (
    <>
      <path d="M12 3v3M6 6l2 2M18 6l-2 2" />
      <path d="M5 21l3-9h8l3 9H5Z" />
      <path d="M12 12v9" />
    </>
  ),
  "homestays-farm-stays": (
    <>
      <path d="M4 11l8-6 8 6" />
      <path d="M6 10v10h12V10" />
      <path d="M12 21v-5a2 2 0 0 1 4 0" />
    </>
  ),
  "lounge-bar": (
    <>
      <path d="M6 4h12l-6 8-6-8Z" />
      <path d="M12 12v7M9 19h6" />
    </>
  ),
  "food-nightlife": (
    <>
      <path d="M18 13.5A7 7 0 1 1 10.5 6a5.5 5.5 0 0 0 7.5 7.5Z" />
    </>
  ),
};

const FALLBACK_ICON: React.ReactNode = (
  <>
    <circle cx="12" cy="10" r="3" />
    <path d="M12 21s-6-5.2-6-10a6 6 0 0 1 12 0c0 4.8-6 10-6 10Z" />
  </>
);

export default function CategoryIcon({ slug, className }: { slug: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {ICON_PATHS[slug] ?? FALLBACK_ICON}
    </svg>
  );
}
