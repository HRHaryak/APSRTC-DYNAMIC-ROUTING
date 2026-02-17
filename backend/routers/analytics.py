from fastapi import APIRouter, Depends, Request
from typing import List, Dict
from models.schemas import RouteAnalytics
from dependencies import get_current_user
from database import supabase
from pydantic import BaseModel

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


class ODFlowResponse(BaseModel):
    origin: str
    destination: str
    passenger_count: int
    revenue: float
    trip_count: int


class TemporalPattern(BaseModel):
    hour: int
    avg_demand: float
    avg_occupancy: float
    avg_delay: float


class EfficiencyMetrics(BaseModel):
    route_id: str
    total_trips: int
    on_time_percentage: float
    avg_speed: float
    fuel_efficiency: float
    revenue_per_km: float


@router.get("/routes", response_model=List[RouteAnalytics])
async def get_route_analytics(request: Request, user = Depends(get_current_user)):
    """
    Get analytics for all routes.
    """
    simulation = request.app.state.simulation
    return simulation.get_route_analytics()


@router.get("/od-matrix/{route_id}", response_model=List[ODFlowResponse])
async def get_od_matrix(route_id: str, user = Depends(get_current_user)):
    """
    Get origin-destination flow matrix for a specific route.
    """
    # Load OD matrix from data loader
    try:
        from services.data_loader import data_loader
        
        if not data_loader.data_cache:
            data_loader.load_all_data()
        
        od_matrix = data_loader.compute_od_matrix()
        
        if od_matrix is None or len(od_matrix) == 0:
            return []
        
        # Convert to response format
        flows = []
        for _, row in od_matrix.head(50).iterrows():  # Limit to top 50 flows
            flows.append(ODFlowResponse(
                origin=row.get('origin', 'Unknown'),
                destination=row.get('destination', 'Unknown'),
                passenger_count=int(row.get('total_passengers', row.get('trip_count', 0))),
                revenue=float(row.get('total_revenue', 0)),
                trip_count=int(row.get('trip_count', 0))
            ))
        
        return flows
    except Exception as e:
        print(f"Error computing OD matrix: {e}")
        return []


@router.get("/temporal-patterns", response_model=List[TemporalPattern])
async def get_temporal_patterns(request: Request, user = Depends(get_current_user)):
    """
    Get hourly demand and performance patterns.
    """
    simulation = request.app.state.simulation
    
    # Aggregate by hour from current bus states
    hourly_data = {}
    
    for bus in simulation.buses.values():
        hour = bus.last_updated.hour
        
        if hour not in hourly_data:
            hourly_data[hour] = {
                'demand': [],
                'occupancy': [],
                'delay': []
            }
        
        hourly_data[hour]['demand'].append(bus.occupancy * 0.5)  # Approximate demand
        hourly_data[hour]['occupancy'].append(bus.occupancy)
        hourly_data[hour]['delay'].append(bus.delay_minutes)
    
    # Calculate averages
    patterns = []
    for hour in range(24):
        if hour in hourly_data:
            data = hourly_data[hour]
            patterns.append(TemporalPattern(
                hour=hour,
                avg_demand=sum(data['demand']) / len(data['demand']),
                avg_occupancy=sum(data['occupancy']) / len(data['occupancy']),
                avg_delay=sum(data['delay']) / len(data['delay'])
            ))
        else:
            # No data for this hour
            patterns.append(TemporalPattern(
                hour=hour,
                avg_demand=0,
                avg_occupancy=0,
                avg_delay=0
            ))
    
    return patterns


@router.get("/efficiency", response_model=List[EfficiencyMetrics])
async def get_efficiency_metrics(request: Request, user = Depends(get_current_user)):
    """
    Get efficiency metrics for all routes.
    """
    simulation = request.app.state.simulation
    metrics = []
    
    for route_id, route in simulation.routes.items():
        # Get buses on this route
        buses_on_route = [b for b in simulation.buses.values() if b.route.route_id == route_id]
        
        if not buses_on_route:
            continue
        
        # Calculate metrics
        total_delay = sum(b.delay_minutes for b in buses_on_route)
        on_time_count = sum(1 for b in buses_on_route if b.status == "on-time")
        on_time_pct = (on_time_count / len(buses_on_route)) * 100 if buses_on_route else 0
        
        avg_speed = sum(b.speed for b in buses_on_route) / len(buses_on_route)
        
        # Get revenue from route stats
        stats = simulation.route_stats.get(route_id, {})
        revenue = stats.get('revenue', 0)
        
        # Estimate route length (simplified)
        route_length = len(route.path) * 2  # Approximate km
        
        metrics.append(EfficiencyMetrics(
            route_id=route_id,
            total_trips=len(buses_on_route),
            on_time_percentage=on_time_pct,
            avg_speed=avg_speed,
            fuel_efficiency=avg_speed / 10,  # Simplified fuel efficiency
            revenue_per_km=revenue / route_length if route_length > 0 else 0
        ))
    
    return metrics

