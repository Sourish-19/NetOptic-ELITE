import argparse
import sys
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from pathlib import Path
import random

# Constants
SYMBOL_DURATION = 0.0000357

def get_args():
    parser = argparse.ArgumentParser(description="Telecom Telemetry Phase 1: Cleaning & Alignment")
    parser.add_argument("log_dir", type=str, help="Path to the folder containing .dat logs")
    return parser.parse_args()

def scan_files(log_dir):
    """
    Scans the directory for pkt-stats-cell-*.dat and throughput-cell-*.dat files.
    Returns a dict: { cell_id: {'pkt': path, 'thr': path} }
    """
    path = Path(log_dir)
    if not path.is_dir():
        print(f"Error: Directory '{log_dir}' not found.")
        sys.exit(1)
        
    cell_map = {}
    
    # Scan for packet stats
    for p in path.glob("pkt-stats-cell-*.dat"):
        try:
            parts = p.name.split('-')
            cell_id = parts[3].replace('.dat', '')
            if cell_id not in cell_map: cell_map[cell_id] = {}
            cell_map[cell_id]['pkt'] = p
        except: continue
            
    # Scan for throughput
    for p in path.glob("throughput-cell-*.dat"):
        try:
            parts = p.name.split('-')
            cell_id = parts[2].replace('.dat', '')
            if cell_id not in cell_map: cell_map[cell_id] = {}
            cell_map[cell_id]['thr'] = p
        except: continue
    
    # Filter incomplete cells
    valid_cells = {k: v for k, v in cell_map.items() if 'pkt' in v and 'thr' in v}
    print(f"Found {len(valid_cells)} complete cells (pkt + thr pair).")
    return valid_cells

def process_throughput(file_path):
    """
    Loads, sorts, cleans, and converts throughput data.
    Returns DataFrame with ['timestamp', 'gbps']
    """
    try:
        df = pd.read_csv(file_path, sep=r'\s+', header=None, names=["timestamp", "kbits"])
    except Exception as e:
        print(f"Error reading throughput {file_path}: {e}")
        return None

    # Step 6: Sort
    df = df.sort_values("timestamp").reset_index(drop=True)
    
    # Step 7: Remove spikes
    median_val = df["kbits"].median()
    mean_val = df["kbits"].mean()
    
    # Logic: If median is 0 (bursty traffic), use mean. Ensure existing floor (e.g. 0.1)
    cutoff = max(median_val * 10, mean_val * 5, 100.0) # 100 kbits minimum floor
    
    # Replace spikes with 0
    spikes_mask = df["kbits"] > cutoff
    spike_count = spikes_mask.sum()
    df.loc[spikes_mask, "kbits"] = 0.0
    
    # Step 8: Convert to Gbps
    # Gbps = (kbits * 1000) / symbol_duration / 1e9
    df["gbps"] = (df["kbits"] * 1000) / SYMBOL_DURATION / 1e9
    
    return df, spike_count

def process_packets(file_path):
    """
    Loads, sorts, and computes packet loss.
    Returns DataFrame with ['timestamp', 'loss']
    """
    try:
        # Step 4: Load raw (skipping header)
        df = pd.read_csv(file_path, sep=r'\s+', header=None, comment='<', 
                         names=["timestamp", "tx", "rx", "tooLate"])
    except Exception as e:
        print(f"Error reading packets {file_path}: {e}")
        return None

    # Step 6: Sort
    df = df.sort_values("timestamp").reset_index(drop=True)
    
    # Step 9: Compute Match Packet Loss
    # loss = tx - (rx - tooLate) = tx - rx + tooLate
    df["loss"] = df["tx"] - df["rx"] + df["tooLate"]
    df["loss"] = df["loss"].clip(lower=0)
    
    return df

