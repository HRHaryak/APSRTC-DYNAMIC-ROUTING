"""
Middleware to integrate audit logging with FastAPI requests.
"""
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from services.audit_service import log_api_access
import time


class AuditMiddleware(BaseHTTPMiddleware):
    """Middleware to log all API requests for audit purposes."""
    
    async def dispatch(self, request: Request, call_next):
        # Skip logging for health/root endpoints
        if request.url.path in ["/", "/health", "/docs", "/openapi.json"]:
            return await call_next(request)
        
        # Record start time
        start_time = time.time()
        
        # Get user from request if authenticated
        username = "anonymous"
        try:
            if hasattr(request.state, "user"):
                username = request.state.user.get("username", "anonymous")
        except:
            pass
        
        # Process request
        response = await call_next(request)
        
        # Log API access
        try:
            success = response.status_code < 400
            
            log_api_access(
                username=username,
                endpoint=request.url.path,
                method=request.method,
                success=success
            )
        except Exception as e:
            print(f"Error logging audit event: {e}")
        
        return response
