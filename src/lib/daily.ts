import { getDailyPool, type PointercrateDemon } from "@/lib/pointercrate";
import { SCHEDULE } from "@/lib/schedule";

/** First day the daily puzzle ran — used only to number puzzles for display ("Puzzle #12"). */
const LAUNCH_DATE = "2026-08-04";

export function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Today's date in whatever timezone the caller is running in. Only meaningful
 * client-side — the server has no notion of a player's timezone, so this must
 * be called from a "use client" component, not during SSR.
 */
export function todayLocal(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function puzzleNumber(dateStr: string = todayUTC()): number {
  const [ly, lm, ld] = LAUNCH_DATE.split("-").map(Number);
  const launch = Date.UTC(ly, lm - 1, ld);
  const [y, m, d] = dateStr.split("-").map(Number);
  const current = Date.UTC(y, m - 1, d);
  const days = Math.round((current - launch) / 86_400_000);
  return Math.max(1, days + 1);
}

/** Deterministic 32-bit hash (djb2) so every player gets the same daily target. */
function seedFromDate(dateStr: string): number {
  let hash = 5381;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash * 33) ^ dateStr.charCodeAt(i);
  }
  return hash >>> 0;
}

export async function getDailyTarget(
  dateStr: string = todayUTC()
): Promise<{ target: PointercrateDemon; pool: PointercrateDemon[] }> {
  const pool = await getDailyPool();

  const scheduledId = SCHEDULE[dateStr];
  if (scheduledId !== undefined) {
    const scheduled = pool.find((demon) => demon.id === scheduledId);
    if (scheduled) {
      return { target: scheduled, pool };
    }
    console.warn(
      `SCHEDULE[${dateStr}] = ${scheduledId}, but that id isn't in the current top-150 pool — falling back to the seeded pick.`
    );
  }

  const index = seedFromDate(dateStr) % pool.length;
  return { target: pool[index], pool };
}
