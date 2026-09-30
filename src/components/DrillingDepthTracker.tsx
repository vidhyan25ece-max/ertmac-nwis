import React from 'react';
import { FORMATION_LAYERS, OFFSET_WELLS } from '../data/wellsData';
import { useTheme } from '../context/ThemeContext';
import { AlertTriangle, ChevronRight } from 'lucide-react';

interface DrillingDepthTrackerProps {
  currentDepth: number;
  targetDepth: number;
  onSetDepth: (depth: number) => void;
}

export const DrillingDepthTracker: React.FC<DrillingDepthTrackerProps> = ({
  currentDepth,
  targetDepth,
  onSetDepth,
}) => {
  const { isDark } = useTheme();

  // Scale depth (0m to 3500m) to percentage
  const totalScaleDepth = 3500;
  const bitPercent = Math.min(100, Math.max(0, (currentDepth / totalScaleDepth) * 100));

  // Risk zone: 2390m to 2430m
  const riskTopPercent = (2390 / totalScaleDepth) * 100;
  const riskBottomPercent = (2440 / totalScaleDepth) * 100;
  const riskHeightPercent = riskBottomPercent - riskTopPercent;

  // Key historical incidents to plot along the depth track
  const keyIncidents = [
    { depth: 1985, label: 'OFF-B04 Mud Loss (1985m)', type: 'loss' },
    { depth: 2395, label: 'OFF-D09 Gas Kick (2395m)', type: 'kick' },
    { depth: 2415, label: 'OFF-A01 Stuck Pipe (2415m)', type: 'stuck' },
    { depth: 2442, label: 'OFF-C02 Total Loss (2442m)', type: 'loss' },
  ];

  const isInsideRiskZone = currentDepth >= 2380 && currentDepth <= 2450;
  const isApproaching = currentDepth >= 2250 && currentDepth < 2380;

  return (
    <div
      className={`rounded-xl border p-5 flex flex-col h-full min-h-[540px] transition-all relative select-none ${
        isDark
          ? 'bg-[#0b1224] border-slate-800 shadow-[0_4px_24px_rgba(0,0,0,0.4)]'
          : 'bg-white border-slate-200 shadow-sm'
      }`}
    >
      {/* Tracker Title */}
      <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800/80">
        <div>
          <h3 className={`text-xs font-mono font-bold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-950'}`}>
            Vertical Drilling Depth Tracker
          </h3>
          <span className={`text-[11px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-700 font-semibold'}`}>
            Borehole Trajectory • Subsurface Stratigraphy
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isInsideRiskZone ? (
            <span className={`flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-mono font-bold animate-pulse ${
              isDark
                ? 'border-red-500/40 bg-red-500/10 text-red-400'
                : 'border-red-300 bg-red-50 text-red-800'
            }`}>
              <AlertTriangle className="h-3 w-3" />
              <span>INSIDE HAZARD ZONE</span>
            </span>
          ) : isApproaching ? (
            <span className={`flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-mono font-bold ${
              isDark
                ? 'border-amber-500/40 bg-amber-500/10 text-amber-400'
                : 'border-amber-300 bg-amber-50 text-amber-800'
            }`}>
              <AlertTriangle className="h-3 w-3" />
              <span>APPROACHING RISK</span>
            </span>
          ) : (
            <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-mono font-semibold ${
              isDark
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                : 'border-emerald-300 bg-emerald-50 text-emerald-800'
            }`}>
              STABLE STRATUM
            </span>
          )}
        </div>
      </div>

      {/* Main Depth Column Graphic */}
      <div className="mt-4 flex-1 relative flex items-stretch gap-4">
        {/* Subsurface Geological Column */}
        <div className="relative w-20 shrink-0 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700/50 flex flex-col">
          {FORMATION_LAYERS.map((layer) => {
            const hPercent = ((layer.bottomDepth - layer.topDepth) / totalScaleDepth) * 100;
            const isCurrent = currentDepth >= layer.topDepth && currentDepth <= layer.bottomDepth;
            return (
              <div
                key={layer.name}
                onClick={() => onSetDepth(Math.round((layer.topDepth + layer.bottomDepth) / 2))}
                style={{ height: `${hPercent}%`, backgroundColor: layer.color }}
                className={`relative cursor-pointer transition-all hover:brightness-125 flex items-center justify-center ${
                  isCurrent ? 'ring-2 ring-cyan-500 z-10' : 'opacity-85'
                }`}
                title={`${layer.name} (${layer.topDepth}m - ${layer.bottomDepth}m)`}
              >
                <span className="text-[9px] font-mono font-bold text-slate-200/80 rotate-90 truncate max-w-[50px] uppercase">
                  {layer.lithology.split('/')[0]}
                </span>
              </div>
            );
          })}
        </div>

        {/* Central Vertical Wellbore Guide Line */}
        <div className="flex-1 relative flex flex-col justify-between py-1">
          {/* Surface Header */}
          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-600 dark:text-slate-400">
            <span className="font-bold text-cyan-700 dark:text-cyan-400">SURFACE</span>
            <span className="text-slate-500">── 0 m</span>
          </div>

          {/* Interactive Depth Track Area */}
          <div
            className="absolute top-6 bottom-6 left-6 right-0 cursor-pointer"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickY = e.clientY - rect.top;
              const ratio = Math.max(0, Math.min(1, clickY / rect.height));
              const newD = Math.round(ratio * totalScaleDepth);
              onSetDepth(newD);
            }}
          >
            {/* Vertical Center Wellbore Rod */}
            <div className="absolute top-0 bottom-0 left-0 w-1 bg-slate-300 dark:bg-slate-700 rounded-full">
              {/* Drilled Borehole Fill (Cyan) */}
              <div
                className="w-full bg-cyan-500 rounded-full transition-all duration-300"
                style={{ height: `${bitPercent}%` }}
              ></div>
            </div>

            {/* Historical Risk Corridor Highlight Zone (2,390m – 2,430m) */}
            <div
              style={{
                top: `${riskTopPercent}%`,
                height: `${riskHeightPercent}%`,
              }}
              className="absolute left-0 right-2 rounded-r-md border-y border-r border-red-500/60 bg-red-500/10 pointer-events-none flex items-center justify-between px-3"
            >
              <div className={`flex items-center gap-1.5 font-mono text-[10px] font-bold ${isDark ? 'text-red-400' : 'text-red-700'}`}>
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping"></span>
                <span>HISTORICAL RISK ZONE (2,390 – 2,430 m)</span>
              </div>
              <span className={`font-mono text-[9px] font-semibold hidden sm:inline ${isDark ? 'text-red-400' : 'text-red-700'}`}>
                Differential Sticking & Lost Circulation
              </span>
            </div>

            {/* Historical Incident Depth Markers */}
            {keyIncidents.map((inc) => {
              const topPos = (inc.depth / totalScaleDepth) * 100;
              const isVeryClose = Math.abs(currentDepth - inc.depth) <= 40;
              return (
                <div
                  key={inc.depth}
                  style={{ top: `${topPos}%` }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSetDepth(inc.depth);
                  }}
                  className={`absolute left-3 -translate-y-1/2 flex items-center gap-1.5 text-[10px] font-mono cursor-pointer rounded px-2 py-0.5 border transition-all ${
                    isVeryClose
                      ? 'border-red-500 bg-red-600 text-white font-bold shadow-md scale-105 z-20'
                      : isDark
                      ? 'border-slate-700/80 bg-slate-900/90 text-slate-300 hover:border-cyan-400 hover:text-cyan-300'
                      : 'border-slate-300 bg-white text-slate-800 hover:border-cyan-600 shadow-xs'
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      inc.type === 'stuck' ? 'bg-red-500' : inc.type === 'loss' ? 'bg-amber-500' : 'bg-cyan-400'
                    }`}
                  ></span>
                  <span>{inc.label}</span>
                </div>
              );
            })}

            {/* ANIMATED DRILL BIT CURSOR */}
            <div
              style={{ top: `${bitPercent}%` }}
              className="absolute left-0 -translate-y-1/2 flex items-center pointer-events-none z-30 transition-all duration-300"
            >
              {/* Glowing Drill Bit Point */}
              <div className="relative -left-2 flex items-center justify-center">
                <div className="h-5 w-5 rounded-full bg-cyan-400/30 animate-ping"></div>
                <div className="absolute h-3 w-3 rounded-full bg-amber-400 border-2 border-white shadow-[0_0_10px_#f59e0b]"></div>
              </div>

              {/* Bit Depth Floating Label */}
              <div
                className={`ml-2 flex items-center gap-2 rounded-lg px-3 py-1 font-mono text-xs font-bold shadow-lg border transition-all ${
                  isInsideRiskZone
                    ? 'border-red-500 bg-red-600 text-white animate-pulse'
                    : isDark
                    ? 'border-cyan-500/60 bg-[#0f233a] text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                    : 'border-cyan-400 bg-cyan-50 text-cyan-950 shadow-md'
                }`}
              >
                <span>CURRENT BIT:</span>
                <span className={`text-sm font-black ${isInsideRiskZone ? 'text-white' : isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                  {currentDepth} m
                </span>
              </div>
            </div>
          </div>

          {/* Target Depth Footer */}
          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-600 dark:text-slate-400">
            <span className="font-bold text-slate-900 dark:text-slate-300">TARGET DEPTH</span>
            <span className="text-slate-500">── {targetDepth} m</span>
          </div>
        </div>
      </div>
    </div>
  );
};
