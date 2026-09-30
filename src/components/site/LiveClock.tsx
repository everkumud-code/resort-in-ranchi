"use client";

import { useEffect, useState } from "react";

const TIME_ZONE = "Asia/Kolkata";

function formatNow(): string {
  return new Date().toLocaleTimeString("en-IN", {
    timeZone: TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

/** Ticks once a second on the client only — starts blank server-side to avoid an SSR/client mismatch on the current second. */
export default function LiveClock() {
  const [time, setTime] = useState(formatNow);

  useEffect(() => {
    const id = setInterval(() => setTime(formatNow()), 1000);
    return () => clearInterval(id);
  }, []);

  return <span suppressHydrationWarning>{time}</span>;
}
