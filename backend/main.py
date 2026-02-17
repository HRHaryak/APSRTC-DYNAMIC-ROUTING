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
    # Start simulation in background
    app.state.simulation = simulation
    sim_task = asyncio.create_task(simulation.run())
    yield
    # Stop simulation
    simulation.running = False
    await sim_task

app = FastAPI(title="Route Insight Hub API", lifespan=lifespan)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all for now, restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Route Insight Hub API is running"}

# Include routers
from routers import dashboard, live, analytics, ai, auth, history, reports

app.include_router(dashboard.router)
app.include_router(live.router)
app.include_router(analytics.router)
app.include_router(ai.router)
app.include_router(auth.router)
app.include_router(history.router)
app.include_router(reports.router)
