export interface KPIResponse {
    active_buses: number;
    total_routes: number;
    delayed_buses: number;
    avg_occupancy: number;
    total_revenue: number;
}

export interface RouteAnalytics {
    route_id: string;
    route_name?: string;
    avg_delay: number;
    total_passengers: number;
    utilization_score: number;
    revenue: number;
    reliability: number;
}

export interface MonthlyStats {
    total_scheduled: number;
    total_completed: number;
    reliability_percentage: number;
    cancellations: number;
    worst_routes: { route_id: string; cancellations: number }[];
}

export interface WeeklyDelayData {
    day: string;
    before: number;
    after: number;
}

export interface FleetStatusItem {
    name: string;
    value: number;
    color: string;
}

export interface CongestionZone {
    zone: string;
    score: number;
}

export interface ReportsData {
    weekly_delay: WeeklyDelayData[];
    fleet_status: FleetStatusItem[];
    congestion_zones: CongestionZone[];
    avg_delay_reduction: string;
    fleet_utilization: string;
    routes_optimized: number;
    passengers_served: string;
}
