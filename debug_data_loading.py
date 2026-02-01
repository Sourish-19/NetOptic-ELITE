
import os
import sys
import pandas as pd
from pathlib import Path

# Add backend to path
sys.path.append(os.path.abspath('dashboard/backend'))

def debug_loading():
    data_dir = Path('output')
    print(f"Checking data dir: {data_dir.absolute()}")
    
    # 1. Check a sample CSV
    sample_file = list(data_dir.glob("cell_*_aligned.csv"))[0]
    print(f"\nScanning sample file: {sample_file.name}")
    try:
        df = pd.read_csv(sample_file)
        print("Columns:", df.columns.tolist())
        print("Head (2 rows):")
        print(df.head(2))
        print("Timestamp Info:")
        print(df['timestamp'].dtype)
        # Check if empty
        if df.empty:
            print("WARNING: Dataframe is empty!")
    except Exception as e:
        print(f"ERROR reading CSV: {e}")
        return

    # 2. Test Logic Loading
    print("\n--- Testing NetworkLogic ---")
    try:
        from logic import NetworkLogic
        nl = NetworkLogic(data_dir)
        
        print(f"Cells Loaded: {len(nl.cells)}")
        if nl.thr_df is not None:
             print(f"Throughput DF Shape: {nl.thr_df.shape}")
             print(f"Throughput DF Index: {nl.thr_df.index[:5]}")
             print(f"Throughput DF Columns: {nl.thr_df.columns[:5]}")
        else:
             print("Throughput DF is None!")

        # 3. Check Link 1
        print("\n--- Checking Link 1 ---")
        link_id = 1
        if link_id in nl.links:
            cells = nl.links[link_id]
            print(f"Link 1 Cells: {cells}")
            mapped_cells = [c for c in cells if c in nl.thr_df.columns]
            print(f"Mapped Cells (present in DF): {mapped_cells}")
            
            if mapped_cells:
                traffic = nl.thr_df[mapped_cells].sum(axis=1)
                print(f"Total Traffic Sum: {traffic.sum()}")
                print(f"Peak Traffic: {traffic.max()}")
            else:
                print("No cells mapped to dataframe columns!")
        else:
            print("Link 1 not found in topology!")

    except Exception as e:
        print(f"ERROR in Logic: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    debug_loading()
