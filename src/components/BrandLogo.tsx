type BrandLogoProps = {
  compact?: boolean;
  className?: string;
  textClassName?: string;
  tagline?: string;
};

export function BrandMark({ className = "size-10" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 56 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="2"
        y="2"
        width="52"
        height="52"
        rx="12"
        fill="#0d1016"
        stroke="#36b7ff"
        strokeOpacity="0.44"
        strokeWidth="2"
      />
      <path
        d="M13.5 39.5L25.2 15.5C26.35 13.15 29.65 13.15 30.8 15.5L42.5 39.5"
        stroke="#f7fafc"
        strokeWidth="4.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19.8 31.4H36.2"
        stroke="#b7ff3c"
        strokeWidth="4.2"
        strokeLinecap="round"
      />
      <path
        d="M31 24.6L42 13.6M42 13.6H33.7M42 13.6V21.9"
        stroke="#36b7ff"
        strokeWidth="3.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13 45.3H43"
        stroke="#ff7a3d"
        strokeOpacity="0.8"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <circle cx="43.5" cy="39.5" r="2.5" fill="#b7ff3c" />
    </svg>
  );
}

export function BrandLogo({
  compact = false,
  className = "",
  textClassName = "",
  tagline = "360° büyüme ajansı"
}: BrandLogoProps) {
  return (
    <span className={`inline-flex min-w-0 items-center gap-2.5 sm:gap-3 ${className}`}>
      <span className="relative flex shrink-0 items-center justify-center">
        <span className="absolute inset-0 rounded-xl bg-electric/20 blur-md" />
        <BrandMark className={compact ? "relative size-10" : "relative size-10 sm:size-11"} />
      </span>
      {!compact ? (
        <span className={`min-w-0 leading-tight ${textClassName}`}>
          <span className="block whitespace-nowrap text-xs font-black uppercase tracking-[0.14em] text-white sm:text-sm sm:tracking-[0.15em]">
            Aky Dijital
          </span>
          <span className="block max-w-[9rem] truncate text-[11px] font-medium text-fog-500 sm:max-w-none sm:text-xs">
            {tagline}
          </span>
        </span>
      ) : null}
    </span>
  );
}
