import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import LocalInfoSection from "@/components/site/LocalInfoSection";
import GoogleAdSlot from "@/components/site/GoogleAdSlot";
import { CompareProvider } from "@/components/site/CompareProvider";
import CompareTray from "@/components/site/CompareTray";
import JoharSplash from "@/components/site/JoharSplash";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  const topAdSlot = process.env.NEXT_PUBLIC_ADSENSE_TOP_SLOT;
  const bottomAdSlot = process.env.NEXT_PUBLIC_ADSENSE_BOTTOM_SLOT;

  return (
    <CompareProvider>
      <JoharSplash storageKey="johar-splash-site" subtitle="Ranchi's Hospitality, Dining & Events Discovery Platform" />
      {/* Visually hidden until focused — lets keyboard/screen-reader visitors jump past the header nav instead of tabbing through it on every page. */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-brand-dark focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
      >
        Skip to main content
      </a>
      <div className="flex min-h-screen flex-col bg-brand-cream">
        <Header />
        <GoogleAdSlot slot={topAdSlot} label="Advertisement" />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <GoogleAdSlot slot={bottomAdSlot} label="Advertisement" />
        <LocalInfoSection />
        <Footer />
      </div>
      <CompareTray />
    </CompareProvider>
  );
}
