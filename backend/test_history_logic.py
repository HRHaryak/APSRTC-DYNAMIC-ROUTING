
import pandas as pd
import os
from datetime import datetime
from routers.history import get_file_for_month, BASE_DATA_PATH

def test_history_logic(year=2023, month=4):
    print(f"Testing for {month}/{year}")
    print(f"Base Path: {BASE_DATA_PATH}")
    
    file_path = get_file_for_month(year, month)
    print(f"Resolved File Path: {file_path}")
    
    if not file_path or not os.path.exists(file_path):
        print("File not found!")
        return

    chunk_size = 100000
    date_col = 'Scheduled_Trip_Start_Time'
    is_cancelled_col = 'isCancelled'
    
    total_scheduled = 0
    total_cancelled = 0
    matching_rows = 0
    
    # Peek columns
    df_preview = pd.read_csv(file_path, nrows=5)
    print("Columns:", df_preview.columns.tolist())
    if date_col in df_preview.columns:
        print(f"Sample Date: {df_preview[date_col].iloc[0]}")
    
    print("Processing chunks...")
    try:
        with pd.read_csv(file_path, chunksize=chunk_size, low_memory=False) as reader:
            for i, chunk in enumerate(reader):
                if i > 5: break # Test only first few chunks to save time
                
                if date_col in chunk.columns:
                    chunk[date_col] = pd.to_datetime(chunk[date_col], errors='coerce')
                    mask = (chunk[date_col].dt.year == year) & (chunk[date_col].dt.month == month)
                    filtered = chunk[mask]
                    
                    if not filtered.empty:
                        matching_rows += len(filtered)
                        print(f"Chunk {i}: Found {len(filtered)} matching rows.")
                        
                        if is_cancelled_col in filtered.columns:
                            c_vals = filtered[is_cancelled_col].astype(str).str.upper()
                            cancelled_mask = c_vals.isin(['Y', 'YES', '1', 'TRUE'])
                            total_cancelled += cancelled_mask.sum()
                            total_scheduled += len(filtered)
                    else:
                        pass
                        # print(f"Chunk {i}: No match.")
    except Exception as e:
        print(f"Error: {e}")
        
    print(f"Total Scheduled: {total_scheduled}")
    print(f"Total Cancelled: {total_cancelled}")

if __name__ == "__main__":
    test_history_logic()
