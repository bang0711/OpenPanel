import { Badge } from "@/components/ui/badge";

export function ServiceStateBadge({
  active,
  sub,
}: {
  active: string;
  sub: string;
}) {
  return (
    <Badge variant={active === "active" ? "secondary" : "outline"}>
      {active}/{sub}
    </Badge>
  );
}
