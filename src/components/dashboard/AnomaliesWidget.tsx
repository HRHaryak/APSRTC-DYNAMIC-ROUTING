import { AlertTriangle, TrendingUp, CheckCircle2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchAnomalies, fetchSystemStats } from "@/services/api";

interface Anomaly {
    bus_id: string;
    anomaly_score: number;
    features: { [key: string]: number };
}

export default function AnomaliesWidget() {
    const { data: anomalies } = useQuery<Anomaly[]>({
        queryKey: ["anomalies"],
        queryFn: fetchAnomalies,
        refetchInterval: 30000, // Refresh every 30 seconds
    });

    const { data: systemStats } = useQuery({
        queryKey: ["systemStats"],
        queryFn: fetchSystemStats,
        refetchInterval: 60000, // Refresh every minute
    });

    const highPriorityAnomalies = anomalies?.filter((a) => a.anomaly_score > 0.8) || [];

    return (
        <div className="space-y-4">
            {/* ML Model Status */}
            <div className="rounded-lg border border-border bg-card p-3">
                <h3 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-primary" />
                    ML Model Status
                </h3>
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[10px]">
                        <span className="text-muted-foreground">Delay Prediction</span>
                        {systemStats?.ml_models?.delay_model_trained ? (
                            <span className="flex items-center gap-1 text-status-ok">
                                <CheckCircle2 className="h-3 w-3" />
                                Active
                            </span>
                        ) : (
                            <span className="text-status-warn">Training...</span>
                        )}
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                        <span className="text-muted-foreground">Demand Forecast</span>
                        {systemStats?.ml_models?.demand_model_trained ? (
                            <span className="flex items-center gap-1 text-status-ok">
                                <CheckCircle2 className="h-3 w-3" />
                                Active
                            </span>
                        ) : (
                            <span className="text-status-warn">Training...</span>
                        )}
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                        <span className="text-muted-foreground">Anomaly Detection</span>
                        {systemStats?.ml_models?.anomaly_model_trained ? (
                            <span className="flex items-center gap-1 text-status-ok">
                                <CheckCircle2 className="h-3 w-3" />
                                Active
                            </span>
                        ) : (
                            <span className="text-status-warn">Training...</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Anomaly Alerts */}
            <div className="rounded-lg border border-border bg-card p-3">
                <h3 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-status-warn" />
                    Anomaly Alerts ({highPriorityAnomalies.length})
                </h3>
                {highPriorityAnomalies.length === 0 ? (
                    <p className="text-[10px] text-muted-foreground">No high-priority anomalies detected</p>
                ) : (
                    <div className="space-y-2">
                        {highPriorityAnomalies.slice(0, 5).map((anomaly) => (
                            <div
                                key={anomaly.bus_id}
                                className="rounded-md bg-status-warn/5 border border-status-warn/20 p-2"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-medium text-foreground">
                                        Bus {anomaly.bus_id}
                                    </span>
                                    <span className="text-[9px] text-status-warn font-semibold">
                                        Score: {(anomaly.anomaly_score * 100).toFixed(0)}%
                                    </span>
                                </div>
                                <p className="text-[9px] text-muted-foreground mt-0.5">
                                    Unusual operational pattern detected
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
