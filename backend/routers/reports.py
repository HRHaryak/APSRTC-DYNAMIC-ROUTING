from fastapi import APIRouter, HTTPException, Query, Request
from typing import List, Dict
from pydantic import BaseModel
from datetime import datetime, timedelta
import random

router = APIRouter(
    prefix="/api/reports",
    tags=["reports"],
    responses={404: {"description": "Not found"}},
)

# Response Models
class WeeklyDelayData(BaseModel):
    day: str
    before: float
    after: float

class FleetStatusItem(BaseModel):
    name: str
    value: int
    color: str

class CongestionZone(BaseModel):
    zone: str
    score: int

class ReportsData(BaseModel):
    weekly_delay: List[WeeklyDelayData]
    fleet_status: List[FleetStatusItem]
    congestion_zones: List[CongestionZone]
    avg_delay_reduction: str
    fleet_utilization: str
    routes_optimized: int
    passengers_served: str

@router.get("/performance", response_model=ReportsData)
async def get_performance_reports(request: Request):
    """
    Get aggregated performance reports combining booking data and simulation state.
    """
    simulation = request.app.state.simulation
    
    # Fleet Status from Simulation
    fleet_status = []
    active = len([b for b in simulation.buses.values() if b.status in ["on-time", "minor-delay", "critical-delay"]])
    maintenance = random.randint(80, 100)  # Mock maintenance count
    idle = random.randint(30, 50)
    standby = random.randint(100, 150)
    
    fleet_status = [
        FleetStatusItem(name="Active", value=active, color="hsl(152, 60%, 36%)"),
        FleetStatusItem(name="Maintenance", value=maintenance, color="hsl(36, 80%, 48%)"),
        FleetStatusItem(name="Idle", value=idle, color="hsl(0, 72%, 50%)"),
        FleetStatusItem(name="Standby", value=standby, color="hsl(220, 70%, 35%)"),
    ]
    
    # Weekly Delay Trends (simulated comparison)
    weekly_delay = [
        WeeklyDelayData(day="Mon", before=12.5, after=7.2),
        WeeklyDelayData(day="Tue", before=10.8, after=6.4),
        WeeklyDelayData(day="Wed", before=14.2, after=8.1),
        WeeklyDelayData(day="Thu", before=11.3, after=6.9),
        WeeklyDelayData(day="Fri", before=15.6, after=9.2),
        WeeklyDelayData(day="Sat", before=8.4, after=5.1),
        WeeklyDelayData(day="Sun", before=6.2, after=4.0),
    ]
    
    # Congestion Zones from Live Buses
    route_delays = {}
    for bus in simulation.buses.values():
        route_id = bus.route.route_id
        if route_id not in route_delays:
            route_delays[route_id] = []
        route_delays[route_id].append(bus.delay_minutes)
    
    # Calculate average delays per route
    congestion_data = []
    for route_id, delays in sorted(route_delays.items(), key=lambda x: sum(x[1])/len(x[1]) if x[1] else 0, reverse=True)[:8]:
        avg_delay = sum(delays) / len(delays) if delays else 0
        # Convert delay to congestion score (0-100)
        score = min(100, int(avg_delay * 5))
        # Use route name if available
        route_name = f"Route {route_id}"
        congestion_data.append(CongestionZone(zone=route_name, score=score))
    
    # Summary Stats
    total_buses = len(simulation.buses)
    utilization = (active / total_buses * 100) if total_buses > 0 else 0
    
    # Calculate delay reduction (compare current avg to baseline)
    all_delays = [b.delay_minutes for b in simulation.buses.values()]
    avg_current_delay = sum(all_delays) / len(all_delays) if all_delays else 0
    baseline_delay = 12.0  # Assumed baseline before optimization
    reduction = ((baseline_delay - avg_current_delay) / baseline_delay * 100) if baseline_delay > 0 else 0
    
    return ReportsData(
        weekly_delay=weekly_delay,
        fleet_status=fleet_status,
        congestion_zones=congestion_data,
        avg_delay_reduction=f"{reduction:.0f}%",
        fleet_utilization=f"{utilization:.1f}%",
        routes_optimized=len(route_delays),
        passengers_served="2.4M"  # Could be calculated from booking data
    )
