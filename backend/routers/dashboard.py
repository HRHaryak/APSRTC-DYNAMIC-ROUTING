from fastapi import APIRouter, Depends, HTTPException, Request
from models.schemas import KPIResponse
from dependencies import get_current_user
from database import supabase
from services.ai_service import predict_delay

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/kpis", response_model=KPIResponse)
async def get_dashboard_kpis(request: Request, user = Depends(get_current_user)):
    """
    Get key performance indicators for the dashboard.
    """
    try:
        simulation = request.app.state.simulation
        kpis = simulation.get_kpis()
        
        return KPIResponse(**kpis)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
