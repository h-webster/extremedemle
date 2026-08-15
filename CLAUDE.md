# Extremle

A daily Wordle-style guessing game for the Geometry Dash extreme-demon community. Each day there's one secret level, drawn from the top 150 of the [Pointercrate](https://pointercrate.com) demonlist. Players get 6 guesses. Each guess is a full level name (chosen via autocomplete, not typed letter-by-letter), and every guess — right or wrong — reveals a new piece of information about the secret level plus a directional comparison (harder/easier on the list) versus the guess.

**Renamed from "Extreme Demonle" to "Extremle" (2026-08-13, explicit user direction).** Pure branding change — title, nav wordmark, page titles, share text, and package/dev-server identifiers were updated; internal `localStorage`/Redis key prefixes (`demonle:...`) were deliberately left unchanged to preserve existing players' saved stats/streaks and completion counts.

## Implementation status

Scaffolded and playable end-to-end (Next.js App Router, TypeScript, Tailwind v4). The "Assumptions" and "Open questions" sections below were resolved during the build — kept here for history, not as open items:

- Guess mechanic and 6-guess structure: built exactly as assumed below. Hint schedule and data source were later switched from AREDL to Pointercrate — see the "Superseded by explicit user direction (2026-08-05, pointercrate pivot)" note under [Hint schedule](#hint-schedule).
- Puzzle pool: **the top 150 positions on Pointercrate** (`getDailyPool()` in [src/lib/pointercrate.ts](src/lib/pointercrate.ts); main list = 1–75, extended list = 76–150), not the full AREDL list — narrower and much more likely a guesser has heard of the level.
- One puzzle per day, deterministically seeded by date ([src/lib/daily.ts](src/lib/daily.ts)); an `/archive/[date]` route lets players replay any past day using the same target-selection logic. **The date that seeds "today" is the player's own local calendar date, resolved client-side** (`todayLocal()`), not a single global UTC cutoff — see the "day rolls over at local midnight" note under [Game rules](#game-rules).
- The owner can override the auto-picked target for any date — see [Owner curation](#owner-curation).
- `/` **is** the game (no marketing landing page — matches Wordle's own site behavior). There is no `/play` route.
- On finishing a puzzle (win or loss), the result card shows what % of everyone who played that date's puzzle solved it, e.g. "73% of people guessed the level (342/468)" — the one piece of state that's shared across all players. See [Cross-player completion stats](#cross-player-completion-stats).
- Key files: `src/lib/pointercrate.ts` (Pointercrate fetch — position, publisher, verifier, thumbnail, video, all provided directly by their API), `src/lib/aredl.ts` (trimmed to a `level_id → tags` lookup, since Pointercrate has no gameplay-tag concept), `src/lib/daily.ts` (date-seeded target, with owner-schedule override), `src/lib/schedule.ts` (owner-curated date → demon overrides, hand-edited), `src/lib/hints.ts` (progressive hint payload builder, server-only), `src/lib/completions.ts` (Redis-backed cross-player played/won counters), `src/app/api/guess/route.ts` + `src/app/api/levels/route.ts` (the only two endpoints; the answer is never sent to the client until win/loss), `src/components/game/PlayGame.tsx` (client orchestrator, rendered by `src/app/page.tsx`), `src/lib/storage.ts` (localStorage stats/state + import/export/reset).
- Visual language: deliberately flat/plain (see the "Superseded by explicit user direction" note under Visual design below) — single Poppins font, no glow/blur/gradients, sharp-cornered bordered rows instead of rounded cards. Theme is white/blue (also superseded — see Visual design), not the original AREDL-derived black/orange.
- Verified live against the real Pointercrate + AREDL APIs in-browser: search autocomplete, guess submission, position-direction feedback, all 5 hint stages, win reveal (real thumbnail/video + song via GDBrowser fallback), stats/streak recording, and the archive route.
- Known non-issue from testing: `navigator.clipboard.writeText` in the Share button is denied under the automated browser tool's permission policy — this is a sandbox restriction, not an app bug; it works in a normal browser with clipboard permission.

## Assumptions to confirm with the user

The original spec mixed "Wordle" mechanics (letter-by-letter, 5 letters, green/yellow tiles) with "guess the level and get hints" mechanics, which are two different games. AREDL level names aren't 5 letters (see "Welcome To GD News" in the reference screenshot), so this doc assumes the **Poeltl/Framed-style** interpretation:

- A guess = picking a full level name from a searchable/autocomplete list of real AREDL levels (not spelling it out).
- 6 guesses total, one new hint unlocked per non-winning guess (see [Hint schedule](#hint-schedule)).
- Guessing the exact level = instant win, "Done" state (matches screenshot's "Done" button).
- The reference screenshot appears to be the actual AREDL site's nav bar around a "guess" card UI — treat it as the target visual language, not necessarily an existing shipped feature.

If any of this is wrong, correct it and this file should be updated before implementation goes further.

## Game rules

1. One target level is selected per day, deterministically seeded by date so every player gets the same puzzle and refreshing doesn't change the answer. **The day rolls over at the player's own local midnight**, not a single global UTC cutoff — `todayLocal()` in [src/lib/daily.ts](src/lib/daily.ts) resolves the calendar date client-side (`PlayGame.tsx` only calls it once mounted; the server has no notion of a visitor's timezone). Archive replays (`/archive/[date]`) always use an explicit fixed date, so they're unaffected.
2. Player searches/selects a level name; submitting it counts as a guess (max 6).
3. Feedback per guess:
   - Correct → win immediately, show full level card + share-style result grid.
   - Incorrect → reveal directional hint (target is higher/lower on the list than the guess) and unlock the next scheduled hint.
4. 6 incorrect guesses → loss, reveal the answer.
5. Daily result and streak/stats are tracked client-side (localStorage), same pattern as Wordle: `gamesPlayed`, `winPercent`, `currentStreak`, `maxStreak`, `guessDistribution`.

## Owner curation

By default the target is picked automatically (a deterministic hash of the date, mod pool size — see `seedFromDate()` in `daily.ts`). The owner can override this for any date by editing [src/lib/schedule.ts](src/lib/schedule.ts) directly and redeploying — a plain `Record<string, number>` mapping a puzzle date (`YYYY-MM-DD`) to a pointercrate demon `id` (stable across list-position churn, unlike `position`). `getDailyTarget()` checks this map first; if the date has no entry, or the scheduled id has since dropped out of the current top-150 pool, it falls back to the seeded pick (with a `console.warn` in the latter case).

This is deliberately code-as-config, not a live admin UI: no login, no database, matches the project's existing "no database needed" stance. Run `npm run list-pool` ([scripts/list-pool.mjs](scripts/list-pool.mjs)) to print every current pool demon as `id  position  name`, so you can find the id to paste into `schedule.ts`.

### Hint schedule

Progressive reveal, one per wrong guess (tune order once the user confirms priority):

| After guess # | Hint revealed |
|---|---|
| 1 | List position range / percentile (e.g. "Top 50%", "AT LEAST 8%" per screenshot) |
| 2 | Level name length + tags (Wave, Ship, Timings, etc. from `tags`) |
| 3 | Publisher name |
| 4 | Song name / artist |
| 5 | Level thumbnail — verification YouTube thumbnail, blurred/pixelated |
| 6 (final guess) | Full thumbnail unblurred, last chance |

Every guess (not just scheduled hints) also shows a higher/lower arrow relative to list position — this is the main Wordle-equivalent "warm/cold" signal.

**Superseded by explicit user direction (2026-08-05, pointercrate pivot):** the table above was the AREDL-era schedule. The user switched the data source to Pointercrate (see the new data-source section below) and specified the hint order directly. Current schedule, implemented in [src/lib/hints.ts](src/lib/hints.ts) and rendered by [src/components/game/HintPanel.tsx](src/components/game/HintPanel.tsx):

| After guess # | Hint revealed |
|---|---|
| 1 | List tier — "Main List" (position 1–75) or "Extended List" (76–150) |
| 2 | Gameplay tags (Wave, Ship, Timings, etc.) — cross-referenced from AREDL by GD `level_id`, since Pointercrate itself has no tags. `null` (not just unrevealed) means no AREDL entry exists for that level |
| 3 | Publisher and verifier names (Pointercrate provides both directly) |
| 4 | Song name / artist, via the GDBrowser fallback keyed by `level_id` (unchanged from before) |
| 5 | Level thumbnail — Pointercrate returns a ready-made `thumbnail` URL directly, no YouTube-ID extraction needed; shown blurred |
| 6 (final guess) | No new scheduled hint; win or loss both trigger the same full reveal (name, position, tier, publisher, verifier, tags, song, unblurred thumbnail linking to `video`) |

The "harder/easier" directional signal on every guess is unchanged — still driven by Pointercrate `position` (1 = hardest).

## Cross-player completion stats

**Added 2026-08-07, explicit user direction.** On finishing a puzzle (win or loss — "completing" it either way, not just winning), the result card shows a community stat: a big `X%` ("of people guessed the level") with the raw `(won/played)` fraction underneath in smaller text. This is the one piece of state in the whole app that has to be shared across every player, so — unlike everything else — it can't live in `localStorage`. It lives in Redis instead:

- [src/lib/completions.ts](src/lib/completions.ts) — two integer counters per puzzle date (`demon:completions:{date}:played`, `...won`), via [Upstash Redis](https://upstash.com) (`@upstash/redis`, REST-based, no persistent connection needed — fits serverless).
- `src/app/api/guess/route.ts` calls `recordCompletion(date, correct)` exactly once, at the same moment `gameOver` becomes true (the same choke point that already guarantees one win/loss per browser per date), and returns the updated counts in that same response — no extra round trip.
- **Configuration**: needs `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` env vars, documented in `.env.local.example`. Get them by adding the "Upstash for Redis" integration from the Vercel Marketplace (Vercel dashboard → your project → Storage) and copying the REST credentials it provisions into `.env.local` (for local dev) and the project's Vercel env vars (for production).
- **Fails silently, on purpose**: if those env vars aren't set — which is the normal state for local dev without a Redis instance wired up — `completions.ts` just returns `null` and the stat section doesn't render. The game itself (guessing, hints, win/loss) never depends on this and must never break because of it.
- This is deliberately the *only* database in the project — every other data need (the demon pool, tags, song lookups, player stats/streaks) still works the old way (public API + Next.js fetch cache, or `localStorage`). This one counter is shared by definition, so it's the one exception to the "no database" stance elsewhere in this doc.

## Data source: Pointercrate API v2 (primary, added 2026-08-05)

Base URL: `https://pointercrate.com/api/v2`. Docs: `https://pointercrate.com/documentation/demons/` (returned 403 to an automated fetch — verified the actual shape by hitting the live API and reading the [pointercrate source](https://github.com/stadust/pointercrate) instead). Public, no auth required for reads.

Relevant endpoints:

- `GET /demons/listed/?after={cursor}&limit={n}` — the position-ordered demonlist (**not** capped to top 150 — it includes every legacy demon too, so filter client-side on `position <= 150`). `limit` is capped at 100 server-side, so [src/lib/pointercrate.ts](src/lib/pointercrate.ts) pages through with the `after` cursor until it has the top 150. Returns a raw JSON array (not wrapped). Fields per demon: `id`, `position`, `name`, `requirement` (% needed for a record), `video`, `thumbnail` (a ready-made `i.ytimg.com` URL — no YouTube-ID extraction needed, unlike AREDL), `publisher: {id, name, banned}`, `verifier: {id, name, banned}`, `level_id` (the actual GD level ID, nullable).
- `GET /demons/{id}/` — single demon detail. **Response is wrapped in `{"data": {...}}`**, unlike the list endpoint. Adds `creators: [{id, name, banned}]` and `records: [...]` (not used).
- Main List = position 1–75, Extended List = position 76–150 (`MAIN_LIST_SIZE`/`EXTENDED_LIST_SIZE` in `pointercrate.ts`) — standard Pointercrate convention, not returned by the API itself.
- `requirement__gt`/`requirement__lt`/`name`/etc. query params exist in the pointercrate source but were confirmed (empirically, by curl) to be silently ignored by the live API — don't rely on server-side filtering beyond `after`/`limit`/`before`.

### Edge Runtime is required, not optional (found 2026-08-08)

`src/app/api/levels/route.ts` and `src/app/api/guess/route.ts` both set `export const runtime = "edge";`. This isn't a style choice — **removing it breaks the app in production.**

pointercrate.com is fronted by Cloudflare, and Cloudflare serves an interactive JS challenge (`403`, `<title>Just a moment...</title>`) to requests from Vercel's default Node serverless function IPs — confirmed by deploying and curling the live endpoint, which returned that exact challenge page. The same code worked perfectly locally (both `next dev` and a real `next build && next start`), so this isn't a code bug; it's IP-reputation-based bot protection on pointercrate's side that only triggers from Vercel's Node runtime's network path. Switching both routes to `runtime = "edge"` — which routes through a different network path — was confirmed via a live redeploy to resolve it; the same code, unchanged otherwise, started working immediately.

Things that were investigated and ruled out or found irrelevant:
- Adding a `User-Agent`/`Accept` header to the pointercrate/AREDL fetches (kept anyway, in `pointercrate.ts`/`aredl.ts` — harmless, but didn't fix this on its own).
- Pointercrate's documented authentication (JWT bearer tokens via account login) — that's for account-gated write actions (submitting records, managing the list); the read endpoints we use are explicitly public and unauthenticated, and Cloudflare's challenge happens before a request ever reaches pointercrate's own auth logic anyway, so authenticating as a user wouldn't have helped.

If pointercrate's Cloudflare configuration or Vercel's Edge Runtime networking ever changes and this starts failing again, the fallback options (not yet needed) are: ask the pointercrate team to allowlist the deployment, or proxy the requests through a Cloudflare Worker (Cloudflare-to-Cloudflare traffic isn't scored as bot traffic the way Vercel's IPs are).

## Data source: AREDL API v2 (secondary — tags cross-reference only)

Base URL: `https://api.aredl.net/v2/api`. Public, no auth required. Since the pivot to Pointercrate, this is used for exactly one thing: Pointercrate has no gameplay-tag concept (Wave, Ship, Timings, etc.), so [src/lib/aredl.ts](src/lib/aredl.ts) fetches `GET /aredl/levels` and builds a `level_id → tags` map, joined against the Pointercrate demon's own `level_id`. AREDL and Pointercrate are separately curated lists, so not every Pointercrate demon has an AREDL match — a miss renders as "no tag data", not an error.

### Song info

Both APIs expose the underlying GD `level_id` directly, so song lookup no longer depends on AREDL specifically: cross-reference `https://gdbrowser.com/api/level/{level_id}` → `songName`, `songAuthor`. Unofficial fallback, not a source of truth — it just fills in what neither list API tracks.

### Caching strategy

Don't hit either API on every page load:
- Fetch the Pointercrate top-150 and AREDL tags map server-side on a schedule (revalidate every 6h) and cache them — this powers the autocomplete list, the daily-puzzle seed pool, and the tags hint.
- Compute "today's answer" server-side from the cached pool using a date-seeded PRNG (hash of `YYYY-MM-DD` mod pool size) so it's stable across requests and doesn't leak in the client bundle before guesses unlock it.
- Fetch demon detail (`/demons/{id}/`) only for the target level at win/loss time (for publisher/verifier on the reveal card), not the whole pool.

## Visual design (from the AREDL site screenshot)

Match AREDL's actual theme, don't invent a new one:

- **Background**: near-black (`#0a0a0c`–`#0d0d0f`), subtle dark reddish glow/gradient bleeding in from the edges.
- **Nav bar**: same near-black, thin low-contrast bottom border. Logo is "AREDL" in a bold flame-style gradient (yellow → orange → red) with a small winged-demon mark. Nav links in muted gray uppercase, small tracked-out letterforms. Circular icon buttons (Discord, notifications) in solid orange with a red notification badge; profile picture is a plain circle.
- **Cards/panels**: slightly lighter dark gray than the page background (`#17171a`–`#1c1c20`), rounded corners, no heavy borders — separation comes from subtle elevation, not lines.
- **Typography**: bold, rounded/geometric sans-serif for headings (e.g. Poppins/Baloo/Nunito, heavy weight), plenty of size contrast between the "Current Level" label and the big level name/number.
- **Buttons**: pill/rounded-rect. Primary action (e.g. "Done", submit guess) = solid orange. Secondary/neutral (e.g. "Import", "Return to Menu") = dark gray. Destructive (e.g. "Reset") = muted maroon/red. Positive (e.g. "Export") = muted green. This 4-color button system (orange/gray/red/green) should map directly onto this game's actions (Guess, New Game/Share, Reset stats, Export/Import save).
- **Hint pills**: small rounded-rect badges in a slightly lighter gray than the card (e.g. "AT LEAST 8%"), muted uppercase text — use this exact pattern for revealed hints.
- **Thumbnail**: embedded YouTube-style rounded rectangle, ~16:9, with a play button overlay is fine to keep even though it won't actually be playable pre-win (or make it a real embed post-win as a bonus).

**Superseded by explicit user direction (2026-08-05):** the section above was the original screenshot-derived brief and is kept for history, but the shipped UI deliberately pulls back from it — the user asked for it to look *less* designed, closer to NYT Wordle's actual restraint. Current rules:
- **No landing/marketing page.** `/` renders the game directly (what used to be `/play`), the same way wordle.nytimes.com opens straight into the grid, not a hero page.
- **One font only** — Poppins (`src/app/layout.tsx`), no display/mono pairing.
- **No glow, no blur, no gradients.** Flat solid backgrounds (`src/app/globals.css` has no `background-image`), fully opaque header (no `backdrop-blur`/alpha bg).
- **Flat chrome throughout**: sharp/minimal corners (no `rounded-xl`/`rounded-2xl`/`rounded-full`), no shadows, no decorative pill badges — plain bordered rows and rectangles (see `src/components/game/HintPanel.tsx`, `GuessLog.tsx` for the pattern to follow).
- Header nav is icon-only (archive/stats/help), not a text nav + CTA button.

**Superseded again (2026-08-05, pointercrate pivot):** with the data source no longer AREDL, the black/orange palette (originally derived straight from the AREDL site screenshot) no longer fits. The user asked for **white and blue** instead. All colors are CSS variables in `src/app/globals.css` (`--color-bg: #ffffff`, `--color-accent: #2563eb`, etc.), so the swap is a palette change only — the flat/no-glow/no-gradient/single-font rules above are unchanged and still apply. `html { color-scheme: light }` (was `dark`).

## Suggested tech stack

- **Next.js (App Router) + TypeScript** — server-side data fetching/caching for the daily seed without exposing the answer, plus easy static/ISR hosting.
- **Tailwind CSS** — CSS variables for the theme above; single light theme (`color-scheme: light`), no dark mode toggle.
- **No database for game data** — cached levels JSON (revalidated fetch) is enough; all per-player state lives in `localStorage`. The one exception is the cross-player completion counter, which needs a shared store — see [Cross-player completion stats](#cross-player-completion-stats) — a small Redis instance (Upstash), not a full database.
- **Deploy**: Vercel (pairs naturally with Next.js ISR/Edge caching for the Pointercrate + AREDL fetches).

## Build phases

1. **Scaffold**: `create-next-app` (TS + Tailwind), set up the AREDL dark theme as Tailwind config / CSS variables per the section above.
2. **Data layer**: server route/lib that fetches + caches `GET /aredl/levels`, resolves the date-seeded daily target, and exposes a client-safe search/autocomplete endpoint that never leaks the answer.
3. **Guess flow**: autocomplete input (search over cached level names) → submit → server validates against the (hidden) target, returns hint payload + correctness + position-comparison, without ever sending the raw answer to the client until win/loss.
4. **Hint UI**: implement the 6-stage progressive reveal (table above) as components — position badge, tags/length, publisher, song, blurred→clear thumbnail.
5. **Win/loss + share card**: Wordle-style emoji/color result grid, "Done" state matching the screenshot, share-to-clipboard.
6. **Stats + persistence**: localStorage-backed streak/stats, Import/Export (JSON blob, matches the screenshot's Import/Export/Reset buttons) so players can back up progress across devices.
7. **Polish pass**: responsive layout (screenshot shows a mobile-width card with a drag handle at the bottom — check the intended breakpoint), loading/error states for the AREDL API, thumbnail fallback when no verification video exists.

## Open questions for the user

- Confirm the guess mechanic (autocomplete full level name vs. something else) before building the input UI.
- Confirm hint order/priority — the table above is a best guess from the screenshot + description.
- Should the puzzle pool be the entire list, or restricted (e.g. top 100/200, excluding `legacy` levels)? Wider pools are harder to guess blind; narrower pools repeat faster.
- One puzzle per day for everyone (Wordle-style), or unlimited/practice mode too?
