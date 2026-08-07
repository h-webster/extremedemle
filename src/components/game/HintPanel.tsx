import type { CSSProperties, ReactNode } from "react";
import type { RevealedHints } from "@/types/game";

interface HintPanelProps {
  hints: RevealedHints | undefined;
  attemptsMade: number;
}

interface HintDef {
  key: string;
  threshold: number;
  title: string;
  color: string;
  span?: boolean;
  render: (hints: RevealedHints | undefined) => ReactNode;
}

function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="11" width="14" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

const HINTS: HintDef[] = [
  {
    key: "list",
    threshold: 1,
    title: "List",
    color: "#2563eb",
    render: (hints) => hints?.listTier,
  },
  {
    key: "tags",
    threshold: 2,
    title: "Tags",
    color: "#7c3aed",
    render: (hints) => (hints?.tags === null ? "no tag data" : hints?.tags?.join(", ")),
  },
  {
    key: "publisher",
    threshold: 3,
    title: "Published & verified",
    color: "#ea580c",
    render: (hints) => (
      <>
        Published by: {hints?.publisher}
        <br />
        Verified by: {hints?.verifier}
      </>
    ),
  },
  {
    key: "song",
    threshold: 4,
    title: "Song",
    color: "#db2777",
    render: (hints) => (hints?.song ? `${hints.song.name} — ${hints.song.author}` : "unavailable"),
  },
  {
    key: "thumbnail",
    threshold: 5,
    title: "Thumbnail",
    color: "#059669",
    span: true,
    render: (hints) =>
      hints?.thumbnailUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={hints.thumbnailUrl}
          alt="Blurred level thumbnail"
          className="h-full w-full object-cover blur-md"
        />
      ) : (
        "unavailable"
      ),
  },
];

function HintCard({
  def,
  unlocked,
  hints,
}: {
  def: HintDef;
  unlocked: boolean;
  hints: RevealedHints | undefined;
}) {
  return (
    <div
      className={`hint-card ${def.span ? "col-span-2" : ""}`}
      style={
        {
          "--hint-color": def.color,
          "--hint-card-height": def.span ? "160px" : "92px",
        } as CSSProperties
      }
    >
      <div className={`hint-card-inner ${unlocked ? "is-flipped" : ""}`}>
        <div className="hint-face hint-face-front">
          <LockIcon />
          <span className="text-[12px] font-semibold">{def.title}</span>
        </div>
        <div className="hint-face hint-face-back">
          <span className="hint-face-label">{def.title}</span>
          <div className="text-[13px] leading-snug text-text-primary">
            {unlocked ? def.render(hints) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HintPanel({ hints, attemptsMade }: HintPanelProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {HINTS.map((def) => (
        <HintCard key={def.key} def={def} unlocked={attemptsMade >= def.threshold} hints={hints} />
      ))}
    </div>
  );
}
