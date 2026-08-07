import { NextRequest, NextResponse } from "next/server";
import { recordCompletion } from "@/lib/completions";
import { getDailyTarget, todayUTC } from "@/lib/daily";
import { buildFullReveal, buildHints } from "@/lib/hints";
import { MAX_GUESSES, type GuessResponse } from "@/types/game";

interface GuessBody {
  guessLevelId?: number;
  guessNumber?: number;
  date?: string;
}

export async function POST(request: NextRequest) {
  let body: GuessBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { guessLevelId, guessNumber, date } = body;

  if (typeof guessLevelId !== "number") {
    return NextResponse.json({ error: "guessLevelId is required" }, { status: 400 });
  }
  if (!guessNumber || guessNumber < 1 || guessNumber > MAX_GUESSES) {
    return NextResponse.json(
      { error: `guessNumber must be between 1 and ${MAX_GUESSES}` },
      { status: 400 }
    );
  }

  const resolvedDate = date ?? todayUTC();
  const { target, pool } = await getDailyTarget(resolvedDate);
  const guessed = pool.find((demon) => demon.id === guessLevelId);

  if (!guessed) {
    return NextResponse.json({ error: "Unknown level for today's pool" }, { status: 400 });
  }

  const correct = guessed.id === target.id;
  const positionDirection = correct
    ? "correct"
    : target.position < guessed.position
      ? "harder"
      : "easier";

  const hints = await buildHints(target, guessNumber);
  const gameOver = correct || guessNumber >= MAX_GUESSES;

  const response: GuessResponse = {
    correct,
    guessNumber,
    guessedLevel: {
      id: guessed.id,
      name: guessed.name,
      position: guessed.position,
    },
    positionDirection,
    hints,
    gameOver,
    ...(gameOver
      ? {
          reveal: await buildFullReveal(target),
          completionStats: await recordCompletion(resolvedDate, correct),
        }
      : {}),
  };

  return NextResponse.json(response);
}
