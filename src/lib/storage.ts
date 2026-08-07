import type { StoredGameState, StoredStats } from "@/types/game";

const STATS_KEY = "demonle:stats";
const GAME_PREFIX = "demonle:game:";

const EMPTY_STATS: StoredStats = {
  played: 0,
  won: 0,
  currentStreak: 0,
  maxStreak: 0,
  guessDistribution: [0, 0, 0, 0, 0, 0],
  lastPlayedDate: null,
};

function isBrowser() {
  return typeof window !== "undefined";
}

export function getStats(): StoredStats {
  if (!isBrowser()) return EMPTY_STATS;
  try {
    const raw = window.localStorage.getItem(STATS_KEY);
    if (!raw) return EMPTY_STATS;
    return { ...EMPTY_STATS, ...(JSON.parse(raw) as StoredStats) };
  } catch {
    return EMPTY_STATS;
  }
}

function saveStats(stats: StoredStats) {
  if (!isBrowser()) return;
  window.localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

export function recordResult(date: string, won: boolean, guessCount: number): StoredStats {
  const stats = getStats();
  if (stats.lastPlayedDate === date) {
    return stats; // already recorded today's result
  }

  const next: StoredStats = {
    ...stats,
    played: stats.played + 1,
    won: stats.won + (won ? 1 : 0),
    currentStreak: won ? stats.currentStreak + 1 : 0,
    lastPlayedDate: date,
    guessDistribution: [...stats.guessDistribution],
  };
  next.maxStreak = Math.max(next.maxStreak, next.currentStreak);
  if (won && guessCount >= 1 && guessCount <= 6) {
    next.guessDistribution[guessCount - 1] += 1;
  }

  saveStats(next);
  return next;
}

export function getGameState(date: string): StoredGameState | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(GAME_PREFIX + date);
    if (!raw) return null;
    return JSON.parse(raw) as StoredGameState;
  } catch {
    return null;
  }
}

export function saveGameState(state: StoredGameState) {
  if (!isBrowser()) return;
  window.localStorage.setItem(GAME_PREFIX + state.date, JSON.stringify(state));
}

export function exportSave(): string {
  if (!isBrowser()) return "{}";
  const dump: Record<string, unknown> = {};
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (key && (key === STATS_KEY || key.startsWith(GAME_PREFIX))) {
      dump[key] = JSON.parse(window.localStorage.getItem(key) as string);
    }
  }
  return JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), data: dump }, null, 2);
}

export function importSave(json: string): { ok: true } | { ok: false; error: string } {
  if (!isBrowser()) return { ok: false, error: "Not in browser" };
  try {
    const parsed = JSON.parse(json) as { data?: Record<string, unknown> };
    if (!parsed.data) return { ok: false, error: "Missing data field" };
    for (const [key, value] of Object.entries(parsed.data)) {
      if (key === STATS_KEY || key.startsWith(GAME_PREFIX)) {
        window.localStorage.setItem(key, JSON.stringify(value));
      }
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not parse save file" };
  }
}

export function resetSave() {
  if (!isBrowser()) return;
  const toRemove: string[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (key && (key === STATS_KEY || key.startsWith(GAME_PREFIX))) {
      toRemove.push(key);
    }
  }
  toRemove.forEach((key) => window.localStorage.removeItem(key));
}
