/**
 * Owner-curated overrides for the daily target.
 *
 * Key = puzzle date (YYYY-MM-DD). Value = the pointercrate demon `id` (its
 * stable numeric id, not its list `position` — positions drift as the list
 * moves, ids don't). Run `npm run list-pool` to print every current
 * top-150 demon as "id  position  name" so you can look one up.
 *
 * Any date left out falls back to the normal date-seeded random pick. If an
 * id here has since dropped out of the top 150, it's also ignored and falls
 * back — the id must be in the current pool for the override to take effect.
 */
export const SCHEDULE: Record<string, number> = {
  "2026-08-04": 646,
  "2026-08-05": 547,
  "2026-08-06": 577,
  "2026-08-07": 428,
  "2026-08-08": 425,
  "2026-08-09": 629,
  "2026-08-10": 599,
  "2026-08-11": 429,
  "2026-08-12": 274,
  "2026-08-13": 555,
  "2026-08-14": 649,
  "2026-08-15": 670,
  "2026-08-16": 617,
  "2026-08-17": 668,
};
