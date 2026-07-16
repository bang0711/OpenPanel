"use client";

import { RiArrowLeftSLine, RiArrowRightSLine } from "@remixicon/react";

import { useT } from "@/components/common/i18n-provider";
import { IconButton } from "@/components/common/icon-button";

export function ServicesPagination({
  page,
  pageCount,
  from,
  to,
  total,
  onPage,
}: {
  page: number;
  pageCount: number;
  from: number;
  to: number;
  total: number;
  onPage: (page: number) => void;
}) {
  const t = useT();
  if (total === 0) return null;

  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-muted-foreground">
        {t("services.showing")
          .replace("{from}", String(from))
          .replace("{to}", String(to))
          .replace("{total}", String(total))}
      </span>
      <div className="flex items-center gap-1">
        <IconButton
          label={t("services.prevPage")}
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
        >
          <RiArrowLeftSLine />
        </IconButton>
        <span className="px-1 text-xs text-muted-foreground tabular-nums">
          {t("services.pageOf")
            .replace("{page}", String(page))
            .replace("{pageCount}", String(pageCount))}
        </span>
        <IconButton
          label={t("services.nextPage")}
          disabled={page >= pageCount}
          onClick={() => onPage(page + 1)}
        >
          <RiArrowRightSLine />
        </IconButton>
      </div>
    </div>
  );
}
