"use client";

import type React from "react";
import Image from "next/image";
import Link from "next/link";
import { NavAuthLinks } from "@/components/NavAuthLinks";
import { useId, useState } from "react";

type AppTopNavProps = {
  right?: React.ReactNode;
};

export function AppTopNav({ right }: AppTopNavProps) {
  const menuId = useId();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-40 border-b border-white/5 bg-brand-dark/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="group flex items-center gap-2"
          onClick={() => setMenuOpen(false)}
        >
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

        <button
          type="button"
          className="md:hidden inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-gray-200 hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan/30"
          aria-expanded={menuOpen}
          aria-controls={menuId}
          onClick={() => setMenuOpen((v) => !v)}
        >
          Menu
        </button>
      </div>

      <div
        id={menuId}
        className={[
          "md:hidden border-t border-white/5 bg-brand-dark/95 backdrop-blur-xl",
          menuOpen ? "block" : "hidden",
        ].join(" ")}
      >
        <div className="mx-auto max-w-7xl px-6 py-4 text-sm font-medium">
          {right ? <div className="mb-3 flex flex-col gap-2">{right}</div> : null}
          <div className="flex flex-col gap-1">
            <NavAuthLinks
              variant="mobile"
              onLinkClick={() => setMenuOpen(false)}
            />
          </div>
        </div>
      </div>
    </nav>
  );
}

