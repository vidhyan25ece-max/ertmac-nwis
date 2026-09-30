import React, { useState, useEffect } from 'react';
import { ActiveDrillingState, OffsetWell } from './types/drilling';
import { INITIAL_ACTIVE_WELL, OFFSET_WELLS } from './data/wellsData';
import { getLookAheadAlerts, predictDrillingHazards } from './utils/riskModel';
import { Header } from './components/Header';
import { Sidebar, TabId } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { GisView } from './components/GisView';
import { IntelligenceView } from './components/IntelligenceView';
import { PredictionView } from './components/PredictionView';
import { AlertsEvidenceView } from './components/AlertsEvidenceView';
import { CorrelationView } from './components/CorrelationView';
import { AnalysisView } from './components/AnalysisView';
import { AiAssistant } from './components/AiAssistant';
import { ThemeProvider, useTheme } from './context/ThemeContext';

type AppScreen = 'entry' | 'login' | 'app';

function EntryScreen({ onStart }: { onStart: () => void }) {
  const technicalWords = [
    'PERMEABILITY',
    'PRESSURE',
    'FORMATION',
    'MUD',
    'SHALE',
    'SANDSTONE',
    'LIMESTONE',
    'AZIMUTH',
    'DEPTH',
    'OFFSET',
    'PPG',
    'PSI',
    'CRUDE',
    'ROP',
    'TORQUE',
    'WCR',
    'DDR',
    '4200 m',
    '2360 m',
    '11.2 PPG',
  ];

  return (
    <div className="entry-screen relative min-h-screen overflow-hidden bg-[#05070b] text-white">
      {/* Technical background */}
      <div className="entry-grid absolute inset-0 opacity-30" />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {technicalWords.map((word, index) => (
          <span
            key={word}
            className="technical-word"
            style={{
              left: `${5 + ((index * 17) % 90)}%`,
              top: `${8 + ((index * 23) % 82)}%`,
              animationDelay: `${index * -1.8}s`,
              animationDuration: `${13 + (index % 5) * 2}s`,
            }}
          >
            {word}
          </span>
        ))}
      </div>

      {/* Subtle technical lines */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="drill-line drill-line-1" />
        <div className="drill-line drill-line-2" />
        <div className="drill-line drill-line-3" />

        <div className="absolute left-[8%] top-[22%] h-24 w-24 rounded-full border border-cyan-400/10" />
        <div className="absolute right-[10%] bottom-[20%] h-40 w-40 rounded-full border border-amber-400/10" />
      </div>

      {/* Top branding */}
      <div className="relative z-10 flex items-center justify-between px-7 py-6 md:px-12">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/40 bg-cyan-400/10 text-sm font-bold text-cyan-300">
            eR
          </div>
          <div>
            <div className="text-sm font-semibold tracking-[0.2em] text-white">
              eRTMAC-NWIS
            </div>
            <div className="text-[10px] tracking-[0.18em] text-slate-500">
              DRILLING INTELLIGENCE PLATFORM
            </div>
          </div>
        </div>

        <div className="hidden rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-[10px] tracking-[0.18em] text-slate-500 md:block">
          SIH26121 • DECISION SUPPORT
        </div>
      </div>

      {/* Hero */}
      <div className="relative z-10 flex min-h-[calc(100vh-92px)] items-center justify-center px-6 pb-16">
        <div className="w-full max-w-4xl text-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/[0.06] px-4 py-2 text-[11px] tracking-[0.22em] text-cyan-300">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.8)]" />
            INTELLIGENT OFFSET WELL ANALYSIS
          </div>

          <h1 className="text-5xl font-bold tracking-[-0.04em] text-white md:text-7xl">
            eRTMAC<span className="text-cyan-400">-</span>NWIS
          </h1>

          <div className="mt-5 text-xl font-medium tracking-[0.12em] text-slate-300 md:text-2xl">
            Explore. Understand. Decide.
          </div>

          <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-slate-400 md:text-base">
            From reservoir history to field-level decisions.
            <br />
            Intelligent offset-well analysis for safer, smarter drilling operations.
          </p>

          <button
            onClick={onStart}
            className="entry-start-button group mt-10 inline-flex items-center gap-4 rounded-xl bg-amber-400 px-8 py-4 text-sm font-bold tracking-[0.12em] text-[#15120a] shadow-[0_12px_40px_rgba(251,191,36,0.16)] transition-all duration-300 hover:-translate-y-1 hover:bg-amber-300 hover:shadow-[0_16px_50px_rgba(251,191,36,0.25)]"
          >
            GET STARTED
            <span className="text-lg transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          </button>

          <div className="mt-12 flex items-center justify-center gap-8 text-[10px] tracking-[0.18em] text-slate-600">
            <span>WCR</span>
            <span>DDR</span>
            <span>GIS</span>
            <span>RAG</span>
            <span>ML</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoginScreen({
  onLogin,
}: {
  onLogin: () => void;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Prototype login — no external authentication required.
    if (!email.trim() || !password.trim()) {
      setError('Enter your email and password to continue.');
      return;
    }

    setError('');
    onLogin();
  };

  const handleDemoLogin = () => {
    setEmail('demo@ertmac-nwis.com');
    setPassword('demo');
    setError('');
    onLogin();
  };

  return (
    <div className="login-screen min-h-screen bg-[#f7f8fa] text-slate-900">
      <div className="mx-auto flex min-h-screen w-full max-w-md items-center justify-center px-6 py-10">
        <div className="w-full">
          {/* Brand */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#111827] text-lg font-bold text-cyan-400 shadow-lg">
              eR
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              eRTMAC-NWIS
            </h1>

            <p className="mt-2 text-[11px] font-semibold tracking-[0.2em] text-slate-600">
              WELL INTELLIGENCE PLATFORM
            </p>
          </div>

          {/* Login card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-[0_20px_60px_rgba(15,23,42,0.06)] md:p-8">
            <div className="mb-7">
              <h2 className="text-2xl font-bold text-slate-900">
                Welcome back
              </h2>

              <div className="mt-3 h-1 w-10 rounded-full bg-amber-400" />

              <p className="mt-3 text-sm text-slate-700">
                Sign in to access drilling intelligence.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-700">
                  Email
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10 shadow-2xs"
                />
              </div>

              {/* Password */}
              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-700">
                  Password
                </label>

                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 pr-12 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10 shadow-2xs"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 px-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {/* Remember / forgot */}
              <div className="flex items-center justify-between text-xs">
                <label className="flex cursor-pointer items-center gap-2 text-slate-700 font-medium">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 accent-cyan-600"
                  />
                  Remember me
                </label>

                <button
                  type="button"
                  onClick={() => alert('Password recovery is available in the full authentication system.')}
                  className="font-semibold text-cyan-700 hover:text-cyan-800"
                >
                  Forgot password?
                </button>
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700 font-medium">
                  {error}
                </div>
              )}

              {/* Login */}
              <button
                type="submit"
                className="w-full rounded-xl bg-amber-400 py-3.5 text-sm font-bold text-slate-950 transition hover:bg-amber-300 hover:shadow-lg hover:shadow-amber-200/50 cursor-pointer"
              >
                Login
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-600">
                  Or continue with
                </span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              {/* Google / demo */}
              <button
                type="button"
                onClick={handleDemoLogin}
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white py-3.5 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50 shadow-2xs cursor-pointer"
              >
                <span className="text-base font-bold">G</span>
                Sign in with Google
              </button>
              {/* Skip for now */}
              <button
                type="button"
                onClick={onLogin}
                className="mt-4 w-full py-2 text-sm font-semibold text-slate-600 transition hover:text-cyan-700 cursor-pointer"
              >
                Skip for now →
              </button>
            </form>

            <div className="mt-7 text-center text-xs text-slate-700 font-medium">
              Not a member?{' '}
              <button
                type="button"
                onClick={handleDemoLogin}
                className="font-bold text-cyan-700 hover:text-cyan-800"
              >
                Signup Now
              </button>
            </div>
          </div>

          <p className="mt-6 text-center text-[10px] tracking-wide text-slate-600 font-medium">
            Prototype • SIH26121 • eRTMAC-NWIS
          </p>
        </div>
      </div>
    </div>
  );
}

