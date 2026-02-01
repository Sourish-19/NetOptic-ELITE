import sys
import pandas as pd
import numpy as np
import networkx as nx
import matplotlib.pyplot as plt
from pathlib import Path

# Constants
SLOT_DURATION = 0.0005  # 500 microseconds
BUFFER_TIME_SEC = 143e-6 # 143 microseconds (4 symbols)
MAX_DROP_RATE = 0.01    # 1% packet loss allowed

def load_aligned_data(output_dir):
    """
    Loads all aligned CSVs into a single dictionary.
    """
    path = Path(output_dir)
    cells = {}
    for p in path.glob("cell_*_aligned.csv"):
        try:
            # cell_1_aligned.csv -> 1
            parts = p.name.split('_')
            cell_id = parts[1]
            df = pd.read_csv(p)
            cells[cell_id] = df
        except Exception as e:
            print(f"Skipping {p}: {e}")
            
    print(f"Loaded data for {len(cells)} cells.")
    return cells

def resample_and_correlate(cells):
    """
    Resamples packet loss series to a common timeline and computes correlation.
    """
    # 1. Union of all timestamps to create a master index
    all_timestamps = set()
    for cid, df in cells.items():
        all_timestamps.update(df["timestamp"].values)
        
    master_index = sorted(list(all_timestamps))
    loss_df = pd.DataFrame(index=master_index)
    throughput_df = pd.DataFrame(index=master_index)
    
    # 2. Fill master dataframes
    for cid, df in cells.items():
        # Set timestamp as index
        df = df.set_index("timestamp")
        
        # Round index to tolerate small float diffs
        df.index = df.index.round(4) 
        
        loss_series = df["packet_loss"]
        loss_series = loss_series[~loss_series.index.duplicated(keep='first')]
        loss_df[cid] = loss_series
        
        thr_series = df["gbps"]
        thr_series = thr_series[~thr_series.index.duplicated(keep='first')]
        throughput_df[cid] = thr_series
        
    # Fill NANs with 0 (assuming no data = no activity)
    loss_df = loss_df.fillna(0)
    throughput_df = throughput_df.fillna(0)
    
    # 3. Correlation
    corr_matrix = loss_df.corr()
    
    return loss_df, throughput_df, corr_matrix

def build_topology(corr_matrix):
    """
    Builds a graph where edges exist if correlation > threshold.
    Dynamically adjusts threshold to try and find exactly 3 connected components (Links 1, 2, 3).
    """
    cells = corr_matrix.columns
    best_G = None
    best_components = []
    
    # Sweep threshold from high to low to find optimal clustering
    # We want to merge cells until we have roughly 3 groups.
    # Start high (strict) -> many components. Lower -> fewer components.
    for threshold in np.arange(0.95, 0.2, -0.05):
        G = nx.Graph()
        G.add_nodes_from(cells)
        
        for i in range(len(cells)):
            for j in range(i+1, len(cells)):
                c1 = cells[i]
                c2 = cells[j]
                corr = corr_matrix.iloc[i, j]
                if corr > threshold:
                    G.add_edge(c1, c2, weight=corr)
                    
        components = list(nx.connected_components(G))
        
        # Filter out singletons if they are just noise, or keep strict count?
        # Problem implies 3 distinct links covering all cells.
        # Let's count significant components (size > 1) or just total components.
        # If we reach <= 3, valid.
        if len(components) <= 3:
            print(f"converged at threshold {threshold:.2f} with {len(components)} components.")
            return G, components

    # If we exit loop without converging, return the last one (loosest)
    print("Warning: Could not converge to <= 3 components with correlations > 0.2.")
    return G, components

