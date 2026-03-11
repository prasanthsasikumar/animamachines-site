"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MascotViewer } from "@/components/MascotViewer";

const POLL_INTERVAL_MS = 2000;

function proxyUrl(meshyGlbUrl: string | undefined): string | undefined {
  if (!meshyGlbUrl) return undefined;
  return `/api/meshy-ai/proxy?url=${encodeURIComponent(meshyGlbUrl)}`;
}

async function pollStatus(
  taskId: string,
  type: string
): Promise<{ status: string; glb_url?: string }> {
  const url = `/api/meshy-ai/status/${encodeURIComponent(taskId)}?type=${type}`;
  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error ?? "Failed to fetch status");
  return { status: data.status, glb_url: data.glb_url };
}

async function pollUntilSucceeded(
  taskId: string,
  type: string
): Promise<string | undefined> {
  for (let i = 0; i < 120; i++) {
    const result = await pollStatus(taskId, type);
    if (result.status === "SUCCEEDED") return result.glb_url;
    if (result.status === "FAILED" || result.status === "CANCELED") {
      throw new Error("Task failed");
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
  throw new Error("Task timed out");
}

type SavedAnimatedModel = { label: string; url: string; kind: string };

type CharacterDetailViewProps = {
  modelUrl: string;
  name: string;
  createdAt?: string;
  avatarId: string;
  creationPrompt?: string;
  creationMode?: "text" | "photo";
  sourceImageUrl?: string;
  savedAnimatedModels?: SavedAnimatedModel[];
  defaultModelUrl?: string;
};

export function CharacterDetailView({
  modelUrl,
  name,
  createdAt,
  avatarId,
  creationPrompt,
  creationMode,
  sourceImageUrl,
  savedAnimatedModels = [],
  defaultModelUrl,
}: CharacterDetailViewProps) {
  const router = useRouter();
  const [localAnimatedModels, setLocalAnimatedModels] = useState<
    SavedAnimatedModel[]
  >([]);
  const [selectedModelUrl, setSelectedModelUrl] = useState<string>(
    defaultModelUrl ?? modelUrl
  );
  const [isApplying, setIsApplying] = useState(false);
  const [animError, setAnimError] = useState<string | null>(null);

  const allAnimatedModels = [
    ...savedAnimatedModels,
    ...localAnimatedModels.filter(
      (local) => !savedAnimatedModels.some((s) => s.kind === local.kind)
    ),
  ];
  const models = [
    { label: "Base model", url: modelUrl, kind: "base" },
    ...allAnimatedModels.map((m) => ({ ...m, kind: m.kind })),
  ];
  const urlToShow = selectedModelUrl;

  const saveAnimatedAsset = useCallback(
    async (kind: string, sourceUrl: string) => {
      const res = await fetch("/api/characters/asset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          avatar_id: avatarId,
          kind,
          source_url: sourceUrl,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? "Failed to save animated model");
      }
    },
    [avatarId]
  );

  async function handleApplyTalkAnimation() {
    if (!avatarId) return;
    setAnimError(null);
    setIsApplying(true);
    try {
      const res = await fetch("/api/characters/animate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          avatar_id: avatarId,
          action_id: 308, // Talk_Passionately
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Animation failed");

      const taskId = data.task_id as string;
      const glbUrl = await pollUntilSucceeded(taskId, "animation");
      if (glbUrl) {
        await saveAnimatedAsset("animated_talk_glb", glbUrl);
        const displayUrl = proxyUrl(glbUrl) ?? glbUrl;
        setLocalAnimatedModels((prev) => {
          const filtered = prev.filter((m) => m.kind !== "animated_talk_glb");
          return [
            ...filtered,
            { label: "Talk (308)", url: displayUrl, kind: "animated_talk_glb" },
          ];
        });
        setSelectedModelUrl(displayUrl);
        router.refresh();
      }
    } catch (e) {
      setAnimError(e instanceof Error ? e.message : "Failed to apply animation");
    } finally {
      setIsApplying(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-10 px-6 py-10 lg:flex-row">
      <div className="flex-1">
        <div className="relative aspect-square min-h-[360px] overflow-hidden rounded-2xl border border-white/10 bg-black/30">
          <MascotViewer
            className="absolute inset-0 h-full w-full"
            modelUrl={urlToShow}
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

        {(creationPrompt || sourceImageUrl) && (
          <div className="space-y-3 rounded-2xl border border-white/10 bg-brand-dark-card/80 p-5 text-sm text-gray-200">
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Creation
            </p>
            {creationMode === "text" && creationPrompt && (
              <div>
                <p className="mb-1 text-xs text-gray-500">Text prompt</p>
                <p className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-gray-100">
                  {creationPrompt}
                </p>
              </div>
            )}
            {sourceImageUrl && (
              <div>
                <p className="mb-2 text-xs text-gray-500">
                  {creationMode === "photo" ? "Source image" : "Reference"}
                </p>
                <div className="overflow-hidden rounded-xl border border-white/10 bg-black/40">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={sourceImageUrl}
                    alt="Source or reference"
                    className="h-auto w-full object-contain"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        <div className="space-y-3 rounded-2xl border border-white/10 bg-brand-dark-card/80 p-5 text-sm text-gray-200">
          <p className="text-xs uppercase tracking-wide text-gray-500">
            Models
          </p>
          <div className="flex flex-wrap gap-2">
            {models.map((m) => (
              <button
                key={m.kind}
                type="button"
                onClick={() => setSelectedModelUrl(m.url)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  selectedModelUrl === m.url
                    ? "bg-brand-purple/30 text-white ring-1 ring-brand-purple/50"
                    : "bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
          <a
            href={selectedModelUrl}
            download="character.glb"
            className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-brand-purple to-brand-cyan px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-purple/25 transition-all hover:scale-[1.02] hover:shadow-brand-purple/50 focus:outline-none focus:ring-2 focus:ring-brand-purple/40"
          >
            Download GLB
          </a>
          <p className="text-xs text-gray-500">
            Switch models above. Download gets the currently displayed model.
          </p>
        </div>

        <div className="space-y-3 rounded-2xl border border-white/10 bg-brand-dark-card/80 p-5 text-sm text-gray-200">
          <p className="text-xs uppercase tracking-wide text-gray-500">
            Animation
          </p>
          <button
            type="button"
            onClick={handleApplyTalkAnimation}
            disabled={isApplying}
            className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-brand-purple to-brand-cyan px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-purple/25 transition-all hover:scale-[1.02] hover:shadow-brand-purple/50 focus:outline-none focus:ring-2 focus:ring-brand-purple/40 disabled:opacity-60"
          >
            {isApplying
              ? "Applying Talk animation (308)…"
              : "Apply Talk animation (308)"}
          </button>
          {animError && (
            <p className="text-xs text-red-400">{animError}</p>
          )}
          <p className="text-xs text-gray-500">
            Generates a Talk_Passionately animation via Meshy AI and displays it
            in the viewer.
          </p>
        </div>
      </div>
    </div>
  );
}
