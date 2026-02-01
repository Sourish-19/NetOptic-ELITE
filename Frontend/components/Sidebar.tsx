
import React from 'react';
import { Financials } from '../types';
import { Settings2, DollarSign, TrendingUp, ShieldAlert, Cpu, ChevronRight, X, Layers } from 'lucide-react';

interface Props {
  bufferSize: number;
  setBufferSize: (val: number) => void;
  cost: number;
  setCost: (val: number) => void;
  financials: Financials;
  isDarkMode: boolean;
  onClose?: () => void;
  onLogout: () => void;
  user?: { name: string; email: string };
}

const Sidebar: React.FC<Props> = ({ bufferSize, setBufferSize, cost, setCost, financials, isDarkMode, onClose, onLogout, user }) => {
  return (
    <aside className="w-full sm:w-[420px] h-full bg-white dark:bg-royal-950 border-r border-emerald-500/10 flex flex-col shrink-0 overflow-y-auto z-[70] shadow-2xl lg:backdrop-blur-2xl custom-scrollbar relative">

      {/* Sidebar Header Area */}
      <div className="p-8 md:p-12 pb-6 md:pb-8 flex items-center justify-between sticky top-0 bg-white/90 dark:bg-royal-950/90 backdrop-blur-md z-20 border-b border-emerald-500/5 lg:border-none">
        <div className="flex items-center gap-4 md:gap-5">
          <div className="w-10 h-10 md:w-14 md:h-14 bg-emerald-600 rounded-xl md:rounded-3xl flex items-center justify-center shadow-2xl shadow-emerald-500/40 transform hover:rotate-12 transition-transform duration-500">
            <Layers className="w-6 h-6 md:w-8 md:h-8 text-white" />
          </div>
          <div>
            <h1 className="text-lg md:text-2xl font-black text-emerald-950 dark:text-emerald-50 leading-none tracking-tighter uppercase italic">
              NetOptic <span className="text-emerald-600 not-italic">ELITE</span>
            </h1>
            <p className="text-[9px] md:text-[10px] text-emerald-800/40 dark:text-royal-700 font-black uppercase tracking-[0.4em] mt-1.5 flex items-center gap-2">
              Optimization <ChevronRight className="w-2.5 h-2.5" />
            </p>
          </div>
        </div>

        {/* Mobile Close Button */}
        <button
          onClick={onClose}
          className="lg:hidden p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="p-8 md:p-12 pt-10 md:pt-8 space-y-12 md:space-y-16">
        {/* Controls Section */}
        <section className="space-y-10 md:space-y-12">
          <div className="space-y-10 md:space-y-12">
            <div className="space-y-6 md:space-y-8">
              {/* Buffer Slider */}
              <div className="space-y-5 md:space-y-6">
                <div className="flex justify-between items-end">
                  <label className="text-[11px] font-black text-emerald-900/40 dark:text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    Buffer Depth
                  </label>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl md:text-4xl font-mono font-black text-emerald-900 dark:text-emerald-100 tracking-tighter">{bufferSize}</span>
                    <span className="text-[10px] font-mono font-bold text-emerald-600 uppercase">µs</span>
                  </div>
                </div>
                <input
                  type="range" min="0" max="500" step="5" value={bufferSize}
                  onChange={(e) => setBufferSize(parseInt(e.target.value))}
                  className="w-full h-2 bg-emerald-50 dark:bg-royal-900 rounded-full appearance-none cursor-pointer accent-emerald-600 hover:scale-y-125 transition-all"
                />
              </div>

              {/* Cost Slider */}
              <div className="space-y-5 md:space-y-6">
                <div className="flex justify-between items-end">
                  <label className="text-[11px] font-black text-emerald-900/40 dark:text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    Cost Metric
                  </label>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl md:text-3xl font-mono font-black text-emerald-900 dark:text-emerald-100 tracking-tighter">${cost.toLocaleString()}</span>
                    <span className="text-[10px] font-mono font-bold text-emerald-600 uppercase">/Gbps</span>
                  </div>
                </div>
                <input
                  type="range" min="500" max="5000" step="50" value={cost}
                  onChange={(e) => setCost(parseInt(e.target.value))}
                  className="w-full h-2 bg-emerald-50 dark:bg-royal-900 rounded-full appearance-none cursor-pointer accent-emerald-600 hover:scale-y-125 transition-all"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Fiscal Engine Section */}
        <section className="space-y-8 md:space-y-10">
          <div className="flex items-center gap-4">
            <h3 className="text-[11px] font-black text-emerald-900/30 dark:text-emerald-500/60 uppercase tracking-[0.3em]">Fiscal Engine</h3>
            <div className="flex-1 h-px bg-emerald-500/10"></div>
          </div>

          <div className="bg-emerald-600/5 dark:bg-royal-900/40 border border-emerald-500/20 p-6 md:p-10 rounded-[2.5rem] md:rounded-[3rem] relative shadow-2xl overflow-hidden group">
            <div className="absolute top-[-20%] right-[-20%] w-32 h-32 bg-emerald-500/10 blur-[40px] rounded-full pointer-events-none group-hover:bg-emerald-500/20 transition-all duration-700"></div>
            <div className="flex items-center gap-4 mb-6 text-emerald-700 dark:text-emerald-400">
              <div className="p-2 bg-emerald-600/10 rounded-xl">
                <DollarSign className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-black uppercase tracking-widest">Est. Annual OPEX Save</span>
            </div>
            <div className="text-4xl md:text-6xl font-mono font-black text-emerald-900 dark:text-emerald-50 mb-6 tracking-tighter">
              <span className="text-xl md:text-2xl text-emerald-500/40 font-bold">$</span>
              {(financials.totalSavings / 1000).toFixed(2)}
              <span className="text-xl md:text-2xl text-emerald-500/40 font-bold uppercase">M</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-emerald-600 dark:text-emerald-400 font-black bg-emerald-600/10 px-4 py-2 rounded-2xl w-fit border border-emerald-600/10">
              <ShieldAlert className="w-4 h-4" />
              PEAK EFFICIENCY ACHIEVED
            </div>
          </div>

          <div className="grid grid-cols-1 xs:grid-cols-2 gap-4 md:gap-8">
            <div className="bg-emerald-50 dark:bg-royal-900/30 border border-emerald-500/10 p-6 md:p-8 rounded-[2rem] shadow-xl group hover:scale-105 transition-all">
              <div className="flex items-center gap-2 mb-3 text-emerald-600">
                <Cpu className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-900/40 dark:text-emerald-500/50">Yield</span>
              </div>
              <div className="text-2xl md:text-3xl font-mono font-black text-emerald-950 dark:text-emerald-100">
                {financials.efficiencyGain.toFixed(1)}%
              </div>
            </div>
            <div className="bg-emerald-50 dark:bg-royal-900/30 border border-emerald-500/10 p-8 rounded-[2rem] shadow-xl group hover:scale-105 transition-all">
              <div className="flex items-center gap-2 mb-3 text-emerald-600">
                <TrendingUp className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-900/40 dark:text-emerald-500/50">CapEx</span>
              </div>
              <div className="text-2xl md:text-3xl font-mono font-black text-emerald-950 dark:text-emerald-100">
                <span className="text-sm text-emerald-500/40 mr-1">-$</span>{(financials.capexReduction / 1000).toFixed(1)}M
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="mt-auto p-8 md:p-12 pt-0 mb-8 md:mb-0 space-y-4">
        {user && (
          <div className="bg-emerald-600/5 dark:bg-royal-900/40 border border-emerald-500/10 p-4 rounded-2xl flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-lg">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-emerald-900 dark:text-emerald-50 truncate">{user.name || 'User'}</p>
                <p className="text-xs text-emerald-800/50 dark:text-emerald-500/50 truncate max-w-[150px]">{user.email}</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              title="Log Out"
              className="p-2 rounded-lg hover:bg-red-500/10 text-emerald-600/60 hover:text-red-500 transition-colors"
            >
              <Settings2 className="w-5 h-5" />
            </button>
          </div>
        )}

        <div className="bg-emerald-600/5 dark:bg-royal-900/20 border border-emerald-500/5 p-6 md:p-8 rounded-[2rem] relative shadow-inner">
          <div className="absolute top-[-10px] left-10 px-3 bg-white dark:bg-royal-950 text-[9px] font-black text-emerald-600 uppercase tracking-[0.2em]">Operational Insight</div>
          <p className="text-xs text-emerald-900/60 dark:text-emerald-50/40 leading-relaxed font-semibold">
            "Buffer modulation intelligently mitigates jitter while preserving high-throughput lane integrity. Current stats reflect a baseline increase in utilization efficiency."
          </p>
        </div>

        {!user && (
          <button
            onClick={onLogout}
            className="w-full py-4 text-xs font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-500 dark:text-emerald-500/60 dark:hover:text-emerald-400 transition-colors flex items-center justify-center gap-2"
          >
            Sign Out
          </button>
        )}

      </div>
    </aside>
  );
};

export default Sidebar;
