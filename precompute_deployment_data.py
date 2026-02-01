
import os
import json
import pandas as pd
from dashboard.backend.logic import NetworkLogic

def precompute_data():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(base_dir, "output")
    
    print("Loading data via NetworkLogic...")
    logic = NetworkLogic(data_dir)
    
    # 1. Traffic Summaries
    print("Generating Traffic Summaries...")
    traffic_summary = {}
    for link_id in logic.links.keys():
        traffic_data = logic.get_traffic_sample(link_id)
        traffic_summary[str(link_id)] = traffic_data
        
    with open(os.path.join(data_dir, "traffic_summary.json"), "w") as f:
        json.dump(traffic_summary, f)
        
    # 2. Link Stats
    print("Generating Link Stats...")
    link_stats = {}
    for link_id in logic.links.keys():
        stats = logic.get_link_stats(link_id)
        link_stats[str(link_id)] = stats
        
    with open(os.path.join(data_dir, "link_stats.json"), "w") as f:
        json.dump(link_stats, f)
        
    # 3. Optimization/Financials Lookups
    # (These are computed on demand usually, but we can pre-compute common cases if needed)
    # Actually, logic.find_optimal_capacity uses huge thr_df. We MUST pre-compute this.
    # We'll compute for Standard Buffer (143us) and maybe a few others if needed?
    # Or just store the 'thr_df' in a much more compressed way? 
    # No, let's just pre-compute the specific endpoints needed for the demo.
    
    print("Pre-computing Optimal Capacity (143us)...")
    defaults_143 = logic.find_optimal_capacity(0.000143)
    
    optimization_cache = {
        "143": defaults_143
    }
    
    with open(os.path.join(data_dir, "optimization_cache.json"), "w") as f:
        json.dump(optimization_cache, f)

    print("Done! JSON files saved to output/.")

if __name__ == "__main__":
    precompute_data()
