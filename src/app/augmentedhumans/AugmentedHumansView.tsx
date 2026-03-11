"use client";

import { useState, useRef, useEffect } from "react";
import { MascotViewer } from "@/components/MascotViewer";

const POLL_INTERVAL_MS = 2000;
const FULL_BODY_PROMPT =
  "Full-body realistic photo of the same person in the reference image, preserve identity and outfit. Standing straight facing the camera, neutral expression, arms slightly away from body, legs shoulder-width apart, symmetrical posture for rigging. Studio lighting, plain background. Photorealistic, full body visible from head to feet.";

type TaskType = "image-to-image" | "image-to-3d" | "rig" | "animation";

async function pollStatus(
  taskId: string,
  type: TaskType
): Promise<{ status: string; glb_url?: string; image_url?: string }> {
  const typeParam =
    type === "image-to-image"
      ? "image-to-image"
      : type === "image-to-3d"
        ? "image-to-3d"
        : type;
  const url = `/api/meshy-ai/status/${encodeURIComponent(taskId)}?type=${typeParam}`;
  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error ?? "Failed to fetch status");
  const result = data as {
    status: string;
    glb_url?: string;
    image_url?: string;
  };
  return {
    status: result.status,
    glb_url: result.glb_url,
    image_url: result.image_url,
  };
}

