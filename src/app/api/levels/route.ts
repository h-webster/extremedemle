import { NextRequest, NextResponse } from "next/server";
import { describeError } from "@/lib/describeError";
import { getDailyPool } from "@/lib/pointercrate";
import type { LevelOption } from "@/types/game";

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
    // TEMPORARY: surfacing the real error to diagnose the production 502 — remove once fixed.
    return NextResponse.json(
      { error: "Failed to load level pool", debug: describeError(err) },
      { status: 502 }
    );
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
