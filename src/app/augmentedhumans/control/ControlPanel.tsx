"use client";

import { useState } from "react";

const COMMANDS = [
  { command: "start", label: "▶ Start Experience", payload: {} },
  { command: "mode", label: "Mode 1", payload: { mode: 1 } },
  { command: "mode", label: "Mode 2", payload: { mode: 2 } },
  { command: "mode", label: "Mode 3", payload: { mode: 3 } },
  { command: "answer", label: "Answer: Yes", payload: { answer: "yes" } },
  { command: "answer", label: "Answer: No", payload: { answer: "no" } },
  { command: "reset", label: "↺ Reset", payload: {} },
  { command: "stop", label: "■ Stop", payload: {} },
  { command: "load_character", label: "🧍 Load Character", payload: {} },
  { command: "mic_on", label: "🎙 Mic On", payload: {} },
  { command: "mic_off", label: "🔇 Mic Off", payload: {} },
] as const;

export function ControlPanel() {
  const [sending, setSending] = useState<string | null>(null);
  const [lastSent, setLastSent] = useState<{
    command: string;
    time: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function send(command: string, payload: Record<string, unknown>, label: string) {
    setSending(label);
    setError(null);
    try {
      const res = await fetch("/api/augmented-humans/commands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command, payload }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Failed to send");
      setLastSent({
        command: `${command}${Object.keys(payload).length ? ` → ${JSON.stringify(payload)}` : ""}`,
        time: new Date().toLocaleTimeString(),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSending(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {COMMANDS.map((c, i) => (
          <button
            key={i}
            type="button"
            disabled={sending !== null}
            onClick={() => send(c.command, { ...c.payload }, c.label)}
            className={`rounded-xl border px-4 py-4 text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 ${
              c.command === "start"
                ? "border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20"
                : c.command === "stop"
                  ? "border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                  : c.command === "reset"
                    ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20"
                    : c.command === "mode"
                      ? "border-brand-cyan/30 bg-brand-cyan/10 text-brand-cyan hover:bg-brand-cyan/20"
                      : c.command === "load_character"
                        ? "border-orange-500/30 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20"
                        : c.command === "mic_on"
                          ? "border-teal-500/30 bg-teal-500/10 text-teal-400 hover:bg-teal-500/20"
                          : c.command === "mic_off"
                            ? "border-gray-500/30 bg-gray-500/10 text-gray-400 hover:bg-gray-500/20"
                            : "border-purple-500/30 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20"
            }`}
          >
            {sending === c.label ? "Sending…" : c.label}
          </button>
        ))}
      </div>

      {lastSent && (
        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-400">
          Last sent: <span className="text-white">{lastSent.command}</span>{" "}
          at <span className="text-gray-300">{lastSent.time}</span>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}
    </div>
  );
}
