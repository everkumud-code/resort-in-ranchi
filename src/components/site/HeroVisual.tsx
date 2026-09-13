/**
 * Hero background — an original, abstract brand-color composition (soft
 * layered hill silhouettes + a sunrise glow), NOT a photograph. No real
 * Ranchi photography was available to use, and fabricating one or pulling
 * an external stock image wasn't an option here, so this stands in as an
 * honest placeholder with real visual presence.
 *
 * To swap in a real photo later: replace this component's contents with
 * next/image (fill, object-cover) pointed at the new asset — the parent
 * hero section already has `relative overflow-hidden` sizing and a text
 * scrim ready for it, so no layout changes are needed.
 */
export default function HeroVisual() {
  return (
    <svg
      viewBox="0 0 1600 900"
      preserveAspectRatio="xMidYMax slice"
      className="absolute inset-0 h-full w-full"
      aria-hidden="true"
    >
      <rect width="1600" height="900" fill="#003D2E" />
      <circle cx="1180" cy="330" r="260" fill="#F36B21" opacity="0.9" />
      <circle cx="1180" cy="330" r="380" fill="#F36B21" opacity="0.15" />
      <path d="M0 620 Q 260 480 560 560 T 1120 540 T 1600 600 V 900 H 0 Z" fill="#6B7F42" opacity="0.55" />
      <path d="M0 700 Q 320 600 700 680 T 1600 660 V 900 H 0 Z" fill="#2697A0" opacity="0.35" />
      <path d="M0 780 Q 400 700 800 760 T 1600 740 V 900 H 0 Z" fill="#064B3A" />
    </svg>
  );
}
