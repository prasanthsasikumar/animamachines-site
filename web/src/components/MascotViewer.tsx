"use client";

import { useEffect, useId, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

type MascotViewerProps = {
  className?: string;
  modelUrl?: string;
};

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

export function MascotViewer({
  className,
  modelUrl = "/mascot.glb",
}: MascotViewerProps) {
  const viewerId = useId();
  const viewerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorText, setErrorText] = useState<string | null>(null);

  useEffect(() => {
    const viewer = viewerRef.current;
    const canvas = canvasRef.current;
    if (!viewer || !canvas) return;

    let raf = 0;
    let interval: number | undefined;
    const reducedMotion = prefersReducedMotion();

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 100);

    // Lighting (purple key + cyan fill + soft rim)
    scene.add(new THREE.HemisphereLight(0x8b5cf6, 0x06b6d4, 0.6));

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
    keyLight.position.set(2, 4, 3);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x22d3ee, 0.8);
    fillLight.position.set(-3, 2, 1);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xa78bfa, 0.6);
    rimLight.position.set(0, -1, -3);
    scene.add(rimLight);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.minPolarAngle = Math.PI * 0.25;
    controls.maxPolarAngle = Math.PI * 0.75;
    controls.autoRotate = !reducedMotion;
    controls.autoRotateSpeed = 1.2;

    const resizeRenderer = () => {
      const w = viewer.clientWidth;
      const h = viewer.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };

    const resizeObs = new ResizeObserver(resizeRenderer);
    resizeObs.observe(viewer);

    const funnyMessages = [
      "Rendering emotions… please hold.",
      "Not just an AI — this one has vibes.",
      "Calculating the perfect eyebrow raise…",
      "404: Poker face not found.",
      "Lip-sync calibrated. Karaoke mode: ON.",
      "No uncanny valley. Only vibes valley.",
    ];

    const msgWrap = viewer.querySelector<HTMLElement>("[data-mascot-msg-wrap]");
    const msgEl = viewer.querySelector<HTMLElement>("[data-mascot-msg]");
    let msgIndex = 0;

    const showMessage = (text: string) => {
      if (!msgWrap || !msgEl) return;
      msgWrap.style.opacity = "0";
      window.setTimeout(() => {
        msgEl.textContent = text;
        msgWrap.style.opacity = "1";
      }, 250);
    };

    const clock = new THREE.Clock();
    let mixer: THREE.AnimationMixer | null = null;
    let currentAction: THREE.AnimationAction | null = null;
    let clips: THREE.AnimationClip[] = [];
    let playing = true;

    const setPlaying = (next: boolean) => {
      playing = next;
      if (!playing) {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        return;
      }
      if (!raf) animate();
    };

    const onVisibility = () => setPlaying(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVisibility);

    const playClip = (index: number) => {
      if (!mixer || clips.length === 0) return;
      const clip = clips[index];
      const action = mixer.clipAction(clip);
      if (currentAction && currentAction !== action) currentAction.fadeOut(0.6);
      action.reset().setEffectiveWeight(1).fadeIn(0.6).play();
      currentAction = action;

      showMessage(funnyMessages[msgIndex % funnyMessages.length]);
      msgIndex += 1;
    };

    const loader = new GLTFLoader();
    loader.load(
      modelUrl,
      (gltf) => {
        const model = gltf.scene;
        scene.add(model);

        // Auto-fit camera to bounding box
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const fovRad = (camera.fov * Math.PI) / 180;
        const dist = (maxDim / 2 / Math.tan(fovRad / 2)) * 1.6;

        camera.position.set(center.x, center.y + size.y * 0.05, center.z + dist);
        camera.lookAt(center);
        controls.target.copy(center);
        controls.update();

        resizeRenderer();
        setStatus("ready");

        clips = gltf.animations ?? [];
        if (clips.length > 0 && !reducedMotion) {
          mixer = new THREE.AnimationMixer(model);
          playClip(0);
          interval = window.setInterval(() => {
            const next = (Math.floor(msgIndex) + 1) % clips.length;
            playClip(next);
          }, 4000);
        }

        animate();
      },
      undefined,
      (err) => {
        console.error("GLB load error:", err);
        setStatus("error");
        setErrorText("Failed to load mascot");
      },
    );

    // Pause rendering if offscreen to avoid mobile GPU burn.
    const io = new IntersectionObserver(
      (entries) => {
        const isVisible = entries.some((e) => e.isIntersecting);
        setPlaying(isVisible && document.visibilityState === "visible");
      },
      { threshold: 0.05 },
    );
    io.observe(viewer);

    function animate() {
      raf = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      if (mixer) mixer.update(delta);
      controls.update();
      renderer.render(scene, camera);
    }

    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      if (interval) window.clearInterval(interval);
      if (raf) cancelAnimationFrame(raf);
      resizeObs?.disconnect();
      controls.dispose();
      renderer.dispose();
    };
  }, [modelUrl, viewerId]);

  return (
    <div className={className} ref={viewerRef} data-mascot-viewer={viewerId}>
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      {status !== "ready" ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {status === "loading" ? (
            <>
              <div className="mb-3 h-8 w-8 animate-spin rounded-full border-2 border-brand-purple border-t-transparent" />
              <p className="text-xs text-gray-500">Loading mascot…</p>
            </>
          ) : (
            <p className="px-4 text-center text-xs text-red-400">
              {errorText ?? "Something went wrong"}
            </p>
          )}
        </div>
      ) : null}

      {/* Message bubble */}
      <div
        className="pointer-events-none absolute bottom-5 left-3 right-3 flex justify-center opacity-0 transition-opacity duration-500"
        data-mascot-msg-wrap
      >
        <span
          className="rounded-full border border-white/10 bg-black/50 px-3 py-1.5 text-center text-xs font-medium leading-snug text-white/80 backdrop-blur"
          data-mascot-msg
        />
      </div>

      {/* Bottom sparkle line */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-cyan/50 to-transparent" />
      {/* Corner dots */}
      <div className="pointer-events-none absolute left-3 top-3 h-2 w-2 rounded-full bg-brand-purple/60" />
      <div className="pointer-events-none absolute right-3 top-3 h-2 w-2 rounded-full bg-brand-cyan/60" />
    </div>
  );
}

