import { AlertTriangle, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Alert {
  id: string;
  type: "info" | "warning" | "critical";
  message: string;
  time: string;
}

const alerts: Alert[] = [
  { id: "1", type: "critical", message: "Route 47C — Bus AP09Z4521 stalled at Kurnool Depot", time: "2 min ago" },
  { id: "2", type: "warning", message: "Route 12A — Overcrowding detected at Vijayawada terminal", time: "5 min ago" },
  { id: "3", type: "warning", message: "Route 88B — 15 min delay due to road closure on NH-65", time: "12 min ago" },
  { id: "4", type: "info", message: "AI recommends frequency increase on Route 5D (peak hours)", time: "18 min ago" },
  { id: "5", type: "info", message: "Fleet maintenance: 3 buses returning to service at Guntur depot", time: "25 min ago" },
];

const iconMap = {
  info: Info,
  warning: AlertTriangle,
  critical: XCircle,
};

export default function AlertsPanel() {
  return (
    <div className="rounded-lg border border-kpi-border bg-kpi">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground">Live Alerts</h3>
        <span className="rounded-full border border-status-critical/30 bg-status-critical/10 px-2 py-0.5 text-[10px] font-semibold text-status-critical">
          {alerts.filter((a) => a.type === "critical").length} Critical
        </span>
      </div>
      <div className="max-h-72 overflow-y-auto scrollbar-thin divide-y divide-border">
        {alerts.map((alert) => {
          const Icon = iconMap[alert.type];
          return (
            <div key={alert.id} className="flex items-start gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors">
              <Icon
                className={cn(
                  "mt-0.5 h-4 w-4 shrink-0",
                  alert.type === "critical" && "text-status-critical",
                  alert.type === "warning" && "text-status-warn",
                  alert.type === "info" && "text-primary"
                )}
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-foreground">{alert.message}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">{alert.time}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
