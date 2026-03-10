"use client";

import { useState } from "react";
import { MascotViewer } from "@/components/MascotViewer";

type CharacterDetailViewProps = {
  modelUrl: string;
  name: string;
  createdAt?: string;
};

export function CharacterDetailView({ modelUrl, name, createdAt }: CharacterDetailViewProps) {
  const [selectedAnimation, setSelectedAnimation] = useState<"none" | "walk">("none");
  const [externalAnimationUrl, setExternalAnimationUrl] = useState<string | undefined>();

  const handleApply = () => {
    if (selectedAnimation === "walk") {
      setExternalAnimationUrl("/animations/walk.glb");
    } else {
      setExternalAnimationUrl(undefined);
    }
  };

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-10 px-6 py-10 lg:flex-row">
      <div className="flex-1">
        <div className="relative aspect-square min-h-[360px] overflow-hidden rounded-2xl border border-white/10 bg-black/30">
          <MascotViewer
            className="absolute inset-0 h-full w-full"
            modelUrl={modelUrl}
            animationUrl={externalAnimationUrl}
          />
        </div>
      </div>

      <div className="w-full max-w-sm space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">
            {name || "Character"}
          </h1>
          {createdAt ? (
            <p className="mt-1 text-sm text-gray-400">Created on {createdAt}</p>
          ) : null}
        </div>

        <div className="space-y-3 rounded-2xl border border-white/10 bg-brand-dark-card/80 p-5 text-sm text-gray-200">
          <p className="text-xs uppercase tracking-wide text-gray-500">
            Model actions
          </p>
          <a
            href={modelUrl}
            download="character.glb"
            className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-brand-purple to-brand-cyan px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-purple/25 transition-all hover:scale-[1.02] hover:shadow-brand-purple/50 focus:outline-none focus:ring-2 focus:ring-brand-purple/40"
          >
            Download GLB
          </a>
          <p className="text-xs text-gray-500">
            This file is a signed link to your character in Supabase Storage.
          </p>
        </div>

        <div className="space-y-3 rounded-2xl border border-white/10 bg-brand-dark-card/80 p-5 text-sm text-gray-200">
          <p className="text-xs uppercase tracking-wide text-gray-500">
            Animation (client-side)
          </p>
          <div className="flex items-center gap-3">
            <select
              value={selectedAnimation}
              onChange={(e) =>
                setSelectedAnimation(e.target.value as "none" | "walk")
              }
              className="flex-1 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-gray-100 focus:border-brand-purple/50 focus:outline-none focus:ring-1 focus:ring-brand-purple/40"
            >
              <option value="none">None</option>
              <option value="walk">Walk (Mixamo)</option>
            </select>
            <button
              type="button"
              onClick={handleApply}
              className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-brand-purple to-brand-cyan px-3 py-1.5 text-xs font-semibold text-white"
            >
              Apply
            </button>
          </div>
          <p className="text-xs text-gray-500">
            This uses a local Mixamo animation file and runs entirely in your browser.
          </p>
        </div>
      </div>
    </div>
  );
}

