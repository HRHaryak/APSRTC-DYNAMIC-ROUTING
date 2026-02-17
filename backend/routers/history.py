from fastapi import APIRouter, HTTPException, Query
from typing import List, Dict
import pandas as pd
import os
import glob
from datetime import datetime
from pydantic import BaseModel
import asyncio
import calendar

router = APIRouter(
    prefix="/api/history",
    tags=["history"],
    responses={404: {"description": "Not found"}},
)

class MonthlyStats(BaseModel):
    total_scheduled: int  # Total trips
    total_completed: int  # Successfully completed trips
    reliability_percentage: float  # Completion rate
    cancellations: int  # Failed/cancelled trips
    worst_routes: List[Dict[str, int]]  # Routes with highest failure rate

# Base paths
BASE_DATA_PATH = "C:/Users/bhava/Desktop/RTGS/2years"
HALTWISE_FILE = "C:/Users/bhava/Desktop/RTGS/HaltWiseData_22Apr2025.xls"

def get_booking_files_for_month(year: int, month: int) -> List[str]:
    """Get all booking CSV files for the given month/year."""
    month_str = f"{month:02d}"
    year_str = str(year)
    month_path = os.path.join(BASE_DATA_PATH, year_str, month_str)
    
    if not os.path.exists(month_path):
        return []
    
    pattern = os.path.join(month_path, "**", "ticket_booking_info_*.csv")
    files = glob.glob(pattern, recursive=True)
    return files

def get_tripwise_file_for_period(year: int, month: int) -> str:
    """
    Get the appropriate TripWiseData CSV file based on date range.
    Returns path to file or None if not found.
    """
    target_date = datetime(year, month, 1)
    
    # Range 1: 2023-04-01 to 2024-03-31
    start_1 = datetime(2023, 4, 1)
    end_1 = datetime(2024, 3, 31)
    
    # Range 2: 2024-04-01 to 2025-04-30
    start_2 = datetime(2024, 4, 1)
    end_2 = datetime(2025, 4, 30)
    
    if start_1 <= target_date <= end_1:
        return os.path.join(BASE_DATA_PATH, "TripWiseData_01APR2023_30APR2024", "TripWiseData_01APR2023_30APR2024.csv")
    elif start_2 <= target_date <= end_2:
        return os.path.join(BASE_DATA_PATH, "TripWiseData_01APR2024_30APR2025", "TripWiseData_01APR2024_30APR2025.csv")
    
    return None

