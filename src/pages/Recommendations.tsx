import { useState, useEffect } from "react";
import { Brain, Check, X, MessageSquare, TrendingUp, Clock, Zap, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { fetchAIRecommendations } from "@/services/api";

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

const categoryIcon = { frequency: Zap, reroute: TrendingUp, capacity: Brain, schedule: Clock };
const categoryLabel = { frequency: "Frequency", reroute: "Reroute", capacity: "Capacity", schedule: "Schedule" };

export default function Recommendations() {
  const { session } = useAuth();
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data: apiRecs, isLoading } = useQuery({
    queryKey: ["aiRecommendations"],
    queryFn: () => fetchAIRecommendations(session?.access_token || ""),
    enabled: !!session?.access_token,
  });

  useEffect(() => {
    if (apiRecs) {
      // Transform API models to UI models if strictly needed, or just map fields
      // API returns: rec_id, route_id, recommendation, reason, expected_impact, confidence, status
      const mapped: Recommendation[] = apiRecs.map((r: any) => ({
        id: r.rec_id,
        title: r.recommendation, // Map recommendation text to title
        reason: r.reason || "No reason provided",
        action: r.recommendation, // Reuse recommendation as action
        impact: r.expected_impact || "Unknown impact",
        confidence: Math.round(r.confidence * 100), // Decimal to percentage
        category: "frequency", // Mock category as it's not in API yet
        status: r.status as any
      }));
      setRecs(mapped);
    }
  }, [apiRecs]);

  const updateStatus = (id: string, status: "accepted" | "rejected") => {
    setRecs((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">AI Route Recommendations</h1>
          <p className="text-xs text-muted-foreground">AI-generated insights based on real-time and historical data</p>
          {isLoading && <span className="text-xs text-primary animate-pulse ml-2">Updating recommendations...</span>}
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
