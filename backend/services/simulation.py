import asyncio
import random
from typing import List, Dict, Optional
from datetime import datetime, timedelta
import math
import pandas as pd
import os

class Route:
    def __init__(self, route_id: str, name: str, path: List[Dict[str, float]]):
        self.route_id = route_id
        self.name = name
        self.path = path  # List of {lat, lon}
        self.stops = path # For simplicity, treat all path points as stops

class Bus:
    def __init__(self, bus_id: str, route: Route):
        self.bus_id = bus_id
        self.route = route
        self.current_stop_index = 0
        self.progress_to_next = 0.0 # 0.0 to 1.0
        self.speed = 0.0 # km/h
        self.status = "on-time" # on-time, minor-delay, critical-delay
        self.delay_minutes = 0.0
        self.occupancy = random.randint(10, 50)
        self.last_updated = datetime.now()
        # Handle empty paths
        if route.path:
            self.lat = route.path[0]['lat']
            self.lon = route.path[0]['lon']
        else:
            self.lat = 0.0
            self.lon = 0.0

    def update_position(self, delta_seconds: float):
        if not self.route.path:
            return

        # Simulate movement
        if self.status == "critical-delay":
            speed_factor = 0.2
        elif self.status == "minor-delay":
            speed_factor = 0.6
        else:
            speed_factor = 1.0

        # Move along the path segments
        # Simplified: Move percentage along current segment
        
        # Distance between current stop and next
        current_stop = self.route.path[self.current_stop_index]
        next_index = (self.current_stop_index + 1) % len(self.route.path)
        next_stop = self.route.path[next_index]

        # Calculate distance (rough approx)
        dist = math.sqrt((next_stop['lat'] - current_stop['lat'])**2 + (next_stop['lon'] - current_stop['lon'])**2)
        if dist == 0: dist = 0.001

        # Move
        # Adjust speed factor for lat/lon degrees (very rough approx, 1 deg ~= 111km)
        # Assuming speed 40km/h approx
        step = (0.0001 * delta_seconds * speed_factor) / dist
        self.progress_to_next += step

        if self.progress_to_next >= 1.0:
            self.progress_to_next = 0.0
            self.current_stop_index = next_index
            
            # Simulate passenger exchange at stop
            change = random.randint(-5, 10)
            self.occupancy = max(0, min(100, self.occupancy + change))

        # Interpolate position
        current_stop = self.route.path[self.current_stop_index]
        next_stop = self.route.path[(self.current_stop_index + 1) % len(self.route.path)]
        
        self.lat = current_stop['lat'] + (next_stop['lat'] - current_stop['lat']) * self.progress_to_next
        self.lon = current_stop['lon'] + (next_stop['lon'] - current_stop['lon']) * self.progress_to_next
        
        self.last_updated = datetime.now()

