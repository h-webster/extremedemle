import { NextRequest, NextResponse } from "next/server";
import { getDailyPool } from "@/lib/pointercrate";
import type { LevelOption } from "@/types/game";

// Required: pointercrate.com is fronted by Cloudflare, which serves an
// interactive JS challenge ("Just a moment...", 403) to requests from
// Vercel's default Node serverless IPs. Edge Runtime routes through a
// different network path that isn't challenged. Confirmed by testing —
// don't remove this without re-verifying against production.
export const runtime = "edge";

const MAX_RESULTS = 8;

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim().toLowerCase() ?? "";
  if (query.length < 1) {
    return NextResponse.json<LevelOption[]>([]);
  }

  let pool;
  try {
    pool = await getDailyPool();
  } catch (err) {
    console.error("GET /api/levels: failed to load pool", err);
    return NextResponse.json({ error: "Failed to load level pool" }, { status: 502 });
  }

  const starts: LevelOption[] = [];
  const contains: LevelOption[] = [];

  for (const level of pool) {
    const name = level.name.toLowerCase();
    if (name.startsWith(query)) {
      starts.push({ id: level.id, name: level.name, position: level.position });
    } else if (name.includes(query)) {
      contains.push({ id: level.id, name: level.name, position: level.position });
    }
    if (starts.length >= MAX_RESULTS) break;
  }

  const results = [...starts, ...contains].slice(0, MAX_RESULTS);
  return NextResponse.json<LevelOption[]>(results);
}
