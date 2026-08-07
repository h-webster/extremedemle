"use client";

import { useEffect, useState } from "react";
import type { GuessResponse } from "@/types/game";

interface ResultPanelProps {
  guesses: GuessResponse[];
  status: "won" | "lost";
  puzzleNumber: number;
}

function nextResetLabel(): string {
  const now = new Date();
  // Local midnight, not UTC — the puzzle itself rolls over on the player's
  // local calendar date (see todayLocal() in src/lib/daily.ts), so this
  // countdown needs to agree with that or it'll show the wrong time left.
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const diff = next.getTime() - now.getTime();
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function buildShareText(guesses: GuessResponse[], status: "won" | "lost", puzzle: number) {
  const grid = guesses
    .map((g) => (g.correct ? "🟩" : g.positionDirection === "harder" ? "🟧" : "⬛"))
    .join("");
  const score = status === "won" ? `${guesses.length}/6` : "X/6";
  return `Extreme Demonle #${puzzle} ${score}\n${grid}`;
}

function ThumbnailFrame({
  src,
  videoUrl,
  name,
}: {
  src: string;
  videoUrl: string | null;
  name: string;
}) {
  // eslint-disable-next-line @next/next/no-img-element
  const image = <img src={src} alt={`${name} verification thumbnail`} className="aspect-video w-full object-cover" />;
  if (!videoUrl) return image;
  return (
    <a href={videoUrl} target="_blank" rel="noreferrer">
      {image}
    </a>
  );
}

export default function ResultPanel({ guesses, status, puzzleNumber }: ResultPanelProps) {
  const [countdown, setCountdown] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client-only clock read, avoids SSR/client mismatch
    setCountdown(nextResetLabel());
    const id = setInterval(() => setCountdown(nextResetLabel()), 1000);
    return () => clearInterval(id);
  }, []);

  const last = guesses[guesses.length - 1];
  const reveal = last?.reveal;
  const completionStats = last?.completionStats;
  if (!reveal) return null;

  async function handleShare() {
    const text = buildShareText(guesses, status, puzzleNumber);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — no-op
    }
  }

  return (
    <div className="border border-border">
      <div className="border-b border-border px-4 py-4">
        <p className={`text-[12px] font-semibold ${status === "won" ? "text-correct" : "text-danger"}`}>
          {status === "won" ? `Solved in ${guesses.length}/6` : "Out of guesses"}
        </p>
        <h2 className="mt-0.5 text-xl font-bold text-text-primary">{reveal.name}</h2>
        <p className="mt-0.5 text-[13px] text-text-secondary">
          #{reveal.position} &middot; {reveal.listTier} &middot; published by {reveal.publisher}{" "}
          &middot; verified by {reveal.verifier}
        </p>
      </div>

      <ThumbnailFrame src={reveal.thumbnailUrl} videoUrl={reveal.videoUrl} name={reveal.name} />

      <div className="px-4 pt-3 text-[13px] text-text-secondary">
        {reveal.tags ? reveal.tags.join(", ") : "No tag data"}
      </div>

      {reveal.song && (
        <p className="px-4 pt-2 text-[13px] text-text-secondary">
          Song &mdash; {reveal.song.name} by {reveal.song.author}
        </p>
      )}

      {completionStats && completionStats.played > 0 && (
        <div className="border-t border-border px-4 py-4 text-center">
          <p className="text-3xl font-bold text-accent">
            {Math.round((completionStats.won / completionStats.played) * 100)}%
          </p>
          <p className="text-[13px] text-text-secondary">of people guessed the level</p>
          <p className="mt-1 text-[11px] text-text-muted">
            ({completionStats.won}/{completionStats.played})
          </p>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
        <div>
          <p className="text-[11px] text-text-muted">Next puzzle in</p>
          <p className="text-[14px] font-medium text-text-primary">{countdown}</p>
        </div>
        <button
          type="button"
          onClick={handleShare}
          className="border border-border px-4 py-2 text-[13px] font-semibold text-text-primary hover:bg-bg-card-hover active:translate-y-px"
        >
          {copied ? "Copied!" : "Share result"}
        </button>
      </div>
    </div>
  );
}
