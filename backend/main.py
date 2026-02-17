from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv()

from contextlib import asynccontextmanager
import asyncio
from services.simulation import simulation

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifespan (startup/shutdown)."""
    # Startup
    print("APSRTC Application Starting...")
    
    # Initialize ML models
    print("\n[1/3] Initializing ML models...")
    try:
        from services.model_init import initialize_models
        initialize_models()
    except Exception as e:
        print(f"⚠️ Model initialization failed: {e}")
    
    # Start simulation
    print("\n[2/3] Starting simulation...")
    app.state.simulation = simulation
    app.state.sim_task = asyncio.create_task(simulation.run())
    print("✓ Simulation task started")
    
    # Start background tasks
    print("\n[3/3] Starting background tasks...")
    try:
        from services.background_tasks import scheduler
        app.state.background_task = asyncio.create_task(scheduler.start())
    except Exception as e:
        print(f"⚠️ Background tasks failed: {e}")
        app.state.background_task = None
    
    print("\n✓ Application started successfully!")
    
    yield
    
    # Shutdown
    print("\nShutting down...")
    simulation.running = False
    
    try:
        from services.background_tasks import scheduler
        await scheduler.stop()
    except:
        pass
    
    await sim_task
    if background_task:
        background_task.cancel()
    
    print("✓ Application shutdown complete")

app = FastAPI(title="Route Insight Hub API", lifespan=lifespan)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all for now, restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add audit middleware
try:
    from middleware.audit_middleware import AuditMiddleware
    app.add_middleware(AuditMiddleware)
    print("✓ Audit middleware enabled")
except Exception as e:
    print(f"⚠️ Audit middleware not loaded: {e}")

@app.get("/")
def read_root():
    return {
        "message": "APSRTC Route Insight Hub API",
        "version": "2.0",
        "features": {
            "ml_models": True,
            "real_time_prediction": True,
            "anomaly_detection": True,
            "background_tasks": True
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint with ML model status."""
    try:
        from services.ml_models import delay_model, demand_model, anomaly_model
        ml_status = {
            "delay_model": delay_model.is_trained if delay_model else False,
            "demand_model": demand_model.is_trained if demand_model else False,
            "anomaly_model": anomaly_model.is_trained if anomaly_model else False
        }
    except Exception as e:
        ml_status = {"error": str(e)}
    
    try:
        from services.background_tasks import scheduler
        background_status = scheduler.get_status()
    except Exception as e:
        background_status = {"error": str(e)}
    
    return {
        "status": "healthy",
        "ml_models": ml_status,
        "background_tasks": background_status
    }

# Include routers
from routers import dashboard, live, analytics, ai, auth, history, reports, admin

app.include_router(dashboard.router)
app.include_router(live.router)
app.include_router(analytics.router)
app.include_router(ai.router)
app.include_router(auth.router)
app.include_router(history.router)
app.include_router(reports.router)
app.include_router(admin.router)
