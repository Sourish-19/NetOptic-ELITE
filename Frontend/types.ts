
export interface TrafficDataPoint {
  time: string;
  actual: number;
  capacity: number;
  burst: number;
}

export interface LinkStats {
  id: string;
  name: string;
  p99: number;
  p95: number;
  avg: number;
  peak: number;
  utilization: number;
  cellCount: number;
}

export interface Node {
  id: string;
  group: 'link' | 'cell';
  x?: number;
  y?: number;
}

export interface Link {
  source: string;
  target: string;
}

export interface Topology {
  nodes: Node[];
  links: Link[];
}

export interface Financials {
  totalSavings: number;
  capexReduction: number;
  efficiencyGain: number;
}

export interface CapacityReportItem {
  Link_ID: number;
  Cells: string;
  Optimal_Capacity_Gbps: number;
  Peak_Capacity_Gbps: number;
  Savings_Pct: number;
}
