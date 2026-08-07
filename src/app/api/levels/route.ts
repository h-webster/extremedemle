import { NextRequest, NextResponse } from "next/server";
import { getDailyPool } from "@/lib/pointercrate";
import type { LevelOption } from "@/types/game";

const MAX_RESULTS = 8;

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim().toLowerCase() ?? "";
  if (query.length < 1) {
    return NextResponse.json<LevelOption[]>([]);
  }

  const pool = await getDailyPool();
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
