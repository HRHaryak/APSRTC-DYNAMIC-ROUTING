import { Settings as SettingsIcon, Shield, Users, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

const roles = [
  { role: "Admin", users: 3, permissions: "Full system access including user management and configuration" },
  { role: "Route Planner", users: 12, permissions: "View analytics, accept/reject AI recommendations, export reports" },
  { role: "Control Room", users: 8, permissions: "Live monitoring, alerts management, bus tracking" },
  { role: "Depot Official", users: 25, permissions: "View route status, bus assignments, depot-level metrics" },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Settings</h1>
        <p className="text-xs text-muted-foreground">System configuration & role management</p>
      </div>

      {/* Role Management */}
      <div className="rounded-lg border border-kpi-border bg-kpi">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Shield className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Role Management</h3>
        </div>
        <div className="divide-y divide-border">
          {roles.map((r) => (
            <div key={r.role} className="flex items-center justify-between px-4 py-3 hover:bg-secondary/50 transition-colors">
              <div>
                <p className="text-sm font-medium text-foreground">{r.role}</p>
                <p className="text-xs text-muted-foreground">{r.permissions}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 rounded border border-border bg-secondary px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
                  <Users className="h-3 w-3" /> {r.users}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* System Config */}
      <div className="rounded-lg border border-kpi-border bg-kpi">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <SettingsIcon className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">System Configuration</h3>
        </div>
        <div className="divide-y divide-border">
          {[
            { label: "Data refresh interval", value: "60 seconds" },
            { label: "Map provider", value: "Mapbox GL" },
            { label: "AI model version", value: "v2.4.1" },
            { label: "Alert retention", value: "30 days" },
            { label: "Session timeout", value: "15 minutes" },
          ].map((config) => (
            <div key={config.label} className="flex items-center justify-between px-4 py-3">
              <span className="text-xs text-muted-foreground">{config.label}</span>
              <span className="font-mono text-xs text-foreground">{config.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="rounded-lg border border-kpi-border bg-kpi">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Bell className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Notification Preferences</h3>
        </div>
        <div className="divide-y divide-border">
          {[
            { label: "Critical delay alerts", enabled: true },
            { label: "AI recommendation notifications", enabled: true },
            { label: "Fleet maintenance reminders", enabled: false },
            { label: "Weekly performance summary", enabled: true },
          ].map((pref) => (
            <div key={pref.label} className="flex items-center justify-between px-4 py-3">
              <span className="text-xs text-muted-foreground">{pref.label}</span>
              <span className={cn(
                "rounded px-2 py-0.5 text-[10px] font-semibold",
                pref.enabled ? "bg-status-ok/15 text-status-ok" : "bg-secondary text-muted-foreground"
              )}>
                {pref.enabled ? "Enabled" : "Disabled"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
