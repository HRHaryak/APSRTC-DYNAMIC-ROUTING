"""
Admin router for system administration tasks.
Includes audit logs, compliance reports, and user management.
"""
from fastapi import APIRouter, Depends, Query
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from dependencies import require_admin, User
from services.audit_service import get_audit_logs
from services.compliance_service import (
    get_data_retention_policy,
    validate_data_minimization,
    check_consent_requirements
)

router = APIRouter(prefix="/api/admin", tags=["Administration"])


class AuditLogEntry(BaseModel):
    timestamp: str
    event_type: str
    username: str
    action: str
    resource: Optional[str]
    details: dict
    ip_address: Optional[str]
    success: bool


class ComplianceReport(BaseModel):
    retention_policy: dict
    consent_requirements: dict
    data_minimization_check: dict


@router.get("/audit-logs", response_model=List[AuditLogEntry])
async def get_audit_log(
    limit: int = Query(100, le=1000),
    username: Optional[str] = None,
    event_type: Optional[str] = None,
    current_user: User = Depends(require_admin)
):
    """
    Get audit logs (admin only).
    
    Filters:
    - limit: Maximum number of logs (default 100, max 1000)
    - username: Filter by username
    - event_type: Filter by event type (auth, api, admin, data, model)
    """
    logs = get_audit_logs(
        limit=limit,
        username=username,
        event_type=event_type
    )
    
    return logs


@router.get("/compliance-report", response_model=ComplianceReport)
async def get_compliance_report(current_user: User = Depends(require_admin)):
    """
    Get DPDP Act 2023 compliance report (admin only).
    """
    # Get retention policy
    retention_policy = get_data_retention_policy()
    
    # Check consent requirements for common operations
    consent_requirements = {
        "passenger_data_collection": check_consent_requirements("collect", "personal"),
        "data_sharing": check_consent_requirements("share", "sensitive"),
        "cross_border_transfer": check_consent_requirements("transfer", "sensitive")
    }
    
    # Example data minimization check
    data_minimization_check = validate_data_minimization(
        requested_fields=['route_id', 'timestamp', 'passenger_count', 'occupancy'],
        business_purpose='demand_forecasting'
    )
    
    return {
        "retention_policy": retention_policy,
        "consent_requirements": consent_requirements,
        "data_minimization_check": data_minimization_check
    }


@router.get("/system-stats")
async def get_system_stats(current_user: User = Depends(require_admin)):
    """
    Get system statistics (admin only).
    """
    try:
        from services.ml_models import delay_model, demand_model, anomaly_model
        from services.background_tasks import scheduler
        from services.auth_service import list_users
        
        ml_stats = {
            "delay_model_trained": delay_model.is_trained if delay_model else False,
            "demand_model_trained": demand_model.is_trained if demand_model else False,
            "anomaly_model_trained": anomaly_model.is_trained if anomaly_model else False
        }
        
        background_stats = scheduler.get_status()
        
        user_count = len(list_users())
        
        return {
            "ml_models": ml_stats,
            "background_tasks": background_stats,
            "total_users": user_count,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return {
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }


@router.post("/retrain-models")
async def retrain_models(current_user: User = Depends(require_admin)):
    """
    Trigger model retraining (admin only).
    """
    try:
        from services.model_trainer import train_all_models
        from services.audit_service import log_admin_action
        import asyncio
        
        # Log action
        log_admin_action(
            username=current_user.username,
            action="retrain_models",
            target="all_ml_models",
            details={"triggered_by": "manual"}
        )
        
        # Trigger training in background
        asyncio.create_task(train_all_models())
        
        return {
            "status": "success",
            "message": "Model retraining started in background",
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
            "timestamp": datetime.now().isoformat()
        }
