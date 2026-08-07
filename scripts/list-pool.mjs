/**
 * Prints every demon in the current top-150 pool as "id  position  name",
 * so you can look up the `id` to put in src/lib/schedule.ts.
 *
 * Usage: npm run list-pool
 */

const BASE = "https://pointercrate.com/api/v2";
const EXTENDED_LIST_SIZE = 150;

async function fetchListedPage(after, limit) {
  const res = await fetch(`${BASE}/demons/listed/?after=${after}&limit=${limit}`);
  if (!res.ok) throw new Error(`Pointercrate demons fetch failed: ${res.status}`);
  return res.json();
}

async function getPool() {
  const demons = [];
  let after = 0;
  while (demons.length < EXTENDED_LIST_SIZE) {
    const page = await fetchListedPage(after, 100);
    if (page.length === 0) break;
    demons.push(...page);
    after += page.length;
  }
  return demons
    .filter((d) => d.position <= EXTENDED_LIST_SIZE)
    .sort((a, b) => a.position - b.position);
}

const pool = await getPool();
for (const demon of pool) {
  console.log(`${String(demon.id).padStart(5)}  #${String(demon.position).padStart(3)}  ${demon.name}`);
}
