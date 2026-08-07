"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { puzzleNumber, todayLocal } from "@/lib/daily";

const LAUNCH_DATE = "2026-08-04";

function formatLabel(dateStr: string) {
  return new Date(`${dateStr}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function pastDates(today: string): string[] {
  const [ty, tm, td] = today.split("-").map(Number);
  const todayMs = Date.UTC(ty, tm - 1, td);
  const [ly, lm, ld] = LAUNCH_DATE.split("-").map(Number);
  const launchMs = Date.UTC(ly, lm - 1, ld);

  const dates: string[] = [];
  for (let ms = todayMs - 86_400_000; ms >= launchMs; ms -= 86_400_000) {
    dates.push(new Date(ms).toISOString().slice(0, 10));
  }
  return dates;
}

export default function ArchiveList() {
  const [dates, setDates] = useState<string[] | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time client read of the local calendar date
    setDates(pastDates(todayLocal()));
  }, []);

  if (dates === null) {
    return null;
  }

  if (dates.length === 0) {
    return (
      <p className="mt-8 text-[14px] text-text-muted">
        Puzzle #1 just dropped &mdash; the archive fills in from tomorrow.
      </p>
    );
  }

  return (
    <ol className="mt-6 border-t border-border">
      {dates.map((date) => (
        <li key={date} className="border-b border-border">
          <Link
            href={`/archive/${date}`}
            className="flex items-center justify-between py-2.5 text-[14px] hover:bg-bg-card-hover"
          >
            <span className="font-medium text-text-primary">
              Puzzle #{puzzleNumber(date)}
            </span>
            <span className="text-text-secondary">{formatLabel(date)}</span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
