import Image from "next/image";
import { ShowcaseGallery } from "@/components/showcase/ShowcaseGallery";
import { StatsSection } from "@/components/showcase/StatsSection";
import { GALLERY } from "@/content/showcase-data";

const boothCount = GALLERY.filter((g) => g.kind === "booth-session").length;
const studioCount = GALLERY.length - boothCount;

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

        <div className="relative mx-auto max-w-3xl px-6 pb-16 pt-20 sm:pt-28">
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
