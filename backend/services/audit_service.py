"""
Audit logging service for tracking system events and user actions.
Logs stored in JSON files for local compliance.
"""
import json
import os
from datetime import datetime
from typing import Dict, Optional, List
from pathlib import Path

# Audit log file
AUDIT_LOG_FILE = "backend/data/audit_log.jsonl"


def ensure_audit_log():
    """Ensure audit log file exists."""
    os.makedirs(os.path.dirname(AUDIT_LOG_FILE), exist_ok=True)
    
    if not os.path.exists(AUDIT_LOG_FILE):
        # Create empty file
        with open(AUDIT_LOG_FILE, 'w') as f:
            pass


def log_event(
    event_type: str,
    username: str,
    action: str,
    resource: str = None,
    details: Dict = None,
    ip_address: str = None,
    success: bool = True
):
    """
    Log an audit event.
    
    Args:
        event_type: Type of event (auth, api, admin, data, model)
        username: Username performing the action
        action: Action being performed
        resource: Resource being accessed (optional)
        details: Additional details (optional)
        ip_address: Client IP address (optional)
        success: Whether the action succeeded
    """
    ensure_audit_log()
    
    event = {
        "timestamp": datetime.now().isoformat(),
        "event_type": event_type,
        "username": username,
        "action": action,
        "resource": resource,
        "details": details or {},
        "ip_address": ip_address,
        "success": success
    }
    
    # Append to log file (JSONL format - one JSON per line)
    with open(AUDIT_LOG_FILE, 'a') as f:
        f.write(json.dumps(event) + '\n')


def get_audit_logs(
    limit: int = 100,
    username: Optional[str] = None,
    event_type: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None
) -> List[Dict]:
    """
    Retrieve audit logs with optional filtering.
    
    Args:
        limit: Maximum number of logs to return
        username: Filter by username
        event_type: Filter by event type
        start_date: Filter by start date
        end_date: Filter by end date
    
    Returns:
        List of audit log entries
    """
    ensure_audit_log()
    
    logs = []
    
    try:
        with open(AUDIT_LOG_FILE, 'r') as f:
            for line in f:
                if not line.strip():
                    continue
                    
                log = json.loads(line)
                
                # Apply filters
                if username and log.get('username') != username:
                    continue
                
                if event_type and log.get('event_type') != event_type:
                    continue
                
                if start_date:
                    log_time = datetime.fromisoformat(log['timestamp'])
                    if log_time < start_date:
                        continue
                
                if end_date:
                    log_time = datetime.fromisoformat(log['timestamp'])
                    if log_time > end_date:
                        continue
                
                logs.append(log)
                
                # Limit results
                if len(logs) >= limit:
                    break
        
        # Return most recent first
        return list(reversed(logs[-limit:]))
        
    except FileNotFoundError:
        return []


def log_authentication(username: str, success: bool, ip_address: str = None):
    """Log authentication attempt."""
    log_event(
        event_type="auth",
        username=username,
        action="login",
        success=success,
        ip_address=ip_address
    )


def log_api_access(username: str, endpoint: str, method: str, success: bool = True):
    """Log API endpoint access."""
    log_event(
        event_type="api",
        username=username,
        action=f"{method} {endpoint}",
        resource=endpoint,
        success=success
    )


def log_admin_action(username: str, action: str, target: str, details: Dict = None):
    """Log administrative action."""
    log_event(
        event_type="admin",
        username=username,
        action=action,
        resource=target,
        details=details,
        success=True
    )


def log_model_training(username: str, model_name: str, metrics: Dict):
    """Log model training event."""
    log_event(
        event_type="model",
        username=username,
        action="train_model",
        resource=model_name,
        details=metrics,
        success=True
    )


def log_data_access(username: str, data_source: str, operation: str):
    """Log data access event."""
    log_event(
        event_type="data",
        username=username,
        action=operation,
        resource=data_source,
        success=True
    )


# Initialize on import
ensure_audit_log()