@router.get("/monthly-stats", response_model=MonthlyStats)
async def get_monthly_stats(
    year: int = Query(..., description="Year (e.g. 2023)"),
    month: int = Query(..., description="Month (1-12)"),
):
    """
    Get monthly statistics using TripWiseData for trip completion metrics.
    Falls back to HaltWiseData if TripWiseData unavailable.
    """
    print(f"Fetching stats for {year}-{month:02d}")
    
    def process_data():
        total_trips = 0
        completed_trips = 0
        failed_trips = 0
        route_failures = {}
        
        # Try TripWiseData first (faster, smaller files)
        tripwise_file = get_tripwise_file_for_period(year, month)
        
        if tripwise_file and os.path.exists(tripwise_file):
            print(f"Using TripWiseData: {os.path.basename(tripwise_file)}")
            
            
            try:
                # TripWiseData contains aggregated stats per trip
                # Columns: Scheduled_Trip_Start_Time, Trips_Scheduled, Trips_Completed, isCancelled
                chunk_size = 100000
                
                # Target date range for filtering
                last_day = calendar.monthrange(year, month)[1]
                target_start = pd.Timestamp(year=year, month=month, day=1)
                target_end = pd.Timestamp(year=year, month=month, day=last_day) + pd.Timedelta(days=1)
                
                with pd.read_csv(tripwise_file, chunksize=chunk_size, low_memory=False) as reader:
                    chunk_num = 0
                    for chunk in reader:
                        chunk_num += 1
                        # Verify required columns exist
                        required_cols = ['Trips_Scheduled', 'Trips_Completed', 'Scheduled_Trip_Start_Time']
                        if not all(col in chunk.columns for col in required_cols):
                            print(f"Warning: Missing required columns in TripWiseData chunk {chunk_num}")
                            print(f"Available columns: {list(chunk.columns)[:10]}")
                            continue
                        
                        # Parse and filter by date
                        chunk['Scheduled_Trip_Start_Time'] = pd.to_datetime(chunk['Scheduled_Trip_Start_Time'], errors='coerce')
                        
                        # Debug: check date range in chunk
                        if chunk_num == 1:
                            print(f"First chunk date range: {chunk['Scheduled_Trip_Start_Time'].min()} to {chunk['Scheduled_Trip_Start_Time'].max()}")
                            print(f"Target range: {target_start} to {target_end}")
                        
                        mask = (chunk['Scheduled_Trip_Start_Time'] >= target_start) & (chunk['Scheduled_Trip_Start_Time'] < target_end)
                        filtered = chunk[mask]
                        
                        if chunk_num == 1 and not filtered.empty:
                            print(f"First chunk filtered: {len(filtered)} rows out of {len(chunk)}")
                        
                        if filtered.empty:
                            continue
                        
                        # Sum scheduled and completed trips for this month
                        # Use to_numeric to handle non-numeric values safely
                        chunk_scheduled = pd.to_numeric(filtered['Trips_Scheduled'], errors='coerce').fillna(0).astype(int).sum()
                        chunk_completed = pd.to_numeric(filtered['Trips_Completed'], errors='coerce').fillna(0).astype(int).sum()
                        
                        total_trips += int(chunk_scheduled)
                        completed_trips += int(chunk_completed)
                        failed_trips += (int(chunk_scheduled) - int(chunk_completed))
                        
                        # Count failures by route
                        if 'RouteID' in filtered.columns:
                            sched = pd.to_numeric(filtered['Trips_Scheduled'], errors='coerce').fillna(0).astype(int)
                            compl = pd.to_numeric(filtered['Trips_Completed'], errors='coerce').fillna(0).astype(int)
                            filtered['Failed'] = sched - compl
                            failed_by_route = filtered[filtered['Failed'] > 0].groupby('RouteID')['Failed'].sum()
                            for route_id, count in failed_by_route.items():
                                route_str = str(route_id)
                                route_failures[route_str] = route_failures.get(route_str, 0) + int(count)
                
                print(f"TripWiseData results: Scheduled={total_trips}, Completed={completed_trips}, Failed={failed_trips}")
                
            except Exception as e:
                print(f"Error processing TripWiseData: {e}")
                total_trips = 0
        
        # Fallback to HaltWiseData if no TripWise data
        if total_trips == 0:
            print("Falling back to HaltWiseData...")
            try:
                if os.path.exists(HALTWISE_FILE):
                    df_halt = pd.read_excel(HALTWISE_FILE, usecols=['RouteID', 'isCancelled', 'Scheduled_Trip_Start_Time'])
                    df_halt['Scheduled_Trip_Start_Time'] = pd.to_datetime(df_halt['Scheduled_Trip_Start_Time'], errors='coerce')
                    
                    mask = (df_halt['Scheduled_Trip_Start_Time'].dt.year == year) & (df_halt['Scheduled_Trip_Start_Time'].dt.month == month)
                    df_month = df_halt[mask]
                    
                    if len(df_month) > 0:
                        total_trips = len(df_month)
                        cancellation_vals = df_month['isCancelled'].astype(str).str.upper()
                        cancelled_mask = cancellation_vals.isin(['Y', 'YES', '1', 'TRUE'])
                        failed_trips = cancelled_mask.sum()
                        completed_trips = total_trips - failed_trips
                        
                        # Route failures
                        cancelled_df = df_month[cancelled_mask]
                        if not cancelled_df.empty:
                            route_failures = cancelled_df['RouteID'].value_counts().to_dict()
                        
                        print(f"HaltWiseData results: Total={total_trips}, Completed={completed_trips}, Failed={failed_trips}")
            except Exception as e:
                print(f"Error processing HaltWiseData: {e}")
        
        # Final fallback to booking data
        if total_trips == 0:
            print("Using booking data as final fallback...")
            files = get_booking_files_for_month(year, month)
            total_bookings = 0
            
            for file_path in files:
                try:
                    df = pd.read_csv(file_path, low_memory=False)
                    if 'BOOKING_ID' in df.columns:
                        total_bookings += len(df.dropna(subset=['BOOKING_ID']))
                except:
                    continue
            
            total_trips = total_bookings
            completed_trips = total_bookings
            failed_trips = 0
        
        # Calculate metrics
        reliability = ((completed_trips / total_trips) * 100) if total_trips > 0 else 100.0
        
        # Top 5 worst routes
        sorted_routes = sorted(route_failures.items(), key=lambda x: x[1], reverse=True)[:5]
        worst_routes_list = [{"route_id": str(r), "cancellations": int(c)} for r, c in sorted_routes]
        
        return MonthlyStats(
            total_scheduled=total_trips,
            total_completed=completed_trips,
            reliability_percentage=round(reliability, 1),
            cancellations=failed_trips,
            worst_routes=worst_routes_list
        )
    
    # Run in thread pool
    try:
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(None, process_data)
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
