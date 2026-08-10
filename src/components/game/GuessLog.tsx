import type { GuessResponse } from "@/types/game";

function DirectionLabel({ guess }: { guess: GuessResponse }) {
  if (guess.correct) {
    return <span className="text-[12px] font-semibold text-correct">Correct</span>;
  }
  const harder = guess.positionDirection === "harder";
  return (
    <span className="text-[12px] text-text-secondary">
      {harder ? "↑ ranks harder" : "↓ ranks easier"}
    </span>
  );
}

export default function GuessLog({ guesses }: { guesses: GuessResponse[] }) {
  

  return (
    <ol className="border-t border-border">
      {[...guesses].reverse().map((guess) => (
        <li
          key={guess.guessNumber}
          className="flex items-center justify-between gap-4 border-b border-border py-2.5"
        >
          <div className="flex min-w-0 items-center gap-3">
            <span className="text-[12px] text-text-muted">{guess.guessNumber}.</span>
            <span className="truncate text-[14px] font-medium text-text-primary">
              {guess.guessedLevel.name}
            </span>
          </div>
          <DirectionLabel guess={guess} />
        </li>
      ))}
    </ol>
  );
}
