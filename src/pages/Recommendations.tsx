import { useState } from "react";
import { Brain, Check, X, MessageSquare, TrendingUp, Clock, Zap, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface Recommendation {
  id: string;
  title: string;
  reason: string;
  action: string;
  impact: string;
  confidence: number;
  category: "frequency" | "reroute" | "capacity" | "schedule";
  status: "pending" | "accepted" | "rejected";
}

const initialRecs: Recommendation[] = [
  {
    id: "1", title: "Increase frequency on Route 5D during 7-9 AM",
    reason: "Consistent overcrowding detected over the past 14 days during morning peak. Average occupancy exceeds 92%.",
    action: "Add 3 additional buses between 7:00-9:00 AM from Guntur Depot.",
    impact: "Expected to reduce overcrowding by 35% and improve on-time rate by 8%.",
    confidence: 94, category: "frequency", status: "pending",
  },
  {
    id: "2", title: "Reroute 47C via bypass road during construction",
    reason: "NH-44 construction causing 20+ min delays for Route 47C. Alternate route via bypass adds only 4 km.",
    action: "Temporarily reroute via Kurnool bypass (NH-44B) for next 30 days.",
    impact: "Expected delay reduction from 22 min to 6 min average.",
    confidence: 88, category: "reroute", status: "pending",
  },
  {
    id: "3", title: "Deploy larger buses on Route 12A weekends",
    reason: "Weekend demand on 12A is 40% higher than weekday, but same fleet is used. Passenger complaints increasing.",
    action: "Replace 3 standard buses with high-capacity buses on Sat-Sun.",
    impact: "Can serve 180 additional passengers per trip without adding frequency.",
    confidence: 91, category: "capacity", status: "pending",
  },
  {
    id: "4", title: "Shift Route 88B first departure 30 min earlier",
    reason: "Data shows 120+ passengers waiting before 5:30 AM at Tirupati, but first bus departs at 6:00 AM.",
    action: "Move first departure to 5:30 AM and adjust crew schedules accordingly.",
    impact: "Capture unserved demand and reduce passenger wait time by 25 min.",
    confidence: 82, category: "schedule", status: "pending",
  },
  {
    id: "5", title: "Reduce frequency on Route 31G post-10 PM",
    reason: "Occupancy drops below 15% after 10 PM. Operating at a loss during late-night window.",
    action: "Reduce from 4 buses/hr to 2 buses/hr between 10 PM - 5 AM.",
    impact: "Save ₹12,000/day in fuel and crew costs with minimal passenger impact.",
    confidence: 96, category: "frequency", status: "pending",
  },
];

const categoryIcon = { frequency: Zap, reroute: TrendingUp, capacity: Brain, schedule: Clock };
const categoryLabel = { frequency: "Frequency", reroute: "Reroute", capacity: "Capacity", schedule: "Schedule" };

export default function Recommendations() {
  const [recs, setRecs] = useState(initialRecs);
  const [expanded, setExpanded] = useState<string | null>(null);

  const updateStatus = (id: string, status: "accepted" | "rejected") => {
    setRecs((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">AI Route Recommendations</h1>
          <p className="text-xs text-muted-foreground">AI-generated insights based on real-time and historical data</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-status-ok" /> {recs.filter((r) => r.status === "accepted").length} Accepted</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-status-critical" /> {recs.filter((r) => r.status === "rejected").length} Rejected</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-status-warn" /> {recs.filter((r) => r.status === "pending").length} Pending</span>
        </div>
      </div>

      <div className="space-y-3">
        {recs.map((rec) => {
          const CatIcon = categoryIcon[rec.category];
          const isExpanded = expanded === rec.id;
          return (
            <div
              key={rec.id}
              className={cn(
                "rounded-lg border bg-kpi transition-all",
                rec.status === "accepted" && "border-status-ok/40",
                rec.status === "rejected" && "border-status-critical/40 opacity-60",
                rec.status === "pending" && "border-kpi-border hover:border-primary/40"
              )}
            >
              <button
                onClick={() => setExpanded(isExpanded ? null : rec.id)}
                className="w-full px-4 py-3 text-left"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-md border border-border bg-secondary p-2">
                    <CatIcon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="rounded border border-border bg-secondary px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                        {categoryLabel[rec.category]}
                      </span>
                      <span className="font-mono text-[10px] text-primary">{rec.confidence}% confidence</span>
                      {rec.status !== "pending" && (
                        <span className={cn(
                          "rounded px-1.5 py-0.5 text-[10px] font-semibold",
                          rec.status === "accepted" ? "bg-status-ok/15 text-status-ok" : "bg-status-critical/15 text-status-critical"
                        )}>
                          {rec.status}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm font-medium text-foreground">{rec.title}</p>
                  </div>
                  {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-border px-4 py-4 space-y-3">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div className="rounded-md border border-border bg-secondary/50 p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Why</p>
                      <p className="mt-1 text-xs text-foreground">{rec.reason}</p>
                    </div>
                    <div className="rounded-md border border-border bg-secondary/50 p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Suggested Action</p>
                      <p className="mt-1 text-xs text-foreground">{rec.action}</p>
                    </div>
                    <div className="rounded-md border border-border bg-secondary/50 p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Expected Impact</p>
                      <p className="mt-1 text-xs text-foreground">{rec.impact}</p>
                    </div>
                  </div>

                  {/* Confidence bar */}
                  <div>
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                      <span>AI Confidence</span>
                      <span className="font-mono">{rec.confidence}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          rec.confidence >= 90 ? "bg-status-ok" : rec.confidence >= 80 ? "bg-primary" : "bg-status-warn"
                        )}
                        style={{ width: `${rec.confidence}%` }}
                      />
                    </div>
                  </div>

                  {rec.status === "pending" && (
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => updateStatus(rec.id, "accepted")}
                        className="flex items-center gap-1.5 rounded-md bg-status-ok/10 border border-status-ok/30 px-3 py-1.5 text-xs font-medium text-status-ok hover:bg-status-ok/20 transition-colors"
                      >
                        <Check className="h-3 w-3" /> Accept
                      </button>
                      <button
                        onClick={() => updateStatus(rec.id, "rejected")}
                        className="flex items-center gap-1.5 rounded-md bg-status-critical/10 border border-status-critical/30 px-3 py-1.5 text-xs font-medium text-status-critical hover:bg-status-critical/20 transition-colors"
                      >
                        <X className="h-3 w-3" /> Reject
                      </button>
                      <button className="flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                        <MessageSquare className="h-3 w-3" /> Comment
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
