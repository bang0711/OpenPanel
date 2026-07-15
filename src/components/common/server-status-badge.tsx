import { RiShieldCheckLine } from "@remixicon/react";

import { Badge } from "@/components/ui/badge";

/** Host-key verification status pill, shared by the overview card and server header. */
export function ServerStatusBadge({ verified }: { verified: boolean }) {
  return verified ? (
    <Badge variant="secondary" className="gap-1">
      <RiShieldCheckLine className="size-3" />
      verified
    </Badge>
  ) : (
    <Badge variant="outline">untested</Badge>
  );
}
