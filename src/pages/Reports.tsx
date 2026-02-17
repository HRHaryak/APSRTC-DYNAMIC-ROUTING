import { FileBarChart, Download, Calendar, TrendingUp, Clock, Bus, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { fetchReportsData } from "@/services/api";
import { ReportsData } from "@/types";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
} from "recharts";

const chartTooltipStyle = {
  contentStyle: { backgroundColor: "hsl(0, 0%, 100%)", border: "1px solid hsl(220, 13%, 86%)", borderRadius: "6px", fontSize: "12px", color: "hsl(220, 25%, 12%)" },
};

const gridColor = "hsl(220, 13%, 90%)";
const tickStyle = { fontSize: 10, fill: "hsl(220, 10%, 46%)" };

export default function Reports() {
  const { session } = useAuth();

  const { data: reportsData, isLoading, error } = useQuery<ReportsData>({
    queryKey: ["reports"],
    queryFn: () => fetchReportsData(session?.access_token || ""),
    enabled: true, // Always enabled since backend doesn't require auth
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-500 bg-red-50 rounded-lg border border-red-200">
        Failed to load reports data. Please try again later.
      </div>
    );
  }

  if (!reportsData) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        No reports data available.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Reports & Trends</h1>
          <p className="text-xs text-muted-foreground">Performance analytics and export-ready reports</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs text-foreground hover:bg-secondary transition-colors">
            <Calendar className="h-3 w-3" /> Last 7 Days
          </button>
          <button className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
            <Download className="h-3 w-3" /> Export PDF
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Avg Delay Reduction", value: reportsData.avg_delay_reduction, icon: Clock, color: "text-status-ok" },
          { label: "Fleet Utilization", value: reportsData.fleet_utilization, icon: Bus, color: "text-primary" },
          { label: "Routes Optimized", value: reportsData.routes_optimized.toString(), icon: TrendingUp, color: "text-primary" },
          { label: "Passengers Served", value: reportsData.passengers_served, icon: Users, color: "text-status-warn" },
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
            <BarChart data={reportsData.weekly_delay}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey="day" tick={tickStyle} axisLine={false} tickLine={false} />
              <YAxis tick={tickStyle} axisLine={false} tickLine={false} />
              <Tooltip {...chartTooltipStyle} />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
              <Bar dataKey="before" fill="hsl(0, 72%, 50%)" radius={[4, 4, 0, 0]} name="Before (min)" />
              <Bar dataKey="after" fill="hsl(152, 60%, 36%)" radius={[4, 4, 0, 0]} name="After (min)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Fleet Utilization Pie */}
        <div className="rounded-lg border border-kpi-border bg-kpi p-4">
          <div className="mb-4 flex items-center gap-2">
            <Bus className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Fleet Status Distribution</h3>
          </div>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width="50%" height={220}>
              <PieChart>
                <Pie data={reportsData.fleet_status} cx="50%" cy="50%" outerRadius={80} innerRadius={50} dataKey="value" strokeWidth={2} stroke="hsl(0, 0%, 100%)">
                  {reportsData.fleet_status.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip {...chartTooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {reportsData.fleet_status.map((item) => (
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
            <BarChart data={reportsData.congestion_zones} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
              <XAxis type="number" tick={tickStyle} axisLine={false} tickLine={false} domain={[0, 100]} />
              <YAxis dataKey="zone" type="category" tick={tickStyle} axisLine={false} tickLine={false} width={120} />
              <Tooltip {...chartTooltipStyle} />
              <Bar dataKey="score" radius={[0, 4, 4, 0]} name="Congestion Score">
                {reportsData.congestion_zones.map((entry, i) => (
                  <Cell key={i} fill={entry.score > 80 ? "hsl(0, 72%, 50%)" : entry.score > 60 ? "hsl(36, 80%, 48%)" : "hsl(152, 60%, 36%)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
