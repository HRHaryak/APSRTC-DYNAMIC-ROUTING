"""
Comprehensive data loader for all APSRTC CSV/Excel files.
Loads, processes, and joins data for ML model training and analytics.
"""
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import os
from pathlib import Path

class APSRTCDataLoader:
    """Load and process all APSRTC data files."""
    
    def __init__(self, base_path: str = "C:/Users/bhava/Desktop/RTGS"):
        self.base_path = base_path
        self.data_cache = {}
        
    def load_all_data(self) -> Dict[str, pd.DataFrame]:
        """Load all available CSV and Excel files."""
        print("Loading APSRTC data files...")
        
        data = {}
        
        # Network information
        try:
            network_file = f"{self.base_path}/2years/network_information_2years.csv"
            if os.path.exists(network_file):
                data['network'] = pd.read_csv(network_file, low_memory=False)
                print(f"✓ Loaded network data: {len(data['network'])} records")
        except Exception as e:
            print(f"✗ Error loading network data: {e}")
            
        # Schedule information
        try:
            schedule_file = f"{self.base_path}/2years/sehedule_information_2years.csv"
            if os.path.exists(schedule_file):
                data['schedule'] = pd.read_csv(schedule_file, low_memory=False)
                print(f"✓ Loaded schedule data: {len(data['schedule'])} records")
        except Exception as e:
            print(f"✗ Error loading schedule data: {e}")
            
        # Ticketing data
        try:
            ticketing_file = f"{self.base_path}/Ticketing_Data.csv"
            if os.path.exists(ticketing_file):
                data['ticketing'] = pd.read_csv(ticketing_file, low_memory=False)
                print(f"✓ Loaded ticketing data: {len(data['ticketing'])} records")
        except Exception as e:
            print(f"✗ Error loading ticketing data: {e}")
            
        # HaltWise data
        try:
            haltwise_file = f"{self.base_path}/HaltWiseData_22Apr2025.xls"
            if os.path.exists(haltwise_file):
                data['haltwise'] = pd.read_excel(haltwise_file)
                print(f"✓ Loaded haltwise data: {len(data['haltwise'])} records")
        except Exception as e:
            print(f"✗ Error loading haltwise data: {e}")
            
        # TripWise data
        try:
            tripwise_file = f"{self.base_path}/TripWiseData_22Apr2025.xls"
            if os.path.exists(tripwise_file):
                data['tripwise'] = pd.read_excel(tripwise_file)
                print(f"✓ Loaded tripwise data: {len(data['tripwise'])} records")
        except Exception as e:
            print(f"✗ Error loading tripwise data: {e}")
            
        # Service Halts
        try:
            service_halts_file = f"{self.base_path}/2years/Service_Halts.csv"
            if os.path.exists(service_halts_file):
                data['service_halts'] = pd.read_csv(service_halts_file, low_memory=False)
                print(f"✓ Loaded service halts data: {len(data['service_halts'])} records")
        except Exception as e:
            print(f"✗ Error loading service halts data: {e}")
            
        # Place master
        try:
            place_file = f"{self.base_path}/2years/place_master.csv"
            if os.path.exists(place_file):
                data['place_master'] = pd.read_csv(place_file, low_memory=False)
                print(f"✓ Loaded place master data: {len(data['place_master'])} records")
        except Exception as e:
            print(f"✗ Error loading place master data: {e}")
            
        # Route halts with distance
        try:
            route_halts_file = f"{self.base_path}/rout_halts_with_distance.csv"
            if os.path.exists(route_halts_file):
                data['route_halts'] = pd.read_csv(route_halts_file, low_memory=False)
                print(f"✓ Loaded route halts data: {len(data['route_halts'])} records")
        except Exception as e:
            print(f"✗ Error loading route halts data: {e}")
            
        self.data_cache = data
        return data
    
    def extract_temporal_features(self, df: pd.DataFrame, date_col: str, time_col: Optional[str] = None) -> pd.DataFrame:
        """Extract temporal features from date/time columns."""
        df = df.copy()
        
        # Parse date
        if date_col in df.columns:
            df['date'] = pd.to_datetime(df[date_col], errors='coerce')
            df['year'] = df['date'].dt.year
            df['month'] = df['date'].dt.month
            df['day'] = df['date'].dt.day
            df['day_of_week'] = df['date'].dt.dayofweek
            df['is_weekend'] = df['day_of_week'].isin([5, 6]).astype(int)
            
        # Parse time if provided
        if time_col and time_col in df.columns:
            df['time'] = pd.to_datetime(df[time_col], format='%H:%M:%S', errors='coerce').dt.time
            df['hour'] = pd.to_datetime(df[time_col], format='%H:%M:%S', errors='coerce').dt.hour
            df['minute'] = pd.to_datetime(df[time_col], format='%H:%M:%S', errors='coerce').dt.minute
            
            # Peak hour classification
            df['is_peak_hour'] = df['hour'].apply(
                lambda x: 1 if (7 <= x <= 10) or (17 <= x <= 20) else 0
            )
            
        return df
    
    def compute_od_matrix(self) -> Optional[pd.DataFrame]:
        """Compute origin-destination flow matrix from ticketing data."""
        if 'ticketing' not in self.data_cache:
            return None
            
        ticketing = self.data_cache['ticketing']
        
        # Check for OD columns
        if 'FROM_PLACE_NAME' not in ticketing.columns or 'TO_PLACE_NAME' not in ticketing.columns:
            print("Warning: OD columns not found in ticketing data")
            return None
            
        # Aggregate flows
        od_matrix = ticketing.groupby(['FROM_PLACE_NAME', 'TO_PLACE_NAME']).agg({
            'TOTAL_AMOUNT': 'sum',
            'ROUTE_ID': 'count'  # Number of trips
        }).reset_index()
        
        od_matrix.columns = ['origin', 'destination', 'total_revenue', 'trip_count']
        
        # Add passenger count if available
        passenger_col = '(TB.NO_OF_ADULTS+TB.NO_OF_CHILD)'
        if passenger_col in ticketing.columns:
            passenger_flow = ticketing.groupby(['FROM_PLACE_NAME', 'TO_PLACE_NAME'])[passenger_col].sum().reset_index()
            od_matrix = od_matrix.merge(
                passenger_flow,
                left_on=['origin', 'destination'],
                right_on=['FROM_PLACE_NAME', 'TO_PLACE_NAME'],
                how='left'
            )
            od_matrix.rename(columns={passenger_col: 'total_passengers'}, inplace=True)
            od_matrix.drop(['FROM_PLACE_NAME', 'TO_PLACE_NAME'], axis=1, inplace=True, errors='ignore')
        
        return od_matrix
    
    def prepare_delay_training_data(self) -> Optional[pd.DataFrame]:
        """Prepare training data for delay prediction model."""
        if 'haltwise' not in self.data_cache or 'schedule' not in self.data_cache:
            print("Warning: Required data for delay prediction not available")
            return None
            
        haltwise = self.data_cache['haltwise'].copy()
        schedule = self.data_cache['schedule'].copy()
        
        # Merge haltwise with schedule
        if 'RouteID' in haltwise.columns and 'ROUTE_ID' in schedule.columns:
            # Rename for consistency
            haltwise.rename(columns={'RouteID': 'ROUTE_ID'}, inplace=True)
            
        if 'ServiceID' in haltwise.columns and 'SERVICE_ID' in schedule.columns:
            haltwise.rename(columns={'ServiceID': 'SERVICE_ID'}, inplace=True)
            
        # Merge
        delay_data = haltwise.merge(
            schedule[['SERVICE_ID', 'ROUTE_ID', 'TOTAL_TRAVEL_MINUTES', 'SERVICE_TYPE_NAME', 'DISTANCE_KM']].drop_duplicates(),
            on=['SERVICE_ID', 'ROUTE_ID'],
            how='left'
        )
        
        # Calculate actual delay
        if 'ActualArrivalTime' in delay_data.columns and 'ScheduledArrivalTime' in delay_data.columns:
            delay_data['ScheduledArrivalTime'] = pd.to_datetime(delay_data['ScheduledArrivalTime'], errors='coerce')
            delay_data['ActualArrivalTime'] = pd.to_datetime(delay_data['ActualArrivalTime'], errors='coerce')
            delay_data['delay_minutes'] = (
                (delay_data['ActualArrivalTime'] - delay_data['ScheduledArrivalTime']).dt.total_seconds() / 60
            )
        elif 'isCancelled' in delay_data.columns:
            # Estimate delay based on cancellation (cancelled = high delay)
            delay_data['delay_minutes'] = delay_data['isCancelled'].apply(lambda x: 120 if x == 1 else np.random.uniform(0, 15))
        else:
            delay_data['delay_minutes'] = 0
            
        # Extract temporal features if date/time available
        if 'TripDate' in delay_data.columns:
            delay_data = self.extract_temporal_features(delay_data, 'TripDate')
        elif 'ScheduledArrivalTime' in delay_data.columns:
            delay_data['date'] = delay_data['ScheduledArrivalTime'].dt.date
            delay_data['hour'] = delay_data['ScheduledArrivalTime'].dt.hour
            delay_data['day_of_week'] = delay_data['ScheduledArrivalTime'].dt.dayofweek
            delay_data['is_peak_hour'] = delay_data['hour'].apply(
                lambda x: 1 if (7 <= x <= 10) or (17 <= x <= 20) else 0
            )
            
        return delay_data
    
    def prepare_demand_training_data(self) -> Optional[pd.DataFrame]:
        """Prepare training data for demand forecasting model."""
        if 'ticketing' not in self.data_cache:
            print("Warning: Ticketing data not available for demand forecasting")
            return None
            
        ticketing = self.data_cache['ticketing'].copy()
        
        # Extract temporal features
        if 'BOOKED_DATE' in ticketing.columns:
            ticketing = self.extract_temporal_features(ticketing, 'BOOKED_DATE', 'BOOKING_TIME')
            
        # Calculate passenger count
        passenger_col = '(TB.NO_OF_ADULTS+TB.NO_OF_CHILD)'
        if passenger_col in ticketing.columns:
            ticketing['passenger_count'] = ticketing[passenger_col]
        else:
            ticketing['passenger_count'] = 1  # Default
            
        # Aggregate by route and time
        if 'date' in ticketing.columns and 'hour' in ticketing.columns:
            demand_data = ticketing.groupby(['ROUTE_ID', 'date', 'hour']).agg({
                'passenger_count': 'sum',
                'TOTAL_AMOUNT': 'sum'
            }).reset_index()
            
            # Add temporal features to aggregated data
            demand_data['day_of_week'] = pd.to_datetime(demand_data['date']).dt.dayofweek
            demand_data['month'] = pd.to_datetime(demand_data['date']).dt.month
            demand_data['is_peak_hour'] = demand_data['hour'].apply(
                lambda x: 1 if (7 <= x <= 10) or (17 <= x <= 20) else 0
            )
            
            return demand_data
        else:
            return ticketing
    
    def get_route_statistics(self) -> pd.DataFrame:
        """Compute comprehensive route statistics."""
        stats_list = []
        
        # Revenue from ticketing
        if 'ticketing' in self.data_cache:
            revenue = self.data_cache['ticketing'].groupby('ROUTE_ID').agg({
                'TOTAL_AMOUNT': 'sum',
                'ROUTE_ID': 'count'
            }).reset_index()
            revenue.columns = ['ROUTE_ID', 'total_revenue', 'trip_count']
            stats_list.append(revenue)
            
        # Reliability from haltwise
        if 'haltwise' in self.data_cache:
            haltwise = self.data_cache['haltwise'].copy()
            if 'RouteID' in haltwise.columns:
                haltwise.rename(columns={'RouteID': 'ROUTE_ID'}, inplace=True)
                
            if 'isCancelled' in haltwise.columns:
                reliability = haltwise.groupby('ROUTE_ID').agg({
                    'isCancelled': ['count', 'sum']
                }).reset_index()
                reliability.columns = ['ROUTE_ID', 'total_trips', 'cancelled_trips']
                reliability['reliability'] = (1 - reliability['cancelled_trips'] / reliability['total_trips']) * 100
                stats_list.append(reliability[['ROUTE_ID', 'reliability']])
                
        # Distance from schedule
        if 'schedule' in self.data_cache:
            schedule = self.data_cache['schedule']
            if 'DISTANCE_KM' in schedule.columns:
                distance = schedule.groupby('ROUTE_ID')['DISTANCE_KM'].mean().reset_index()
                distance.columns = ['ROUTE_ID', 'avg_distance_km']
                stats_list.append(distance)
                
        # Merge all stats
        if stats_list:
            route_stats = stats_list[0]
            for df in stats_list[1:]:
                route_stats = route_stats.merge(df, on='ROUTE_ID', how='outer')
            return route_stats
        else:
            return pd.DataFrame()
    
    def get_summary(self) -> Dict:
        """Get summary statistics of loaded data."""
        summary = {
            'files_loaded': len(self.data_cache),
            'datasets': {}
        }
        
        for name, df in self.data_cache.items():
            summary['datasets'][name] = {
                'rows': len(df),
                'columns': len(df.columns),
                'column_names': list(df.columns)[:10]  # First 10 columns
            }
            
        return summary

# Global instance
data_loader = APSRTCDataLoader()
