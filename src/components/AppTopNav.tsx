import type React from "react";
import Image from "next/image";
import Link from "next/link";
import { NavAuthLinks } from "@/components/NavAuthLinks";

type AppTopNavProps = {
  right?: React.ReactNode;
};

export function AppTopNav({ right }: AppTopNavProps) {
  return (
    <nav className="sticky top-0 z-40 border-b border-white/5 bg-brand-dark/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="group flex items-center gap-2">
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
        </Link>

        <div className="hidden items-center gap-6 text-sm font-medium md:flex">
          {right}
          <NavAuthLinks variant="desktop" />
        </div>

        <div className="md:hidden">
          <NavAuthLinks variant="mobile" />
        </div>
      </div>
    </nav>
  );
}

