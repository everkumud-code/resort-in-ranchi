"use client";

import { useEffect, useRef } from "react";

interface GoogleAdSlotProps {
  slot: string | undefined;
  label?: string;
}

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export default function GoogleAdSlot({ slot, label = "Advertisement" }: GoogleAdSlotProps) {
  const pushed = useRef(false);
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

  useEffect(() => {
    if (!client || !slot || pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      // AdSense may not be ready on the first client pass; it can retry on reload.
    }
  }, [client, slot]);

  if (!client || !slot) return null;

  return (
    <section className="mx-auto my-5 w-full max-w-5xl" aria-label={label}>
      <p className="mb-1 text-center text-[10px] tracking-wide text-brand/40 uppercase">{label}</p>
      <div className="min-h-[90px] w-full overflow-hidden">
        <ins
          className="adsbygoogle block w-full"
          style={{ display: "block" }}
          data-ad-client={client}
          data-ad-slot={slot}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    </section>
  );
}
