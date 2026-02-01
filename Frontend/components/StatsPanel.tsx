
import React from 'react';
import { LinkStats } from '../types';
import { Activity, Zap, TrendingUp, BarChart3, Target } from 'lucide-react';

interface Props {
  stats: LinkStats;
}

const StatsPanel: React.FC<Props> = ({ stats }) => {
  const items = [
    { label: 'P99 Threshold', value: stats.p99, unit: 'Gbps', icon: Activity },
    { label: 'P95 Standard', value: stats.p95, unit: 'Gbps', icon: TrendingUp },
    { label: 'Avg Throughput', value: stats.avg, unit: 'Gbps', icon: BarChart3 },
    { label: 'Utilization', value: stats.utilization, unit: '%', icon: Zap },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
      {items.map((item, idx) => (
        <div key={idx} className={`bg-white/95 dark:bg-royal-900/40 border border-emerald-500/10 p-4 lg:p-6 rounded-3xl flex flex-col gap-2 lg:gap-4 shadow-xl backdrop-blur-md transition-all hover:-translate-y-2 hover:border-emerald-500/30 overflow-hidden`}>
          <div className="flex items-center justify-between">
            <div className={`p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/10`}>
              <item.icon className={`w-3.5 h-3.5 lg:w-4 lg:h-4 text-emerald-600`} />
            </div>
            <Target className="w-3 h-3 text-emerald-200 dark:text-emerald-900" />
          </div>
          <div className="space-y-0.5 lg:space-y-1">
            <span className="text-[9px] lg:text-[10px] font-black text-emerald-800/40 dark:text-emerald-700 uppercase tracking-[0.15em]">{item.label}</span>
            <div className="flex items-baseline gap-1">
              <span className={`text-lg lg:text-2xl font-mono font-black text-emerald-900 dark:text-white truncate`}>
                {typeof item.value === 'number' ? item.value.toFixed(item.unit === '%' ? 1 : 2) : item.value}
              </span>
              <span className="text-[9px] lg:text-[10px] font-mono font-bold text-emerald-800/40 uppercase tracking-tighter shrink-0">{item.unit}</span>
            </div>
          </div>
          <div className="mt-1 h-1 lg:h-1.5 w-full bg-emerald-500/5 dark:bg-royal-950 rounded-full overflow-hidden">
            <div
              className={`h-full bg-emerald-500 transition-all duration-1000 ease-out opacity-80`}
              style={{ width: `${Math.min(item.value, 100)}%` }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsPanel;
