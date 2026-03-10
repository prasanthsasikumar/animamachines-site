"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MascotViewer } from "@/components/MascotViewer";

type Character = {
  id: string;
  name: string;
  storage_path: string;
  created_at: string;
};

type CharactersListProps = {
  characters: Character[];
};

export function CharactersList({ characters }: CharactersListProps) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {characters.map((c) => (
        <CharacterCard key={c.id} character={c} />
      ))}
    </div>
  );
}

function CharacterCard({ character }: { character: Character }) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/characters/signed-url?path=${encodeURIComponent(character.storage_path)}`
        );
        const data = await res.json();
        if (!cancelled && res.ok && data.url) {
          setSignedUrl(data.url);
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [character.storage_path]);

  return (
    <Link
      href={`/characters/${character.id}`}
      className="block overflow-hidden rounded-2xl border border-white/10 bg-brand-dark-card/80 transition-transform hover:-translate-y-1 hover:border-brand-cyan/40"
    >
      <div className="relative aspect-square min-h-[200px] bg-black/30">
        {signedUrl ? (
          <MascotViewer
            className="absolute inset-0 h-full w-full"
            modelUrl={signedUrl}
          />
        ) : loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-purple border-t-transparent" />
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-gray-500 text-sm">
            Failed to load
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-display font-semibold text-white">
          {character.name}
        </h3>
        <p className="mt-1 text-xs text-gray-500">
          {new Date(character.created_at).toLocaleDateString()}
        </p>
        <p className="mt-2 text-[11px] font-medium text-brand-cyan">
          Click to view larger & download
        </p>
      </div>
    </Link>
  );
}
