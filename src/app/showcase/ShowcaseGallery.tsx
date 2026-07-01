"use client";

import { useState } from "react";
import { MascotViewer } from "@/components/MascotViewer";
import { GALLERY, type GalleryItem } from "@/content/showcase-data";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// The static files are all literally named model.glb / talk.glb / thumb.png,
// so without an explicit download filename every item would save as the
// same generic name — silently overwriting or auto-suffixing in the
// browser's downloads folder, which looks identical to "nothing downloaded."
function downloadFilename(item: GalleryItem, kind: "photo" | "model" | "talk") {
  const namePart = item.label.split("@")[0].replace(/[^a-zA-Z0-9]+/g, "-");
  const kindPart = item.kind === "booth-session" ? "ah2026" : "avatar";
  const ext = kind === "photo" ? "png" : "glb";
  const variantPart = kind === "talk" ? "-talk" : "";
  return `anima-machines-${namePart}-${kindPart}-${item.id.slice(0, 8)}${variantPart}.${ext}`;
}

// Always visible (not hover-only) — a hover-reveal affordance is invisible
// and untappable on touch devices, which was making these downloads hard to
// find at all on anything but a mouse-driven desktop browser.
function CardIconButton({
  href,
  download,
  title,
  children,
}: {
  href: string;
  download: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      download={download}
      onClick={(e) => e.stopPropagation()}
      title={title}
      aria-label={title}
      className="flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur transition hover:bg-black/90"
    >
      {children}
    </a>
  );
}

function Card({ item, onOpen }: { item: GalleryItem; onOpen: () => void }) {
  return (
    <div
      onClick={onOpen}
      className="group relative cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-brand-dark-card/60 backdrop-blur transition hover:-translate-y-1 hover:border-brand-purple/40"
    >
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element -- static export asset, matches SessionGrid.tsx convention */}
        <img
          src={item.thumbnailPath}
          alt={item.label}
          className="h-56 w-full bg-black/30 object-cover"
        />
        <div className="absolute right-2 top-2 flex gap-1.5">
          <CardIconButton
            href={item.glbPath}
            download={downloadFilename(item, "model")}
            title="Download 3D model (.glb)"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 2l8 4.5v9L12 20l-8-4.5v-9L12 2zM12 2v9m0 0l8-4.5M12 11L4 6.5"
              />
            </svg>
          </CardIconButton>
          <CardIconButton href={item.thumbnailPath} download={downloadFilename(item, "photo")} title="Download photo">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V3"
              />
            </svg>
          </CardIconButton>
        </div>
      </div>
      <div className="space-y-1 p-4">
        <p className="truncate text-xs text-brand-cyan">{item.label}</p>
        <p className="text-xs text-gray-500">{formatDate(item.createdAt)}</p>
      </div>
    </div>
  );
}

const SORTED_GALLERY = [...GALLERY].sort(
  (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
);

export function ShowcaseGallery() {
  const [selected, setSelected] = useState<GalleryItem | null>(null);
  const [useTalk, setUseTalk] = useState(false);

  function open(item: GalleryItem) {
    setUseTalk(false);
    setSelected(item);
  }
  function close() {
    setSelected(null);
  }

  const activeGlb = selected
    ? useTalk && selected.talkGlbPath
      ? selected.talkGlbPath
      : selected.glbPath
    : null;

  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {SORTED_GALLERY.map((item) => (
          <Card key={item.id} item={item} onOpen={() => open(item)} />
        ))}
      </div>

      {/* Exactly one live 3D viewer mounts at a time, only on click — mirrors
          the pattern in augmentedhumans/history/SessionGrid.tsx, since
          MascotViewer creates a WebGL context + fetches its GLB unconditionally
          on mount. */}
      {selected && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={close}
        >
          <div
            className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-brand-dark-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-white">{selected.label}</h3>
                <p className="text-xs text-gray-400">
                  {formatDate(selected.createdAt)} ·{" "}
                  {selected.kind === "booth-session" ? "Augmented Humans 2026 Booth" : "Studio Avatar"}
                </p>
              </div>
              <button
                onClick={close}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-gray-300 transition hover:bg-white/10 hover:text-white"
              >
                ✕ Close
              </button>
            </div>

            <div className="h-[500px] w-full">
              {activeGlb && (
                <MascotViewer className="relative h-full w-full" modelUrl={activeGlb} />
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 px-6 py-4">
              <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                {selected.sleepScore != null && (
                  <span>
                    Sleep: <span className="text-white">{selected.sleepScore}</span>
                  </span>
                )}
                {selected.arousal != null && (
                  <span>
                    Arousal: <span className="text-white">{selected.arousal}</span>
                  </span>
                )}
                {selected.valence != null && (
                  <span>
                    Valence: <span className="text-white">{selected.valence}</span>
                  </span>
                )}
                {selected.gender && (
                  <span>
                    Gender: <span className="capitalize text-white">{selected.gender}</span>
                  </span>
                )}
                {selected.ageBracket && (
                  <span>
                    Age: <span className="text-white">{selected.ageBracket}</span>
                  </span>
                )}
                {selected.device && (
                  <span>
                    Device: <span className="text-white">{selected.device}</span>
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {selected.talkGlbPath && (
                  <button
                    onClick={() => setUseTalk((v) => !v)}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-gray-300 transition hover:bg-white/10 hover:text-white"
                  >
                    {useTalk ? "Show default animation" : "Show talking animation"}
                  </button>
                )}
                <a
                  href={selected.thumbnailPath}
                  download={downloadFilename(selected, "photo")}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Download Photo
                </a>
                {activeGlb && (
                  <a
                    href={activeGlb}
                    download={downloadFilename(selected, useTalk && !!selected.talkGlbPath ? "talk" : "model")}
                    className="inline-flex items-center gap-2 rounded-xl bg-brand-cyan px-4 py-2 text-sm font-semibold text-black transition hover:bg-brand-cyan/90"
                  >
                    Download GLB
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
