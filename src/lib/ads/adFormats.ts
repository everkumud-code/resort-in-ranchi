/**
 * The reusable catalog of ad sizes AdSlot can render. Every entry here is a
 * real, standard promotional-banner size — nothing invented. A page never
 * renders every format at once (see AD_LADDERS below): it picks one
 * `AdLadderName`, and AdSlot shows exactly one matching size per breakpoint,
 * swapping via CSS only.
 */
export type AdFormatId =
  | "hero"
  | "leaderboard"
  | "banner728"
  | "banner468"
  | "mobileBanner"
  | "rectangle"
  | "largeRectangle"
  | "skyscraperTall"
  | "skyscraper"
  | "skyscraperNarrow"
  | "mobileRail";

export type AdShape = "banner" | "card" | "rail";

export interface AdFormat {
  id: AdFormatId;
  label: string;
  width: number;
  height: number;
  shape: AdShape;
}

export const AD_FORMATS: Record<AdFormatId, AdFormat> = {
  hero: { id: "hero", label: "1200x630 hero banner", width: 1200, height: 630, shape: "banner" },
  leaderboard: { id: "leaderboard", label: "970x250 leaderboard", width: 970, height: 250, shape: "banner" },
  banner728: { id: "banner728", label: "728x90 desktop banner", width: 728, height: 90, shape: "banner" },
  banner468: { id: "banner468", label: "468x60 compact banner", width: 468, height: 60, shape: "banner" },
  mobileBanner: { id: "mobileBanner", label: "320x100 mobile banner", width: 320, height: 100, shape: "banner" },
  rectangle: { id: "rectangle", label: "300x250 sidebar/card", width: 300, height: 250, shape: "card" },
  largeRectangle: { id: "largeRectangle", label: "336x280 card/sidebar", width: 336, height: 280, shape: "card" },
  skyscraperTall: { id: "skyscraperTall", label: "300x600 tall sidebar", width: 300, height: 600, shape: "rail" },
  skyscraper: { id: "skyscraper", label: "160x600 tall desktop rail", width: 160, height: 600, shape: "rail" },
  skyscraperNarrow: { id: "skyscraperNarrow", label: "120x600 tall desktop rail (narrow)", width: 120, height: 600, shape: "rail" },
  mobileRail: { id: "mobileRail", label: "120x240 mobile/sidebar", width: 120, height: 240, shape: "rail" },
};

export const BREAKPOINT_ORDER = ["base", "sm", "md", "lg", "xl", "2xl"] as const;
export type Breakpoint = (typeof BREAKPOINT_ORDER)[number];

export interface AdLadderStep {
  breakpoint: Breakpoint;
  formatId: AdFormatId;
  /**
   * Hand-authored, fully literal Tailwind classes — deliberately NOT built
   * from string interpolation at runtime. Tailwind's build-time class
   * scanner only detects classes that appear as complete, literal text
   * somewhere in the source; a class assembled at runtime from separate
   * breakpoint-name fragments (e.g. `` `${bp}:block` ``) would never appear
   * as literal text anywhere and would silently fail to generate any CSS.
   * `buildStepVisibilityClass` below independently recomputes the same
   * string from pure logic — its test suite cross-checks every entry here
   * against it, so this data can never silently drift from the logic it's
   * meant to encode, while the actual rendered class stays 100% literal.
   */
  visibilityClass: string;
}

export type AdLadderName = "hero" | "banner" | "rail" | "card";

/**
 * Which named formats each placement context uses, and at which viewport
 * width each one takes over — deliberately a curated subset per context
 * ("don't force every format onto every screen"), not every catalog entry
 * crammed into every ladder.
 */
export const AD_LADDERS: Record<AdLadderName, AdLadderStep[]> = {
  // The homepage's single, most prominent placement — the only ladder that
  // ever reaches the full 1200x630 hero size, and only on wide screens.
  hero: [
    { breakpoint: "base", formatId: "mobileBanner", visibilityClass: "block sm:hidden" },
    { breakpoint: "sm", formatId: "banner468", visibilityClass: "hidden sm:block md:hidden" },
    { breakpoint: "md", formatId: "banner728", visibilityClass: "hidden md:block lg:hidden" },
    { breakpoint: "lg", formatId: "leaderboard", visibilityClass: "hidden lg:block xl:hidden" },
    { breakpoint: "xl", formatId: "hero", visibilityClass: "hidden xl:block" },
  ],
  // Category/location/search "above results" placement — capped at
  // leaderboard so it stays a supporting element, never the page's hero.
  banner: [
    { breakpoint: "base", formatId: "mobileBanner", visibilityClass: "block sm:hidden" },
    { breakpoint: "sm", formatId: "banner468", visibilityClass: "hidden sm:block md:hidden" },
    { breakpoint: "md", formatId: "banner728", visibilityClass: "hidden md:block lg:hidden" },
    { breakpoint: "lg", formatId: "leaderboard", visibilityClass: "hidden lg:block" },
  ],
  // Desktop sidebar rail — never rendered below `lg` at all (there is no
  // sidebar column in the single-column mobile/tablet layout).
  rail: [
    { breakpoint: "lg", formatId: "skyscraperNarrow", visibilityClass: "hidden lg:block xl:hidden" },
    { breakpoint: "xl", formatId: "skyscraper", visibilityClass: "hidden xl:block 2xl:hidden" },
    { breakpoint: "2xl", formatId: "skyscraperTall", visibilityClass: "hidden 2xl:block" },
  ],
  // A single inline promotional card — property page's one relevant slot.
  card: [
    { breakpoint: "base", formatId: "rectangle", visibilityClass: "block sm:hidden" },
    { breakpoint: "sm", formatId: "largeRectangle", visibilityClass: "hidden sm:block" },
  ],
};

/**
 * Pure — independently recomputes what a step's visibility class *should*
 * be from its position in the ladder alone (never read directly by AdSlot —
 * see the `visibilityClass` doc comment above for why the literal,
 * hand-authored string is what actually gets rendered). Used only by tests,
 * as the oracle that AD_LADDERS' literal strings are checked against.
 */
export function buildStepVisibilityClass(steps: { breakpoint: Breakpoint }[], index: number): string {
  const step = steps[index];
  const next = steps[index + 1];
  const classes: string[] = step.breakpoint === "base" ? ["block"] : ["hidden", `${step.breakpoint}:block`];
  if (next) classes.push(`${next.breakpoint}:hidden`);
  return classes.join(" ");
}

export interface ResolvedAdLadderStep {
  step: AdLadderStep;
  format: AdFormat;
}

/** Pure — resolves a named ladder into its ordered {step, format} entries, ready for AdSlot to render. */
export function resolveAdLadder(ladderName: AdLadderName): ResolvedAdLadderStep[] {
  return AD_LADDERS[ladderName].map((step) => ({ step, format: AD_FORMATS[step.formatId] }));
}
