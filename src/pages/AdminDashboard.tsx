import { Shield, Users, Activity, Database } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { fetchUsers, fetchAuditLogs, fetchSystemStats, triggerModelRetraining } from "@/services/api";
import { useState } from "react";

export default function AdminDashboard() {
    const { user } = useAuth();
    const [retrainingModel, setRetrainingModel] = useState(false);

    // Only admins should access this
    if (user?.role !== "admin") {
        return (
            <div className="p-10 text-center">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-lg font-semibold text-foreground">Access Denied</h2>
                <p className="text-sm text-muted-foreground">Admin privileges required</p>
            </div>
        );
    }

    const { data: users } = useQuery({
        queryKey: ["users"],
        queryFn: fetchUsers,
    });

    const { data: auditLogs } = useQuery({
        queryKey: ["auditLogs"],
        queryFn: () => fetchAuditLogs(20),
    });

    const { data: systemStats } = useQuery({
        queryKey: ["systemStats"],
        queryFn: fetchSystemStats,
        refetchInterval: 30000,
    });

    const handleRetrain = async () => {
        setRetrainingModel(true);
        try {
            await triggerModelRetraining();
            alert("Model retraining started in background");
        } catch (error) {
            alert("Failed to trigger retraining");
        } finally {
            setRetrainingModel(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-bold text-foreground">System Administration</h1>
                <p className="text-xs text-muted-foreground">Manage users, monitor system, and configure ML models</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border border-kpi-border bg-kpi p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Users className="h-4 w-4 text-primary" />
                        <span className="text-xs font-semibold text-foreground">Total Users</span>
                    </div>
                    <p className="text-2xl font-bold text-foreground">{users?.length || 0}</p>
                </div>

                <div className="rounded-lg border border-kpi-border bg-kpi p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Activity className="h-4 w-4 text-status-ok" />
                        <span className="text-xs font-semibold text-foreground">ML Models</span>
                    </div>
                    <p className="text-2xl font-bold text-foreground">
                        {[
                            systemStats?.ml_models?.delay_model_trained,
                            systemStats?.ml_models?.demand_model_trained,
                            systemStats?.ml_models?.anomaly_model_trained,
                        ].filter(Boolean).length}/3
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">Models Active</p>
                </div>

                <div className="rounded-lg border border-kpi-border bg-kpi p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Database className="h-4 w-4 text-primary" />
                        <span className="text-xs font-semibold text-foreground">Audit Logs</span>
                    </div>
                    <p className="text-2xl font-bold text-foreground">{auditLogs?.length || 0}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">Recent Events</p>
                </div>

                <div className="rounded-lg border border-kpi-border bg-kpi p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Shield className="h-4 w-4 text-status-ok" />
                        <span className="text-xs font-semibold text-foreground">System Status</span>
                    </div>
                    <p className="text-sm font-bold text-status-ok">Online</p>
                    <p className="text-[10px] text-muted-foreground mt-1">All Services Running</p>
                </div>
            </div>

            {/* Users Table */}
            <div className="rounded-lg border border-border bg-card p-4">
                <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    User Management
                </h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="text-left py-2 px-2 font-semibold text-muted-foreground">Username</th>
                                <th className="text-left py-2 px-2 font-semibold text-muted-foreground">Full Name</th>
                                <th className="text-left py-2 px-2 font-semibold text-muted-foreground">Email</th>
                                <th className="text-left py-2 px-2 font-semibold text-muted-foreground">Role</th>
                                <th className="text-left py-2 px-2 font-semibold text-muted-foreground">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users?.map((user: any) => (
                                <tr key={user.username} className="border-b border-border/50">
                                    <td className="py-2 px-2 font-mono text-foreground">{user.username}</td>
                                    <td className="py-2 px-2 text-foreground">{user.full_name}</td>
                                    <td className="py-2 px-2 text-muted-foreground">{user.email}</td>
                                    <td className="py-2 px-2">
                                        <span className="rounded px-2 py-0.5 bg-primary/10 text-primary font-medium">
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="py-2 px-2">
                                        <span className={user.disabled ? "text-status-critical" : "text-status-ok"}>
                                            {user.disabled ? "Disabled" : "Active"}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Model Management */}
            <div className="rounded-lg border border-border bg-card p-4">
                <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" />
                    ML Model Management
                </h2>
                <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between p-2 rounded bg-secondary/50">
                        <span className="text-xs text-foreground">Delay Prediction Model</span>
                        <span className={`text-xs font-semibold ${systemStats?.ml_models?.delay_model_trained ? 'text-status-ok' : 'text-status-warn'}`}>
                            {systemStats?.ml_models?.delay_model_trained ? 'Active' : 'Not Trained'}
                        </span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded bg-secondary/50">
                        <span className="text-xs text-foreground">Demand Forecast Model</span>
                        <span className={`text-xs font-semibold ${systemStats?.ml_models?.demand_model_trained ? 'text-status-ok' : 'text-status-warn'}`}>
                            {systemStats?.ml_models?.demand_model_trained ? 'Active' : 'Not Trained'}
                        </span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded bg-secondary/50">
                        <span className="text-xs text-foreground">Anomaly Detection Model</span>
                        <span className={`text-xs font-semibold ${systemStats?.ml_models?.anomaly_model_trained ? 'text-status-ok' : 'text-status-warn'}`}>
                            {systemStats?.ml_models?.anomaly_model_trained ? 'Active' : 'Not Trained'}
                        </span>
                    </div>
                </div>
                <button
                    onClick={handleRetrain}
                    disabled={retrainingModel}
                    className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                    {retrainingModel ? "Starting Retraining..." : "Retrain All Models"}
                </button>
            </div>

            {/* Audit Logs */}
            <div className="rounded-lg border border-border bg-card p-4">
                <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Database className="h-4 w-4 text-primary" />
                    Recent Audit Logs
                </h2>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                    {auditLogs?.map((log: any, index: number) => (
                        <div key={index} className="p-2 rounded bg-secondary/30 text-xs">
                            <div className="flex items-center justify-between mb-1">
                                <span className="font-mono text-primary">{log.username}</span>
                                <span className="text-muted-foreground">{new Date(log.timestamp).toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="rounded px-1.5 py-0.5 bg-primary/10 text-primary font-mono text-[10px]">
                                    {log.event_type}
                                </span>
                                <span className="text-foreground">{log.action}</span>
                                {log.success === false && (
                                    <span className="text-status-critical text-[10px]">FAILED</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
