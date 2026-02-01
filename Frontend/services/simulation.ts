
import { TrafficDataPoint, LinkStats, Financials } from '../types';

/**
 * Simulates traffic data for a specific link
 * Higher buffer size allows smoothing out bursts, potentially reducing peak capacity requirement
 */
export const simulateTraffic = (
  linkId: string, 
  bufferSize: number
): { points: TrafficDataPoint[]; stats: LinkStats } => {
  const points: TrafficDataPoint[] = [];
  const baseLoad = linkId === 'L-NYC-01' ? 40 : linkId === 'L-CHI-02' ? 30 : 25;
  
  // Smoothing factor based on buffer (0-500µs)
  // Higher buffer reduces the impact of random bursts
  const smoothing = 1 - (bufferSize / 1000); 

  let totalActual = 0;
  let maxActual = 0;
  const values: number[] = [];

  for (let i = 0; i < 24; i++) {
    const hour = `${String(i).padStart(2, '0')}:00`;
    // Diurnal pattern
    const timeFactor = Math.sin((i - 6) * Math.PI / 12) + 1.2;
    const noise = Math.random() * 10 * smoothing;
    const actual = baseLoad * timeFactor + noise;
    
    // Capacity needed depends on buffer
    // Lower buffer = higher headroom needed to prevent drops
    const headroom = 20 * (1 + (500 - bufferSize) / 500);
    const capacity = actual + headroom;
    
    points.push({
      time: hour,
      actual: parseFloat(actual.toFixed(2)),
      capacity: parseFloat(capacity.toFixed(2)),
      burst: parseFloat((noise * 2).toFixed(2))
    });

    totalActual += actual;
    if (actual > maxActual) maxActual = actual;
    values.push(actual);
  }

  values.sort((a, b) => a - b);
  const p99 = values[Math.floor(values.length * 0.99)];
  const p95 = values[Math.floor(values.length * 0.95)];

  const stats: LinkStats = {
    id: linkId,
    name: linkId,
    p99: parseFloat(p99.toFixed(2)),
    p95: parseFloat(p95.toFixed(2)),
    avg: parseFloat((totalActual / 24).toFixed(2)),
    peak: parseFloat(maxActual.toFixed(2)),
    utilization: parseFloat(((totalActual / 24) / (maxActual + 20) * 100).toFixed(1)),
    cellCount: 8
  };

  return { points, stats };
};

export const calculateFinancials = (
  bufferSize: number, 
  costPerGbps: number
): Financials => {
  // Logic: 
  // Savings = (Baseline Capacity Needed - Optimized Capacity Needed) * Cost
  // Baseline is at 0 buffer
  const baselineBufferEff = 0.6;
  const currentBufferEff = 0.6 + (bufferSize / 500) * 0.35;
  
  const totalTraffic = 450; // Gbps across all links
  const baselineCost = (totalTraffic / baselineBufferEff) * costPerGbps;
  const optimizedCost = (totalTraffic / currentBufferEff) * costPerGbps;
  
  const totalSavings = baselineCost - optimizedCost;
  
  return {
    totalSavings,
    capexReduction: totalSavings * 0.7,
    efficiencyGain: (currentBufferEff - baselineBufferEff) / baselineBufferEff * 100
  };
};
