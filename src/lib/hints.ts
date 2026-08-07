import { getAredlTagsByLevelId } from "@/lib/aredl";
import { getDemonDetail, listTierLabel, type PointercrateDemon } from "@/lib/pointercrate";
import type { FullReveal, RevealedHints, SongInfo } from "@/types/game";

interface GdBrowserSong {
  songName?: string;
  songAuthor?: string;
  customSong?: string;
}

async function fetchSongInfo(levelId: number | null): Promise<SongInfo | null> {
  if (!levelId) return null;
  try {
    const res = await fetch(`https://gdbrowser.com/api/level/${levelId}`, {
      next: { revalidate: 21600 },
    });
    if (!res.ok) return null;
    const data: GdBrowserSong = await res.json();
    if (!data.songName) return null;
    return { name: data.songName, author: data.songAuthor ?? "Unknown" };
  } catch {
    return null;
  }
}

/** AREDL and pointercrate don't share IDs, so tags are matched by the underlying GD level_id. */
async function fetchTags(levelId: number | null): Promise<string[] | null> {
  if (!levelId) return null;
  const tagsByLevelId = await getAredlTagsByLevelId();
  return tagsByLevelId.get(levelId) ?? null;
}

export async function buildHints(
  target: PointercrateDemon,
  guessNumber: number
): Promise<RevealedHints> {
  const hints: RevealedHints = {};

  if (guessNumber >= 1) {
    hints.listTier = listTierLabel(target.position);
  }
  if (guessNumber >= 2) {
    hints.tags = await fetchTags(target.level_id);
  }
  if (guessNumber >= 3) {
    hints.publisher = target.publisher.name;
    hints.verifier = target.verifier.name;
  }
  if (guessNumber >= 4) {
    hints.song = await fetchSongInfo(target.level_id);
  }
  if (guessNumber >= 5) {
    hints.thumbnailUrl = target.thumbnail;
  }

  return hints;
}

export async function buildFullReveal(target: PointercrateDemon): Promise<FullReveal> {
  const [detail, song, tags] = await Promise.all([
    getDemonDetail(target.id),
    fetchSongInfo(target.level_id),
    fetchTags(target.level_id),
  ]);

  return {
    id: target.id,
    name: target.name,
    position: target.position,
    listTier: listTierLabel(target.position),
    publisher: detail.publisher.name,
    verifier: detail.verifier.name,
    tags,
    song,
    thumbnailUrl: target.thumbnail,
    videoUrl: target.video,
    levelId: target.level_id,
  };
}