class TransportSimulation:
    def __init__(self):
        self.routes: Dict[str, Route] = {}
        self.buses: Dict[str, Bus] = {}
        self.running = False
        self._init_data()

    def _init_data(self):
        # Load real data
        try:
            self.load_real_data()
        except Exception as e:
            print(f"Error loading real data: {e}")
            print("Falling back to mock data.")
            self._init_mock_data()

    def load_real_data(self):
        # Paths hardcoded for now as per user environment
        base_path = "C:/Users/bhava/Desktop/RTGS"
        network_file = f"{base_path}/2years/network_information_2years.csv"
        schedule_file = f"{base_path}/2years/sehedule_information_2years.csv"
        ticketing_file = f"{base_path}/Ticketing_Data.csv"
        haltwise_file = f"{base_path}/HaltWiseData_22Apr2025.xls"
        
        # Fallback to root if 2years file not found
        if not os.path.exists(network_file):
            print(f"Warning: 2years network file not found at {network_file}. Trying root.")
            network_file = f"{base_path}/Network information.csv"

        if not os.path.exists(network_file):
            raise FileNotFoundError(f"File not found: {network_file}")

        print(f"Loading network data from {network_file}...")
        # Use iterator for large files if needed, or just read_csv if memory sufficient (64GB RAM assumption from env)
        # Using low_memory=False to avoid dtypes warnings, or specify dtypes
        df = pd.read_csv(network_file, low_memory=False)
        
        # Ensure lat/lon are numeric and drop invalid rows
        df['LATITUDE'] = pd.to_numeric(df['LATITUDE'], errors='coerce')
        df['LONGITUDE'] = pd.to_numeric(df['LONGITUDE'], errors='coerce')
        df = df.dropna(subset=['LATITUDE', 'LONGITUDE', 'ROUTE_ID', 'SEQ_NO'])
        
        # Group by Route ID
        # Limit to first 50 routes to avoid memory overload for now
        route_ids = df['ROUTE_ID'].unique()[:50]
        
        count = 0
        for r_id in route_ids:
            route_df = df[df['ROUTE_ID'] == r_id].sort_values('SEQ_NO')
            
            # Extract path
            path = []
            for _, row in route_df.iterrows():
                path.append({
                    "lat": row['LATITUDE'],
                    "lon": row['LONGITUDE'],
                    "name": row['STOP_NAME'] if 'STOP_NAME' in row else "Stop"
                })
            
            if len(path) > 1:
                route_name = str(route_df.iloc[0]['ROUTE_CODE']) if 'ROUTE_CODE' in route_df.columns else f"Route {r_id}"
                # Handle unique route keys if needed, but ROUTE_ID should be unique
                self.routes[str(r_id)] = Route(str(r_id), route_name, path)
                count += 1

        print(f"Loaded {count} routes.")

        # Load Schedule Data
        self.schedule_df = None
        if os.path.exists(schedule_file):
            print(f"Loading schedule data from {schedule_file}...")
            try:
                # Load minimal columns to save memory
                # Columns observed: SERVICE_ID, SERVICE_TYPE_NAME, ROUTE_ID, TOTAL_TRAVEL_MINUTES
                self.schedule_df = pd.read_csv(schedule_file, usecols=['SERVICE_ID', 'ROUTE_ID', 'TOTAL_TRAVEL_MINUTES'], low_memory=False)
                print(f"Schedule data loaded: {len(self.schedule_df)} records.")
            except Exception as e:
                print(f"Error loading schedule data: {e}")

        # Load Ticketing Data for Revenue & Occupancy
        self.route_stats = {}
        if os.path.exists(ticketing_file):
            print(f"Loading ticketing data from {ticketing_file}...")
            try:
                # Load only necessary columns
                tdf = pd.read_csv(ticketing_file, usecols=['ROUTE_ID', 'TOTAL_AMOUNT', 'TICKET_TYPE'])
                # Group by ROUTE_ID
                revenue_df = tdf.groupby('ROUTE_ID')['TOTAL_AMOUNT'].sum().reset_index()
                # Store in a dict for easy lookup
                for _, row in revenue_df.iterrows():
                    rid = str(row['ROUTE_ID'])
                    if rid not in self.route_stats: self.route_stats[rid] = {}
                    self.route_stats[rid]['revenue'] = float(row['TOTAL_AMOUNT'])
                print("Ticketing data loaded.")
            except Exception as e:
                print(f"Error loading ticketing data: {e}")

        # Load HaltWise Data for Reliability
        if os.path.exists(haltwise_file):
             print(f"Loading haltwise data from {haltwise_file}...")
             try:
                 # Load minimal columns
                 hdf = pd.read_excel(haltwise_file, usecols=['RouteID', 'isCancelled'])
                 # Calculate cancellation rate or just count
                 reliability_df = hdf.groupby('RouteID').agg(
                     total_trips=('isCancelled', 'count'),
                     cancelled=('isCancelled', 'sum')
                 ).reset_index()
                 
                 for _, row in reliability_df.iterrows():
                     rid = str(row['RouteID'])
                     if rid not in self.route_stats: self.route_stats[rid] = {}
                     # Simple reliability: 1 - cancellation_rate
                     rate = 1.0 - (row['cancelled'] / row['total_trips'] if row['total_trips'] > 0 else 0)
                     self.route_stats[rid]['reliability'] = round(rate * 100, 1) # Percentage
                 print("Haltwise data loaded.")
             except Exception as e:
                 print(f"Error loading haltwise data: {e}")

        # Initialize Buses - put 1-2 buses on each route
        bus_count = 0
        for r_id, route in self.routes.items():
            # Bus 1
            b_id = f"BUS-{r_id}-1"
            self.buses[b_id] = Bus(b_id, route)
            # Randomize start position
            self.buses[b_id].current_stop_index = random.randint(0, max(0, len(route.path) - 2))
            bus_count += 1
            
            # Chance for Bus 2
            if random.random() > 0.5:
                b_id2 = f"BUS-{r_id}-2"
                self.buses[b_id2] = Bus(b_id2, route)
                self.buses[b_id2].current_stop_index = random.randint(0, max(0, len(route.path) - 2))
                bus_count += 1
        
        print(f"Initialized {bus_count} buses.")

    def _init_mock_data(self):
        # Initialize some routes centered around Vijayawada (approx lat 16.5, lon 80.6)
        # Using the coords from the user's LiveMap.tsx as reference but making them more realistic for Vijayawada
        
        # Route 1: Benz Circle -> Bus Station
        r1_path = [
            {"lat": 16.5062, "lon": 80.6480}, # Benz Circle
            {"lat": 16.5100, "lon": 80.6400},
            {"lat": 16.5150, "lon": 80.6300},
            {"lat": 16.5180, "lon": 80.6200}, # Bus Station area
        ]
        self.routes["R-5A"] = Route("R-5A", "Benz Circle Expr", r1_path)

        # Route 2: 
        r2_path = [
            {"lat": 16.5200, "lon": 80.6200},
            {"lat": 16.5250, "lon": 80.6250},
            {"lat": 16.5300, "lon": 80.6350},
        ]
        self.routes["R-12B"] = Route("R-12B", "City Loop", r2_path)
        
        # Route 3
        r3_path = [
             {"lat": 16.5000, "lon": 80.6000},
             {"lat": 16.5050, "lon": 80.6100},
             {"lat": 16.5100, "lon": 80.6200},
        ]
        self.routes["R-47C"] = Route("R-47C", "Ind. Park Line", r3_path)
        self.route_stats = {} # Empty for mock

        # Initialize Buses
        self.buses["BUS-101"] = Bus("BUS-101", self.routes["R-5A"])
        self.buses["BUS-102"] = Bus("BUS-102", self.routes["R-12B"])
        self.buses["BUS-103"] = Bus("BUS-103", self.routes["R-5A"]) # Second bus on route 1
        self.buses["BUS-103"].progress_to_next = 0.5 # Start mid-way
        
        self.buses["BUS-201"] = Bus("BUS-201", self.routes["R-47C"])

    async def run(self):
        self.running = True
        print("Simulation started.")
        while self.running:
            self.update(1.0) # Update every second
            await asyncio.sleep(1.0)

    def update(self, delta_seconds: float):
        for bus_id, bus in self.buses.items():
            bus.update_position(delta_seconds)
            
            # Random events
            # 1% chance to change delay status
            if random.random() < 0.01:
                r = random.random()
                if r < 0.1:
                    bus.status = "critical-delay"
                    bus.delay_minutes = random.randint(15, 45)
                elif r < 0.4:
                    bus.status = "minor-delay"
                    bus.delay_minutes = random.randint(5, 14)
                else:
                    bus.status = "on-time"
                    bus.delay_minutes = random.randint(0, 4)

    def get_all_buses(self) -> List[Dict]:
        return [
            {
                "bus_id": b.bus_id,
                "route_id": b.route.route_id,
                "lat": b.lat,
                "lon": b.lon,
                "speed": b.speed,
                "timestamp": b.last_updated,
                "delay_prediction": b.delay_minutes,
                "status": b.status,
                "occupancy": b.occupancy
            }
            for b in self.buses.values()
        ]
    
    def get_kpis(self) -> Dict:
        total_buses = len(self.buses)
        delayed = sum(1 for b in self.buses.values() if b.status != "on-time")
        active = total_buses # For now all are active
        
        total_occ = sum(b.occupancy for b in self.buses.values())
        avg_occ = round(total_occ / total_buses, 1) if total_buses > 0 else 0
        
        # Calculate system-wide revenue if available
        total_revenue = 0
        if hasattr(self, 'route_stats'):
            total_revenue = sum(s.get('revenue', 0) for s in self.route_stats.values())

        return {
            "active_buses": active,
            "total_routes": len(self.routes),
            "delayed_buses": delayed,
            "avg_occupancy": avg_occ,
            "total_revenue": total_revenue
        }

    def get_route_analytics(self) -> List[Dict]:
        analytics = []
        for r_id, route in self.routes.items():
            buses_on_route = [b for b in self.buses.values() if b.route.route_id == r_id]
            
            # Get static stats
            stats = self.route_stats.get(r_id, {})
            revenue = stats.get('revenue', 0)
            reliability = stats.get('reliability', 100.0)
            
            # Live stats
            if buses_on_route:
                avg_delay = sum(b.delay_minutes for b in buses_on_route) / len(buses_on_route)
                avg_occupancy = sum(b.occupancy for b in buses_on_route) / len(buses_on_route)
            else:
                avg_delay = 0
                avg_occupancy = 0
                
            analytics.append({
                "route_id": r_id,
                "route_name": route.name,
                "avg_delay": round(avg_delay, 1),
                "total_passengers": int(avg_occupancy * 10), # Placeholder for real pax count
                "utilization_score": round(min(1.0, avg_occupancy / 100), 2),
                "revenue": revenue,
                "reliability": reliability
            })
        return analytics

simulation = TransportSimulation()
