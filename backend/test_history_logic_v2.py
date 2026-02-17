
import pandas as pd
import os
from datetime import datetime

# Hardcoded base path
BASE_DATA_PATH = "C:/Users/bhava/Desktop/RTGS/2years"

def get_file_for_month(year: int, month: int, type: str = "HaltWise") -> str:
    target_date = datetime(year, month, 1)
    
    start_1 = datetime(2023, 4, 1)
    end_1 = datetime(2024, 4, 30)
    
    start_2 = datetime(2024, 5, 1)
    end_2 = datetime(2025, 4, 30)
    
    if start_1 <= target_date <= end_1:
        if type == "HaltWise":
            return os.path.join(BASE_DATA_PATH, "HaltWiseData_01APR2023_30APR2024", "HaltWiseData_01APR2023_30APR2024.csv")
    elif start_2 <= target_date <= end_2:
        if type == "HaltWise":
            return os.path.join(BASE_DATA_PATH, "HaltWiseData_01MAY2024_30APR2025", "HaltWiseData_01MAY2024_30APR2025.csv")
            
    return None

def test_history_logic(year=2023, month=4):
    print(f"Testing for {month}/{year}")
    
    file_path = get_file_for_month(year, month)
    print(f"Resolved File Path: {file_path}")
    
    if not file_path or not os.path.exists(file_path):
        print("File not found!")
        return

    chunk_size = 100000
    date_col = 'Scheduled_Trip_Start_Time'
    is_cancelled_col = 'isCancelled'
    
    try:
        # Check first row
        df_preview = pd.read_csv(file_path, nrows=5)
        print("Columns:", df_preview.columns.tolist())
        
        print("Processing chunks...")
        processed_chunks = 0
        matching_rows = 0
        
        with pd.read_csv(file_path, chunksize=chunk_size, low_memory=False) as reader:
            for chunk in reader:
                processed_chunks += 1
                if processed_chunks > 5: break
                
                if date_col in chunk.columns:
                    chunk[date_col] = pd.to_datetime(chunk[date_col], errors='coerce')
                    mask = (chunk[date_col].dt.year == year) & (chunk[date_col].dt.month == month)
                    filtered = chunk[mask]
                    
                    if not filtered.empty:
                        matching_rows += len(filtered)
                        print(f"Chunk {processed_chunks}: Found {len(filtered)} matches.")
                        # Sample
                        print(filtered[[date_col, is_cancelled_col]].head(1))
                    else:
                        print(f"Chunk {processed_chunks}: No matches. Date range: {chunk[date_col].min()} to {chunk[date_col].max()}")
                
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_history_logic()