def assign_link_ids(components):
    """
    Maps connected components to Link IDs 1, 2, 3 based on hints.
    Hint 1: Cell 1 is connected via Link 2.
    Hint 2: Cell 2 is connected via Link 3.
    Strategy: 
    - Identify Cluster for Link 2 (has Cell 1).
    - Identify Cluster for Link 3 (has Cell 2).
    - All other clusters/cells -> Link 1.
    """
    link2_cells = set()
    link3_cells = set()
    link1_cells = set()
    
    # 1. Expand all components into a list of sets
    comp_list = [set(c) for c in components]
    
    # 2. Find Link 2 (Cell 1)
    found_l2_idx = -1
    for i, comp in enumerate(comp_list):
        if '1' in comp:
            link2_cells = comp
            found_l2_idx = i
            break
            
    # 3. Find Link 3 (Cell 2)
    found_l3_idx = -1
    for i, comp in enumerate(comp_list):
        if i == found_l2_idx: continue # Already taken
        if '2' in comp:
            link3_cells = comp
            found_l3_idx = i
            break
            
    # 4. Assign everything else to Link 1
    for i, comp in enumerate(comp_list):
        if i == found_l2_idx or i == found_l3_idx:
            continue
        link1_cells.update(comp)
        
    # Handle Edge Case: What if Cell 1 and Cell 2 are in the SAME component?
    # This implies threshold was too low.
    if found_l2_idx != -1 and found_l2_idx == found_l3_idx:
        print("Warning: Cell 1 and Cell 2 are in the same cluster! Splitting arbitrarily or assigning to Link 2.")
        # For now, let's just keep them in Link 2 and leave Link 3 empty? 
        # Or duplicate? No, strictly partition.
        # This hints that our topology search failed. 
        # But proceeding is better than crashing.
        pass

    final_assignment = {}
    if link1_cells: final_assignment[1] = sorted(list(link1_cells))
    if link2_cells: final_assignment[2] = sorted(list(link2_cells))
    if link3_cells: final_assignment[3] = sorted(list(link3_cells))
    
    # Validation: Ensure 1, 2, 3 exist
    if 1 not in final_assignment: final_assignment[1] = []
    if 2 not in final_assignment: final_assignment[2] = []
    if 3 not in final_assignment: final_assignment[3] = []
    
    return final_assignment

def simulate_buffer_drop(capacity_gbps, input_gbps_series):
    """
    Simulates a switch buffer and returns drop rate.
    input_gbps_series: pandas Series of input rate per slot.
    """
    dt = SLOT_DURATION
    
    # Buffer size in bits depends on Link Capacity
    # Problem says: "Total buffer size at leaf switch is 4 symbols (i.e. 143 microsecond)"
    # Buffer in bits = Rate * Time
    max_buffer_bits = capacity_gbps * 1e9 * BUFFER_TIME_SEC
    
    current_buffer_bits = 0
    total_input_bits = 0
    total_dropped_bits = 0
    
    inputs = input_gbps_series.values # Gbps
    drain_rate_bits_per_slot = capacity_gbps * 1e9 * dt
    
    for inp_gbps in inputs:
        input_bits = inp_gbps * 1e9 * dt
        total_input_bits += input_bits
        
        # Ingress
        current_buffer_bits += input_bits
        
        # Drain
        current_buffer_bits -= drain_rate_bits_per_slot
        
        # Underflow check
        if current_buffer_bits < 0:
            current_buffer_bits = 0
            
        # Overflow check
        if current_buffer_bits > max_buffer_bits:
            drop = current_buffer_bits - max_buffer_bits
            total_dropped_bits += drop
            current_buffer_bits = max_buffer_bits
            
    if total_input_bits == 0: return 0.0
    
    drop_rate = total_dropped_bits / total_input_bits
    return drop_rate

def estimate_capacity(throughput_df, cells_in_group):
    """
    Returns TWO capacity estimates:
    1. No Buffer (Strict Peak)
    2. With Buffer (4 symbols, < 1% loss)
    """
    # Sum throughput
    group_throughput = throughput_df[cells_in_group].sum(axis=1)
    
    # 1. No Buffer Case: Capacity must >= Peak Load at every instant
    # (Technically 'peak load' IS the capacity needed for 0 loss and 0 buffer)
    cap_no_buffer = group_throughput.max()
    
    # 2. Buffer Case: Binary Search
    # Range: 0 to Peak
    min_cap = 0 
    max_cap = cap_no_buffer
    cap_with_buffer = max_cap
    
    low = min_cap
    high = max_cap
    
    # Optimization: If peak is very small, skip
    if max_cap < 0.001: return 0.0, 0.0
    
    for _ in range(20): 
        mid = (low + high) / 2
        drop_rate = simulate_buffer_drop(mid, group_throughput)
        
        if drop_rate <= MAX_DROP_RATE:
            cap_with_buffer = mid
            high = mid
        else:
            low = mid
            
    return cap_no_buffer, cap_with_buffer

def visualize_topology(G, output_path):
    plt.figure(figsize=(10, 8))
    # Spring layout attempts to position high-weight edges closer
    pos = nx.spring_layout(G, k=0.5, iterations=50)
    nx.draw(G, pos, with_labels=True, node_color='lightgreen', 
            node_size=1200, font_weight='bold', font_size=10, 
            edge_color='gray', width=1.5)
    plt.title("Inferred Network Topology (Packet Loss Correlation)")
    plt.savefig(output_path)
    plt.close()

