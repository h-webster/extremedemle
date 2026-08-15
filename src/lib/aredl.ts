const AREDL_BASE = "https://api.aredl.net/v2/api";

const REQUEST_HEADERS = {
  "User-Agent": "ExtremleBot/1.0 (+https://extremedemle.vercel.app)",
  Accept: "application/json",
};

/** The one field we still need AREDL for — pointercrate has no gameplay tags (Wave, Ship, Timings, ...). */
interface AredlLevel {
  level_id: number;
  tags: string[];
}

/**
 * AREDL and pointercrate are separate curated lists with separate criteria, so
 * not every pointercrate demon has an AREDL entry. This map is best-effort —
 * callers should treat a miss as "no tag data" rather than an error.
 */
export async function getAredlTagsByLevelId(): Promise<Map<number, string[]>> {
  const res = await fetch(`${AREDL_BASE}/aredl/levels`, {
    next: { revalidate: 21600 }, // 6h — the list barely moves within a day
    headers: REQUEST_HEADERS,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`AREDL levels fetch failed: ${res.status} ${body.slice(0, 300)}`);
  }
  const levels: AredlLevel[] = await res.json();
  const map = new Map<number, string[]>();
  for (const level of levels) {
    map.set(level.level_id, level.tags);
  }
  return map;
}
