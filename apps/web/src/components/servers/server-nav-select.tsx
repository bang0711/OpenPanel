"use client";

import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useT } from "@/components/common/i18n-provider";

import {
  isNavItemActive,
  NAV_GROUPS,
  navHref,
} from "./server-nav.constant";

/** Mobile counterpart to the ServerNav rail: same groups, one dropdown. */
export function ServerNavSelect({ serverId }: { serverId: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useT();
  const base = `/servers/${serverId}`;

  // Keyed by href, not `seg`: Radix rejects an empty-string value and the
  // dashboard's seg is "".
  const active = NAV_GROUPS.flatMap((g) => g.items).find((i) =>
    isNavItemActive(pathname, base, i.seg),
  );

  return (
    <Select
      value={navHref(base, active?.seg ?? "")}
      onValueChange={(href) => router.push(href)}
    >
      <SelectTrigger className="w-full lg:hidden">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {NAV_GROUPS.map((group) => (
          <SelectGroup key={group.key}>
            <SelectLabel>{t(group.key)}</SelectLabel>
            {group.items.map(({ seg, key, icon: Icon }) => (
              <SelectItem key={key} value={navHref(base, seg)}>
                <Icon className="size-3.5" />
                {t(key)}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}
