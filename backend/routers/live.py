from fastapi import APIRouter, Depends
from typing import List
from models.schemas import BusLocation
from dependencies import get_current_user
from database import supabase
from datetime import datetime

router = APIRouter(prefix="/api/live", tags=["Live"])

from fastapi import Request

@router.get("/buses", response_model=List[BusLocation])
async def get_live_buses(request: Request, user = Depends(get_current_user)):
    """
    Get live location of all active buses.
    """
    simulation = request.app.state.simulation
    buses = simulation.get_all_buses()
    
    # Map simulation format to schema if needed, but dicts align well
    return buses
