import { cn } from "@/lib/utils";

import { OS_BRANDS } from "./os-brands.constant";

/**
 * Distro icon for a registered server. `osId` is null until the server has been
 * tested (the backend fills it from /etc/os-release), so an unknown or missing
 * id degrades to the generic Linux mark rather than disappearing.
 */
export function OsIcon({
  osId,
  className,
  brandColor = false,
}: {
  osId: string | null | undefined;
  className?: string;
  /** Tint with the distro's brand colour instead of inheriting currentColor. */
  brandColor?: boolean;
}) {
  const brand = (osId && OS_BRANDS[osId]) || OS_BRANDS.linux;

  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      aria-label={brand.title}
      className={cn("size-4 shrink-0", className)}
      fill={brandColor ? `#${brand.hex}` : "currentColor"}
    >
      <path d={brand.path} />
    </svg>
  );
}
