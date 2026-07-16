import type { Locale } from "@/lib/i18n/messages";
import { cn } from "@/lib/utils";

// Inline SVG flags — render everywhere (Windows shows emoji flags as letters).
//
// The `size-full` class is load-bearing: Button/DropdownMenuItem force bare
// descendant svgs to a fixed size via `[&_svg:not([class*='size-'])]:size-*`.
// A `size-` class opts out of that override so the flag fills its span.
// `slice` fills the span's ratio instead of letterboxing inside it.

function GbFlag() {
  return (
    <svg
      viewBox="0 0 60 30"
      preserveAspectRatio="xMidYMid slice"
      className="size-full"
    >
      <rect width="60" height="30" fill="#012169" />
      <path d="M0,0 60,30 M60,0 0,30" stroke="#fff" strokeWidth="6" />
      <path d="M0,0 60,30 M60,0 0,30" stroke="#C8102E" strokeWidth="2" />
      <path d="M30,0 V30 M0,15 H60" stroke="#fff" strokeWidth="10" />
      <path d="M30,0 V30 M0,15 H60" stroke="#C8102E" strokeWidth="6" />
    </svg>
  );
}

function VnFlag() {
  return (
    <svg
      viewBox="0 0 30 20"
      preserveAspectRatio="xMidYMid slice"
      className="size-full"
    >
      <rect width="30" height="20" fill="#DA251D" />
      <path
        fill="#FF0"
        d="M15 4l1.76 5.42h5.7l-4.61 3.35 1.76 5.42L15 14.84l-4.61 3.35 1.76-5.42-4.61-3.35h5.7z"
      />
    </svg>
  );
}

const FLAGS: Record<Locale, () => React.ReactNode> = {
  en: GbFlag,
  vi: VnFlag,
};

export function FlagIcon({
  locale,
  className,
}: {
  locale: Locale;
  className?: string;
}) {
  const Flag = FLAGS[locale];
  return (
    <span
      className={cn(
        "block h-3.5 w-5 shrink-0 overflow-hidden rounded-[2px]",
        className,
      )}
    >
      <Flag />
    </span>
  );
}