def plot_loss_heatmap(loss_df, link_id, group_cells, output_dir):
    """
    Figure 1: Heatmap/Barcode of packet loss for a group of cells.
    """
    subset = loss_df[group_cells]
    if subset.empty: return
    data = subset.T.values 
    binary_map = np.where(data > 0, 1, 0)
    
    plt.figure(figsize=(15, 4 + len(group_cells)*0.5))
    plt.imshow(binary_map, aspect='auto', cmap='Reds', interpolation='nearest')
    plt.yticks(range(len(group_cells)), group_cells)
    plt.xlabel("Time (Slots)")
    plt.ylabel("Cells")
    plt.title(f"Link {link_id} Congestion Pattern (Packet Loss)")
    plt.text(0, -1, "Red = Packet Loss Event", color='red', fontsize=10, fontweight='bold')
    plt.tight_layout()
    plt.savefig(f"{output_dir}/link_{link_id}_loss_pattern.png")
    plt.close()

def plot_link_traffic(throughput_df, link_id, group_cells, cap_no_buf, cap_buf, output_dir):
    """
    Figure 3: Aggregated Traffic vs Time
    """
    agg_thr = throughput_df[group_cells].sum(axis=1)
    
    plt.figure(figsize=(12, 6))
    
    # Plot Traffic
    plt.plot(agg_thr.index, agg_thr.values, color='purple', alpha=0.8, linewidth=0.5, label='Aggregated Traffic')
    plt.fill_between(agg_thr.index, agg_thr.values, color='purple', alpha=0.3)
    
    # Plot Capacity Lines
    plt.axhline(y=cap_no_buf, color='red', linestyle='--', linewidth=2, label=f'No Buffer Cap ({cap_no_buf:.2f} Gbps)')
    plt.axhline(y=cap_buf, color='blue', linestyle='-.', linewidth=2, label=f'Buffer Cap ({cap_buf:.2f} Gbps)')
    
    plt.xlabel('Time (s)')
    plt.ylabel('Data Rate (Gbps)')
    plt.title(f"Link {link_id} Traffic Analysis (Sum of {len(group_cells)} cells)")
    plt.legend(loc='upper right')
    plt.grid(True, alpha=0.3)
    
    plt.tight_layout()
    plt.savefig(f"{output_dir}/link_{link_id}_traffic.png")
    plt.close()

def main():
    output_dir = "output"
    cells = load_aligned_data(output_dir)
    if not cells: 
        print("No aligned data found. Run main.py first.")
        return
    
    # 1. Resample & Correlate
    print("Resampling and calculating correlation...")
    loss_df, thr_df, corr_matrix = resample_and_correlate(cells)
    corr_matrix.to_csv("output/correlation_matrix.csv")
    
    # 2. Build Topology
    print("Building topology graph...")
    G, components = build_topology(corr_matrix)
    visualize_topology(G, "output/topology_graph.png")
    
    # 3. Assign Links
    link_map = assign_link_ids(components)
    
    # 4. Estimate Capacity & Report
    results = []
    print("\nEstimating Capacity for identified Links...")
    
    # Sort by Link ID
    for link_id in sorted(link_map.keys()):
        cells_in_link = link_map[link_id]
        
        # Estimate
        cap_no_buf, cap_buf = estimate_capacity(thr_df, cells_in_link)
        
        results.append({
            "Link_ID": link_id,
            "Cells": " ".join(cells_in_link),
            "Capacity_No_Buffer_Gbps": round(cap_no_buf, 2),
            "Capacity_With_Buffer_Gbps": round(cap_buf, 2)
        })
        print(f"  Link {link_id} (Cells: {cells_in_link}):")
        print(f"    -> No Buffer Cap: {cap_no_buf:.2f} Gbps")
        print(f"    -> With Buffer Cap: {cap_buf:.2f} Gbps")
        
        # Visualize
        plot_loss_heatmap(loss_df, link_id, cells_in_link, output_dir)
        plot_link_traffic(thr_df, link_id, cells_in_link, cap_no_buf, cap_buf, output_dir)
        
    # Save Results
    res_df = pd.DataFrame(results)
    res_df.to_csv("output/link_capacity_estimates.csv", index=False)
    print("\nCapacity estimates saved to 'output/link_capacity_estimates.csv'.")

if __name__ == "__main__":
    main()
