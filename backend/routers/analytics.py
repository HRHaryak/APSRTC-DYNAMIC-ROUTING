from fastapi import APIRouter, Depends, Request
from typing import List
from models.schemas import RouteAnalytics
from dependencies import get_current_user
from database import supabase

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

@router.get("/routes", response_model=List[RouteAnalytics])
async def get_route_analytics(request: Request, user = Depends(get_current_user)):
    """
    Get analytics for all routes.
    """
    simulation = request.app.state.simulation
    return simulation.get_route_analytics()
