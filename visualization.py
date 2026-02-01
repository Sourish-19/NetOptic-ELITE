import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.cm as cm
from pathlib import Path
import ast

def load_data():
    """
    Loads aligned cell data and link estimates.
    """
    data_dir = Path("output")
    
    # Load Link Estimates
    try:
        links_df = pd.read_csv(data_dir / "link_capacity_estimates.csv")
    except FileNotFoundError:
        print("Error: 'output/link_capacity_estimates.csv' not found. Run topology.py first.")
        return None, None

    # Load Cell Data
    cells = {}
    for p in data_dir.glob("cell_*_aligned.csv"):
        try:
            cid = p.name.split('_')[1]
            cells[cid] = pd.read_csv(p)
        except: continue
        
    return links_df, cells

def plot_link_utilization(link_id, cell_ids, optimal_cap, peak_load, cells_data, output_dir):
    """
    Generates 'Figure 3': Aggregated Throughput vs Capacity.
    """
    # Align aggregation
    # We need a common index. Since main.py aligns timelines, we can assume
    # closely matching timestamps, but let's be safe and reindex to a master grid.
    
    # 1. Create master index from all cells in group
    all_ts = set()
    for cid in cell_ids:
        if cid in cells_data:
            all_ts.update(cells_data[cid]["timestamp"].values)
            
    master_index = sorted(list(all_ts))
    agg_df = pd.DataFrame(index=master_index)
    
    # 2. Sum throughput
    for cid in cell_ids:
        if cid not in cells_data: continue
        df = cells_data[cid].set_index("timestamp")
        # Reindex to master, fill 0
        df = df.reindex(master_index, fill_value=0)
        agg_df[cid] = df["gbps"]
        
    agg_df["total_gbps"] = agg_df.sum(axis=1)
    
    # 3. Plot
    plt.figure(figsize=(12, 6))
    
    # Plot total load
    plt.plot(agg_df.index, agg_df["total_gbps"], color='black', linewidth=0.8, alpha=0.8, label="Aggregated Traffic")
    
    # Plot Optimal Capacity
    plt.axhline(y=optimal_capacity, color='red', linestyle='--', linewidth=2, label=f"Required FH Link Capacity ({optimal_capacity} Gbps)")
    
    # Plot Peak (Reference)
    # plt.axhline(y=peak_load, color='gray', linestyle=':', label=f"Peak Load ({peak_load} Gbps)")
    
    plt.xlabel("Time [s]")
    plt.ylabel("Data rate [Gbps]")
    plt.title(f"Link {link_id} Capacity Requirement (Cells: {', '.join(cell_ids)})")
    plt.legend(loc="upper right")
    plt.grid(True, alpha=0.3)
    
    out_path = output_dir / f"link_{link_id}_utilization.png"
    plt.savefig(out_path, dpi=150)
    plt.close()
    print(f"  -> Generated {out_path}")

def plot_loss_heatmap(link_id, cell_ids, cells_data, output_dir):
    """
    Generates 'Figure 1': Packet Loss Heatmap.
    """
    # 1. Prepare Matrix: Rows=Cells, Cols=Time
    # Use same master index approach
    all_ts = set()
    for cid in cell_ids:
        if cid in cells_data:
            all_ts.update(cells_data[cid]["timestamp"].values)
            
    master_index = sorted(list(all_ts))
    
    # Filter to a specific window? 
    # Validating on the WHOLE timeline might be huge image.
    # Let's verify data duration. Usually 1-2 seconds based on logs.
    # 2 seconds / 0.0005s (slot) = 4000 cols. Manageable.
    
    matrix_data = []
    labels = []
    
    for cid in cell_ids:
        if cid not in cells_data: continue
        df = cells_data[cid].set_index("timestamp")
        df = df.reindex(master_index, fill_value=0)
        
        # Binarize or Intensity? 
        # Figure 1 shows black bars. Binary "Has Loss" or "No Loss" is cleanest.
        loss_signal = df["packet_loss"].values
        loss_signal[loss_signal > 0] = 1 # Binarize for simple visual
        
        matrix_data.append(loss_signal)
        labels.append(f"Cell {cid}")
        
    if not matrix_data: return

    matrix = np.array(matrix_data)
    
    # 2. Plot
    plt.figure(figsize=(14, len(cell_ids)*0.8 + 2))
    
    # Use binary colormap (White=No Loss, Black=Loss)
    plt.imshow(matrix, aspect='auto', cmap='Greys', interpolation='nearest',
               extent=[master_index[0], master_index[-1], 0, len(cell_ids)])
    
    plt.yticks(np.arange(len(cell_ids)) + 0.5, labels[::-1]) # Reverse labels to match image top-down
    plt.xlabel("Time [s]")
    plt.title(f"Link {link_id}: Correlated Packet Loss Events")
    
    out_path = output_dir / f"link_{link_id}_loss_heatmap.png"
    plt.savefig(out_path, dpi=150)
    plt.close()
    print(f"  -> Generated {out_path}")

def main():
    links_df, cells = load_data()
    if links_df is None: return
    
    output_dir = Path("output")
    
    print("Generating Link Visualizations...")
    
    for _, row in links_df.iterrows():
        link_id = row["Link_ID"]
        
        # Cells column is string representation of list: "['1', '2']" or space separated "1 2"
        # topology.py saved it as space separated string "10 11 12" depending on implementation.
        # Let's check topology.py line 205: " ".join(sorted(group_list))
        # So it's space separated.
        
        cell_ids = str(row["Cells"]).split()
        
        opt_cap = float(row["Optimal_Capacity_Gbps"])
        peak_load = float(row["Peak_Load_Gbps"])
        
        print(f"Processing Link {link_id}...")
        
        # 1. Utilization Plot
        plot_link_utilization(link_id, cell_ids, opt_cap, peak_load, cells, output_dir)
        
        # 2. Heatmap Plot
        plot_loss_heatmap(link_id, cell_ids, cells, output_dir)
        
    print("\nVisualization Complete.")

if __name__ == "__main__":
    main()
