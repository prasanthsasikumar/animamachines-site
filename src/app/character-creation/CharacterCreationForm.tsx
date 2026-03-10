"use client";

import { useState, useRef, useEffect } from "react";
import { MascotViewer } from "@/components/MascotViewer";

const POLL_INTERVAL_MS = 2000;

function proxyUrl(meshyGlbUrl: string | undefined): string | undefined {
  if (!meshyGlbUrl) return undefined;
  return `/api/meshy-ai/proxy?url=${encodeURIComponent(meshyGlbUrl)}`;
}

type TaskType = "text-to-3d" | "image-to-3d" | "image-to-image" | "rig";

async function pollStatus(
  taskId: string,
  type: TaskType
): Promise<{ status: string; glb_url?: string; image_url?: string; progress?: number }> {
  const url = `/api/meshy-ai/status/${encodeURIComponent(taskId)}?type=${type}`;
  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error ?? "Failed to fetch status");
  return {
    status: data.status,
    glb_url: data.glb_url,
    image_url: data.image_url,
    progress: data.progress,
  };
}

async function pollUntilSucceeded(
  taskId: string,
  type: TaskType,
  onProgress?: (progress: number) => void
): Promise<string | undefined> {
  for (let i = 0; i < 120; i++) {
    const result = await pollStatus(taskId, type);
    if (result.status === "SUCCEEDED") return result.glb_url ?? result.image_url;
    if (result.status === "FAILED" || result.status === "CANCELED") {
      throw new Error("Task failed");
    }
    onProgress?.(result.progress ?? 0);
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
  throw new Error("Task timed out");
}

function fileToDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

type CreationMode = "text" | "photo";

export function CharacterCreationForm() {
  const [mode, setMode] = useState<CreationMode>("text");
  const [prompt, setPrompt] = useState("");
  const [imageDataUri, setImageDataUri] = useState<string | null>(null);
  const [fullBodyImageUrl, setFullBodyImageUrl] = useState<string | null>(null);
  const [step, setStep] = useState<
    | "idle"
    | "creating"
    | "preview"
    | "texturing"
    | "textured"
    | "rigging"
    | "rigged"
    | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);
  const [previewTaskId, setPreviewTaskId] = useState<string | null>(null);
  const [imageTaskId, setImageTaskId] = useState<string | null>(null);
  const [refinedTaskId, setRefinedTaskId] = useState<string | null>(null);
  const [rigTaskId, setRigTaskId] = useState<string | null>(null);
  const [previewGlbUrl, setPreviewGlbUrl] = useState<string | null>(null);
  const [texturedGlbUrl, setTexturedGlbUrl] = useState<string | null>(null);
  const [riggedGlbUrl, setRiggedGlbUrl] = useState<string | null>(null);
  const [rawFinalGlbUrl, setRawFinalGlbUrl] = useState<string | null>(null);
  const [avatarId, setAvatarId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [awaitingPhotoApproval, setAwaitingPhotoApproval] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const currentModelUrl =
    riggedGlbUrl ?? texturedGlbUrl ?? previewGlbUrl ?? undefined;

  const sourceTaskIdForRig = imageTaskId ?? refinedTaskId ?? previewTaskId;

  async function initAvatar(): Promise<string> {
    if (avatarId) return avatarId;
    const res = await fetch("/api/characters/init", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: saveName.trim() || "Character" }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error ?? "Failed to init");
    setAvatarId(data.avatar_id);
    return data.avatar_id as string;
  }

  async function saveAsset(kind: string, sourceUrl: string) {
    const id = await initAvatar();
    await fetch("/api/characters/asset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        avatar_id: id,
        kind,
        source_url: sourceUrl,
      }),
    });
  }

  async function handleCreateFromText() {
    if (!prompt.trim()) return;
    setError(null);
    setStep("creating");
    try {
      await initAvatar();
      const res = await fetch("/api/meshy-ai/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Create failed");

      const taskId = data.task_id as string;
      setPreviewTaskId(taskId);
      const glbUrl = await pollUntilSucceeded(
        taskId,
        "text-to-3d",
        setProgress
      );
      setPreviewGlbUrl(proxyUrl(glbUrl) ?? null);
      if (glbUrl) void saveAsset("preview_glb", glbUrl);
      setStep("preview");

      setStep("texturing");
      setProgress(0);
      const textureRes = await fetch("/api/meshy-ai/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preview_task_id: taskId,
          enable_pbr: false,
        }),
      });
      const textureData = await textureRes.json().catch(() => ({}));
      if (!textureRes.ok) throw new Error(textureData?.error ?? "Texture failed");
      const textureTaskId = textureData.task_id as string;
      setRefinedTaskId(textureTaskId);
      const texturedGlb = await pollUntilSucceeded(
        textureTaskId,
        "text-to-3d",
        setProgress
      );
      setTexturedGlbUrl(proxyUrl(texturedGlb) ?? null);
      if (texturedGlb) void saveAsset("textured_glb", texturedGlb);
      setStep("textured");

      setStep("rigging");
      setProgress(0);
      const rigRes = await fetch("/api/meshy-ai/rig", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input_task_id: textureTaskId }),
      });
      const rigData = await rigRes.json().catch(() => ({}));
      if (!rigRes.ok) throw new Error(rigData?.error ?? "Rig failed");
      const rigId = rigData.task_id as string;
      setRigTaskId(rigId);
      const riggedGlb = await pollUntilSucceeded(rigId, "rig", setProgress);
      setRawFinalGlbUrl(riggedGlb ?? null);
      setRiggedGlbUrl(proxyUrl(riggedGlb) ?? null);
      if (riggedGlb) void saveAsset("rigged_glb", riggedGlb);
      setStep("rigged");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setStep("error");
    }
  }

  async function handleCreateFromPhoto() {
    if (!imageDataUri) return;
    setError(null);
    setStep("creating");
    setProgress(0);
    setFullBodyImageUrl(null);
    setAwaitingPhotoApproval(false);
    try {
      const id = await initAvatar();
      void saveAsset("input_photo", imageDataUri);

      // 1) Image-to-Image: generate full-body reference photo
      const fullBodyPrompt =
        "Full-body realistic photo of the same person in the reference image, standing straight facing the camera, neutral expression, arms slightly away from the body, legs shoulder-width apart, symmetrical posture for character rigging, natural proportions, wearing simple casual clothing, studio lighting, plain neutral background, ultra realistic, photorealistic, high detail, full body visible from head to feet.";

      const i2iRes = await fetch("/api/meshy-ai/image-to-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: fullBodyPrompt,
          reference_image_url: imageDataUri,
        }),
      });
      const i2iData = await i2iRes.json().catch(() => ({}));
      if (!i2iRes.ok) throw new Error(i2iData?.error ?? "Image transform failed");

      const i2iTaskId = i2iData.task_id as string;
      const fullBody = await pollUntilSucceeded(
        i2iTaskId,
        "image-to-image" as TaskType,
        setProgress
      );
      if (!fullBody) throw new Error("No image output");
      setFullBodyImageUrl(fullBody);
      void saveAsset("fullbody_photo", fullBody);
      setStep("idle");
      setProgress(0);
      setAwaitingPhotoApproval(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setStep("error");
    }
  }

  async function handleContinueFromApprovedPhoto() {
    if (!fullBodyImageUrl) return;
    setError(null);
    setAwaitingPhotoApproval(false);
    setStep("creating");
    setProgress(0);
    try {
      await initAvatar();

      // 2) Image-to-3D: use full-body image as both geometry + texture guide
      const res = await fetch("/api/meshy-ai/image-to-3d", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: fullBodyImageUrl,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "3D create failed");

      const taskId = data.task_id as string;
      setImageTaskId(taskId);
      const glbUrl = await pollUntilSucceeded(taskId, "image-to-3d", setProgress);
      setTexturedGlbUrl(proxyUrl(glbUrl) ?? null);
      if (glbUrl) void saveAsset("textured_glb", glbUrl);
      setStep("textured");

      setStep("rigging");
      setProgress(0);
      const rigRes = await fetch("/api/meshy-ai/rig", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input_task_id: taskId }),
      });
      const rigData = await rigRes.json().catch(() => ({}));
      if (!rigRes.ok) throw new Error(rigData?.error ?? "Rig failed");
      const rigId = rigData.task_id as string;
      setRigTaskId(rigId);
      const riggedGlb = await pollUntilSucceeded(rigId, "rig", setProgress);
      setRawFinalGlbUrl(riggedGlb ?? null);
      setRiggedGlbUrl(proxyUrl(riggedGlb) ?? null);
      if (riggedGlb) void saveAsset("rigged_glb", riggedGlb);
      setStep("rigged");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setStep("error");
    }
  }

  function handleRetryFullBody() {
    setFullBodyImageUrl(null);
    setAwaitingPhotoApproval(false);
    void handleCreateFromPhoto();
  }

  function handleCreate() {
    if (mode === "photo") handleCreateFromPhoto();
    else handleCreateFromText();
  }

  async function handleDownload() {
    const url = currentModelUrl;
    if (!url) return;
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "character.glb";
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      setError("Download failed");
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/^image\/(jpe?g|png)$/i.test(file.type)) {
      setError("Please upload a JPG or PNG image");
      return;
    }
    setError(null);
    try {
      const dataUri = await fileToDataUri(file);
      setImageDataUri(dataUri);
    } catch {
      setError("Failed to read image");
    }
  }

  async function handleTakePhoto() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
      });
      streamRef.current = stream;
      setCameraOpen(true);
      setImageDataUri(null);
      setError(null);
    } catch {
      setError("Camera access denied");
    }
  }

  useEffect(() => {
    if (cameraOpen && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [cameraOpen]);

  function handleCapturePhoto() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUri = canvas.toDataURL("image/jpeg", 0.9);
    handleCloseCamera();
    setImageDataUri(dataUri);
  }

  function handleCloseCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject = null;
    }
    setCameraOpen(false);
  }

  const canCreateText = prompt.trim().length > 0;
  const canCreatePhoto = !!imageDataUri;
  const canCreate = mode === "text" ? canCreateText : canCreatePhoto;
  const isComplete = step === "rigged";
  const isWorking =
    step === "creating" ||
    step === "texturing" ||
    step === "rigging";

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-6">
        <div className="flex gap-2 rounded-xl border border-white/10 bg-white/5 p-1">
          <button
            type="button"
            onClick={() => {
              setMode("text");
              setError(null);
              handleCloseCamera();
            }}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              mode === "text"
                ? "bg-brand-purple/20 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            From text
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("photo");
              setError(null);
              handleCloseCamera();
            }}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              mode === "photo"
                ? "bg-brand-purple/20 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            From photo
          </button>
        </div>

        <div className="rounded-2xl border border-white/10 bg-brand-dark-card/80 p-6">
          <h2 className="font-display text-lg font-semibold text-white">
            Create
          </h2>

          {mode === "text" ? (
            <>
              <p className="mt-1 text-sm text-gray-400">
                Describe your character. We&apos;ll create, texture, and rig a
                full-body humanoid.
              </p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <input
                  type="text"
                  value={prompt ?? ""}
                  onChange={(e) => setPrompt(e.target.value)}
                  disabled={isWorking}
                  placeholder="e.g. a humanoid robot with glowing eyes"
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:border-brand-purple/50 focus:outline-none focus:ring-2 focus:ring-brand-purple/20 disabled:opacity-70"
                />
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={!canCreate || isWorking}
                  className="whitespace-nowrap rounded-xl bg-gradient-to-r from-brand-purple to-brand-cyan px-6 py-3 text-sm font-semibold text-white disabled:opacity-70"
                >
                  {isWorking ? "Creating…" : "Create character"}
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="mt-1 text-sm text-gray-400">
                Upload a photo or take one. We&apos;ll create a full-body
                humanoid that looks like the person.
              </p>
              <div className="mt-4 space-y-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/jpg"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isWorking}
                    className="rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/10 disabled:opacity-50"
                  >
                    Upload photo
                  </button>
                  <button
                    type="button"
                    onClick={handleTakePhoto}
                    disabled={isWorking}
                    className="rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/10 disabled:opacity-50"
                  >
                    Take photo
                  </button>
                </div>

                {cameraOpen && (
                  <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black/30">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="h-48 w-full object-cover"
                    />
                    <div className="absolute inset-x-0 bottom-0 flex justify-center gap-2 p-3">
                      <button
                        type="button"
                        onClick={handleCapturePhoto}
                        className="rounded-full bg-brand-cyan px-4 py-2 text-sm font-medium text-black"
                      >
                        Capture
                      </button>
                      <button
                        type="button"
                        onClick={handleCloseCamera}
                        className="rounded-full bg-white/20 px-4 py-2 text-sm font-medium text-white"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {imageDataUri && !cameraOpen && (
                  <div className="relative">
                    <img
                      src={imageDataUri}
                      alt="Selected"
                      className="h-40 w-auto max-w-full rounded-xl border border-white/10 object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => setImageDataUri(null)}
                      className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-1 text-xs text-white hover:bg-black/80"
                    >
                      Remove
                    </button>
                  </div>
                )}

                {fullBodyImageUrl && (
                  <div className="space-y-3 rounded-2xl border border-brand-cyan/40 bg-brand-dark-card/80 p-4">
                    <p className="text-sm text-gray-200">
                      Does this full-body image look OK before we turn it into a 3D character?
                    </p>
                    <img
                      src={fullBodyImageUrl}
                      alt="Full-body preview from Meshy"
                      className="h-48 w-full rounded-xl border border-white/10 bg-black/40 object-contain"
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={handleContinueFromApprovedPhoto}
                        disabled={isWorking}
                        className="inline-flex flex-1 items-center justify-center rounded-xl bg-gradient-to-r from-brand-purple to-brand-cyan px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                      >
                        Yes, looks good — continue
                      </button>
                      <button
                        type="button"
                        onClick={handleRetryFullBody}
                        disabled={isWorking}
                        className="inline-flex flex-1 items-center justify-center rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/10 disabled:opacity-60"
                      >
                        Try again
                      </button>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={!canCreate || isWorking || awaitingPhotoApproval}
                  className="mt-2 w-full rounded-xl bg-gradient-to-r from-brand-purple to-brand-cyan px-6 py-3 text-sm font-semibold text-white disabled:opacity-70"
                >
                  {isWorking
                    ? "Creating character…"
                    : fullBodyImageUrl
                      ? "Regenerate full-body photo"
                      : "Create character from photo"}
                </button>
              </div>
            </>
          )}
        </div>

        {isWorking && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full bg-gradient-to-r from-brand-purple to-brand-cyan transition-all duration-300 ${
                  progress === 0 ? "animate-pulse" : ""
                }`}
                style={{
                  width: progress > 0 ? `${Math.max(progress, 2)}%` : "30%",
                }}
              />
            </div>
            <p className="mt-2 text-xs text-gray-500">
              {step === "creating"
                ? "Generating model… (typically 2–5 min)"
                : step === "texturing"
                  ? "Applying texture… (typically 1–3 min)"
                  : "Rigging… (typically 1–2 min)"}
            </p>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
            {error}
          </div>
        )}
      </div>

      <div className="relative">
        <div className="relative aspect-square min-h-[320px] overflow-hidden rounded-2xl border border-white/10 bg-black/30">
          {currentModelUrl ? (
            <MascotViewer
              className="absolute inset-0 h-full w-full"
              modelUrl={currentModelUrl}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-gray-500">
              <p className="text-sm">Your character will appear here</p>
              <p className="text-center text-xs">
                {mode === "text"
                  ? "Enter a prompt and click Create"
                  : "Upload or take a photo and click Create"}
              </p>
            </div>
          )}
        </div>
        {currentModelUrl && (
          <div className="mt-3 space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={saveName ?? ""}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="Name (optional)"
                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-gray-500 focus:border-brand-purple/50 focus:outline-none focus:ring-2 focus:ring-brand-purple/20"
              />
              <a
                href="/characters"
                className="rounded-xl border border-brand-purple/50 bg-brand-purple/10 px-4 py-2.5 text-sm font-medium text-brand-purple hover:bg-brand-purple/20"
              >
                My Characters
              </a>
              <button
                type="button"
                onClick={handleDownload}
                className="rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/10"
              >
                Download GLB
              </button>
            </div>
            <p className="text-xs text-gray-500">
              Auto-saved to your library as each asset is generated.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
