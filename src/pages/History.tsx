import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { fetchMonthlyStats } from "@/services/api";
import type { MonthlyStats } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, CheckCircle, XCircle, AlertTriangle, TrendingUp } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from "recharts";

const HistoryPage = () => {
    const { token } = useAuth();
    const [selectedMonth, setSelectedMonth] = useState<string>("4");
    const [selectedYear, setSelectedYear] = useState<string>("2023");

    console.log("HistoryPage mounted. Token present:", !!token);

    const { data: stats, isLoading, error } = useQuery<MonthlyStats>({
        queryKey: ["history", selectedYear, selectedMonth],
        queryFn: () => {
            console.log(`Fetching stats for ${selectedMonth}/${selectedYear}`);
            // Auth is disabled on history endpoint, so pass empty token if not available
            return fetchMonthlyStats(token || "", parseInt(selectedYear), parseInt(selectedMonth));
        },
        enabled: true, // Always enabled since auth is disabled on backend
    });

    const months = [
        { value: "1", label: "January" },
        { value: "2", label: "February" },
        { value: "3", label: "March" },
        { value: "4", label: "April" },
        { value: "5", label: "May" },
        { value: "6", label: "June" },
        { value: "7", label: "July" },
        { value: "8", label: "August" },
        { value: "9", label: "September" },
        { value: "10", label: "October" },
        { value: "11", label: "November" },
        { value: "12", label: "December" },
    ];

    const years = ["2023", "2024", "2025"];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        Historical Analysis
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Deep dive into past performance metrics and trends.
                    </p>
                </div>

                <div className="flex gap-4 bg-white/50 p-2 rounded-lg backdrop-blur-sm border shadow-sm">
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                        <SelectTrigger className="w-[140px]">
                            <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                            <SelectValue placeholder="Month" />
                        </SelectTrigger>
                        <SelectContent>
                            {months.map((m) => (
                                <SelectItem key={m.value} value={m.value}>
                                    {m.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                        <SelectTrigger className="w-[100px]">
                            <SelectValue placeholder="Year" />
                        </SelectTrigger>
                        <SelectContent>
                            {years.map((y) => (
                                <SelectItem key={y} value={y}>
                                    {y}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Debug Info */}
            {isLoading && <p>Loading data...</p>}
            {error && <p className="text-red-500">Error: {String(error)}</p>}

            {!isLoading && !error && !stats && <p>No data loaded yet (or no data found).</p>}

            {isLoading ? (
                <div className="h-[400px] flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            ) : error ? (
                <div className="p-8 text-center text-red-500 bg-red-50 rounded-lg border border-red-200">
                    <AlertTriangle className="h-10 w-10 mx-auto mb-2" />
                    <p>Failed to load data for this period. It might not be available.</p>
                </div>
            ) : stats ? (
                <>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    Scheduled Trips
                                </CardTitle>
                                <Calendar className="h-4 w-4 text-blue-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-gray-800">{stats.total_scheduled.toLocaleString()}</div>
                                <p className="text-xs text-muted-foreground mt-1">Total trips planned</p>
                            </CardContent>
                        </Card>

                        <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-green-500">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    Completed Trips
                                </CardTitle>
                                <CheckCircle className="h-4 w-4 text-green-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-gray-800">{stats.total_completed.toLocaleString()}</div>
                                <p className="text-xs text-muted-foreground mt-1">Successfully run</p>
                            </CardContent>
                        </Card>

                        <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-red-500">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    Cancellations
                                </CardTitle>
                                <XCircle className="h-4 w-4 text-red-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-gray-800">{stats.cancellations.toLocaleString()}</div>
                                <p className="text-xs text-muted-foreground mt-1">Trips cancelled</p>
                            </CardContent>
                        </Card>

                        <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-purple-500">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    Reliability
                                </CardTitle>
                                <TrendingUp className="h-4 w-4 text-purple-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-gray-800">{stats.reliability_percentage}%</div>
                                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                                    <div
                                        className="bg-purple-500 h-1.5 rounded-full transition-all duration-1000"
                                        style={{ width: `${stats.reliability_percentage}%` }}
                                    ></div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <Card className="hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <CardTitle>Top 5 Routes by Cancellations</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={stats.worst_routes} layout="vertical" margin={{ left: 20 }}>
                                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                            <XAxis type="number" hide />
                                            <YAxis
                                                dataKey="route_id"
                                                type="category"
                                                width={80}
                                                tick={{ fontSize: 12 }}
                                            />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                                cursor={{ fill: 'transparent' }}
                                            />
                                            <Bar dataKey="cancellations" radius={[0, 4, 4, 0]} barSize={20}>
                                                {stats.worst_routes.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={['#ef4444', '#f87171', '#fca5a5', '#fecaca', '#fee2e2'][index] || '#ef4444'} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <CardTitle>Performance Overview</CardTitle>
                            </CardHeader>
                            <CardContent className="flex items-center justify-center h-[300px]">
                                <div className="text-center space-y-4">
                                    <div className="relative h-40 w-40 mx-auto">
                                        <svg className="h-full w-full" viewBox="0 0 36 36">
                                            <path
                                                d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831"
                                                fill="none"
                                                stroke="#e5e7eb"
                                                strokeWidth="3"
                                            />
                                            <path
                                                d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831"
                                                fill="none"
                                                stroke="#10b981"
                                                strokeWidth="3"
                                                strokeDasharray={`${stats.reliability_percentage}, 100`}
                                                className="animate-[spin_1s_ease-out_reverse]"
                                            />
                                        </svg>
                                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                                            <span className="text-3xl font-bold text-gray-800">{stats.reliability_percentage}%</span>
                                            <span className="block text-xs text-muted-foreground">Reliability</span>
                                        </div>
                                    </div>
                                    <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                                        {stats.reliability_percentage > 90 ? "Excellent performance!" : stats.reliability_percentage > 80 ? "Good performance." : "Needs improvement."}
                                        {" "}Based on {stats.total_scheduled.toLocaleString()} scheduled trips.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </>
            ) : null}
        </div>
    );
};

export default HistoryPage;
