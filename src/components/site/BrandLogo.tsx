import Image from "next/image";

/**
 * The three logo files are the master brand artwork, used exactly as
 * supplied — never redrawn, recolored, or recreated in CSS/SVG. Intrinsic
 * dimensions are the actual PNG sizes, needed by next/image to reserve
 * layout space and avoid shift; render size is controlled via `className`
 * (e.g. h-10 w-auto).
 */
const LOGO_VARIANTS = {
  /** Header/footer lockup — icon + wordmark. */
  horizontal: { src: "/brand/horizontal.png", width: 1254, height: 1254 },
  /** Circular badge — compact branding, share cards, favicon-adjacent contexts. */
  circular: { src: "/brand/circular.png", width: 1254, height: 1254 },
  /** Framed icon + wordmark, portrait canvas — mobile/compact promotional contexts. */
  vertical: { src: "/brand/vertical.png", width: 1024, height: 1536 },
} as const;

export type BrandLogoVariant = keyof typeof LOGO_VARIANTS;

export default function BrandLogo({
  variant = "horizontal",
  className,
  priority,
}: {
  variant?: BrandLogoVariant;
  className?: string;
  priority?: boolean;
}) {
  const { src, width, height } = LOGO_VARIANTS[variant];
  return (
    <Image
      src={src}
      alt="Resort In Ranchi"
      width={width}
      height={height}
      priority={priority}
      className={className}
    />
  );
}
