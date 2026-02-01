
import os
import sys

# Add backend directory to path
sys.path.append(os.path.abspath('dashboard/backend'))

from logic import NetworkLogic

def test_logic():
    # Point to the data directory (up one level from script if running in root, or adjusting accordingly)
    # The user is in `telecom_telemetry_phase1`, `output` is in `telecom_telemetry_phase1/output`
    # `app.py` in `dashboard/backend` assumes `output` is at `../../output`
    
    current_dir = os.getcwd()
    print(f"Current Directory: {current_dir}")
    
    data_dir = os.path.join(current_dir, 'output')
    print(f"Looking for data in: {data_dir}")
    
    if not os.path.exists(data_dir):
        print("ERROR: Data directory does not exist or path is wrong.")
        return

    logic = NetworkLogic(data_dir)
    
    print("\n--- Topology ---")
    print(f"Loaded Links: {logic.links.keys()}")
    if not logic.links:
        print("ERROR: No links loaded. Check link_capacity_estimates.csv")
    
    print("\n--- Data ---")
    print(f"Loaded Cells: {len(logic.cells)}")
    if not logic.cells:
        print("ERROR: No cell data loaded.")
        
    print("\n--- Link 1 Stats ---")
    # Link 1 corresponds to L-NYC-01
    stats = logic.get_link_stats(1)
    print(f"Stats: {stats}")
    
    traffic = logic.get_traffic_sample(1)
    print(f"Traffic Points: {len(traffic)}")
    if traffic:
        print(f"First point: {traffic[0]}")
    else:
        print("No traffic data for Link 1")

if __name__ == "__main__":
    test_logic()
