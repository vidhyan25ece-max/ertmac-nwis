import React from 'react';
import { ActiveDrillingState, RiskPredictionResult } from '../types/drilling';
import { FORMATION_LAYERS, OFFSET_WELLS } from '../data/wellsData';
import { LookAheadAlert } from '../utils/riskModel';
import { TabId } from './Sidebar';
import { DrillingDepthTracker } from './DrillingDepthTracker';
import { AlertTriangle, ArrowRight, ShieldCheck, Sparkles, Layers, Compass } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface DashboardViewProps {
  activeWell: ActiveDrillingState;
  prediction: RiskPredictionResult;
  alerts: LookAheadAlert[];
  onNavigateTab: (tab: TabId) => void;
  onSetDepth: (depth: number) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  activeWell,
  prediction,
  alerts,
  onNavigateTab,
  onSetDepth,
}) => {
  const { isDark } = useTheme();

  const currentLayer = FORMATION_LAYERS.find(
    (l) => activeWell.currentDepth >= l.topDepth && activeWell.currentDepth <= l.bottomDepth
  ) || FORMATION_LAYERS[0];

  // Most important active warning
  const topAlert = alerts[0];

  const getRiskBadgeColor = (level: string) => {
    switch (level) {
      case 'Critical':
        return isDark
          ? 'text-red-400 bg-red-500/10 border-red-500/30'
          : 'text-red-800 bg-red-50 border-red-200';
      case 'High':
        return isDark
          ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
          : 'text-amber-800 bg-amber-50 border-amber-200';
      case 'Moderate':
        return isDark
          ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30'
          : 'text-amber-800 bg-amber-50 border-amber-200';
      default:
        return isDark
          ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
          : 'text-emerald-800 bg-emerald-50 border-emerald-200';
    }
  };

  // Automated AI insight generation based on active depth
  const getAiInsight = () => {
    if (activeWell.currentDepth >= 2380 && activeWell.currentDepth <= 2450) {
      return `Bit is inside high-risk Panna corridor (2390–2430m). Correlates with 64h sticking in OFF-A01 (2415m) and 92h total loss in OFF-C02 (2442m). Maintain mud weight ≤ 1.34 SG and minimize stationary pipe time.`;
    } else if (activeWell.currentDepth >= 1950 && activeWell.currentDepth <= 2020) {
      return `Traversing Bassein Limestone shelf (1950–2020m). Offset well OFF-B04 suffered 65 bbl/hr vuggy mud losses at 1985m. Pre-treat pits with medium calcium carbonate.`;
    } else {
      return `Current stratum (${currentLayer.name}) operates within safe hydrostatic margins. Continue normal drilling plan while monitoring approach to the 2390m Panna formation boundary.`;
    }
  };

  const distanceToHazard = 2390 - activeWell.currentDepth;

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Top Header: Brand, Subtitle, Status Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4 border-slate-200 dark:border-slate-800/80">
        <div>
          <div className="flex items-center gap-3">
            <h1 className={`text-2xl font-bold font-mono tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              eRTMAC-NWIS
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-emerald-500">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              ● PROTOTYPE ONLINE
            </span>
          </div>
          <p className={`text-xs mt-0.5 font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Nearby Wells Intelligence System • Western Offshore Basin
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateTab('gis')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-mono font-medium transition-all border ${
              isDark
                ? 'border-slate-800 bg-[#0f172a] text-cyan-400 hover:border-cyan-500/50'
                : 'border-slate-300 bg-white text-cyan-800 hover:border-cyan-400 hover:bg-cyan-50 shadow-xs'
            }`}
          >
            <Compass className="h-3.5 w-3.5" />
            <span>GIS Map ({OFFSET_WELLS.length} Offsets)</span>
          </button>
        </div>
      </div>

      {/* Main Balanced Layout: LEFT (Drilling Depth Tracker) & RIGHT (Intelligence & Alerts) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* LEFT COLUMN: Large Interactive Drilling-Depth Visualization (6 cols) */}
        <div className="lg:col-span-6 flex flex-col">
          <DrillingDepthTracker
            currentDepth={activeWell.currentDepth}
            targetDepth={activeWell.targetDepth}
            onSetDepth={onSetDepth}
          />
        </div>

        {/* RIGHT COLUMN: Current Drilling Intelligence + Upcoming Risk Zone + AI Insight + Active Alert (6 cols) */}
        <div className="lg:col-span-6 flex flex-col justify-between space-y-4">
          {/* Card 1: Current Drilling Intelligence */}
          <div
            className={`rounded-xl border p-5 transition-all ${
              isDark
                ? 'bg-[#0b1224] border-slate-800 shadow-[0_4px_24px_rgba(0,0,0,0.4)]'
                : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between border-b pb-2 border-slate-100 dark:border-slate-800">
              <h2 className={`text-xs font-mono font-bold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-900'}`}>
                Current Drilling Intelligence
              </h2>
              <span className={`text-[10px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>
                Real-Time Telemetry
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <span className={`block text-[10px] uppercase font-mono font-semibold ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>
                  Current Depth
                </span>
                <span className="font-mono text-xl font-bold text-amber-600 dark:text-amber-500">
                  {activeWell.currentDepth} m
                </span>
              </div>

              <div>
                <span className={`block text-[10px] uppercase font-mono font-semibold ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>
                  Formation
                </span>
                <span className={`font-semibold text-xs truncate block mt-1 ${isDark ? 'text-cyan-300' : 'text-cyan-800'}`} title={currentLayer.name}>
                  {currentLayer.name.split('/')[0]}
                </span>
              </div>

              <div>
                <span className={`block text-[10px] uppercase font-mono font-semibold ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>
                  Overall Status
                </span>
                <span
                  className={`inline-block mt-1 rounded-md border px-2 py-0.5 text-xs font-mono font-bold ${getRiskBadgeColor(
                    prediction.overallRiskLevel
                  )}`}
                >
                  {prediction.overallRiskLevel}
                </span>
              </div>

              <div>
                <span className={`block text-[10px] uppercase font-mono font-semibold ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>
                  Stuck Pipe Risk
                </span>
                <span
                  className={`font-mono text-base font-bold ${
                    prediction.stuckPipeRisk > 60
                      ? 'text-red-600 dark:text-red-500'
                      : prediction.stuckPipeRisk > 35
                      ? 'text-amber-600 dark:text-amber-500'
                      : 'text-emerald-700 dark:text-emerald-500'
                  }`}
                >
                  {prediction.stuckPipeRisk}%
                </span>
              </div>

              <div>
                <span className={`block text-[10px] uppercase font-mono font-semibold ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>
                  Mud Loss Risk
                </span>
                <span
                  className={`font-mono text-base font-bold ${
                    prediction.mudLossRisk > 60
                      ? 'text-red-600 dark:text-red-500'
                      : prediction.mudLossRisk > 35
                      ? 'text-amber-600 dark:text-amber-500'
                      : 'text-emerald-700 dark:text-emerald-500'
                  }`}
                >
                  {prediction.mudLossRisk}%
                </span>
              </div>

              <div>
                <span className={`block text-[10px] uppercase font-mono font-semibold ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>
                  Mud Weight
                </span>
                <span className={`font-mono text-base font-semibold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                  {activeWell.mudWeight} SG
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Upcoming Risk Zone */}
          <div
            className={`rounded-xl border p-4 transition-all ${
              isDark
                ? 'bg-[#0b1224] border-slate-800'
                : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className={`block text-[10px] uppercase font-mono font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Upcoming Risk Zone
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-mono text-base font-bold text-red-600 dark:text-red-400">
                    2390 – 2430 m
                  </span>
                  <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    (Panna Marine Shale)
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className={`block text-[10px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>
                  Distance to Entry
                </span>
                <span
                  className={`font-mono text-xs font-bold ${
                    distanceToHazard <= 0
                      ? 'text-red-600 dark:text-red-500'
                      : distanceToHazard <= 100
                      ? 'text-amber-600 dark:text-amber-500'
                      : 'text-emerald-700 dark:text-emerald-500'
                  }`}
                >
                  {distanceToHazard <= 0 ? 'INSIDE ZONE' : `${distanceToHazard} m ahead`}
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: AI Insight */}
          <div
            className={`rounded-xl border p-4 flex items-start gap-3 transition-all ${
              isDark
                ? 'bg-cyan-950/20 border-cyan-800/40 text-cyan-200'
                : 'bg-cyan-50/90 border-cyan-300 text-slate-950 shadow-xs'
            }`}
          >
            <Sparkles className={`h-4 w-4 shrink-0 mt-0.5 ${isDark ? 'text-cyan-400' : 'text-cyan-800'}`} />
            <div>
              <span className={`font-bold text-xs block mb-0.5 ${isDark ? 'text-cyan-200' : 'text-slate-950'}`}>AI Insight</span>
              <p className={`text-xs leading-relaxed font-medium ${isDark ? 'text-cyan-100' : 'text-slate-950'}`}>{getAiInsight()}</p>
            </div>
          </div>

          {/* Card 4: Active Alert (One important alert only + View Evidence button) */}
          <div
            className={`rounded-xl border p-4 transition-all flex flex-col justify-between ${
              topAlert
                ? topAlert.severity === 'Critical'
                  ? isDark
                    ? 'border-red-500/40 bg-red-950/20'
                    : 'border-red-300 bg-red-50/90 shadow-xs'
                  : isDark
                  ? 'border-amber-500/40 bg-amber-950/20'
                  : 'border-amber-300 bg-amber-50/90 shadow-xs'
                : isDark
                ? 'bg-[#0b1224] border-slate-800'
                : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                {topAlert ? (
                  <AlertTriangle
                    className={`h-5 w-5 shrink-0 mt-0.5 ${
                      topAlert.severity === 'Critical'
                        ? isDark ? 'text-red-400' : 'text-red-700'
                        : isDark ? 'text-amber-400' : 'text-amber-800'
                    }`}
                  />
                ) : (
                  <ShieldCheck className={`h-5 w-5 shrink-0 mt-0.5 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`} />
                )}
                <div>
                  <h3 className={`text-xs font-bold font-mono ${isDark ? 'text-white' : 'text-slate-950'}`}>
                    {topAlert ? topAlert.title : 'Active Alert: Operational Envelope Normal'}
                  </h3>
                  <p className={`mt-1 text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-800 font-medium'}`}>
                    {topAlert
                      ? `Approaching ${topAlert.incidentType} depth (${topAlert.offsetWell.primaryIncident.depth}m) in ${topAlert.offsetWell.name}. ${topAlert.recommendedAction}`
                      : 'No immediate high-risk historical offset incident within 120m proximity.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800/80 flex justify-end">
              <button
                onClick={() => onNavigateTab('alerts')}
                className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-mono font-bold transition-all ${
                  isDark
                    ? 'bg-slate-800 hover:bg-slate-700 text-cyan-300'
                    : 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-xs'
                }`}
              >
                <span>View Evidence</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
