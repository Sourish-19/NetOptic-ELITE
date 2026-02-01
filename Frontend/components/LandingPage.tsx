
import React, { useState, useEffect } from 'react';
import {
  Layers,
  ArrowRight,
  Activity,
  ShieldCheck,
  Zap,
  Network
} from 'lucide-react';
import CurvedLoop from './CurvedLoop';
import BlurText from './BlurText';
import RevealLoader from './RevealLoader';
import LiquidEther from './LiquidEther';

interface Props {
  onStart: () => void;
  isDarkMode: boolean;
}

const LandingPage: React.FC<Props> = ({ onStart, isDarkMode }) => {
  const [scrolled, setScrolled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showHeroText, setShowHeroText] = useState(false);
  const navRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      // Trigger the shrink effect slightly earlier (30px) for better responsiveness
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Hide scrollbar effect
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      body::-webkit-scrollbar {
        display: none;
      }
      body {
        -ms-overflow-style: none;  /* IE and Edge */
        scrollbar-width: none;  /* Firefox */
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="min-h-screen w-full flex flex-col bg-white dark:bg-royal-950 transition-colors duration-500 relative">
      {isLoading && (
        <RevealLoader
          text="NETOPTIC"
          textSize="120px"
          bgColors={["#022c22", "#064e3b", "#065f46"]} // Emerald gradient
          angle={135}
          movementDirection="top-down"
          staggerOrder="center-out"
          textFadeDelay={0.1}
          overlayRef={navRef}
          onTextFadeComplete={() => setShowHeroText(true)}
          onComplete={() => setIsLoading(false)}
        />
      )}

      {/* Liquid Ether Interactive Background */}
      <div className="fixed inset-0 z-0">
        <LiquidEther
          colors={['#10b981', '#34d399', '#064e3b']}
          mouseForce={30}
          cursorSize={80}
          isViscous
          viscous={20}
          iterationsViscous={20}
          iterationsPoisson={20}
          resolution={0.4} // Lower resolution for better performance on full screen
          autoDemo={true}
          autoSpeed={0.3}
          autoIntensity={1.5}
        />
        {/* Texture Overlay */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.07] pointer-events-none"
          style={{ backgroundImage: `radial-gradient(#10b981 1px, transparent 1px)`, backgroundSize: '24px 24px' }}>
        </div>
      </div>

      {/* Navigation - Sticky Shinking Capsule (Transparent Version) */}
      <div
        ref={navRef}
        className="fixed top-0 left-0 w-full z-[100] flex justify-center pointer-events-none pt-4 transition-all duration-500"
      >
        <nav className={`
          pointer-events-auto flex items-center justify-between transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]
          ${scrolled
            ? 'w-[92%] max-w-5xl bg-emerald-500/[0.03] dark:bg-emerald-950/30 backdrop-blur-2xl py-2.5 px-6 rounded-full border border-emerald-500/20 dark:border-emerald-500/30 shadow-[0_15px_35px_rgba(16,185,129,0.15)]'
            : 'w-full py-8 px-8 md:px-16 bg-transparent border-transparent'
          }
        `}>
          <div className="flex items-center gap-3 md:gap-4">
            <div className={`
              bg-emerald-600 rounded-lg md:rounded-xl shadow-lg shadow-emerald-500/20 transition-all duration-500
              ${scrolled ? 'p-1.5 md:p-2' : 'p-2 md:p-3'}
            `}>
              <Layers className={`${scrolled ? 'w-3.5 h-3.5 md:w-4 md:h-4' : 'w-5 h-5 md:w-6 md:h-6'} text-white`} />
            </div>
            <div className="transition-all duration-500">
              <h1 className={`font-black italic tracking-tighter transition-all duration-500 ${scrolled ? 'text-sm md:text-base text-emerald-950 dark:text-white' : 'text-xl md:text-2xl text-emerald-950 dark:text-white'}`}>
                NetOptic <span className="text-emerald-500 not-italic">ELITE</span>
              </h1>
              {!scrolled && (
                <p className="hidden xs:block text-[8px] font-mono font-bold text-emerald-700/40 dark:text-emerald-500/30 uppercase tracking-[0.2em] transition-opacity duration-300">
                  Next-Gen Core Logic
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 md:gap-8">
            <button
              onClick={onStart}
              className={`
                bg-emerald-600 text-white font-black uppercase tracking-widest transition-all duration-500 shadow-xl shadow-emerald-500/20 hover:scale-105 active:scale-95
                ${scrolled
                  ? 'px-5 py-2 rounded-full text-[9px]'
                  : 'px-6 md:px-8 py-3 md:py-4 rounded-xl text-[10px] md:text-xs'
                }
              `}
            >
              Launch System
            </button>
          </div>
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col z-10">
        {/* Hero Section */}
        <main className="flex flex-col items-center justify-center px-6 text-center pt-48 md:pt-60 pb-32 md:pb-40 shrink-0">
          <div className="inline-flex items-center gap-2 md:gap-3 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-8 md:mb-10 animate-bounce">
            <Zap className="w-3 h-3 md:w-3.5 md:h-3.5 text-emerald-500" />
            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-emerald-600">v3.4 Stable Engine Active</span>
          </div>

          <div className="mb-8 max-w-4xl">
            <BlurText
              text="Real-Time Network Intelligence. Optimized."
              delay={30}
              stepDuration={0.15}
              animateBy="words"
              direction="top"
              className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tighter text-emerald-950 dark:text-white leading-[1.1] md:leading-[1]"
              startAnimation={showHeroText} // Trigger when fade is complete
            />
          </div>

          <div className="max-w-2xl mb-12 px-4 md:px-0">
            <BlurText
              text="Deploy deep-packet orchestration and predictive topology inference to maximize lane throughput while minimizing jitter-induced latency."
              delay={10} // Faster individual word delay
              stepDuration={0.1}
              animateBy="words"
              direction="bottom" // Pop from bottom
              className="text-base md:text-xl text-emerald-900/60 dark:text-emerald-100/40 leading-relaxed font-medium"
              startAnimation={showHeroText} // Trigger when fade is complete
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-6 w-full sm:w-auto px-4 sm:px-0">
            <button
              onClick={onStart}
              className="group w-full sm:w-auto px-10 md:px-12 py-5 md:py-6 bg-emerald-600 text-white rounded-xl md:rounded-2xl font-black text-xs md:text-sm uppercase tracking-widest shadow-2xl shadow-emerald-500/40 hover:bg-emerald-500 transition-all flex items-center justify-center gap-4"
            >
              Enter Dashboard
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </main>

        {/* Curved Loop Divider */}
        <div className="pointer-events-none mb-12 md:mb-24 shrink-0">
          <CurvedLoop
            marqueeText="✦ INTELLIGENT TOPOLOGY ✦ PREDICTIVE ANALYSIS ✦ CORE OPTIMIZATION ✦ PACKET ORCHESTRATION ✦ JITTER MITIGATION ✦"
            speed={1.5}
            curveAmount={150}
            className="fill-emerald-600/90 dark:fill-emerald-500/80 italic font-black drop-shadow-lg"
          />
        </div>

        {/* Feature Section */}
        <section className="px-6 md:px-16 pb-32 md:pb-64 shrink-0">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
              <FeatureCard
                icon={<Network className="w-6 h-6 md:w-8 md:h-8" />}
                title="Topology Inference"
                description="Automatically map complex core-to-edge relationships using active probe telemetry for hyper-accurate link modeling."
              />
              <FeatureCard
                icon={<Activity className="w-6 h-6 md:w-8 md:h-8" />}
                title="Predictive Load"
                description="Leverage deep-learning models to forecast peak traffic windows with 99.4% historical accuracy across global nodes."
              />
              <FeatureCard
                icon={<ShieldCheck className="w-6 h-6 md:w-8 md:h-8" />}
                title="Protocol Isolation"
                description="Isolate mission-critical lanes to prevent packet-level congestion during high-burst cycles in enterprise environments."
              />
            </div>
          </div>
        </section>
      </div>

      {/* Simplified Footer */}
      <footer className="z-50 bg-white/80 dark:bg-royal-950 backdrop-blur-md border-t border-emerald-500/10 py-16 md:py-24 shrink-0 shadow-2xl">
        <div className="max-w-7xl mx-auto px-6 md:px-16">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="flex flex-col items-center md:items-start space-y-6 md:space-y-8">
              <div className="flex items-center gap-4">
                <Layers className="w-7 h-7 md:w-9 md:h-9 text-emerald-600 dark:text-emerald-400" />
                <h1 className="text-xl md:text-2xl font-black italic text-emerald-950 dark:text-white tracking-tighter uppercase">
                  NetOptic <span className="font-light not-italic text-emerald-600">Elite</span>
                </h1>
              </div>
              <p className="text-sm md:text-base leading-relaxed max-w-sm font-medium text-emerald-900/60 dark:text-emerald-100/60 text-center md:text-left">
                Real-time network intelligence and optimization for global mission-critical infrastructure and next-gen core logic.
              </p>
            </div>

            <div className="flex items-center">
              <p className="text-[10px] md:text-[11px] font-black text-slate-600 uppercase tracking-[0.2em] text-center md:text-right">
                © 2026 NetOptic Systems — Developed by Elite Engineering
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <div className="p-8 md:p-12 bg-white/90 dark:bg-royal-900/70 border border-emerald-500/10 rounded-3xl md:rounded-[3rem] shadow-2xl hover:-translate-y-4 transition-all duration-500 group backdrop-blur-2xl flex flex-col items-start text-left">
    <div className="w-12 h-12 md:w-16 md:h-16 bg-emerald-600/10 dark:bg-emerald-500/10 rounded-xl md:rounded-2xl flex items-center justify-center text-emerald-600 mb-8 md:mb-10 border border-emerald-500/10 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-500">
      {icon}
    </div>
    <h4 className="text-xl md:text-2xl font-black text-emerald-950 dark:text-emerald-50 mb-4 md:mb-5 tracking-tight uppercase italic">{title}</h4>
    <p className="text-sm md:text-base text-emerald-900/50 dark:text-emerald-100/30 leading-relaxed font-medium">
      {description}
    </p>
    <div className="mt-8 md:mt-auto pt-4 md:pt-10 h-1.5 w-10 md:w-14 bg-emerald-500/10 group-hover:w-full group-hover:bg-emerald-500/40 transition-all duration-700 rounded-full"></div>
  </div>
);

export default LandingPage;