function AppContent() {
  const { isDark } = useTheme();

  // NEW: Entry → Login → Existing Application
  const [screen, setScreen] = useState<AppScreen>('entry');

  const [currentTab, setCurrentTab] = useState<TabId>('dashboard');
  const [activeWell, setActiveWell] =
    useState<ActiveDrillingState>(INITIAL_ACTIVE_WELL);
  const [selectedOffsetWell, setSelectedOffsetWell] =
    useState<OffsetWell | null>(OFFSET_WELLS[0]);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  const alerts = getLookAheadAlerts(activeWell);
  const prediction = predictDrillingHazards(activeWell);

  useEffect(() => {
    if (!isSimulating) return;

    const timer = setInterval(() => {
      setActiveWell((prev) => {
        if (prev.currentDepth >= prev.targetDepth) {
          setIsSimulating(false);
          return prev;
        }

        const nextDepth = prev.currentDepth + 2;

        let torque = 16.0 + Math.sin(nextDepth / 20) * 3;
        let rop = 12.0 + Math.cos(nextDepth / 15) * 4;

        if (nextDepth >= 2380 && nextDepth <= 2450) {
          torque += 4.5;
          rop = Math.max(3.0, rop - 4);
        }

        return {
          ...prev,
          currentDepth: nextDepth,
          torque: Math.round(torque * 10) / 10,
          rop: Math.round(rop * 10) / 10,
        };
      });
    }, 800);

    return () => clearInterval(timer);
  }, [isSimulating]);

  const handleDepthChange = (newDepth: number) => {
    setActiveWell((prev) => ({
      ...prev,
      currentDepth: newDepth,
    }));
  };

  const handleUpdateParams = (params: Partial<ActiveDrillingState>) => {
    setActiveWell((prev) => ({
      ...prev,
      ...params,
    }));
  };

  const handleResetDepth = () => {
    setActiveWell((prev) => ({
      ...prev,
      currentDepth: 2360,
      mudWeight: 1.37,
      torque: 18.2,
      rop: 14.5,
      flowRate: 580,
      spp: 2850,
    }));

    setIsSimulating(false);
  };

  // ENTRY SCREEN
  if (screen === 'entry') {
    return <EntryScreen onStart={() => setScreen('login')} />;
  }

  // LOGIN SCREEN
  if (screen === 'login') {
    return <LoginScreen onLogin={() => setScreen('app')} />;
  }

  // EXISTING APPLICATION — unchanged
  return (
    <div
      className={`flex h-screen flex-col overflow-hidden font-sans transition-colors ${
        isDark
          ? 'bg-[#060a14] text-slate-100'
          : 'bg-slate-50 text-slate-900'
      }`}
    >
      <Header
        activeWell={activeWell}
        onDepthChange={handleDepthChange}
        isSimulating={isSimulating}
        onToggleSimulate={() => setIsSimulating(!isSimulating)}
        onResetDepth={handleResetDepth}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          alerts={alerts}
        />

        <main
          className={`flex-1 overflow-y-auto p-5 md:p-7 transition-colors ${
            isDark ? 'bg-[#060a14]' : 'bg-slate-50'
          }`}
        >
          {currentTab === 'dashboard' && (
            <DashboardView
              activeWell={activeWell}
              prediction={prediction}
              alerts={alerts}
              onNavigateTab={setCurrentTab}
              onSetDepth={handleDepthChange}
            />
          )}

          {currentTab === 'gis' && (
            <GisView
              activeWell={activeWell}
              selectedWell={selectedOffsetWell}
              onSelectOffsetWell={setSelectedOffsetWell}
              onSetDepth={handleDepthChange}
              onNavigateTab={setCurrentTab}
            />
          )}

          {currentTab === 'intelligence' && (
            <IntelligenceView
              selectedWell={selectedOffsetWell}
              onSelectOffsetWell={setSelectedOffsetWell}
              onSetDepth={handleDepthChange}
            />
          )}

          {currentTab === 'prediction' && (
            <PredictionView
              activeWell={activeWell}
              prediction={prediction}
              onUpdateParams={handleUpdateParams}
              onResetParams={handleResetDepth}
            />
          )}

          {currentTab === 'alerts' && (
            <AlertsEvidenceView
              activeWell={activeWell}
              alerts={alerts}
              onSetDepth={handleDepthChange}
            />
          )}

          {currentTab === 'correlation' && (
            <CorrelationView
              activeWell={activeWell}
              offsetWells={OFFSET_WELLS}
              selectedWell={selectedOffsetWell}
              onSelectOffsetWell={(well) => {
                setSelectedOffsetWell(well);
              }}
              onSetDepth={handleDepthChange}
              onNavigateTab={setCurrentTab}
            />
          )}

          {currentTab === 'analysis' && (
            <AnalysisView
              activeWell={activeWell}
              offsetWells={OFFSET_WELLS}
              onSelectOffsetWell={(well) => {
                setSelectedOffsetWell(well);
              }}
              onNavigateTab={setCurrentTab}
            />
          )}
        </main>
      </div>

      <AiAssistant
        activeWell={activeWell}
        alerts={alerts}
        stuckPipeRisk={prediction.stuckPipeRisk}
        mudLossRisk={prediction.mudLossRisk}
        onSetDepth={handleDepthChange}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}