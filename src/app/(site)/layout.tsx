import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import { CompareProvider } from "@/components/site/CompareProvider";
import CompareTray from "@/components/site/CompareTray";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <CompareProvider>
      {/* Visually hidden until focused — lets keyboard/screen-reader visitors jump past the header nav instead of tabbing through it on every page. */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-brand-dark focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
      >
        Skip to main content
      </a>
      <div className="flex min-h-screen flex-col bg-brand-cream">
        <Header />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <Footer />
      </div>
      <CompareTray />
    </CompareProvider>
  );
}
