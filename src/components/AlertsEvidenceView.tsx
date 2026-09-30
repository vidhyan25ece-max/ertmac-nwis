import React, { useState } from 'react';
import { ActiveDrillingState } from '../types/drilling';
import { LookAheadAlert } from '../utils/riskModel';
import { OFFSET_WELLS } from '../data/wellsData';
import { useTheme } from '../context/ThemeContext';
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  FileText,
  Clock,
  ArrowDown,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

interface AlertsEvidenceViewProps {
  activeWell: ActiveDrillingState;
  alerts: LookAheadAlert[];
  onSetDepth: (depth: number) => void;
}

export const AlertsEvidenceView: React.FC<AlertsEvidenceViewProps> = ({
  activeWell,
  alerts,
  onSetDepth,
}) => {
  const { isDark } = useTheme();
  const [expandedId, setExpandedId] = useState<string | null>(alerts.length > 0 ? alerts[0].id : null);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  // Structured timeline events along depth
  const timelineEvents = [
    {
      id: 'surface',
      depth: 0,
      title: 'SURFACE SPUD POINT',
      sub: 'Wellbore Entry • Water depth 75m',
      isCurrent: activeWell.currentDepth < 500,
      type: 'normal',
    },
    {
      id: 'current-bit',
      depth: activeWell.currentDepth,
      title: `CURRENT DRILLING DEPTH: ${activeWell.currentDepth} m`,
      sub: `Active bit position • Mud Weight: ${activeWell.mudWeight} SG • Torque: ${activeWell.torque} kft-lb`,
      isCurrent: true,
      type: 'bit',
    },
    {
      id: 'alert-1985',
      depth: 1985,
      title: '1,985 m — MUD LOSS (35–65 bbl/hr)',
      sub: 'D-33-East-02 (OFF-B04) • Bassein Limestone vuggy fracture • 18h NPT',
      evidence: 'Sudden pit volume loss of 48 bbls in 40 minutes at 1,985m. Spotted 40 bbl coarse calcium carbonate pill to seal coral reef vugs.',
      source: 'DDR_B04 • p.32',
      npt: '18 hours',
      action: 'Pre-treat active mud system with 15 ppb medium calcium carbonate prior to 1,950m.',
      severity: 'High',
      isPassed: activeWell.currentDepth > 1985,
      isNear: Math.abs(activeWell.currentDepth - 1985) <= 60,
      type: 'hazard',
    },
    {
      id: 'alert-2390-entry',
      depth: 2390,
      title: '2,390 m — APPROACHING PANNA HISTORICAL RISK CORRIDOR',
      sub: 'Formation Boundary • Pore pressure transition to 1.36 SG equivalent',
      type: 'zone-entry',
      isPassed: activeWell.currentDepth > 2390,
      isNear: Math.abs(activeWell.currentDepth - 2390) <= 60,
    },
    {
      id: 'alert-2395',
      depth: 2395,
      title: '2,395 m — GAS INFLUX / KICK',
      sub: 'Heera-Deep-09 (OFF-D09) • Drilling break (9 to 34 m/hr) • 36h NPT',
      evidence: 'Connection gas surged to 12.8% with 22 bbls pit gain. SIDPP 380 psi upon shut-in. Well killed via Driller\'s method with 1.38 SG mud.',
      source: 'DDR_HD09 • p.41',
      npt: '36 hours',
      action: 'Mandate immediate 10-minute flow check upon any ROP doubling. Keep degasser operational.',
      severity: 'High',
      isPassed: activeWell.currentDepth > 2395,
      isNear: Math.abs(activeWell.currentDepth - 2395) <= 60,
      type: 'hazard',
    },
    {
      id: 'alert-2415',
      depth: 2415,
      title: '2,415 m — SEVERE DIFFERENTIAL STICKING (STUCK PIPE)',
      sub: 'Kaveri-Deep-01 (OFF-A01) • 140 klbs overpull • 64h NPT',
      evidence: 'Drill string stuck while reaming at 2,415m due to 0.12 SG mud overbalance against depleted sand lenses. String freed after spotting acid pipe-lax pill and continuous jarring for 18 hrs.',
      source: 'WCR_OFF_A01 • p.48',
      npt: '64 hours',
      action: 'Cap active mud weight at 1.34 SG. Add lubricant beads. Limit stationary connection time < 90s.',
      severity: 'Critical',
      isPassed: activeWell.currentDepth > 2415,
      isNear: Math.abs(activeWell.currentDepth - 2415) <= 60,
      type: 'hazard',
    },
    {
      id: 'alert-2442',
      depth: 2442,
      title: '2,442 m — TOTAL LOST CIRCULATION & FORMATION BREAKDOWN',
      sub: 'Neelam-North-05 (OFF-C02) • Complete dry drill • 92h NPT',
      evidence: 'High mud weight (1.44 SG) broke down the fragile micro-faulted shale barrier. Lost 210 bbls within 18 minutes. Required 3 consecutive balanced cement squeeze plugs.',
      source: 'WCR_NL05 • p.53',
      npt: '92 hours',
      action: 'Strict ECD control (< 0.05 SG over static mud weight). Do NOT exceed 1.35 SG mud weight.',
      severity: 'Critical',
      isPassed: activeWell.currentDepth > 2442,
      isNear: Math.abs(activeWell.currentDepth - 2442) <= 60,
      type: 'hazard',
    },
    {
      id: 'future-target',
      depth: 3450,
      title: '3,450 m — TARGET TOTAL DEPTH (TD)',
      sub: 'Basal Clastic Reservoir Objective',
      type: 'target',
      isPassed: activeWell.currentDepth >= 3450,
    },
  ];

  // Sort timeline purely by depth
  const sortedEvents = [...timelineEvents].sort((a, b) => a.depth - b.depth);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Header */}
      <div>
        <h1 className={`text-xl font-bold font-mono tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Chronological Depth Alerts & Evidence Timeline
        </h1>
        <p className={`text-xs mt-0.5 font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          Visual depth progression mapping current bit against historical offset incident corridors
        </p>
      </div>

      {/* Clean Timeline Container */}
      <div
        className={`rounded-xl border p-6 transition-all ${
          isDark
            ? 'bg-[#0b1224] border-slate-800 shadow-[0_4px_24px_rgba(0,0,0,0.4)]'
            : 'bg-white border-slate-200 shadow-xs'
        }`}
      >
        <div className="relative pl-8 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-300 dark:before:bg-slate-700">
          {sortedEvents.map((evt) => {
            const isHazard = evt.type === 'hazard';
            const isBit = evt.type === 'bit';
            const isExpanded = expandedId === evt.id;

            return (
              <div key={evt.id} className="relative group">
                {/* Timeline node icon */}
                <div
                  className={`absolute -left-8 top-1 flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-bold shadow-md transition-all ${
                    isBit
                      ? 'bg-amber-500 border-white text-black ring-4 ring-amber-500/20 z-20 animate-pulse'
                      : isHazard && evt.severity === 'Critical'
                      ? 'bg-red-500 border-red-300 text-white ring-2 ring-red-500/30'
                      : isHazard
                      ? 'bg-amber-500 border-amber-300 text-white'
                      : isDark
                      ? 'bg-slate-800 border-slate-700 text-slate-400'
                      : 'bg-white border-slate-300 text-slate-700 shadow-xs'
                  }`}
                >
                  {isBit ? '●' : evt.depth === 0 ? 'S' : '▼'}
                </div>

                {/* Event Card */}
                <div
                  onClick={() => {
                    if (isHazard) toggleExpand(evt.id);
                  }}
                  className={`rounded-lg border p-4 transition-all ${
                    isBit
                      ? isDark
                        ? 'border-cyan-500/50 bg-cyan-950/20 ring-1 ring-cyan-500/30'
                        : 'border-cyan-300 bg-cyan-50/80 ring-1 ring-cyan-400/50'
                      : isHazard && evt.severity === 'Critical'
                      ? isDark
                        ? 'border-red-500/50 bg-red-950/20 hover:border-red-500 cursor-pointer'
                        : 'border-red-300 bg-red-50/80 hover:border-red-400 cursor-pointer shadow-xs'
                      : isHazard
                      ? isDark
                        ? 'border-amber-500/50 bg-amber-950/20 hover:border-amber-500 cursor-pointer'
                        : 'border-amber-300 bg-amber-50/80 hover:border-amber-400 cursor-pointer shadow-xs'
                      : isDark
                      ? 'border-slate-800/80 bg-slate-900/40'
                      : 'border-slate-200 bg-slate-50/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        {isHazard && (
                          <span
                            className={`rounded px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase border ${
                              evt.severity === 'Critical'
                                ? isDark
                                  ? 'bg-red-500/20 text-red-400 border-red-500/40'
                                  : 'bg-red-100 text-red-800 border-red-300'
                                : isDark
                                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                                : 'bg-amber-100 text-amber-800 border-amber-300'
                            }`}
                          >
                            {evt.severity}
                          </span>
                        )}
                        <h3 className={`text-xs font-mono font-bold ${
                          isBit
                            ? isDark
                              ? 'text-cyan-400 text-sm'
                              : 'text-cyan-700 text-sm font-black'
                            : isDark
                            ? 'text-slate-100'
                            : 'text-slate-900'
                        }`}>
                          {evt.title}
                        </h3>
                      </div>
                      <p className={`mt-0.5 text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        {evt.sub}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {isHazard && (
                        <button className="text-slate-500 hover:text-slate-800 dark:text-slate-400 text-xs flex items-center gap-1 font-mono">
                          <span>{isExpanded ? 'Hide Evidence' : 'Expand'}</span>
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                      )}
                      {!isBit && evt.depth > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSetDepth(evt.depth);
                          }}
                          className={`rounded px-2 py-0.5 text-[10px] font-mono font-medium transition-colors ${
                            isDark
                              ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                              : 'bg-white text-slate-800 border border-slate-300 hover:bg-slate-100 shadow-xs'
                          }`}
                        >
                          Jump Depth
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expandable Evidence Accordion */}
                  {isHazard && isExpanded && (
                    <div
                      className={`mt-3 pt-3 border-t text-xs space-y-2.5 font-mono ${
                        isDark ? 'border-slate-800/80 text-slate-300' : 'border-slate-200 text-slate-700'
                      }`}
                    >
                      <div>
                        <span className={`block text-[10px] font-bold uppercase ${isDark ? 'text-slate-500' : 'text-slate-700'}`}>
                          Incident Evidence & Root Cause:
                        </span>
                        <p className="mt-0.5 leading-relaxed font-sans">{evt.evidence}</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-[11px] pt-1">
                        <div>
                          <span className={isDark ? 'text-slate-500' : 'text-slate-600 font-medium'}>Source Citation:</span>{' '}
                          <span className={`${isDark ? 'text-cyan-400' : 'text-cyan-700'} font-bold`}>{evt.source}</span>
                        </div>
                        <div>
                          <span className={isDark ? 'text-slate-500' : 'text-slate-600 font-medium'}>Non-Productive Time:</span>{' '}
                          <span className={`${isDark ? 'text-amber-400' : 'text-amber-700'} font-bold`}>{evt.npt}</span>
                        </div>
                      </div>

                      <div className={`rounded p-2.5 ${isDark ? 'bg-slate-950/40 border border-slate-800/80' : 'bg-emerald-50/70 border border-emerald-200'}`}>
                        <span className={`block text-[10px] font-bold uppercase ${isDark ? 'text-emerald-400' : 'text-emerald-800'}`}>
                          Actionable Mitigation Directive:
                        </span>
                        <p className={`mt-0.5 leading-relaxed font-sans text-xs ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>{evt.action}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
