"use client";

import { RiArrowUpLine,RiHome2Line } from "@remixicon/react";

import { parentOf } from "@/lib/remote-path";

import { IconButton } from "@/components/common/icon-button";

export function FileBreadcrumb({
  path,
  onNavigate,
}: {
  path: string;
  onNavigate: (path: string) => void;
}) {
  const crumbs = path.split("/").filter(Boolean);

  return (
    <div className="flex items-center gap-1 text-xs">
      <IconButton label="Home" onClick={() => onNavigate("/")}>
        <RiHome2Line />
      </IconButton>
      <IconButton
        label="Up"
        onClick={() => onNavigate(parentOf(path))}
        disabled={path === "/"}
      >
        <RiArrowUpLine />
      </IconButton>
      <span className="ml-1 font-mono text-muted-foreground">
        <button className="hover:text-foreground" onClick={() => onNavigate("/")}>
          /
        </button>
        {crumbs.map((c, i) => {
          const to = "/" + crumbs.slice(0, i + 1).join("/");
          return (
            <span key={to}>
              <button
                className="hover:text-foreground"
                onClick={() => onNavigate(to)}
              >
                {c}
              </button>
              {i < crumbs.length - 1 && "/"}
            </span>
          );
        })}
      </span>
    </div>
  );
}
