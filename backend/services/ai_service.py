from typing import List, Dict, Optional
import random
from datetime import datetime, timedelta
import os
from mistralai import Mistral
import json

# Initialize Mistral Client
api_key = os.environ.get("MISTRAL_API_KEY")
client = None

if api_key:
    try:
        client = Mistral(api_key=api_key)
    except Exception as e:
        print(f"Failed to initialize Mistral client: {e}")

# Mock data generators for initial testing
def predict_delay(route_id: str, bus_id: str) -> float:
    """Mock delay prediction logic."""
    # In real implementation, this would load an ML model
    base_delay = random.uniform(0, 15) # 0 to 15 mins
    # Add some logic based on route_id hash to make it consistent for demo
    seed = sum(ord(c) for c in route_id)
    random.seed(seed + datetime.now().hour) 
    
    return round(base_delay, 1)

def forecast_demand(route_id: str, time_slot: datetime) -> int:
    """Mock demand forecasting logic."""
    hour = time_slot.hour
    if 8 <= hour <= 10 or 17 <= hour <= 19:
        return random.randint(50, 100) # Peak hours
    return random.randint(10, 40) # Off-peak

def generate_ai_recommendations(route_id: str, bus_state: Optional[Dict] = None) -> Dict:
    """
    Generate recommendation using Mistral AI if available, otherwise fallback to mock.
    """
    if not client:
        return _mock_recommendation(route_id, bus_state)

    try:
        # Construct prompt
        if bus_state:
            delay = bus_state.get("delay", 0)
            utilization = bus_state.get("occupancy", 50)
            status = bus_state.get("status", "on-time")
        else:
            delay = predict_delay(route_id, "BUS-000")
            utilization = random.randint(40, 95)
            status = "unknown"
            
        demand = forecast_demand(route_id, datetime.now())
        
        prompt = f"""
        You are an AI transport planning assistant for APSRTC.
        Analyze the following route metrics:
        - Route ID: {route_id}
        - Current Status: {status}
        - Current Predicted Delay: {delay} mins
        - Current Passenger Demand: {demand} pax
        - Bus Utilization: {utilization}%

        Generate a single actionable operational recommendation in JSON format with the following keys:
        - recommendation: A short action title (e.g. "Deploy Extra Bus")
        - reason: A concise explanation (max 1 sentence)
        - expected_impact: Quantitative impact (e.g. "Reduce delay by 10%")
        - confidence: A float between 0.0 and 1.0 representing confidence level.

        Do not output markdown code blocks. Just the JSON object.
        """

        response = client.chat.complete(
            model="mistral-tiny",
            messages=[{"role": "user", "content": prompt}]
        )

        content = response.choices[0].message.content
        # Clean up code blocks if present
        if "```json" in content:
            content = content.replace("```json", "").replace("```", "")
        
        rec_data = json.loads(content)
        # Ensure status field is present (default to "pending" if not)
        if "status" not in rec_data:
            rec_data["status"] = "pending"
        
        return rec_data

    except Exception as e:
        print(f"Mistral API Error: {e}")
        return _mock_recommendation(route_id, bus_state)

def _mock_recommendation(route_id: str, bus_state: Optional[Dict] = None) -> Dict:
    """Fallback mock recommendation."""
    reasons = []
    rec_list = []
    
    delay = bus_state.get("delay", 0) if bus_state else 0
    occ = bus_state.get("occupancy", 0) if bus_state else 0
    
    if delay > 20:
        reasons.append(f"Critical delay of {delay} mins detected")
        rec_list.append("Deploy backup bus immediately")
        rec_list.append("Short-terminate trip and turn back")
    elif delay > 10:
        reasons.append(f"Minor delay of {delay} mins accumulating")
        rec_list.append("Adjust dwell time at major stops")
        rec_list.append("Skip non-essential stops")
    
    if occ > 90:
        reasons.append("Extreme overcrowding detected")
        rec_list.append("Dispatch reliever bus")
    elif occ < 20:
        reasons.append("Low utilization detected")
        rec_list.append("Merge with following schedule")

    # Defaults if no specific issues
    if not reasons:
        reasons.append("Routine schedule optimization")
        rec_list.append("Maintain current headway")

    return {
        "recommendation": random.choice(rec_list),
        "reason": random.choice(reasons),
        "expected_impact": f"Reduce delay by {random.randint(10, 30)}%",
        "confidence": round(random.uniform(0.7, 0.99), 2),
        "status": "pending"
    }
