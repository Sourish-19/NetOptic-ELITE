
import React, { useState, useEffect } from 'react';
import { ShieldCheck, Activity, Globe, Wifi, Cpu } from 'lucide-react';

const DashboardFooter: React.FC = () => {
  const [latency, setLatency] = useState(12);

  useEffect(() => {
    const interval = setInterval(() => {
      setLatency(prev => Math.max(8, Math.min(18, prev + (Math.random() - 0.5) * 2)));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <footer className="shrink-0 mt-4 md:mt-6 pt-4 border-t border-emerald-500/5 flex flex-col md:flex-row items-center justify-between gap-4 text-[9px] font-black uppercase tracking-[0.2em] text-emerald-900/40 dark:text-emerald-500/20">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
          <span className="text-emerald-600 dark:text-emerald-500">System Nominal</span>
        </div>
        
        <div className="h-3 w-px bg-emerald-500/10 hidden md:block"></div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Activity className="w-3 h-3 opacity-50" />
            <span>P-Loss: 0.001%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Wifi className="w-3 h-3 opacity-50" />
            <span>RTT: {latency.toFixed(0)}ms</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Cpu className="w-3 h-3 opacity-50" />
            <span>Threads: 128/128</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/5 border border-emerald-500/10">
          <ShieldCheck className="w-3 h-3 text-emerald-600" />
          <span className="text-emerald-600">Secure AES-256 Context</span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Globe className="w-3 h-3 opacity-50" />
            <span>Region: US-EAST-1</span>
          </div>
          <div className="opacity-30">© 2025 NetOptic Elite • v3.4.0</div>
        </div>
      </div>
    </footer>
  );
};

export default DashboardFooter;
