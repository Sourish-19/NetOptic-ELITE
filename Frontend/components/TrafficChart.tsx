
import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend
} from 'recharts';
import { TrafficDataPoint } from '../types';

interface Props {
  data: TrafficDataPoint[];
  linkName: string;
  isDarkMode: boolean;
}

const TrafficChart: React.FC<Props> = ({ data, linkName, isDarkMode }) => {
  const peak = data.length > 0 ? Math.max(...data.map(d => d.actual)) : 0;

  return (
    <div className="w-full h-full p-8 bg-white/90 dark:bg-royal-900/40 rounded-[2.5rem] border border-emerald-500/10 flex flex-col shadow-2xl backdrop-blur-md">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h3 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em] mb-1.5">Load Analysis</h3>
          <p className="text-2xl font-black text-emerald-900 dark:text-white tracking-tight italic">{linkName}</p>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-bold text-emerald-800/40 uppercase tracking-widest block mb-1.5">Real-time Peak</span>
          <span className="text-3xl font-mono font-black text-emerald-600 drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]">{peak.toFixed(1)} <span className="text-xs">Gbps</span></span>
        </div>
      </div>

      <div className="flex-1 min-h-0 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#064e3b" : "#cbd5e1"} vertical={false} strokeOpacity={0.3} />
            <XAxis
              dataKey="time" stroke={isDarkMode ? "#065f46" : "#065f46"} fontSize={10}
              tickLine={false} axisLine={false} dy={15} strokeOpacity={0.5}
            />
            <YAxis
              stroke={isDarkMode ? "#065f46" : "#065f46"} fontSize={10}
              tickLine={false} axisLine={false} unit="G" dx={-15} strokeOpacity={0.5}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: isDarkMode ? '#01150c' : '#ffffff',
                border: '1px solid rgba(16, 185, 129, 0.1)', borderRadius: '16px',
                fontSize: '11px', color: '#10b981', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                backdropFilter: 'blur(8px)'
              }}
            />
            <Legend verticalAlign="top" align="center" height={50} iconType="circle"
              wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: '900', color: '#065f46' }}
            />
            <Area
              type="monotone" dataKey="capacity" stroke="#065f46" fill="transparent"
              strokeDasharray="4 4" strokeWidth={1.5} name="Target Capacity" strokeOpacity={0.4}
            />
            <Area
              type="monotone" dataKey="actual" stroke="#10b981" fillOpacity={1}
              fill="url(#colorActual)" strokeWidth={4} name="Active Traffic"
            />
            <ReferenceLine y={peak} stroke="#ef4444" strokeDasharray="3 3"
              label={{ value: 'CRITICAL', position: 'insideTopRight', fill: '#ef4444', fontSize: 10, fontWeight: '900' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TrafficChart;
