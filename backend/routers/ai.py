from fastapi import APIRouter, Depends, HTTPException, Request
from typing import List
from models.schemas import AIRecommendation
from dependencies import get_current_user
from services.ai_service import (
    generate_ai_recommendations, 
    predict_delay, 
    forecast_demand,
    detect_anomaly
)
from database import supabase
from datetime import datetime
from pydantic import BaseModel

router = APIRouter(prefix="/api/ai", tags=["AI"])


class DelayPredictionResponse(BaseModel):
    bus_id: str
    route_id: str
    predicted_delay: float
    confidence: float
    timestamp: datetime


class DemandForecastResponse(BaseModel):
    route_id: str
    time_slot: datetime
    predicted_demand: int
    peak_hour: bool


class AnomalyResponse(BaseModel):
    bus_id: str
    route_id: str
    is_anomaly: bool
    occupancy: float
    delay: float
    speed: float
    reason: str


class FeedbackRequest(BaseModel):
    rec_id: str
    action: str  # 'accept', 'reject', 'modify'
    comment: str = ""


@router.get("/recommendations", response_model=List[AIRecommendation])
async def get_ai_recommendations(request: Request, user = Depends(get_current_user)):
    """
    Get AI-generated recommendations for fleet optimization.
    """
    simulation = request.app.state.simulation
    buses = simulation.buses.values()
    
    recs = []
    # Generate recommendations for critical/minor delay buses
    count = 0
    for bus in buses:
        if count >= 5: break # Limit to 5 recommendations
        
        # Check for issues
        if bus.status in ["critical-delay", "minor-delay"] or bus.occupancy > 80:
            try:
                rec_data = generate_ai_recommendations(bus.route.route_id, bus_state={
                    "delay": bus.delay_minutes,
                    "occupancy": bus.occupancy,
                    "status": bus.status,
                    "speed": bus.speed
                })
                
                print(f"Generated rec_data for {bus.bus_id}: {rec_data}")
                
                # Ensure all required fields are present
                if "status" not in rec_data:
                    rec_data["status"] = "pending"
                
                recs.append(
                    AIRecommendation(
                        rec_id=f"rec-{bus.bus_id}-{int(datetime.now().timestamp())}",
                        route_id=bus.route.route_id,
                        **rec_data,
                        created_at=datetime.now()
                    )
                )
                count += 1
            except Exception as e:
                print(f"Error creating recommendation for bus {bus.bus_id}: {e}")
                # Continue to next bus instead of failing entire request
                continue
            
    return recs


@router.get("/delay/{bus_id}", response_model=DelayPredictionResponse)
async def get_delay_prediction(
    bus_id: str, 
    request: Request,
    user = Depends(get_current_user)
):
    """
    Get delay prediction for a specific bus using ML model.
    """
    simulation = request.app.state.simulation
    
    # Find bus
    if bus_id not in simulation.buses:
        raise HTTPException(status_code=404, detail="Bus not found")
    
    bus = simulation.buses[bus_id]
    route_id = bus.route.route_id
    
    # Get prediction
    predicted_delay = predict_delay(route_id, bus_id)
    
    return DelayPredictionResponse(
        bus_id=bus_id,
        route_id=route_id,
        predicted_delay=predicted_delay,
        confidence=0.85,  # Model confidence
        timestamp=datetime.now()
    )


@router.get("/demand/{route_id}", response_model=DemandForecastResponse)
async def get_demand_forecast(
    route_id: str,
    hour: int = None,
    user = Depends(get_current_user)
):
    """
    Get demand forecast for a specific route.
    """
    from datetime import datetime
    
    # Create time slot
    now = datetime.now()
    if hour is not None:
        time_slot = now.replace(hour=hour, minute=0, second=0, microsecond=0)
    else:
        time_slot = now
    
    # Get forecast
    predicted_demand = forecast_demand(route_id, time_slot)
    
    is_peak = (7 <= time_slot.hour <= 10) or (17 <= time_slot.hour <= 20)
    
    return DemandForecastResponse(
        route_id=route_id,
        time_slot=time_slot,
        predicted_demand=predicted_demand,
        peak_hour=is_peak
    )


@router.get("/anomalies", response_model=List[AnomalyResponse])
async def get_anomalies(request: Request, user = Depends(get_current_user)):
    """
    Get list of buses with detected anomalies.
    """
    simulation = request.app.state.simulation
    anomalies = []
    
    for bus in simulation.buses.values():
        is_anomaly = detect_anomaly(bus.occupancy, bus.delay_minutes, bus.speed)
        
        if is_anomaly:
            # Determine reason
            reasons = []
            if bus.occupancy > 95:
                reasons.append("overcrowding")
            if bus.delay_minutes > 30:
                reasons.append("critical delay")
            if bus.speed < 5:
                reasons.append("stalled")
            
            anomalies.append(AnomalyResponse(
                bus_id=bus.bus_id,
                route_id=bus.route.route_id,
                is_anomaly=True,
                occupancy=bus.occupancy,
                delay=bus.delay_minutes,
                speed=bus.speed,
                reason=", ".join(reasons) if reasons else "statistical anomaly"
            ))
    
    return anomalies


@router.post("/feedback")
async def submit_feedback(
    feedback: FeedbackRequest,
    user = Depends(get_current_user)
):
    """
    Submit feedback on an AI recommendation.
    """
    # Store feedback (in production, would go to database)
    # For now, just log it
    print(f"Feedback received for {feedback.rec_id}: {feedback.action} - {feedback.comment}")
    
    return {
        "status": "success",
        "message": "Feedback recorded",
        "rec_id": feedback.rec_id
    }

