"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { MascotViewer } from "@/components/MascotViewer";
import { NavAuthLinks } from "@/components/NavAuthLinks";

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

export function MarketingPage() {
  const reducedMotion = useReducedMotion();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  useEffect(() => {
    if (reducedMotion) return;
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (els.length === 0) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15 },
    );
    for (const el of els) io.observe(el);
    return () => io.disconnect();
  }, [reducedMotion]);

  return (
    <div className="min-h-screen bg-brand-dark text-gray-200 overflow-x-hidden">
      {/* NAV */}
      <nav
        style={{ top: "var(--sunset-banner-h, 0px)" }}
        className={[
          "fixed w-full z-50 transition-all duration-300",
          scrolled ? "bg-brand-dark/90 backdrop-blur-xl shadow-lg shadow-black/20" : "",
        ].join(" ")}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <a href="#top" className="group flex items-center gap-2">
            <Image
              src="/animamachinesMascot.png"
              alt="Anima Machines mascot"
              width={36}
              height={36}
              priority
              className="h-9 w-9 rounded-xl object-cover shadow-lg shadow-brand-purple/30 transition-shadow group-hover:shadow-brand-cyan/40"
            />
            <span className="font-display text-xl font-semibold tracking-tight text-white">
              Anima<span className="text-gradient">Machines</span>
            </span>
          </a>

          <div className="hidden items-center gap-8 text-sm font-medium md:flex">
            <a href="#features" className="text-gray-400 transition-colors hover:text-white">
              Features
            </a>
            <a href="#about" className="text-gray-400 transition-colors hover:text-white">
              About
            </a>
            <NavAuthLinks variant="desktop" />
          </div>

          <button
            type="button"
            className="text-gray-400 transition-colors hover:text-white md:hidden"
            aria-label="Toggle menu"
            aria-controls="mobile-menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        <div
          id="mobile-menu"
          className={[
            "md:hidden border-t border-white/5 bg-brand-dark/95 backdrop-blur-xl",
            menuOpen ? "block" : "hidden",
          ].join(" ")}
        >
          <div className="flex flex-col gap-4 px-6 py-4 text-sm font-medium">
            {[
              ["#features", "Features"],
              ["#about", "About"],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="py-2 text-gray-400 transition-colors hover:text-white"
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </a>
            ))}
            <NavAuthLinks variant="mobile" onLinkClick={() => setMenuOpen(false)} />
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section id="top" className="relative flex min-h-[100svh] items-center overflow-hidden pt-20">
        <div className="hero-blob left-[-10%] top-[-10%] h-[500px] w-[500px] bg-brand-purple" />
        <div className="hero-blob bottom-[-5%] right-[-5%] h-[400px] w-[400px] bg-brand-cyan" />
        <div className="hero-blob left-[50%] top-[40%] h-[300px] w-[300px] bg-purple-600" />

        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />

        <div className="relative mx-auto w-full max-w-7xl px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-8">
            <div className="max-w-xl">
              <h1 className="mb-6 font-display text-5xl font-bold leading-[1.08] tracking-tight text-white sm:text-6xl lg:text-7xl">
                Give Your AI <br />
                <span className="text-gradient">a Soul - </span>
                <br />
                and a Face.
              </h1>

              <p className="mb-10 max-w-lg text-lg leading-relaxed text-gray-400 sm:text-xl">
                Stop talking to faceless text boxes. Create expressive, cartoon-style avatars with real-time emotions,
                voice synthesis, and personality — in minutes.
              </p>

              <div className="flex flex-col gap-4 sm:flex-row">
                <a
                  href="/auth/signup"
                  className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-purple to-brand-cyan px-8 py-4 text-base font-semibold text-white shadow-xl shadow-brand-purple/30 transition-all hover:scale-[1.03] hover:shadow-brand-purple/50"
                >
                  Create Your Anima
                  <svg
                    className="h-5 w-5 transition-transform group-hover:translate-x-1"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </a>
                <a
                  href="https://youtu.be/YKkao6rQCYY"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-8 py-4 text-base font-semibold text-white transition-all hover:bg-white/10"
                >
                  <svg className="h-5 w-5 text-brand-cyan" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Watch Demo
                </a>
              </div>

              <div className="mt-12 flex items-center gap-6 text-sm text-gray-500">
                <div className="flex -space-x-2">
                  {["from-purple-400 to-pink-400", "from-cyan-400 to-blue-400", "from-green-400 to-teal-400", "from-orange-400 to-yellow-400"].map(
                    (g) => (
                      <div
                        key={g}
                        className={`h-8 w-8 rounded-full border-2 border-brand-dark bg-gradient-to-br ${g}`}
                      />
                    ),
                  )}
                </div>
                <span>
                  <strong className="text-gray-300">2,400+</strong> creators in the early access
                </span>
              </div>
            </div>

            <div className="flex justify-center lg:justify-end">
              <div className={reducedMotion ? "relative" : "relative animate-float"}>
                <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-brand-purple/20 to-brand-cyan/20 blur-2xl" />
                <div className="relative h-96 w-80 overflow-hidden rounded-[2rem] border border-white/10 bg-brand-dark-card shadow-2xl sm:h-[440px] sm:w-[360px] animate-pulse-glow">
                  <MascotViewer className="absolute inset-0" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path
              d="M0 80L48 72C96 64 192 48 288 42.7C384 37 480 43 576 48C672 53 768 59 864 56C960 53 1056 43 1152 40C1248 37 1344 43 1392 46L1440 48V80H0Z"
              fill="#0F0B1E"
            />
          </svg>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="relative py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto mb-16 max-w-2xl text-center reveal" data-reveal>
            <p className="mb-3 text-sm font-semibold tracking-widest text-brand-cyan uppercase">Capabilities</p>
            <h2 className="mb-5 font-display text-4xl font-bold text-white sm:text-5xl">Everything Your Avatar Needs</h2>
            <p className="text-lg leading-relaxed text-gray-400">
              From lip-synced speech in 50+ languages to nuanced emotional states — Anima Machines makes your AI feel{" "}
              <em>alive</em>.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "Instant Personality",
                desc: "Configure how your avatar sounds, acts, and reacts. Choose from dozens of voice presets or bring your own.",
                tone: "bg-brand-purple/15 text-brand-purple group-hover:bg-brand-purple/25",
                icon: (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z"
                  />
                ),
              },
              {
                title: "Multilingual",
                desc: "50+ languages with perfectly synced lip movements. Your avatar speaks the world's languages — naturally.",
                tone: "bg-brand-cyan/15 text-brand-cyan group-hover:bg-brand-cyan/25",
                icon: (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802"
                  />
                ),
              },
              {
                title: "Behavior Engine",
                desc: "Set triggers for “happy,” “thinking,” or “confused” states. Your avatar responds emotionally in real-time.",
                tone: "bg-purple-500/15 text-purple-400 group-hover:bg-purple-500/25",
                icon: (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                  />
                ),
              },
              {
                title: "LLM Agnostic",
                desc: "Connect to OpenAI, Claude, Gemini, or your own local model. Anima plays nicely with any brain you choose.",
                tone: "bg-cyan-400/15 text-cyan-300 group-hover:bg-cyan-400/25",
                icon: (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
                  />
                ),
              },
            ].map((f) => (
              <div
                key={f.title}
                className="feature-card group rounded-2xl border border-white/5 bg-brand-dark-card/60 p-7 backdrop-blur reveal"
                data-reveal
              >
                <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl transition-colors ${f.tone}`}>
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    {f.icon}
                  </svg>
                </div>
                <h3 className="mb-2 font-display text-lg font-semibold text-white">{f.title}</h3>
                <p className="text-sm leading-relaxed text-gray-400">{f.desc}</p>
              </div>
            ))}
          </div>

          <div
            className="mt-12 flex flex-col items-center gap-6 rounded-2xl border border-white/5 bg-gradient-to-r from-brand-purple/10 via-brand-dark-card to-brand-cyan/10 p-8 sm:flex-row sm:p-10 reveal"
            data-reveal
          >
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-purple to-brand-cyan shadow-lg shadow-brand-purple/20">
              <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            </div>
            <div>
              <h3 className="mb-1 font-display text-lg font-semibold text-white">Real-Time Streaming</h3>
              <p className="max-w-xl text-sm leading-relaxed text-gray-400">
                Sub-200ms latency from text to animated speech. Powered by our proprietary WebGL engine, your avatar responds faster than a blink.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="relative py-24 sm:py-32">
        <div className="absolute top-0 left-1/2 h-px w-48 -translate-x-1/2 bg-gradient-to-r from-transparent via-brand-cyan/40 to-transparent" />
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <div className="reveal" data-reveal>
              <p className="mb-3 text-sm font-semibold tracking-widest text-brand-cyan uppercase">About Us</p>
              <h2 className="mb-6 font-display text-4xl font-bold leading-tight text-white sm:text-5xl">
                The Future of <br />
                <span className="text-gradient">Embodied AI</span>
              </h2>
              <div className="space-y-5 leading-relaxed text-gray-400">
                <p>
                  We believe AI should not live behind a blinking cursor. It should have presence — a face that lights up when it understands you, eyebrows that furrow when it is thinking hard, and a voice that actually sounds like someone.
                </p>
                <p>
                  Anima Machines is building the real-time animation and voice synthesis layer that sits between any LLM and the humans who talk to it. Think of us as the soul engine for the next generation of AI interfaces.
                </p>
                <p>
                  Our proprietary WebGL rendering pipeline achieves sub-200ms end-to-end latency, making conversations feel truly natural. We handle everything from phoneme extraction and emotion classification to skeletal animation and shader rendering.
                </p>
              </div>

              <div className="mt-8 flex flex-wrap gap-4">
                <a
                  href="https://youtu.be/YKkao6rQCYY"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2 text-sm font-semibold text-brand-cyan transition-colors hover:text-white"
                >
                  Watch it in action
                  <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </a>
                <a
                  href="https://dl.acm.org/doi/full/10.1145/3795011.3797399"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2 text-sm font-semibold text-brand-cyan transition-colors hover:text-white"
                >
                  Read the peer-reviewed research
                  <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </a>
              </div>
            </div>

            <div className="reveal" data-reveal>
              <div className="rounded-2xl border border-white/5 bg-gradient-to-br from-brand-dark-card to-brand-dark-surface p-8 sm:p-10">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-purple/20 to-brand-cyan/20">
                  <svg className="h-7 w-7 text-brand-cyan" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                  </svg>
                </div>
                <h3 className="mb-3 font-display text-2xl font-semibold text-white">Partner With Us</h3>
                <p className="mb-6 leading-relaxed text-gray-400">
                  We are seeking <strong className="text-white">strategic partners</strong> and{" "}
                  <strong className="text-white">seed-stage investors</strong> who share our vision of making AI interactions more human. Help us scale our real-time animation engine to millions of users.
                </p>
                <div className="mb-8 grid grid-cols-2 gap-4">
                  {[
                    ["2.4k+", "Early Adopters"],
                    ["<200ms", "End-to-End Latency"],
                    ["50+", "Languages"],
                    ["4", "LLM Integrations"],
                  ].map(([k, v]) => (
                    <div key={k} className="rounded-xl bg-white/5 p-4 text-center">
                      <p className="font-display text-2xl font-bold text-white">{k}</p>
                      <p className="mt-1 text-xs text-gray-500">{v}</p>
                    </div>
                  ))}
                </div>
                <a
                  href="mailto:investors@animamachines.com"
                  className="group inline-flex items-center gap-2 text-sm font-semibold text-brand-cyan transition-colors hover:text-white"
                >
                  investors@animamachines.com
                  <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5 py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-1">
              <a href="#top" className="mb-4 flex items-center gap-2">
                <Image
                  src="/animamachinesMascot.png"
                  alt="Anima Machines mascot"
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-lg object-cover"
                />
                <span className="font-display text-lg font-semibold text-white">
                  Anima<span className="text-gradient">Machines</span>
                </span>
              </a>
              <p className="text-sm leading-relaxed text-gray-500">
                Giving AI a face, a voice, and a personality. Built for humans, powered by imagination.
              </p>
              <p className="mt-3 text-xs leading-relaxed text-gray-600">
                Proudly built in Singapore — where chewing gum is banned but giving AI feelings is apparently fine.
              </p>
            </div>

            {[
              { title: "Product", links: [["#features", "Features"], ["#", "Changelog"]] },
              { title: "Developers", links: [["#", "Documentation"], ["#", "API Reference"], ["#", "SDK & Libraries"], ["#", "Status"]] },
              { title: "Company", links: [["#about", "About"], ["mailto:investors@animamachines.com", "Investors"], ["mailto:hello@animamachines.com", "Contact"]] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="mb-4 font-display text-sm font-semibold text-white">{col.title}</h4>
                <ul className="space-y-2.5 text-sm text-gray-500">
                  {col.links.map(([href, label]) => (
                    <li key={label}>
                      <a href={href} className="transition-colors hover:text-white">
                        {label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 sm:flex-row">
            <p className="text-xs text-gray-600">&copy; 2026 Anima Machines. All rights reserved.</p>
            <div className="flex items-center gap-5">
              {[
                ["Twitter", "#"],
                ["GitHub", "#"],
                ["Discord", "#"],
              ].map(([label, href]) => (
                <a key={label} href={href} className="text-gray-600 transition-colors hover:text-white" aria-label={label}>
                  <span className="sr-only">{label}</span>
                  <div className="h-5 w-5 rounded bg-white/5" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

