from fastapi import APIRouter, Depends, HTTPException, Request
from typing import List
from models.schemas import AIRecommendation
from dependencies import get_current_user
from services.ai_service import generate_ai_recommendations
from database import supabase
from datetime import datetime

router = APIRouter(prefix="/api/ai", tags=["AI"])

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
                    "status": bus.status
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
