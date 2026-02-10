import {
  Clock,
  TrendingDown,
  Users,
  Bus,
  Activity,
  AlertTriangle,
} from "lucide-react";
import KPICard from "@/components/dashboard/KPICard";
import AlertsPanel from "@/components/dashboard/AlertsPanel";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

const trendData = [
  { time: "00:00", ontime: 92, delay: 4, occupancy: 30 },
  { time: "04:00", ontime: 95, delay: 2, occupancy: 15 },
  { time: "06:00", ontime: 88, delay: 8, occupancy: 55 },
  { time: "08:00", ontime: 78, delay: 14, occupancy: 92 },
  { time: "10:00", ontime: 82, delay: 11, occupancy: 75 },
  { time: "12:00", ontime: 85, delay: 9, occupancy: 68 },
  { time: "14:00", ontime: 87, delay: 7, occupancy: 60 },
  { time: "16:00", ontime: 75, delay: 18, occupancy: 88 },
  { time: "18:00", ontime: 72, delay: 20, occupancy: 95 },
  { time: "20:00", ontime: 84, delay: 10, occupancy: 55 },
  { time: "22:00", ontime: 91, delay: 5, occupancy: 35 },
];

const routePerf = [
  { route: "5D", score: 92 },
  { route: "12A", score: 68 },
  { route: "47C", score: 45 },
  { route: "88B", score: 74 },
  { route: "23F", score: 85 },
  { route: "9E", score: 79 },
  { route: "31G", score: 58 },
  { route: "66A", score: 91 },
];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">City Operations Dashboard</h1>
          <p className="text-xs text-muted-foreground">Real-time fleet overview — Last updated 30s ago</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs text-status-ok">
            <span className="h-2 w-2 rounded-full bg-status-ok pulse-dot" />
            System Online
          </span>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard title="On-Time Rate" value="82.4%" change="▼ 3.1% vs yesterday" changeType="negative" icon={Clock} status="warn" />
        <KPICard title="Avg Delay" value="7.2 min" change="▲ 1.4 min vs avg" changeType="negative" icon={TrendingDown} status="warn" />
        <KPICard title="Active Buses" value="1,247" change="98.2% fleet deployed" changeType="positive" icon={Bus} status="ok" />
        <KPICard title="Overcrowded Routes" value="14" change="3 critical alerts" changeType="negative" icon={Users} status="critical" />
      </div>

      {/* Charts + Alerts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* On-time trend */}
        <div className="lg:col-span-2 rounded-lg border border-kpi-border bg-kpi p-4">
          <div className="mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">On-Time Performance (24h)</h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="ontimeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(210, 100%, 56%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(210, 100%, 56%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 18%)" />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: "hsl(215, 20%, 55%)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(215, 20%, 55%)" }} axisLine={false} tickLine={false} domain={[60, 100]} />
              <Tooltip
                contentStyle={{ backgroundColor: "hsl(222, 44%, 9%)", border: "1px solid hsl(222, 30%, 18%)", borderRadius: "8px", fontSize: "12px" }}
                labelStyle={{ color: "hsl(210, 40%, 92%)" }}
              />
              <Area type="monotone" dataKey="ontime" stroke="hsl(210, 100%, 56%)" fill="url(#ontimeGrad)" strokeWidth={2} name="On-Time %" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Alerts */}
        <AlertsPanel />
      </div>

      {/* Route Performance */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-kpi-border bg-kpi p-4">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-status-warn" />
            <h3 className="text-sm font-semibold text-foreground">Route Performance Scores</h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={routePerf} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 18%)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(215, 20%, 55%)" }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <YAxis dataKey="route" type="category" tick={{ fontSize: 10, fill: "hsl(215, 20%, 55%)" }} axisLine={false} tickLine={false} width={35} />
              <Tooltip contentStyle={{ backgroundColor: "hsl(222, 44%, 9%)", border: "1px solid hsl(222, 30%, 18%)", borderRadius: "8px", fontSize: "12px" }} />
              <Bar dataKey="score" radius={[0, 4, 4, 0]} name="Score">
                {routePerf.map((entry, i) => (
                  <rect key={i} fill={entry.score > 80 ? "hsl(142, 76%, 40%)" : entry.score > 60 ? "hsl(38, 92%, 50%)" : "hsl(0, 84%, 55%)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Occupancy trend */}
        <div className="rounded-lg border border-kpi-border bg-kpi p-4">
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-4 w-4 text-accent" />
            <h3 className="text-sm font-semibold text-foreground">Fleet Occupancy (24h)</h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="occGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(192, 90%, 50%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(192, 90%, 50%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 18%)" />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: "hsl(215, 20%, 55%)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(215, 20%, 55%)" }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <Tooltip contentStyle={{ backgroundColor: "hsl(222, 44%, 9%)", border: "1px solid hsl(222, 30%, 18%)", borderRadius: "8px", fontSize: "12px" }} />
              <Area type="monotone" dataKey="occupancy" stroke="hsl(192, 90%, 50%)" fill="url(#occGrad)" strokeWidth={2} name="Occupancy %" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
