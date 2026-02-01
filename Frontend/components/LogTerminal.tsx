
import React, { useEffect, useRef, useState } from 'react';
import { Terminal as TerminalIcon, ShieldCheck } from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warn';
}

interface Props {
  logs: string[];
  isDarkMode: boolean;
}

const LogTerminal: React.FC<Props> = ({ logs, isDarkMode }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [entries, setEntries] = useState<LogEntry[]>([]);

  useEffect(() => {
    if (logs.length > 0) {
      const newEntry: LogEntry = {
        id: Math.random().toString(36),
        timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        message: logs[logs.length - 1],
        type: logs[logs.length - 1].includes('Savings') ? 'success' :
          logs[logs.length - 1].includes('updated') ? 'warn' : 'info'
      };
      setEntries(prev => [...prev, newEntry].slice(-50));
    }
  }, [logs]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries]);

  return (
    <div className="bg-white/70 dark:bg-royal-950/60 border border-emerald-500/10 rounded-[2rem] flex flex-col h-full overflow-hidden shadow-2xl backdrop-blur-xl transition-all hover:border-emerald-500/30 group">
      <div className="bg-emerald-500/5 dark:bg-royal-900/50 px-6 py-4 border-b border-emerald-500/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <TerminalIcon className="w-4 h-4 text-emerald-600" />
          <span className="text-[10px] font-black text-emerald-800/60 dark:text-royal-700 uppercase tracking-[0.2em]">Real-Time Execution Kernel</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <ShieldCheck className="w-3 h-3 text-emerald-600" />
          <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Secured</span>
        </div>
      </div>
      <div
        ref={scrollRef}
        className="flex-1 p-6 overflow-y-auto font-mono text-[10px] space-y-2 selection:bg-emerald-500/30 custom-scrollbar-minimal"
      >
        {entries.map((log) => (
          <div key={log.id} className="flex gap-4 leading-relaxed group/log">
            <span className="text-emerald-500 dark:text-emerald-400 shrink-0 font-bold select-none">[{log.timestamp}]</span>
            <span className={
              log.type === 'success' ? 'text-emerald-600 font-bold' :
                log.type === 'warn' ? 'text-emerald-500' : 'text-emerald-900/60 dark:text-purple-100/60'
            }>
              <span className="text-emerald-200 dark:text-royal-800 mr-2 group-hover/log:text-emerald-500 transition-colors">▶</span>
              {log.message}
            </span>
          </div>
        ))}
        {entries.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 opacity-20">
            <TerminalIcon className="w-8 h-8 text-emerald-600" />
            <div className="text-emerald-800 dark:text-royal-700 italic uppercase tracking-[0.2em] font-black">Kernel Pending</div>
          </div>
        )}
      </div>
      <style>{`
        .custom-scrollbar-minimal::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar-minimal::-webkit-scrollbar-thumb { background: rgba(16, 185, 129, 0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default LogTerminal;
