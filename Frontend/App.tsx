
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TopologyGraph from './components/TopologyGraph';
import TrafficChart from './components/TrafficChart';
import StatsPanel from './components/StatsPanel';
import LogTerminal from './components/LogTerminal';
import LandingPage from './components/LandingPage';
import DashboardFooter from './components/DashboardFooter';
import ReportView from './components/ReportView';
import { GoogleGenAI } from "@google/genai";
import { INITIAL_TOPOLOGY, BASE_COST_PER_GBPS, LINKS } from './constants';
import { fetchTraffic, fetchLinkStats, fetchFinancials, fetchTopology, API_BASE_URL } from './services/api';
import { TrafficDataPoint, LinkStats, Financials, Topology } from './types';
import LoginPage from './components/Auth/LoginPage';
import SignupPage from './components/Auth/SignupPage';
import { BrainCircuit, RefreshCw, Layers, Sun, Moon, Activity, Menu } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<'landing' | 'dashboard' | 'report'>('landing');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [bufferSize, setBufferSize] = useState(250);
  const [cost, setCost] = useState(BASE_COST_PER_GBPS);
  const [selectedLink, setSelectedLink] = useState(LINKS[0]);
  const [insight, setInsight] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Auth States
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authView, setAuthView] = useState<'login' | 'signup'>('login');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token) {
      setIsAuthenticated(true);
      if (savedUser) setUser(JSON.parse(savedUser));
      setView('dashboard'); // Auto-skip landing page if logged in
    }
  }, []);

  const handleLogin = (token: string, userData: any) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setIsAuthenticated(true);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setView('landing'); // Reset view
  };

  // Data States
  const [topology, setTopology] = useState<Topology>(INITIAL_TOPOLOGY);
  const [points, setPoints] = useState<TrafficDataPoint[]>([]);
  const [stats, setStats] = useState<LinkStats>({
    id: selectedLink,
    name: selectedLink,
    p99: 0,
    p95: 0,
    avg: 0,
    peak: 0,
    utilization: 0,
    cellCount: 0
  });
  const [financials, setFinancials] = useState<Financials>({
    totalSavings: 0,
    capexReduction: 0,
    efficiencyGain: 0
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Fetch Topology on Mount
  useEffect(() => {
    const loadTopology = async () => {
      try {
        const data = await fetchTopology();
        setTopology(data);
        setLogs(prev => [...prev, 'Topology data loaded from backend.']);
      } catch (error) {
        console.error("Failed to load topology", error);
        setLogs(prev => [...prev, 'Error: Failed to load topology. Using cached default.']);
      }
    };
    if (view === 'dashboard') {
      loadTopology();
    }
  }, [view]);

  // Fetch Data when parameters change
  useEffect(() => {
    if (view !== 'dashboard') return;

    const loadData = async () => {
      // Independent fetches to prevent cascade failure

      // 1. Traffic Data
      try {
        const trafficDisplay = await fetchTraffic(selectedLink, bufferSize);
        setPoints(trafficDisplay);
      } catch (error) {
        console.error("Failed to fetch traffic", error);
        setLogs(prev => [...prev, `Error: Traffic load failed for ${selectedLink}`]);
      }

      // 2. Link Statistics (P99, P95, etc.)
      try {
        const linkStats = await fetchLinkStats(selectedLink);
        setStats(linkStats);
        setLogs(prev => [...prev, `DEBUG STATS: ${JSON.stringify(linkStats)}`]);
      } catch (error) {
        console.error("Failed to fetch link stats", error);
        setLogs(prev => [...prev, `Error: Statistics failed for ${selectedLink}`]);
      }

      // 3. Financials
      try {
        const finData = await fetchFinancials(bufferSize, cost);
        setFinancials(finData);
        setLogs(prev => [...prev, `DEBUG FIN: ${JSON.stringify(finData)}`]);
      } catch (error) {
        console.error("Failed to fetch financials", error);
        setLogs(prev => [...prev, `Error: Financial calc failed: ${error}`]);
      }
    };

    loadData();
  }, [selectedLink, bufferSize, cost, view]);

  useEffect(() => {
    if (view === 'dashboard') {
      setLogs(prev => [...prev, `Link context switched: ${selectedLink}`]);
    }
  }, [selectedLink, view]);

  useEffect(() => {
    if (view !== 'dashboard') return;

    const fetchInsight = async () => {
      setIsThinking(true);
      try {
        const apiKey = import.meta.env.VITE_API_KEY || process.env.API_KEY;
        if (!apiKey) {
          throw new Error("No API Key");
        }
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `Assessment for ${selectedLink}: Buffer ${bufferSize}µs, P99 ${stats.p99} Gbps, util ${stats.utilization}%. 2 sentences on efficiency. Use professional tone.`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.0-flash-exp',
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
        });

        const text = (response as any).text?.() || (response as any).candidates?.[0]?.content?.parts?.[0]?.text || "Analysis complete. Optimization within nominal bounds.";
        setInsight(text);
      } catch (err) {
        setInsight("Analytics engine disconnected. Defaulting to local heuristics.");
      } finally {
        setIsThinking(false);
      }
    };

    const timeout = setTimeout(fetchInsight, 2000);
    return () => clearTimeout(timeout);
  }, [selectedLink, bufferSize, view, stats.p99]);

  if (view === 'landing') {
    return <LandingPage onStart={() => setView('dashboard')} isDarkMode={isDarkMode} />;
  }

  if (!isAuthenticated) {
    if (authView === 'signup') {
      return (
        <SignupPage
          onLogin={handleLogin}
          onSwitchToLogin={() => setAuthView('login')}
          API_BASE_URL={API_BASE_URL}
          onBack={() => setView('landing')}
        />
      );
    }
    return (
      <LoginPage
        onLogin={handleLogin}
        onSwitchToSignup={() => setAuthView('signup')}
        API_BASE_URL={API_BASE_URL}
        onBack={() => setView('landing')}
      />
    );
  }

  return (
    <div className={`flex flex-col lg:flex-row h-screen transition-colors duration-700 overflow-hidden ${isDarkMode ? 'bg-royal-950 text-emerald-50' : 'light-blue-gradient text-slate-900'}`}>

      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-end p-4 bg-white/80 dark:bg-royal-950/80 backdrop-blur-md border-b border-emerald-500/10 z-[60]">

        <div className="flex gap-2">
          <button
            onClick={() => setView(view === 'dashboard' ? 'report' : 'dashboard')}
            className="p-2 rounded-lg bg-emerald-600 text-white shadow-lg"
          >
            <Layers className="w-6 h-6" />
          </button>
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Sidebar Wrapper */}
      <div className={`fixed inset-0 z-[70] transform lg:relative lg:translate-x-0 transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:block`}>
        <Sidebar
          bufferSize={bufferSize}
          setBufferSize={setBufferSize}
          cost={cost}
          setCost={setCost}
          financials={financials}
          isDarkMode={isDarkMode}
          onClose={() => setIsSidebarOpen(false)}
          onLogout={handleLogout}
          user={user}
        />
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm lg:hidden z-[-1]"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </div>

      <main className="flex-1 p-4 md:p-6 lg:p-10 flex flex-col gap-6 lg:gap-8 overflow-y-auto lg:overflow-hidden relative custom-scrollbar">
        {/* Ambient Emerald Accents */}
        <div className="absolute top-[-5%] right-[-5%] w-[300px] md:w-[400px] h-[300px] md:h-[400px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none"></div>

        {/* Desktop Header */}
        <header className="hidden lg:flex justify-end items-center shrink-0 z-10">


          <div className="flex items-center gap-6">

            <button
              onClick={() => setView(view === 'dashboard' ? 'report' : 'dashboard')}
              className={`p-3.5 rounded-2xl border transition-all shadow-lg backdrop-blur-md flex items-center gap-3
                 ${view === 'report'
                  ? 'bg-emerald-600 border-emerald-500 text-white shadow-emerald-500/20'
                  : 'bg-white/60 dark:bg-royal-900/40 border-emerald-500/10 hover:bg-white dark:hover:bg-royal-800/60'}`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${view === 'report' ? 'bg-white animate-pulse' : 'bg-emerald-500'}`}></div>
                <span className={`text-[11px] font-black uppercase tracking-widest ${view === 'report' ? 'text-white' : 'text-emerald-800 dark:text-emerald-100'}`}>
                  {view === 'report' ? 'Return to Live' : 'Verification Report'}
                </span>
              </div>
            </button>

            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-3.5 rounded-2xl bg-white/60 dark:bg-royal-900/40 border border-emerald-500/10 hover:bg-white dark:hover:bg-royal-800/60 transition-all shadow-lg backdrop-blur-md flex items-center gap-3"
            >
              {isDarkMode ? <Sun className="w-5 h-5 text-emerald-400" /> : <Moon className="w-5 h-5 text-emerald-600" />}
              <span className="text-[11px] font-black uppercase tracking-widest text-emerald-800 dark:text-emerald-100">{isDarkMode ? 'Day' : 'Night'}</span>
            </button>

            <div className="h-10 w-px bg-emerald-500/10"></div>

            <div className="text-right">
              <p className="text-[10px] font-black text-emerald-700/40 dark:text-emerald-500/30 uppercase tracking-widest">Global Yield</p>
              <div className="flex items-center justify-end gap-2 text-emerald-600 dark:text-emerald-400">
                <Activity className="w-4 h-4" />
                <p className="text-2xl font-mono font-black">+{financials.efficiencyGain.toFixed(1)}%</p>
              </div>
            </div>

            <div className={`px-6 py-4 rounded-2xl border transition-all duration-300 flex items-center gap-3 backdrop-blur-lg ${isThinking
              ? 'bg-emerald-600/10 border-emerald-400/40 shadow-emerald-500/5 shadow-2xl'
              : 'bg-white/40 dark:bg-royal-900/40 border-emerald-500/5'
              }`}>
              <RefreshCw className={`w-4 h-4 ${isThinking ? 'animate-spin text-emerald-600' : 'text-emerald-300'}`} />
              <div className="flex flex-col">
                <span className={`text-[9px] font-black tracking-[0.2em] uppercase ${isThinking ? 'text-emerald-600' : 'text-emerald-800/40'}`}>
                  {isThinking ? 'Analyzing' : 'Standby'}
                </span>
                <span className="text-[10px] font-mono font-bold text-emerald-500/30">L-SYS::STABLE</span>
              </div>
            </div>
          </div>
        </header>

        {view === 'report' ? (
          <ReportView isDarkMode={isDarkMode} />
        ) : (
          <div className="flex-1 grid grid-cols-12 gap-6 lg:gap-8 min-h-0 z-10">
            <div className="col-span-12 lg:col-span-5 flex flex-col gap-6 lg:gap-8 min-h-0">
              <div className="h-[350px] md:h-[450px] lg:flex-[3] min-h-0 shadow-2xl rounded-[2rem] lg:rounded-[2.5rem]">
                <TopologyGraph
                  data={topology}
                  selectedId={selectedLink}
                  onSelect={setSelectedLink}
                  isDarkMode={isDarkMode}
                />
              </div>
              <div className="h-[250px] lg:flex-[2] min-h-0 shadow-2xl rounded-[2rem] lg:rounded-[2.5rem]">
                <LogTerminal logs={logs} isDarkMode={isDarkMode} />
              </div>
            </div>

            <div className="col-span-12 lg:col-span-7 flex flex-col gap-6 lg:gap-8 min-h-0 lg:overflow-y-auto pr-0 lg:px-6 lg:pb-8 lg:pt-2 custom-scrollbar">
              <div className="h-[350px] md:h-[450px] lg:flex-1 shrink-0 lg:shrink">
                <TrafficChart data={points} linkName={selectedLink} isDarkMode={isDarkMode} />
              </div>

              <div className="shrink-0 bg-white/90 dark:bg-royal-900/40 border border-emerald-500/10 p-6 md:p-8 rounded-[2rem] lg:rounded-[2.5rem] relative overflow-hidden shadow-xl backdrop-blur-xl transition-all hover:bg-white dark:hover:bg-royal-800/20">
                <div className="absolute top-0 left-0 w-1 md:w-2 h-full bg-emerald-600"></div>
                <div className="flex items-center gap-4 mb-4 md:mb-5">
                  <div className="p-2 bg-emerald-600/10 rounded-xl">
                    <BrainCircuit className="w-5 h-5 text-emerald-600" />
                  </div>
                  <h4 className="text-[11px] font-black text-emerald-800/50 dark:text-emerald-500/40 uppercase tracking-[0.3em]">AI Intelligence Brief</h4>
                </div>
                <p className="text-lg md:text-xl font-medium text-emerald-900 dark:text-emerald-50/90 leading-relaxed italic">
                  {insight || "Awaiting simulation loop feedback for next-gen throughput optimization..."}
                </p>
              </div>

              <div className="shrink-0">
                <StatsPanel stats={stats} />
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Status Bar Footer */}
        <DashboardFooter />
      </main>
    </div>
  );
};

export default App;
