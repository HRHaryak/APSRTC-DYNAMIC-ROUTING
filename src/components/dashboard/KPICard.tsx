import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  status?: "ok" | "warn" | "critical";
}

export default function KPICard({ title, value, change, changeType = "neutral", icon: Icon, status }: KPICardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-kpi-border bg-kpi p-4 transition-all hover:shadow-sm",
        status === "ok" && "border-l-[3px] border-l-status-ok",
        status === "warn" && "border-l-[3px] border-l-status-warn",
        status === "critical" && "border-l-[3px] border-l-status-critical"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
          <p className="font-mono text-2xl font-bold text-foreground">{value}</p>
        </div>
        <div className="rounded-md border border-border bg-secondary p-2">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </div>
      {change && (
        <p
          className={cn(
            "mt-2 text-xs font-medium",
            changeType === "positive" && "text-status-ok",
            changeType === "negative" && "text-status-critical",
            changeType === "neutral" && "text-muted-foreground"
          )}
        >
          {change}
        </p>
      )}
    </div>
  );
}
