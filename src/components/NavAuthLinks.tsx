"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

type NavAuthLinksProps = {
  onLinkClick?: () => void;
  variant?: "desktop" | "mobile";
};

export function NavAuthLinks({ onLinkClick, variant = "desktop" }: NavAuthLinksProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    onLinkClick?.();
    router.push("/");
    router.refresh();
  }

  if (loading) {
    return variant === "desktop" ? (
      <div className="hidden h-9 w-24 animate-pulse rounded bg-white/5 md:block" />
    ) : null;
  }

  if (user) {
    const avatarUrl =
      (user.user_metadata?.avatar_url as string | undefined) ??
      (user.user_metadata?.picture as string | undefined);

    return (
      <>
        <Link
          href="/character-creation"
          className="text-gray-400 transition-colors hover:text-white"
          onClick={onLinkClick}
        >
          Create
        </Link>
        <Link
          href="/characters"
          className="text-gray-400 transition-colors hover:text-white"
          onClick={onLinkClick}
        >
          My Characters
        </Link>
        <Link
          href="/account"
          className="flex items-center gap-2 text-gray-400 transition-colors hover:text-white"
          onClick={onLinkClick}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              className="h-8 w-8 rounded-full border-2 border-white/10 object-cover"
              width={32}
              height={32}
              referrerPolicy="no-referrer"
            />
          ) : null}
          <span>Account</span>
        </Link>
        <button
          type="button"
          onClick={() => {
            onLinkClick?.();
            void handleLogout();
          }}
          className={variant === "desktop" ? "text-gray-400 transition-colors hover:text-white" : "py-2 text-left text-gray-400 transition-colors hover:text-white"}
        >
          Log out
        </button>
      </>
    );
  }

  return (
    <>
      <Link
        href="/auth/login"
        className="text-gray-400 transition-colors hover:text-white"
        onClick={onLinkClick}
      >
        Log in
      </Link>
      <Link
        href="/auth/signup"
        className={
          variant === "desktop"
            ? "ml-2 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-brand-purple to-brand-cyan px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-purple/25 transition-all hover:scale-105 hover:shadow-brand-purple/50"
            : "mt-2 inline-flex items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-brand-purple to-brand-cyan px-5 py-2.5 text-sm font-semibold text-white"
        }
        onClick={onLinkClick}
      >
        Sign up
        {variant === "desktop" ? (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        ) : null}
      </Link>
    </>
  );
}
