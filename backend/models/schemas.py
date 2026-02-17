from pydantic import BaseModel
from typing import List, Optional, Any
from datetime import datetime

# --- Shared Models ---
class Bus(BaseModel):
    bus_id: str
    depot_id: str
    capacity: int

class Route(BaseModel):
    route_id: str
    city: str
    length_km: float

class Stop(BaseModel):
    stop_id: str
    lat: float
    lon: float
    route_id: str
    name: Optional[str] = None

# --- Dashboard KPIs ---
class KPIResponse(BaseModel):
    active_buses: int
    total_routes: int
    delayed_buses: int
    avg_occupancy: float
    total_revenue: float = 0.0

# --- Live Map ---
class BusLocation(BaseModel):
    bus_id: str
    lat: float
    lon: float
    speed: float
    timestamp: datetime
    route_id: Optional[str] = None
    delay_prediction: Optional[float] = 0.0

# --- Analytics ---
class RouteAnalytics(BaseModel):
    route_id: str
    route_name: Optional[str] = None
    avg_delay: float
    total_passengers: int
    utilization_score: float
    revenue: float = 0.0
    reliability: float = 100.0

class DemandForecast(BaseModel):
    route_id: str
    time_slot: datetime
    predicted_demand: int

# --- AI Recommendations ---
class AIRecommendation(BaseModel):
    rec_id: str
    route_id: str
    recommendation: str
    reason: Optional[str]
    expected_impact: Optional[str]
    confidence: float
    status: str
    created_at: datetime
