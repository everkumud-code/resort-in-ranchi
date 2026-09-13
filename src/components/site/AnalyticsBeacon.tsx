"use client";

import { useEffect, useRef } from "react";
import { recordViewEvent } from "@/app/analyticsActions";
import type { AnalyticsEventType } from "@/lib/analytics";

/**
 * Renders nothing. Fires exactly once when the visitor's browser actually
 * mounts this component — i.e. when the page genuinely renders in their
 * viewport, not when Next.js speculatively prefetches the route's RSC
 * payload from a hovered/visible <Link> (prefetching never mounts Client
 * Component effects), so this can't inflate counts from prefetch alone.
 */
export default function AnalyticsBeacon({
  type,
  propertyId,
  path,
}: {
  type: AnalyticsEventType;
  propertyId?: string;
  path?: string;
}) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    void recordViewEvent(type, propertyId, path);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deliberately fire-once-per-mount only; re-running on prop identity changes would double-count the same visit.
  }, []);

  return null;
}
