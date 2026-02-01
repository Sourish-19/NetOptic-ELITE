import pandas as pd
import numpy as np
from pathlib import Path
import networkx as nx
from numba import jit

# Constants
SLOT_DURATION = 0.0005  # 500 microseconds
DEFAULT_BUFFER_TIME_SEC = 143e-6 # 143 microseconds
MAX_DROP_RATE = 0.01    # 1% packet loss allowed

class NetworkLogic:
    def __init__(self, data_dir):
        self.data_dir = Path(data_dir)
        self.cells = {}
        self.loss_df = None
        self.thr_df = None
        self.links = {}
        self.load_topology_from_csv()
        self.load_data()

    def load_topology_from_csv(self):
        """Loads link mappings from the CSV report."""
        csv_path = self.data_dir / "link_capacity_estimates.csv"
        if not csv_path.exists():
            print(f"Warning: {csv_path} not found. Using empty topology.")
            return

        try:
            df = pd.read_csv(csv_path)
            # Schema: Link_ID, Cells (space separated), ...
            for _, row in df.iterrows():
                link_id = int(row['Link_ID'])
                cells_str = str(row['Cells'])
                self.links[link_id] = cells_str.split()
            print(f"Loaded topology for {len(self.links)} links from CSV.")
        except Exception as e:
            print(f"Error loading topology CSV: {e}")

    def load_data(self):
        """Loads all aligned CSVs and aligns them."""
        print("Scaning data directory...")
        files = list(self.data_dir.glob("cell_*_aligned.csv"))
        total = len(files)
        print(f"Found {total} cell files. Loading into memory...")
        
        cells = {}
        for i, p in enumerate(files):
            try:
                print(f"[{i+1}/{total}] Parsing {p.name}...", end="\r")
                parts = p.name.split('_')
                cell_id = parts[1]
                df = pd.read_csv(p)
                cells[cell_id] = df
            except Exception as e:
                print(f"\nSkipping {p}: {e}")
        
        print("\nAligning and rescheduling timestamps...")
        self.cells = cells
        self.loss_df, self.thr_df = self.resample_data(cells)
        print(f"Backend Ready: Loaded {len(cells)} cells.")

    def resample_data(self, cells):
        # Union of all timestamps
        all_timestamps = set()
        for cid, df in cells.items():
            all_timestamps.update(df["timestamp"].values)
            
        master_index = sorted(list(all_timestamps))
        
        # We need efficient lookup, so pre-allocate
        loss_df = pd.DataFrame(index=master_index)
        throughput_df = pd.DataFrame(index=master_index)
        
        for cid, df in cells.items():
            df = df.set_index("timestamp")
            df.index = df.index.round(4)
            # Dedup
            df = df[~df.index.duplicated(keep='first')]
            
            loss_df[cid] = df["packet_loss"]
            throughput_df[cid] = df["gbps"]
            
        return loss_df.fillna(0), throughput_df.fillna(0)

    def get_topology(self):
        """Returns nodes and links for visualization."""
        nodes = []
        edges = []
        
        # Switch Node
        nodes.append({"id": "Switch", "group": "core", "val": 20})
        
        for link_id, cell_ids in self.links.items():
            # Link Aggregation Node
            link_node_id = f"Link {link_id}"
            nodes.append({"id": link_node_id, "group": "link", "val": 15})
            edges.append({"source": link_node_id, "target": "Switch"})
            
            for cid in cell_ids:
                # Cell Node
                nodes.append({"id": f"Cell {cid}", "group": "cell", "val": 10})
                edges.append({"source": f"Cell {cid}", "target": link_node_id})
                
        return {"nodes": nodes, "links": edges}

    def simulate_buffer(self, capacity_gbps, buffer_time_sec_param):
        """Run simulation for ALL links with given params."""
        results = {}
        
        for link_id, cell_ids in self.links.items():
            # Filter columns
            # Ensure we only engage cells that exist in loaded data
            valid_cells = [c for c in cell_ids if c in self.thr_df.columns]
            if not valid_cells:
                results[link_id] = {"capacity": 0, "drop_rate": 0}
                continue

            group_throughput = self.thr_df[valid_cells].sum(axis=1)
            
            # Run sim
            drop_rate = self._run_leaky_bucket(capacity_gbps, group_throughput, buffer_time_sec_param)
            
            results[link_id] = {
                "drop_rate": drop_rate,
                "is_congested": drop_rate > MAX_DROP_RATE
            }
            
        return results
    
    def find_optimal_capacity(self, buffer_time_sec_param):
        """Binary search for optimal capacity for each link given buffer size."""
        results = {}
        for link_id, cell_ids in self.links.items():
            valid_cells = [c for c in cell_ids if c in self.thr_df.columns]
            if not valid_cells: continue
            
            group_throughput = self.thr_df[valid_cells].sum(axis=1)
            peak = group_throughput.max()
            
            # Binary Search
            low = 0
            high = peak * 1.5
            optimal = high
            
            for _ in range(15): # 15 iterations is enough precision
                mid = (low + high) / 2
                drop = self._run_leaky_bucket(mid, group_throughput, buffer_time_sec_param)
                if drop <= MAX_DROP_RATE:
                    optimal = mid
                    high = mid
                else:
                    low = mid
                    
            results[link_id] = {
                "optimal_capacity": round(optimal, 2),
                "peak_load": round(peak, 2),
                "savings_pct": round((1 - optimal/peak)*100, 1) if peak > 0 else 0
            }
        return results

    def calculate_financials(self, buffer_time_sec_param, cost_per_gbps=50.0):
        """Calculates financial savings based on capacity reduction."""
        optimization_results = self.find_optimal_capacity(buffer_time_sec_param)
        
        total_peak_capacity = 0
        total_optimal_capacity = 0
        
        for link_id, res in optimization_results.items():
            total_peak_capacity += res['peak_load']
            total_optimal_capacity += res['optimal_capacity']
            
        saved_capacity = total_peak_capacity - total_optimal_capacity
        # Annual savings assuming cost is per Gbps per Year (or month, but let's say Year for impact)
        # TCO usually involves CapEx + OpEx.
        savings_amount = saved_capacity * cost_per_gbps
        
        return {
            "total_peak_capacity_gbps": round(total_peak_capacity, 2),
            "total_optimal_capacity_gbps": round(total_optimal_capacity, 2),
            "saved_capacity_gbps": round(saved_capacity, 2),
            "estimated_savings": round(savings_amount, 2),
            "cost_basis_per_gbps": cost_per_gbps,
            "optimization_details": optimization_results
        }

    def _run_leaky_bucket(self, capacity_gbps, input_series, buffer_time_sec):
        return run_leaky_bucket_jit(capacity_gbps, input_series.values, buffer_time_sec)


    
    def get_link_stats(self, link_id):
        """Calculates detailed statistics (Peak, P99, P95, Avg) for a link."""
        cell_ids = self.links.get(int(link_id))
        if not cell_ids: return {}
        
        valid_cells = [c for c in cell_ids if c in self.thr_df.columns]
        if not valid_cells: return {}
        
        agg_thr = self.thr_df[valid_cells].sum(axis=1)
        values = agg_thr.values
        
        return {
            "link_id": link_id,
            "peak_gbps": round(float(np.max(values)), 2),
            "p99_gbps": round(float(np.percentile(values, 99)), 2),
            "p95_gbps": round(float(np.percentile(values, 95)), 2),
            "avg_gbps": round(float(np.mean(values)), 2)
        }

    def get_traffic_sample(self, link_id):
        cell_ids = self.links.get(int(link_id))
        if not cell_ids: return []
        
        valid_cells = [c for c in cell_ids if c in self.thr_df.columns]
        agg_thr = self.thr_df[valid_cells].sum(axis=1)
        
        # Downsample for UI (Target ~2000 points)
        resp = []
        timestamps = agg_thr.index
        values = agg_thr.values
        
        target_points = 2000
        step = max(1, len(timestamps) // target_points)
        
        for i in range(0, len(timestamps), step):
            resp.append({
                "time": float(timestamps[i]), # Ensure float json serializable
                "gbps": round(float(values[i]), 2)
            })
        return resp

# Static JIT Helper
@jit(nopython=True)
def run_leaky_bucket_jit(capacity_gbps, inputs, buffer_time_sec):
    dt = 0.0005 # SLOT_DURATION
    max_buffer_bits = capacity_gbps * 1e9 * buffer_time_sec
    drain_rate = capacity_gbps * 1e9 * dt
    
    current_buffer = 0.0
    total_input = 0.0
    total_dropped = 0.0
    
    for inp_gbps in inputs:
        inp_bits = inp_gbps * 1e9 * dt
        total_input += inp_bits
        current_buffer += inp_bits
        current_buffer -= drain_rate
        
        if current_buffer < 0: current_buffer = 0
        if current_buffer > max_buffer_bits:
            drop = current_buffer - max_buffer_bits
            total_dropped += drop
            current_buffer = max_buffer_bits
            
    if total_input > 0:
        return total_dropped / total_input
    return 0.0
