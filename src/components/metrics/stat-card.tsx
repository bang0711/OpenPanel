import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function StatCard({
  icon,
  title,
  value,
  sub,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  sub?: string;
  children?: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-lg font-semibold capitalize">{value}</p>
        {sub && <p className="text-[0.625rem] text-muted-foreground">{sub}</p>}
        {children}
      </CardContent>
    </Card>
  );
}
