"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { SUNSET_DOWNLOAD_DEADLINE_LABEL } from "@/content/sunset";

const DISMISS_KEY = "am_sunset_banner_dismissed_v1";

export function SunsetBanner() {
  const [dismissed, setDismissed] = useState(true); // default hidden until we check localStorage, avoids SSR flash
  const barRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(DISMISS_KEY);
    setDismissed(stored === "1");
  }, []);

  useEffect(() => {
    const setHeightVar = () => {
      const height = dismissed ? 0 : (barRef.current?.offsetHeight ?? 0);
      document.documentElement.style.setProperty("--sunset-banner-h", `${height}px`);
    };
    setHeightVar();

    if (dismissed) return;
    const resizeObs = new ResizeObserver(setHeightVar);
    if (barRef.current) resizeObs.observe(barRef.current);
    return () => resizeObs.disconnect();
  }, [dismissed]);

  useEffect(() => {
    return () => {
      document.documentElement.style.setProperty("--sunset-banner-h", "0px");
    };
  }, []);

  if (dismissed) return null;

  function dismiss() {
    window.localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  }

  return (
    <div
      ref={barRef}
      className="relative z-[60] flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-gradient-to-r from-brand-purple-deep via-brand-purple to-brand-cyan px-4 py-2.5 text-center text-sm font-medium text-white"
    >
      <span>
        Anima Machines is shutting down. Download your avatars before{" "}
        <strong className="font-bold">{SUNSET_DOWNLOAD_DEADLINE_LABEL}</strong>.
      </span>
      <Link
        href="/showcase"
        className="whitespace-nowrap font-bold underline underline-offset-2 hover:text-white/80"
      >
        See the Showcase →
      </Link>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-white/80 transition hover:bg-white/10 hover:text-white"
      >
        ✕
      </button>
    </div>
  );
}
