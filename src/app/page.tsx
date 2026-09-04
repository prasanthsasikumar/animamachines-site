import Image from "next/image";
import { MascotViewer } from "@/components/MascotViewer";
import { ShowcaseGallery } from "@/components/showcase/ShowcaseGallery";
import { StatsSection } from "@/components/showcase/StatsSection";
import { GALLERY } from "@/content/showcase-data";

const boothCount = GALLERY.filter((g) => g.kind === "booth-session").length;
const studioCount = GALLERY.length - boothCount;

const FEATURES = [
  {
    title: "Instant Personality",
    desc: "Configure how the avatar sounded, acted, and reacted. Dozens of voice presets, or bring your own.",
    tone: "bg-brand-purple/15 text-brand-purple group-hover:bg-brand-purple/25",
    icon: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z",
  },
  {
    title: "Multilingual",
    desc: "50+ languages with synced lip movements. The avatar spoke the world's languages, naturally.",
    tone: "bg-brand-cyan/15 text-brand-cyan group-hover:bg-brand-cyan/25",
    icon: "M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802",
  },
  {
    title: "Behavior Engine",
    desc: "Triggers for \u201chappy,\u201d \u201cthinking,\u201d or \u201cconfused\u201d states. The avatar responded emotionally in real time.",
    tone: "bg-purple-500/15 text-purple-400 group-hover:bg-purple-500/25",
    icon: "M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z",
  },
  {
    title: "LLM Agnostic",
    desc: "Connected to OpenAI, Claude, Gemini, or a local model. Anima played nicely with any brain you chose.",
    tone: "bg-cyan-400/15 text-cyan-300 group-hover:bg-cyan-400/25",
    icon: "M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-brand-dark text-gray-200">
      <header className="border-b border-white/10 px-6 py-5">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <a href="#top" className="group flex items-center gap-2">
            <Image
              src="/animamachinesMascot.png"
              alt="Anima Machines mascot"
              width={36}
              height={36}
              priority
              className="h-9 w-9 rounded-xl object-cover shadow-lg shadow-brand-purple/30"
            />
            <span className="font-display text-xl font-semibold tracking-tight text-white">
              Anima<span className="text-gradient">Machines</span>
            </span>
          </a>
          <nav className="flex items-center gap-6 text-sm font-medium text-gray-400">
            <a href="#capabilities" className="transition-colors hover:text-white">
              What it did
            </a>
            <a href="#gallery" className="transition-colors hover:text-white">
              Gallery
            </a>
            <a href="#numbers" className="transition-colors hover:text-white">
              Numbers
            </a>
          </nav>
        </div>
      </header>

      {/* LETTER */}
      <section id="top" className="relative overflow-hidden">
        <div className="hero-blob left-[-10%] top-[-20%] h-[500px] w-[500px] bg-brand-purple" />
        <div className="hero-blob bottom-[-10%] right-[-5%] h-[400px] w-[400px] bg-brand-cyan" />

        <div className="relative mx-auto grid max-w-7xl items-start gap-12 px-6 pb-16 pt-20 sm:pt-28 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-16">
        <div className="max-w-3xl">
          <span className="badge-shimmer mb-8 inline-block rounded-full px-4 py-1 text-xs font-semibold text-white">
            Closed · 2026
          </span>

          <h1 className="mb-10 font-display text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
            Thank you, and <span className="text-gradient">goodbye</span>.
          </h1>

          <div className="space-y-6 text-lg leading-relaxed text-gray-300">
            <p>Hi,</p>

            <p>
              Anima Machines has shut down. The servers are off, the database is gone, and the
              sign-up button is no more. This page is what remains: a short note on what it was,
              and a gallery of what people made with it.
            </p>

            <p>
              <strong className="text-white">What it was.</strong> Anima Machines let you turn a
              photo of yourself into an expressive, rigged 3D avatar. The avatar could show
              emotion in real time, speak, and be driven by a language model, so it could stand
              in for you, or for an AI, with a face.
            </p>

            <p>
              <strong className="text-white">Where it came from.</strong> It started as the
              avatar side of <em>emodrink</em>, our paper for Augmented Humans 2026. At the
              conference we ran a live booth: visitors answered a few questions about their
              sleep and mood, got a lookalike avatar generated on the spot, and watched it
              recommend them a drink in English or Japanese. Afterwards the same setup went to
              the NUS Open House, and then it became a thing we mostly played with ourselves.
            </p>

            <p>
              <strong className="text-white">Why it is closing.</strong> Not enough people used
              it, and honestly, not enough motivation on our side to keep it running. Rather than
              let it quietly rot, we are shutting it down properly and leaving this page behind.
            </p>

            <p>
              <strong className="text-white">Thank you.</strong> To everyone who signed up and
              tried it, everyone who came by our booths, stood in front of a camera for a
              stranger, and laughed at the avatar that came out: thank you. Those were the fun
              moments, and they were the whole point.
            </p>

            <p>
              Every avatar and booth session that was ever completed is below. The 3D models and
              photos are static files and stay downloadable for as long as this page stays up.
            </p>

            <p className="pt-2 text-gray-400">
              With thanks,
              <br />
              <span className="text-white">The Anima Machines team</span>
            </p>
          </div>
        </div>

        <div className="flex justify-center lg:sticky lg:top-24 lg:justify-end">
          <div className="relative animate-float motion-reduce:animate-none">
            <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-brand-purple/20 to-brand-cyan/20 blur-2xl" />
            <div className="relative h-96 w-80 overflow-hidden rounded-[2rem] border border-white/10 bg-brand-dark-card shadow-2xl animate-pulse-glow sm:h-[440px] sm:w-[360px]">
              <MascotViewer className="absolute inset-0" />
            </div>
          </div>
        </div>
        </div>
      </section>

      {/* CAPABILITIES */}
      <section id="capabilities" className="relative py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-cyan">Capabilities</p>
            <h2 className="mb-5 font-display text-4xl font-bold text-white sm:text-5xl">What an Anima could do</h2>
            <p className="text-lg leading-relaxed text-gray-400">
              From lip-synced speech in 50+ languages to nuanced emotional states, the idea was to make an AI feel{" "}
              <em>alive</em>. Here is what the platform offered while it ran.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="feature-card group rounded-2xl border border-white/5 bg-brand-dark-card/60 p-7 backdrop-blur"
              >
                <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl transition-colors ${f.tone}`}>
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d={f.icon} />
                  </svg>
                </div>
                <h3 className="mb-2 font-display text-lg font-semibold text-white">{f.title}</h3>
                <p className="text-sm leading-relaxed text-gray-400">{f.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 flex flex-col items-center gap-6 rounded-2xl border border-white/5 bg-gradient-to-r from-brand-purple/10 via-brand-dark-card to-brand-cyan/10 p-8 sm:flex-row sm:p-10">
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-purple to-brand-cyan shadow-lg shadow-brand-purple/20">
              <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            </div>
            <div>
              <h3 className="mb-1 font-display text-lg font-semibold text-white">Real-Time Streaming</h3>
              <p className="max-w-xl text-sm leading-relaxed text-gray-400">
                Sub-200ms latency from text to animated speech, powered by a custom WebGL engine. The avatar responded
                faster than a blink.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* GALLERY */}
      <section className="mx-auto max-w-6xl px-6 pt-10">
        <h2 className="mb-2 font-display text-2xl font-bold text-white">What people made</h2>
        <p className="text-sm text-gray-500">
          {studioCount} studio avatars and {boothCount} Augmented Humans 2026 booth sessions.
          Click any card to spin it around in 3D, or use the icons to download the model and
          photo.
        </p>
      </section>
      <ShowcaseGallery />

      <StatsSection />

      <footer className="border-t border-white/10 px-6 py-12 text-center text-sm text-gray-500">
        Anima Machines, 2026. Built with more enthusiasm than users, and no regrets.
      </footer>
    </div>
  );
}
