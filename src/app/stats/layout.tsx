import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Stats | Extremle",
  description:
    "Track your Extremle stats: games played, win percentage, current and best streaks, and guess distribution, saved right in your browser.",
};

export default function StatsLayout({ children }: { children: ReactNode }) {
  return children;
}
