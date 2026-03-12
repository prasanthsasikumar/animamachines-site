"use client";

import { useState } from "react";
import { MascotViewer } from "@/components/MascotViewer";

type Session = {
  id: string;
  sleep_score: number;
  arousal: number;
  valence: number;
  gender: string | null;
  age_bracket: string | null;
  client_timestamp: string | null;
  animated_glb_path: string | null;
  created_at: string;
  captureUrl: string | null;
  creatorName: string;
};

export function SessionGrid({ sessions }: { sessions: Session[] }) {
  const [viewingSession, setViewingSession] = useState<Session | null>(null);
  const [glbUrl, setGlbUrl] = useState<string | null>(null);
  const [loadingGlb, setLoadingGlb] = useState(false);

  async function openViewer(session: Session) {
    if (!session.animated_glb_path) return;
    setViewingSession(session);
    setGlbUrl(null);
    setLoadingGlb(true);
    try {
      const res = await fetch(`/api/augmented-humans/${session.id}/glb`);
      if (!res.ok) throw new Error("Failed to load model");
      const data = await res.json();
      setGlbUrl(data.glb_url);
    } catch {
      setGlbUrl(null);
    } finally {
      setLoadingGlb(false);
    }
  }

  function closeViewer() {
    setViewingSession(null);
    setGlbUrl(null);
  }

  return (
    <>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sessions.map((s) => (
          <div
            key={s.id}
            className={`overflow-hidden rounded-2xl border border-white/10 bg-brand-dark-card/80 transition hover:border-white/20 ${
              s.animated_glb_path ? "cursor-pointer" : ""
            }`}
            onClick={() => openViewer(s)}
          >
            {s.captureUrl ? (
              <img
                src={s.captureUrl}
                alt="Capture"
                className="h-40 w-full object-cover bg-black/30"
              />
            ) : (
              <div className="flex h-40 items-center justify-center bg-black/30 text-gray-600 text-sm">
                No capture
              </div>
            )}
            <div className="p-4 space-y-2">
              <p className="text-xs text-gray-500">
                {new Date(s.client_timestamp ?? s.created_at).toLocaleString()}
              </p>
              <p className="text-xs text-brand-cyan">by {s.creatorName}</p>
              <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                <span>
                  Sleep: <span className="text-white">{s.sleep_score}</span>
                </span>
                <span>
                  Arousal: <span className="text-white">{s.arousal}</span>
                </span>
                <span>
                  Valence: <span className="text-white">{s.valence}</span>
                </span>
                {s.gender && (
                  <span>
                    Gender:{" "}
                    <span className="text-white capitalize">{s.gender}</span>
                  </span>
                )}
                {s.age_bracket && (
                  <span>
                    Age: <span className="text-white">{s.age_bracket}</span>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {s.animated_glb_path ? (
                  <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-[10px] font-medium text-green-400">
                    Completed
                  </span>
                ) : (
                  <span className="rounded-full bg-yellow-500/20 px-2 py-0.5 text-[10px] font-medium text-yellow-400">
                    In progress
                  </span>
                )}
              </div>
              {s.animated_glb_path && (
                <p className="break-all rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-[10px] text-brand-cyan">
                  /api/augmented-humans/{s.id}/glb
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 3D Viewer Modal */}
      {viewingSession && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={closeViewer}
        >
          <div
            className="relative mx-4 w-full max-w-3xl rounded-2xl border border-white/10 bg-brand-dark-card overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-white">3D Model Viewer</h2>
                <p className="text-xs text-gray-400">
                  by {viewingSession.creatorName} &middot;{" "}
                  {new Date(
                    viewingSession.client_timestamp ?? viewingSession.created_at
                  ).toLocaleString()}
                </p>
              </div>
              <button
                onClick={closeViewer}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-gray-300 transition hover:bg-white/10 hover:text-white"
              >
                ✕ Close
              </button>
            </div>

            {/* Viewer */}
            <div className="h-[500px] w-full">
              {loadingGlb ? (
                <div className="flex h-full items-center justify-center text-gray-400">
                  Loading 3D model…
                </div>
              ) : glbUrl ? (
                <MascotViewer
                  className="h-full w-full"
                  modelUrl={glbUrl}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-gray-500">
                  Failed to load model
                </div>
              )}
            </div>

            {/* Footer with stats */}
            <div className="flex flex-wrap gap-4 border-t border-white/10 px-6 py-3 text-xs text-gray-400">
              <span>
                Sleep: <span className="text-white">{viewingSession.sleep_score}</span>
              </span>
              <span>
                Arousal: <span className="text-white">{viewingSession.arousal}</span>
              </span>
              <span>
                Valence: <span className="text-white">{viewingSession.valence}</span>
              </span>
              {viewingSession.gender && (
                <span>
                  Gender:{" "}
                  <span className="text-white capitalize">
                    {viewingSession.gender}
                  </span>
                </span>
              )}
              {viewingSession.age_bracket && (
                <span>
                  Age:{" "}
                  <span className="text-white">{viewingSession.age_bracket}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
