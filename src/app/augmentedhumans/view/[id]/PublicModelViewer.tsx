"use client";

import { MascotViewer } from "@/components/MascotViewer";

type Props = {
  glbUrl: string;
  creatorName: string;
  timestamp: string;
  sleepScore: number;
  arousal: number;
  valence: number;
  gender: string | null;
  ageBracket: string | null;
  sessionId: string;
};

export default function PublicModelViewer({
  glbUrl,
  creatorName,
  timestamp,
  sleepScore,
  arousal,
  valence,
  gender,
  ageBracket,
  sessionId,
}: Props) {
  async function handleDownload() {
    try {
      const res = await fetch(`/api/augmented-humans/${sessionId}/glb`);
      if (!res.ok) return;
      const data = await res.json();
      const link = document.createElement("a");
      link.href = data.glb_url;
      link.download = `augmented-human-${sessionId}.glb`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      // silently fail
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-brand-dark">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div>
            <h1 className="font-display text-xl font-bold text-white">
              Augmented Human
            </h1>
            <p className="text-xs text-gray-400">
              by {creatorName} &middot;{" "}
              {new Date(timestamp).toLocaleString()}
            </p>
          </div>
          <a
            href="/"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-gray-200 transition hover:bg-white/10 hover:text-white"
          >
            Anima Machines
          </a>
        </div>
      </header>

      {/* 3D Viewer */}
      <div className="flex-1">
        <div className="mx-auto max-w-4xl px-6 py-6">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-brand-dark-card">
            <div className="h-[500px] w-full sm:h-[600px]">
              <MascotViewer className="h-full w-full" modelUrl={glbUrl} />
            </div>
          </div>

          {/* Stats + Download */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-brand-dark-card/80 px-6 py-4">
            <div className="flex flex-wrap gap-4 text-sm text-gray-400">
              <span>
                Sleep: <span className="text-white">{sleepScore}</span>
              </span>
              <span>
                Arousal: <span className="text-white">{arousal}</span>
              </span>
              <span>
                Valence: <span className="text-white">{valence}</span>
              </span>
              {gender && (
                <span>
                  Gender:{" "}
                  <span className="text-white capitalize">{gender}</span>
                </span>
              )}
              {ageBracket && (
                <span>
                  Age: <span className="text-white">{ageBracket}</span>
                </span>
              )}
            </div>
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-cyan px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-brand-cyan/90"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V3"
                />
              </svg>
              Download 3D Model
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
