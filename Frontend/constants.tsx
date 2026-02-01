
import { Topology, LinkStats } from './types';

export const LINKS = ['L-NYC-01', 'L-CHI-02', 'L-SFO-03'];

export const INITIAL_TOPOLOGY: Topology = {
  nodes: [
    ...LINKS.map(id => ({ id, group: 'link' as const })),
    ...Array.from({ length: 24 }).map((_, i) => ({ 
      id: `Cell-${String(i + 1).padStart(2, '0')}`, 
      group: 'cell' as const 
    }))
  ],
  links: Array.from({ length: 24 }).map((_, i) => ({
    source: LINKS[i % 3],
    target: `Cell-${String(i + 1).padStart(2, '0')}`
  }))
};

export const BASE_COST_PER_GBPS = 1200;
