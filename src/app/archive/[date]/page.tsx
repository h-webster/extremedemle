import { notFound } from "next/navigation";
import PlayGame from "@/components/game/PlayGame";
import { puzzleNumber, todayUTC } from "@/lib/daily";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const LAUNCH_DATE = "2026-08-04";

export default async function ArchivePuzzlePage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;

  // Upper bound is deliberately todayUTC() rather than "yesterday": a player's local
  // calendar date (which drives what counts as "today") can run up to a day ahead of
  // UTC, so a date equal to UTC-today can still be a legitimately past day for them.
  if (!DATE_PATTERN.test(date) || date < LAUNCH_DATE || date > todayUTC()) {
    notFound();
  }

  return <PlayGame date={date} puzzleNumber={puzzleNumber(date)} isToday={false} />;
}
