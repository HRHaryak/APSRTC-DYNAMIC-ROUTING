import { FileBarChart, Download, Calendar, TrendingUp, Clock, Bus, Users } from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
} from "recharts";

const weeklyDelay = [
  { day: "Mon", before: 12.5, after: 7.2 },
  { day: "Tue", before: 10.8, after: 6.4 },
  { day: "Wed", before: 14.2, after: 8.1 },
  { day: "Thu", before: 11.3, after: 6.9 },
  { day: "Fri", before: 15.6, after: 9.2 },
  { day: "Sat", before: 8.4, after: 5.1 },
  { day: "Sun", before: 6.2, after: 4.0 },
];

const fleetUtil = [
  { name: "Active", value: 1247, color: "hsl(142, 76%, 40%)" },
  { name: "Maintenance", value: 85, color: "hsl(38, 92%, 50%)" },
  { name: "Idle", value: 38, color: "hsl(0, 84%, 55%)" },
  { name: "Standby", value: 120, color: "hsl(210, 100%, 56%)" },
];

const congestionData = [
  { zone: "Vijayawada Central", score: 92 },
  { zone: "Tirupati Temple Rd", score: 88 },
  { zone: "Vizag Beach Rd", score: 82 },
  { zone: "Guntur Bus Stand", score: 76 },
  { zone: "Kurnool NH-44", score: 71 },
  { zone: "Nellore Market", score: 65 },
  { zone: "Kadapa Ring Rd", score: 58 },
  { zone: "Ongole Station", score: 42 },
];

const tooltipStyle = {
  contentStyle: { backgroundColor: "hsl(222, 44%, 9%)", border: "1px solid hsl(222, 30%, 18%)", borderRadius: "8px", fontSize: "12px" },
};

export default function Reports() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Reports & Trends</h1>
          <p className="text-xs text-muted-foreground">Performance analytics and export-ready reports</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 rounded-md border border-border bg-secondary px-3 py-1.5 text-xs text-foreground hover:bg-muted transition-colors">
            <Calendar className="h-3 w-3" /> Last 7 Days
          </button>
          <button className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
            <Download className="h-3 w-3" /> Export PDF
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Avg Delay Reduction", value: "-38%", icon: Clock, color: "text-status-ok" },
          { label: "Fleet Utilization", value: "83.6%", icon: Bus, color: "text-primary" },
          { label: "Routes Optimized", value: "24", icon: TrendingUp, color: "text-accent" },
          { label: "Passengers Served", value: "2.4M", icon: Users, color: "text-status-warn" },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-3 rounded-lg border border-kpi-border bg-kpi p-3">
            <s.icon className={`h-5 w-5 ${s.color}`} />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.label}</p>
              <p className="font-mono text-lg font-semibold text-foreground">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Before/After Delay */}
        <div className="rounded-lg border border-kpi-border bg-kpi p-4">
          <div className="mb-4 flex items-center gap-2">
            <FileBarChart className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Before vs After AI Optimization</h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={weeklyDelay}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 18%)" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(215, 20%, 55%)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(215, 20%, 55%)" }} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
              <Bar dataKey="before" fill="hsl(0, 84%, 55%)" radius={[4, 4, 0, 0]} name="Before (min)" />
              <Bar dataKey="after" fill="hsl(142, 76%, 40%)" radius={[4, 4, 0, 0]} name="After (min)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Fleet Utilization Pie */}
        <div className="rounded-lg border border-kpi-border bg-kpi p-4">
          <div className="mb-4 flex items-center gap-2">
            <Bus className="h-4 w-4 text-accent" />
            <h3 className="text-sm font-semibold text-foreground">Fleet Status Distribution</h3>
          </div>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width="50%" height={220}>
              <PieChart>
                <Pie data={fleetUtil} cx="50%" cy="50%" outerRadius={80} innerRadius={50} dataKey="value" strokeWidth={2} stroke="hsl(222, 47%, 6%)">
                  {fleetUtil.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip {...tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {fleetUtil.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-muted-foreground">{item.name}</span>
                  <span className="font-mono text-xs font-semibold text-foreground">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Peak Congestion */}
        <div className="lg:col-span-2 rounded-lg border border-kpi-border bg-kpi p-4">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-status-warn" />
            <h3 className="text-sm font-semibold text-foreground">Peak Congestion Zones</h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={congestionData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 18%)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(215, 20%, 55%)" }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <YAxis dataKey="zone" type="category" tick={{ fontSize: 10, fill: "hsl(215, 20%, 55%)" }} axisLine={false} tickLine={false} width={120} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="score" radius={[0, 4, 4, 0]} name="Congestion Score">
                {congestionData.map((entry, i) => (
                  <Cell key={i} fill={entry.score > 80 ? "hsl(0, 84%, 55%)" : entry.score > 60 ? "hsl(38, 92%, 50%)" : "hsl(142, 76%, 40%)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
