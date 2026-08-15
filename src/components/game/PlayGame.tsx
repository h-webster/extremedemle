"use client";

import { useEffect, useMemo, useState } from "react";
import GuessInput from "@/components/game/GuessInput";
import GuessLog from "@/components/game/GuessLog";
import HintPanel from "@/components/game/HintPanel";
import ResultPanel from "@/components/game/ResultPanel";
import { DiamondGlyph } from "@/components/game/glyphs";
import { puzzleNumber as computePuzzleNumber, todayLocal } from "@/lib/daily";
import { getGameState, recordResult, saveGameState } from "@/lib/storage";
import { MAX_GUESSES, type GuessResponse, type LevelOption, type StoredGameState } from "@/types/game";

interface PlayGameProps {
  /** Fixed date for archive replays. Omit for "today" — resolved client-side from the player's local calendar date. */
  date?: string;
  puzzleNumber?: number;
  isToday?: boolean;
}

export default function PlayGame({ date: fixedDate, puzzleNumber: fixedPuzzleNumber, isToday = true }: PlayGameProps) {
  const [date, setDate] = useState<string | null>(fixedDate ?? null);
  const [guesses, setGuesses] = useState<GuessResponse[]>([]);
  const [status, setStatus] = useState<StoredGameState["status"]>("playing");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const resolvedDate = fixedDate ?? todayLocal();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time client hydration: resolves the local "today" and reads localStorage
    setDate(resolvedDate);
    const stored = getGameState(resolvedDate);
    if (stored) {
      setGuesses(stored.guesses);
      setStatus(stored.status);
    }
    setHydrated(true);
  }, [fixedDate]);

  const excludeIds = useMemo(
    () => new Set(guesses.map((g) => g.guessedLevel.id)),
    [guesses]
  );

  async function handleGuess(option: LevelOption) {
    if (!date || status !== "playing" || submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/guess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guessLevelId: option.id,
          guessNumber: guesses.length + 1,
          date,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Something went wrong submitting that guess.");
        return;
      }
      const data: GuessResponse = await res.json();
      const nextGuesses = [...guesses, data];
      const nextStatus: StoredGameState["status"] = data.correct
        ? "won"
        : data.gameOver
          ? "lost"
          : "playing";

      saveGameState({ date, guesses: nextGuesses, status: nextStatus });
      if (nextStatus !== "playing") {
        recordResult(date, nextStatus === "won", nextGuesses.length);
      }
      setGuesses(nextGuesses);
      setStatus(nextStatus);
    } catch {
      setError("Network error — check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const latestHints = guesses[guesses.length - 1]?.hints;
  const guessesLeft = MAX_GUESSES - guesses.length;

  if (!hydrated || !date) {
    return <div className="py-20 text-center text-text-muted">Loading&hellip;</div>;
  }

  const puzzleNum = fixedPuzzleNumber ?? computePuzzleNumber(date);

  return (
    <div className="mx-auto w-full max-w-xl flex-1 px-4 pb-16">
      <div className="flex items-baseline justify-between border-b border-border py-5">
        <div>
          <p className="text-[12px] text-text-muted">Puzzle #{puzzleNum}</p>
          <h1 className="text-lg font-semibold text-text-primary">
            {isToday ? "Name today’s extreme demon" : "Name this puzzle’s extreme demon"}
          </h1>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span className="text-[13px] text-text-secondary">
            {status === "playing" ? `${guessesLeft} left` : `${guesses.length}/6 used`}
          </span>
          <div className="flex items-center gap-1" aria-hidden="true">
            {Array.from({ length: MAX_GUESSES }).map((_, i) => (
              <DiamondGlyph
                key={i}
                filled={i < guesses.length}
                className={i < guesses.length ? "anim-pip-pop text-accent" : "text-border"}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6 py-6">
        {status === "playing" && (
          <div>
            <GuessInput disabled={submitting} excludeIds={excludeIds} onSubmit={handleGuess} />
            {error && <p className="mt-2 text-[13px] text-danger">{error}</p>}
          </div>
        )}

        {status !== "playing" && (
          <ResultPanel guesses={guesses} status={status} puzzleNumber={puzzleNum} />
        )}

        <HintPanel hints={latestHints} attemptsMade={guesses.length} />

        <GuessLog guesses={guesses} />
      </div>
    </div>
  );
}
