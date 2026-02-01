
import { Topology, LinkStats, TrafficDataPoint, Financials } from '../types';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000/api';

// Mapping between Backend IDs (integers) and Frontend IDs (strings)
// Backend Logic: Link 1, Link 2...
// Frontend Constants: L-NYC-01, L-CHI-02...
const LINK_ID_MAP: Record<string, string> = {
    '1': 'L-NYC-01',
    '2': 'L-CHI-02',
    '3': 'L-SFO-03'
};

const REVERSE_LINK_ID_MAP: Record<string, string> = {
    'L-NYC-01': '1',
    'L-CHI-02': '2',
    'L-SFO-03': '3'
};

const mapBackendToFrontendId = (backendId: string | number): string => {
    const idStr = String(backendId).replace('Link ', '');
    return LINK_ID_MAP[idStr] || `L-UNK-${idStr}`;
};

const mapFrontendToBackendId = (frontendId: string): string => {
    return REVERSE_LINK_ID_MAP[frontendId] || frontendId;
};

export const fetchTopology = async (): Promise<Topology> => {
    const response = await fetch(`${API_BASE_URL}/topology`);
    const data = await response.json();

    // Transform backend topology to frontend structure
    const nodes = data.nodes.map((n: any) => {
        let id = n.id;
        if (n.group === 'link') {
            id = mapBackendToFrontendId(n.id);
        } else if (n.group === 'cell') {
            // Backend: "Cell 12", Frontend: "Cell-12"
            id = n.id.replace('Cell ', 'Cell-');
            // Pad with 0 if needed to match Cell-01 format if desired, 
            // but backend seems to use integers. Let's strict match.
            const parts = id.split('-');
            if (parts[1] && parts[1].length === 1) {
                id = `Cell-0${parts[1]}`;
            }
        }
        return {
            id,
            group: n.group,
            val: n.val
        };
    });

    const links = data.links.map((l: any) => {
        let source = l.source;
        let target = l.target;

        // Handle Link mappings
        if (source.startsWith('Link ')) source = mapBackendToFrontendId(source);
        else if (source.startsWith('Cell ')) {
            const parts = source.replace('Cell ', '').split(' ');
            const cellNum = parts[0];
            source = `Cell-${cellNum.length === 1 ? '0' + cellNum : cellNum}`;
        }

        if (target.startsWith('Link ')) target = mapBackendToFrontendId(target);
        else if (target.startsWith('Cell ')) {
            const parts = target.replace('Cell ', '').split(' ');
            const cellNum = parts[0];
            target = `Cell-${cellNum.length === 1 ? '0' + cellNum : cellNum}`;
        }

        return { source, target };
    });

    return { nodes, links };
};

export const fetchLinkStats = async (linkId: string): Promise<LinkStats> => {
    const backendId = mapFrontendToBackendId(linkId);
    const response = await fetch(`${API_BASE_URL}/stats/${backendId}`);
    if (!response.ok) throw new Error('Failed to fetch stats');
    const data = await response.json();

    // Backend: { peak_gbps, p99_gbps, p95_gbps, avg_gbps, link_id }
    return {
        id: linkId,
        name: linkId,
        p99: data.p99_gbps,
        p95: data.p95_gbps,
        avg: data.avg_gbps,
        peak: data.peak_gbps,
        utilization: (data.avg_gbps / (data.peak_gbps + 20)) * 100, // Rough estimate if not provided
        cellCount: 8 // Backend doesn't return cell count in stats, hardcode or fetch from topology
    };
};

export const fetchTraffic = async (linkId: string, bufferSize: number): Promise<TrafficDataPoint[]> => {
    const backendId = mapFrontendToBackendId(linkId);
    const response = await fetch(`${API_BASE_URL}/traffic/${backendId}`);
    if (!response.ok) throw new Error('Failed to fetch traffic');
    const data = await response.json();

    // The backend optimize endpoint gives optimal capacity for a buffer size.
    // Ideally we should call optimize to get the capacity line.
    // For now, let's fetch optimization data to get valid capacity lines.
    const optResponse = await fetch(`${API_BASE_URL}/optimize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buffer_size_us: bufferSize })
    });
    const optData = await optResponse.json();
    const linkOpt = optData[backendId];
    const capacity = linkOpt ? linkOpt.optimal_capacity : 100;

    return data.map((d: any) => ({
        time: new Date(d.time * 1000).toISOString().substr(11, 8), // Assuming timestamp is epoch seconds
        actual: d.gbps,
        capacity: capacity,
        burst: 0 // Backend doesn't give burst metric currently
    }));
};

export const fetchFinancials = async (bufferSize: number, costPerGbps: number): Promise<Financials> => {
    const response = await fetch(`${API_BASE_URL}/financials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buffer_size_us: bufferSize, cost_per_gbps: costPerGbps })
    });
    if (!response.ok) throw new Error('Failed to fetch financials');
    const data = await response.json();

    // Backend: { estimated_savings, total_peak_capacity_gbps, total_optimal_capacity_gbps, ... }
    return {
        totalSavings: data.estimated_savings,
        capexReduction: data.estimated_savings * 0.7, // Assuming 70% is CapEx
        efficiencyGain: (data.saved_capacity_gbps / data.total_optimal_capacity_gbps) * 100 // Rough calc
    };
};

export const fetchOptimization = async (bufferSize: number) => {
    const response = await fetch(`${API_BASE_URL}/optimize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buffer_size_us: bufferSize })
    });
    return await response.json();
};

export const fetchCapacityReport = async (): Promise<any[]> => {
    const response = await fetch(`${API_BASE_URL}/report/capacity`);
    if (!response.ok) return [];
    const rawData = await response.json();

    return rawData.map((row: any) => {
        const peak = row.Capacity_No_Buffer_Gbps || row.Peak_Capacity_Gbps || 0;
        const optimal = row.Capacity_With_Buffer_Gbps || row.Optimal_Capacity_Gbps || 0; // Handle schema variations
        const savings = peak > 0 ? ((peak - optimal) / peak) * 100 : 0;

        return {
            Link_ID: row.Link_ID,
            Cells: row.Cells,
            Peak_Capacity_Gbps: peak,
            Optimal_Capacity_Gbps: optimal,
            Savings_Pct: Number(savings.toFixed(1))
        };
    });
};