async function pollUntilSucceeded(
  taskId: string,
  type: TaskType,
  onPoll?: (iteration: number, status: string) => void
): Promise<string | undefined> {
  for (let i = 0; i < 120; i++) {
    const result = await pollStatus(taskId, type);
    onPoll?.(i, result.status);
    if (result.status === "SUCCEEDED")
      return result.glb_url ?? result.image_url;
    if (result.status === "FAILED" || result.status === "CANCELED") {
      throw new Error("Task failed");
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
  throw new Error("Task timed out");
}

function proxyUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  return `/api/meshy-ai/proxy?url=${encodeURIComponent(url)}`;
}

export function AugmentedHumansView() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [sleepScore, setSleepScore] = useState(5);
  const [arousal, setArousal] = useState(5);
  const [valence, setValence] = useState(5);
  const [touchedSleep, setTouchedSleep] = useState(false);
  const [touchedArousal, setTouchedArousal] = useState(false);
  const [touchedValence, setTouchedValence] = useState(false);
  const [gender, setGender] = useState<string>("");
  const [ageBracket, setAgeBracket] = useState<string>("");
  const [step, setStep] = useState<
    "idle" | "captured" | "generating" | "done" | "error"
  >("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [glbUrl, setGlbUrl] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const glbApiUrl =
    typeof window !== "undefined" && sessionId
      ? `${window.location.origin}/api/augmented-humans/${sessionId}/glb`
      : "";

  useEffect(() => {
    let mounted = true;
    navigator.mediaDevices
      .getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
      })
      .then((stream) => {
        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        setCameraReady(true);
      })
      .catch(() => setError("Camera access denied"));

    return () => {
      mounted = false;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (cameraReady && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [cameraReady]);

  function handleCapture() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUri = canvas.toDataURL("image/jpeg", 0.9);
    setCapturedUri(dataUri);
    setStep("captured");
  }

  async function handleGenerate() {
    if (!capturedUri) return;
    setError(null);
    setStep("generating");
    setProgress(5);

    const base = window.location.origin;

    function progressUpdater(rangeStart: number, rangeEnd: number) {
      return (iteration: number, status: string) => {
        const t = Math.min(iteration / 60, 1);
        setProgress(Math.round(rangeStart + (rangeEnd - rangeStart) * t));
        setStatusMessage((prev) => {
          const label = prev?.replace(/ \(.*\)$/, "") ?? "";
          return `${label} (${status.toLowerCase()})`;
        });
      };
    }

    try {
      setStatusMessage("Creating session…");
      const initRes = await fetch(`${base}/api/augmented-humans`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          capture_data_uri: capturedUri,
          sleep_score: sleepScore,
          arousal,
          valence,
          gender,
          age_bracket: ageBracket,
          client_timestamp: new Date().toISOString(),
          client_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });
      const initData = await initRes.json().catch(() => ({}));
      if (!initRes.ok) throw new Error(initData?.error ?? "Failed to create session");
      const { session_id } = initData;
      setSessionId(session_id);
      setProgress(10);

      setStatusMessage("Step 1/4 — Generating full-body photo…");
      const i2iRes = await fetch(`${base}/api/meshy-ai/image-to-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: FULL_BODY_PROMPT,
          reference_image_url: capturedUri,
        }),
      });
      const i2iData = await i2iRes.json().catch(() => ({}));
      if (!i2iRes.ok) throw new Error(i2iData?.error ?? "Full-body generation failed");
      const fullBody = await pollUntilSucceeded(i2iData.task_id, "image-to-image", progressUpdater(10, 30));
      if (!fullBody) throw new Error("No full-body output");

      await fetch(`${base}/api/augmented-humans/${session_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullbody_photo_url: fullBody }),
      });
      setProgress(30);

      setStatusMessage("Step 2/4 — Converting to 3D model…");
      const i2tRes = await fetch(`${base}/api/meshy-ai/image-to-3d`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_url: fullBody }),
      });
      const i2tData = await i2tRes.json().catch(() => ({}));
      if (!i2tRes.ok) throw new Error(i2tData?.error ?? "3D generation failed");
      const modelGlb = await pollUntilSucceeded(i2tData.task_id, "image-to-3d", progressUpdater(30, 50));
      if (!modelGlb) throw new Error("No 3D output");

      await fetch(`${base}/api/augmented-humans/${session_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model_glb_url: modelGlb }),
      });
      setProgress(50);

      setStatusMessage("Step 3/4 — Rigging skeleton…");
      const rigRes = await fetch(`${base}/api/meshy-ai/rig`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input_task_id: i2tData.task_id }),
      });
      const rigData = await rigRes.json().catch(() => ({}));
      if (!rigRes.ok) throw new Error(rigData?.error ?? "Rigging failed");
      const rigTaskId = rigData.task_id;
      const riggedGlb = await pollUntilSucceeded(rigTaskId, "rig", progressUpdater(50, 70));
      if (!riggedGlb) throw new Error("No rigged output");

      await fetch(`${base}/api/augmented-humans/${session_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model_glb_url: riggedGlb,
          rig_task_id: rigTaskId,
        }),
      });
      setProgress(70);

      setStatusMessage("Step 4/4 — Animating character…");
      const animRes = await fetch(`${base}/api/augmented-humans/${session_id}/animate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action_id: 308 }),
      });
      const animData = await animRes.json().catch(() => ({}));
      if (!animRes.ok) throw new Error(animData?.error ?? "Animation failed");
      const animatedGlb = await pollUntilSucceeded(animData.task_id, "animation", progressUpdater(70, 99));
      if (!animatedGlb) throw new Error("No animated output");

      await fetch(`${base}/api/augmented-humans/${session_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ animated_glb_url: animatedGlb }),
      });

      setStatusMessage("Done!");
      setGlbUrl(proxyUrl(animatedGlb) ?? animatedGlb);
      setStep("done");
      setProgress(100);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setStep("error");
      setStatusMessage(null);
    }
  }

  function handleRetake() {
    setCapturedUri(null);
    setStep("idle");
    setTouchedSleep(false);
    setTouchedArousal(false);
    setTouchedValence(false);
    setGender("");
    setAgeBracket("");
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !/^image\/(jpe?g|png)$/i.test(file.type)) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCapturedUri(reader.result as string);
      setStep("captured");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  const canProceed =
    !!capturedUri && touchedSleep && touchedArousal && touchedValence && !!gender && !!ageBracket && step !== "generating";

  if (error && step === "error") {
    return (
      <div className="mt-8 space-y-4">
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-400">
          {error}
        </div>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setStep("captured");
          }}
          className="rounded-xl bg-white/10 px-4 py-2 text-sm text-white"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-2">
      <div className="space-y-6">
        <div className="rounded-2xl border border-white/10 bg-brand-dark-card/80 p-6">
          <h2 className="font-display text-lg font-semibold text-white">
            Capture & wellbeing
          </h2>

          {step === "idle" || step === "captured" ? (
            <>
              {!capturedUri ? (
                <div className="mt-4 space-y-3">
                  <div className="relative aspect-video overflow-hidden rounded-xl border border-white/10 bg-black/30">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="h-full w-full object-cover"
                      style={{ display: cameraReady ? "block" : "none" }}
                    />
                    {!cameraReady && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-gray-500">
                        <p>Opening camera… Allow camera access when prompted.</p>
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 p-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-1.5 text-xs text-gray-400 hover:text-white"
                      >
                        Or upload a photo
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCapture}
                    disabled={!cameraReady}
                    style={{ backgroundColor: "#8B5CF6", color: "#fff" }}
                    className="w-full rounded-xl py-3.5 text-sm font-bold shadow-lg transition-all duration-200 hover:scale-[1.02] hover:brightness-110 hover:shadow-purple-500/50 active:scale-[0.98] disabled:cursor-not-allowed disabled:scale-100 disabled:opacity-40 disabled:shadow-none"
                  >
                    📸 Capture Photo
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/jpg"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  <img
                    src={capturedUri}
                    alt="Captured"
                    className="h-48 w-full rounded-xl border border-white/10 object-contain bg-black/30"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleRetake}
                      className="rounded-lg border border-white/20 px-3 py-1.5 text-xs text-white"
                    >
                      Retake
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-6 space-y-4">
                <p className="text-xs text-gray-500">
                  Please fill in all fields below.
                </p>
                <div>
                  <label className="block text-xs text-gray-500">
                    Gender
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="mt-1 w-full appearance-none rounded-lg border border-white/20 bg-[#1a1a2e] px-3 py-2.5 text-sm text-white shadow-sm focus:border-brand-cyan focus:outline-none focus:ring-1 focus:ring-brand-cyan/30"
                  >
                    <option value="" disabled className="bg-[#1a1a2e] text-gray-400">Select…</option>
                    <option value="male" className="bg-[#1a1a2e] text-white">Male</option>
                    <option value="female" className="bg-[#1a1a2e] text-white">Female</option>
                    <option value="non-binary" className="bg-[#1a1a2e] text-white">Non-binary</option>
                    <option value="prefer-not-to-say" className="bg-[#1a1a2e] text-white">Prefer not to say</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500">
                    Age bracket
                  </label>
                  <select
                    value={ageBracket}
                    onChange={(e) => setAgeBracket(e.target.value)}
                    className="mt-1 w-full appearance-none rounded-lg border border-white/20 bg-[#1a1a2e] px-3 py-2.5 text-sm text-white shadow-sm focus:border-brand-cyan focus:outline-none focus:ring-1 focus:ring-brand-cyan/30"
                  >
                    <option value="" disabled className="bg-[#1a1a2e] text-gray-400">Select…</option>
                    <option value="under-18" className="bg-[#1a1a2e] text-white">Under 18</option>
                    <option value="18-24" className="bg-[#1a1a2e] text-white">18–24</option>
                    <option value="25-34" className="bg-[#1a1a2e] text-white">25–34</option>
                    <option value="35-44" className="bg-[#1a1a2e] text-white">35–44</option>
                    <option value="45-54" className="bg-[#1a1a2e] text-white">45–54</option>
                    <option value="55-64" className="bg-[#1a1a2e] text-white">55–64</option>
                    <option value="65+" className="bg-[#1a1a2e] text-white">65+</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500">
                    How did you sleep? (1–10)
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={sleepScore}
                    onChange={(e) => {
                      setSleepScore(Number(e.target.value));
                      setTouchedSleep(true);
                    }}
                    onPointerUp={() => setTouchedSleep(true)}
                    onKeyUp={() => setTouchedSleep(true)}
                    className="mt-1 w-full accent-brand-cyan"
                  />
                  <span className="ml-2 text-sm text-white">{sleepScore}</span>
                  {!touchedSleep && (
                    <span className="ml-2 text-xs text-brand-cyan">tap</span>
                  )}
                </div>
                <div>
                  <label className="block text-xs text-gray-500">
                    Arousal (1–9, SAM scale)
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={9}
                    value={arousal}
                    onChange={(e) => {
                      setArousal(Number(e.target.value));
                      setTouchedArousal(true);
                    }}
                    onPointerUp={() => setTouchedArousal(true)}
                    onKeyUp={() => setTouchedArousal(true)}
                    className="mt-1 w-full accent-brand-cyan"
                  />
                  <span className="ml-2 text-sm text-white">{arousal}</span>
                  {!touchedArousal && (
                    <span className="ml-2 text-xs text-brand-cyan">tap</span>
                  )}
                </div>
                <div>
                  <label className="block text-xs text-gray-500">
                    Valence (1–9, SAM scale)
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={9}
                    value={valence}
                    onChange={(e) => {
                      setValence(Number(e.target.value));
                      setTouchedValence(true);
                    }}
                    onPointerUp={() => setTouchedValence(true)}
                    onKeyUp={() => setTouchedValence(true)}
                    className="mt-1 w-full accent-brand-cyan"
                  />
                  <span className="ml-2 text-sm text-white">{valence}</span>
                  {!touchedValence && (
                    <span className="ml-2 text-xs text-brand-cyan">tap</span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={!canProceed}
                className="mt-6 w-full cursor-pointer rounded-xl border border-white/15 bg-gradient-to-r from-brand-purple to-brand-cyan px-6 py-4 text-base font-semibold text-white shadow-lg shadow-brand-purple/25 transition-all duration-200 hover:scale-[1.02] hover:border-white/25 hover:shadow-brand-purple/50 focus:outline-none focus:ring-2 focus:ring-brand-cyan/40 active:scale-[0.98] disabled:cursor-not-allowed disabled:scale-100 disabled:opacity-60 disabled:shadow-none"
              >
                Proceed
              </button>
            </>
          ) : (
            <div className="mt-4">
              {step === "generating" && (
                <div className="space-y-2">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full bg-gradient-to-r from-brand-purple to-brand-cyan transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    {statusMessage ?? "Generating 3D character…"}
                  </p>
                  <p className="text-[10px] text-gray-600">
                    This may take up to ~3 minutes
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div>
        <div className="relative aspect-square min-h-[320px] overflow-hidden rounded-2xl border border-white/10 bg-black/30">
          {glbUrl ? (
            <MascotViewer
              className="absolute inset-0 h-full w-full"
              modelUrl={glbUrl}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-gray-500">
              <p className="text-sm">
                {step === "generating"
                  ? "Your character will appear here"
                  : "Capture and generate to see your character"}
              </p>
            </div>
          )}
        </div>

        {step === "done" && sessionId && (
          <div className="mt-6 rounded-2xl border border-brand-cyan/40 bg-brand-dark-card/80 p-5">
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Unity / API link
            </p>
            <p className="mt-2 break-all rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-brand-cyan">
              {glbApiUrl}
            </p>
            <p className="mt-2 text-xs text-gray-500">
              GET this URL to receive a signed GLB URL (valid 1 hour). Poll in
              Unity to refresh when needed.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
