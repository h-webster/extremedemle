interface GlyphProps {
  className?: string;
}

export function TriangleGlyph({ direction, className }: GlyphProps & { direction: "up" | "down" }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      aria-hidden="true"
      className={`${direction === "down" ? "rotate-180" : ""} ${className ?? ""}`}
    >
      <polygon points="5,0 10,10 0,10" fill="currentColor" />
    </svg>
  );
}

export function DiamondGlyph({ filled, className }: GlyphProps & { filled?: boolean }) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" className={className}>
      <polygon points="5,0 10,5 5,10 0,5" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}
