import type { Metadata } from "next";
import Link from "next/link";
import { SUNSET_DOWNLOAD_DEADLINE_LABEL } from "@/content/sunset";
import { ShowcaseGallery } from "./ShowcaseGallery";
import { StatsSection } from "./StatsSection";

export const metadata: Metadata = {
  title: "Showcase — Anima Machines",
  description:
    "A look back at what Anima Machines' users created — every avatar and the live Augmented Humans 2026 demo — before the product sunsets.",
};

export default function ShowcasePage() {
  return (
    <div className="min-h-screen bg-brand-dark text-gray-200">
      <header className="border-b border-white/10 px-6 py-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="font-display text-lg font-semibold text-white">
            Anima<span className="text-gradient">Machines</span>
          </Link>
          <Link href="/" className="text-sm text-gray-400 transition hover:text-white">
            ← Back home
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-10 pt-16 text-center">
        <span className="badge-shimmer mb-6 inline-block rounded-full px-4 py-1 text-xs font-semibold text-white">
          Sunsetting
        </span>
        <h1 className="mb-4 font-display text-4xl font-bold text-white sm:text-5xl">
          The Anima Machines <span className="text-gradient">Showcase</span>
        </h1>
        <p className="mx-auto max-w-2xl text-gray-400">
          Anima Machines is shutting down. Before it goes, here&apos;s what our
          users built — every generated avatar, plus the live demo we ran at
          Augmented Humans 2026. If you made something here, download it
          before <span className="text-white">{SUNSET_DOWNLOAD_DEADLINE_LABEL}</span>.
        </p>
      </section>

      <ShowcaseGallery />
      <StatsSection />

      <footer className="mx-auto max-w-6xl px-6 py-16 text-center text-sm text-gray-500">
        Thank you for building with us. — The Anima Machines team
      </footer>
    </div>
  );
}
