/**
 * HELIX brand assets.
 * The mark is an abstract twisted double-strand (DNA helix) — biology/peptides
 * crossed with a clean, engineered feel. Uses currentColor so it inherits the
 * accent wherever it's placed.
 */

export function HelixMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* two strands crossing at the centre */}
      <path d="M9 3 C 24 8, 24 13, 16 16 C 8 19, 8 24, 23 29" />
      <path d="M23 3 C 8 8, 8 13, 16 16 C 24 19, 24 24, 9 29" opacity="0.62" />
      {/* connecting rungs at the wide points */}
      <g strokeWidth={1.7} opacity="0.5">
        <line x1="11.5" y1="5" x2="20.5" y2="5" />
        <line x1="12.5" y1="10" x2="19.5" y2="10" />
        <line x1="12.5" y1="22" x2="19.5" y2="22" />
        <line x1="11.5" y1="27" x2="20.5" y2="27" />
      </g>
    </svg>
  );
}

export function HelixWordmark({ className }: { className?: string }) {
  return (
    <span className={`helix-wordmark ${className ?? ""}`}>
      <HelixMark size={26} className="helix-wordmark-mark" />
      <span className="helix-wordmark-text">HELIX</span>
    </span>
  );
}
