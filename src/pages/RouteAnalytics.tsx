import { useState } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Route, Filter, Download, TrendingUp, Clock, Users, Gauge } from "lucide-react";
import { cn } from "@/lib/utils";

const routes = ["5D", "12A", "47C", "88B", "23F", "9E", "31G", "66A"];

const demandData = [
  { hour: "06", demand: 320, capacity: 400 },
  { hour: "07", demand: 480, capacity: 400 },
  { hour: "08", demand: 620, capacity: 500 },
  { hour: "09", demand: 510, capacity: 500 },
  { hour: "10", demand: 380, capacity: 450 },
  { hour: "11", demand: 290, capacity: 450 },
  { hour: "12", demand: 340, capacity: 400 },
  { hour: "13", demand: 310, capacity: 400 },
  { hour: "14", demand: 350, capacity: 400 },
  { hour: "15", demand: 420, capacity: 450 },
  { hour: "16", demand: 550, capacity: 500 },
  { hour: "17", demand: 680, capacity: 500 },
  { hour: "18", demand: 720, capacity: 550 },
  { hour: "19", demand: 580, capacity: 500 },
  { hour: "20", demand: 340, capacity: 400 },
];

const delayDistribution = [
  { range: "0-2m", count: 45 },
  { range: "2-5m", count: 28 },
  { range: "5-10m", count: 18 },
  { range: "10-15m", count: 12 },
  { range: "15-20m", count: 6 },
  { range: "20m+", count: 4 },
];

const tooltipStyle = {
  contentStyle: { backgroundColor: "hsl(222, 44%, 9%)", border: "1px solid hsl(222, 30%, 18%)", borderRadius: "8px", fontSize: "12px" },
  labelStyle: { color: "hsl(210, 40%, 92%)" },
};

export default function RouteAnalytics() {
  const [selectedRoute, setSelectedRoute] = useState("12A");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Route Analytics</h1>
          <p className="text-xs text-muted-foreground">Detailed performance breakdown by route</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 rounded-md border border-border bg-secondary px-3 py-1.5 text-xs text-foreground hover:bg-muted transition-colors">
            <Filter className="h-3 w-3" /> Filters
          </button>
          <button className="flex items-center gap-1.5 rounded-md border border-border bg-secondary px-3 py-1.5 text-xs text-foreground hover:bg-muted transition-colors">
            <Download className="h-3 w-3" /> Export
          </button>
        </div>
      </div>

      {/* Route Selector */}
      <div className="flex gap-2 flex-wrap">
        {routes.map((r) => (
          <button
            key={r}
            onClick={() => setSelectedRoute(r)}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-mono font-medium transition-colors",
              selectedRoute === r
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            )}
          >
            Route {r}
          </button>
        ))}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Utilization", value: "78%", icon: Gauge, color: "text-primary" },
          { label: "Avg Delay", value: "8.3 min", icon: Clock, color: "text-status-warn" },
          { label: "Daily Riders", value: "12,450", icon: Users, color: "text-accent" },
          { label: "Trend", value: "▲ 4.2%", icon: TrendingUp, color: "text-status-ok" },
        ].map((stat) => (
          <div key={stat.label} className="flex items-center gap-3 rounded-lg border border-kpi-border bg-kpi p-3">
            <stat.icon className={cn("h-5 w-5", stat.color)} />
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</p>
              <p className="font-mono text-lg font-semibold text-foreground">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-kpi-border bg-kpi p-4">
          <div className="mb-4 flex items-center gap-2">
            <Route className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Demand vs Capacity — Route {selectedRoute}</h3>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={demandData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 18%)" />
              <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "hsl(215, 20%, 55%)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(215, 20%, 55%)" }} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
              <Line type="monotone" dataKey="demand" stroke="hsl(0, 84%, 55%)" strokeWidth={2} dot={false} name="Demand" />
              <Line type="monotone" dataKey="capacity" stroke="hsl(142, 76%, 40%)" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Capacity" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-lg border border-kpi-border bg-kpi p-4">
          <div className="mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4 text-status-warn" />
            <h3 className="text-sm font-semibold text-foreground">Delay Distribution</h3>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={delayDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 18%)" vertical={false} />
              <XAxis dataKey="range" tick={{ fontSize: 10, fill: "hsl(215, 20%, 55%)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(215, 20%, 55%)" }} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="count" fill="hsl(210, 100%, 56%)" radius={[4, 4, 0, 0]} name="Bus Count" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