def align_timelines(df_thr, df_pkt):
    """
    Step 10: Find best shift to align packet loss to throughput.
    Returns aligned DataFrame and correlation stats.
    """
    thr_ts = df_thr["timestamp"].values
    thr_vals = df_thr["gbps"].values
    
    pkt_ts = df_pkt["timestamp"].values
    pkt_loss = df_pkt["loss"].values
    
    best_shift = 0
    best_corr = -1
    
    # Grid search for shift: -1.5 to 1.5
    shifts = np.linspace(-1.5, 1.5, 61) # 61 steps implies 0.05s resolution
    
    for s in shifts:
        # Shift packet timestamps: t_pkt_shifted = t_pkt + s
        # We want to resample packet loss onto throughput timestamps
        # If we shift packet time by s, it means an event at t in pkt frame happened at t+s in thr frame? 
        # Wait, the prompt says: "shifted_loss = [interpolate(loss, t+s) for t in thr_ts]"
        # This means we probe the packet loss function at (t_thr + s)
        # So effectively we are shifting the packet signal to the LEFT by s? 
        # Actually standard cross-corr definition. Let's stick to the prompt's logic precisely.
        
        # logical_ts = thr_ts + s
        # interpolated values from pkt series
        interp_loss = np.interp(thr_ts + s, pkt_ts, pkt_loss, left=0, right=0)
        
        # Calculate correlation
        try:
            # np.corrcoef returns matrix [[1, r], [r, 1]]
            corr = np.corrcoef(thr_vals, interp_loss)[0, 1]
        except:
            corr = 0
            
        if np.isnan(corr): corr = 0
            
        if corr > best_corr:
            best_corr = corr
            best_shift = s
            
    # Apply best shift
    final_aligned_loss = np.interp(thr_ts + best_shift, pkt_ts, pkt_loss, left=0, right=0)
    
    aligned_df = pd.DataFrame({
        "timestamp": thr_ts,
        "gbps": thr_vals,
        "packet_loss": final_aligned_loss
    })
    
    return aligned_df, best_shift, best_corr

def plot_alignment(aligned_df, cell_id, output_dir):
    """
    Plots aligned throughput and packet loss.
    """
    fig, ax1 = plt.subplots(figsize=(12, 6))

    color = 'tab:blue'
    ax1.set_xlabel('Timestamp (s)')
    ax1.set_ylabel('Throughput (Gbps)', color=color)
    ax1.plot(aligned_df['timestamp'], aligned_df['gbps'], color=color, alpha=0.6, label='Throughput')
    ax1.tick_params(axis='y', labelcolor=color)

    ax2 = ax1.twinx()  # instantiate a second axes that shares the same x-axis
    color = 'tab:red'
    ax2.set_ylabel('Packet Loss', color=color)  # we already handled the x-label with ax1
    ax2.plot(aligned_df['timestamp'], aligned_df['packet_loss'], color=color, alpha=0.6, label='Packet Loss')
    ax2.tick_params(axis='y', labelcolor=color)
    
    plt.title(f"Cell {cell_id} Aligned Data")
    fig.tight_layout()  # otherwise the right y-label is slightly clipped
    
    plot_path = output_dir / f"cell_{cell_id}_aligned.png"
    plt.savefig(plot_path)
    plt.close()

def main():
    args = get_args()
    log_dir = args.log_dir
    
    # 1. Scan
    cells = scan_files(log_dir)
    if not cells:
        print("No complete cells found.")
        sys.exit(0)
        
    output_dir = Path("output")
    output_dir.mkdir(exist_ok=True)
    
    processed_count = 0
    
    for cell_id, files in cells.items():
        print(f"Processing Cell {cell_id}...")
        
        # Process Throughput
        df_thr, spikes = process_throughput(files['thr'])
        if df_thr is None: continue
        print(f"  -> Throughput loaded: {len(df_thr)} rows, {spikes} spikes removed.")
        
        # Process Packets
        df_pkt = process_packets(files['pkt'])
        if df_pkt is None: continue
        print(f"  -> Packets loaded: {len(df_pkt)} rows.")
        
        # Align
        aligned_df, shift, corr = align_timelines(df_thr, df_pkt)
        print(f"  -> Best Shift: {shift:.2f}s, Correlation: {corr:.4f}")
        
        # Save
        csv_path = output_dir / f"cell_{cell_id}_aligned.csv"
        aligned_df.to_csv(csv_path, index=False)
        
        processed_count += 1
        
        # Plot sample (randomly ~10% chance or if count is low)
        if processed_count <= 3: 
            plot_alignment(aligned_df, cell_id, output_dir)
            
    print(f"\nPhase 1 Complete. Processed {processed_count} cells.")

if __name__ == "__main__":
    main()
