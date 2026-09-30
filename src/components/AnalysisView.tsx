import React, { useState } from 'react';
import { ActiveDrillingState, OffsetWell } from '../types/drilling';
import { FORMATION_LAYERS } from '../data/wellsData';
import { useTheme } from '../context/ThemeContext';
import { TabId } from './Sidebar';
import {
  TrendingUp,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Layers,
  MapPin,
  ShieldAlert,
  SlidersHorizontal,
  Info,
  ChevronDown,
} from 'lucide-react';

interface AnalysisViewProps {
  activeWell: ActiveDrillingState;
  offsetWells: OffsetWell[];
  onSelectOffsetWell?: (well: OffsetWell) => void;
  onNavigateTab?: (tab: TabId) => void;
}

// Visual color palette for multi-well graphs
const WELL_COLORS = [
  { stroke: '#06b6d4', bg: 'bg-cyan-500', text: 'text-cyan-400', border: 'border-cyan-500' }, // Cyan (Ref Well)
  { stroke: '#f59e0b', bg: 'bg-amber-500', text: 'text-amber-400', border: 'border-amber-500' }, // Amber
  { stroke: '#10b981', bg: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500' }, // Emerald
  { stroke: '#a855f7', bg: 'bg-purple-500', text: 'text-purple-400', border: 'border-purple-500' }, // Purple
  { stroke: '#f43f5e', bg: 'bg-rose-500', text: 'text-rose-400', border: 'border-rose-500' }, // Rose
];

export const AnalysisView: React.FC<AnalysisViewProps> = ({
  activeWell,
  offsetWells,
}) => {
  const { isDark } = useTheme();

  // Multi-well selection: Reference well is always pinned as index 0 ('ACTIVE')
  const [selectedWellIds, setSelectedWellIds] = useState<string[]>([
    'ACTIVE',
    offsetWells[0]?.id || 'OFF-A01',
    offsetWells[1]?.id || 'OFF-B04',
    offsetWells[2]?.id || 'OFF-C02',
  ]);

  // Interactive hover inspection
  const [hoverDepth, setHoverDepth] = useState<number | null>(null);

  // Collapsible state for sections after graphs (all collapsed by default)
  const [openSections, setOpenSections] = useState<{
    casing: boolean;
    cementing: boolean;
    lessons: boolean;
  }>({
    casing: false,
    cementing: false,
    lessons: false,
  });

  const toggleSection = (section: 'casing' | 'cementing' | 'lessons') => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Toggle offset well in selection
  const toggleWellSelection = (wellId: string) => {
    if (wellId === 'ACTIVE') return; // Reference well is pinned
    setSelectedWellIds((prev) => {
      if (prev.includes(wellId)) {
        if (prev.length <= 2) return prev; // Keep at least 2 wells
        return prev.filter((id) => id !== wellId);
      } else {
        if (prev.length >= 5) return [...prev.slice(0, 4), wellId]; // Maximum 5 wells
        return [...prev, wellId];
      }
    });
  };

  // Compile active selected well objects
  const activeWells = selectedWellIds.map((id, index) => {
    if (id === 'ACTIVE') {
      return {
        id: 'ACTIVE',
        name: activeWell.wellName,
        isRef: true,
        color: WELL_COLORS[0],
        operator: 'ONGC (Western Asset)',
        maxDepth: activeWell.targetDepth,
        incidentDepth: 2360,
      };
    }
    const found = offsetWells.find((w) => w.id === id);
    const color = WELL_COLORS[(index % (WELL_COLORS.length - 1)) + 1];
    return {
      id: id,
      name: found?.name || id,
      isRef: false,
      color: color,
      operator: found?.operator || 'Western Asset',
      maxDepth: found?.maxDepth || 3200,
      incidentDepth: found?.primaryIncident.depth || 2400,
    };
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // CONTINUOUS GRAPH DATA ENGINE (Depth 1,800m - 2,800m)
  // ─────────────────────────────────────────────────────────────────────────────
  const minDepth = 1800;
  const maxDepth = 2800;
  const numSteps = 40;
  const stepSize = (maxDepth - minDepth) / numSteps;
  const depthArray = Array.from({ length: numSteps + 1 }, (_, i) => minDepth + i * stepSize);

  // SVG Chart Dimensions
  const svgW = 580;
  const svgH = 260;
  const pL = 45;
  const pR = 20;
  const pT = 25;
  const pB = 35;
  const cW = svgW - pL - pR;
  const cH = svgH - pT - pB;

  const toX = (depth: number) => pL + ((depth - minDepth) / (maxDepth - minDepth)) * cW;

  // 1. Rate of Turn (°/30 m: 0 to 6 °/30m)
  const toRotY = (val: number) => pT + cH - (Math.max(0, Math.min(6, val)) / 6) * cH;
  const getRotVal = (depth: number, idx: number) => {
    const shift = idx * 35;
    if (depth < 2050) return 0.4 + Math.sin((depth + shift) / 50) * 0.3;
    if (depth <= 2450) {
      const peak = Math.sin(((depth - 2050) / 400) * Math.PI);
      return 0.8 + peak * (3.4 + (idx % 3) * 0.7) + Math.cos((depth + shift) / 30) * 0.25;
    }
    return 0.9 + Math.cos((depth + shift) / 60) * 0.35;
  };

  // 2. ROP (m/hr: 5 to 45 m/hr)
  const toRopY = (val: number) => pT + cH - ((Math.max(5, Math.min(45, val)) - 5) / 40) * cH;
  const getRopVal = (depth: number, idx: number) => {
    const shift = idx * 25;
    if (depth < 2150) {
      return 28 + (idx % 2 === 0 ? 4 : -3) + Math.sin((depth + shift) / 40) * 5;
    }
    if (depth <= 2650) {
      const isIncidentZone = depth >= 2380 && depth <= 2460 && idx === 1;
      if (isIncidentZone) return 4.5 + Math.random() * 2;
      return 13.5 + Math.cos((depth + shift) / 45) * 3.5;
    }
    return 19 + Math.sin((depth + shift) / 50) * 4;
  };

  // 3. Torque (kft-lb: 8 to 32 kft-lb)
  const toTorqueY = (val: number) => pT + cH - ((Math.max(8, Math.min(32, val)) - 8) / 24) * cH;
  const getTorqueVal = (depth: number, idx: number) => {
    const shift = idx * 30;
    let base = 15.0 + ((depth - 1800) / 1000) * 4 + Math.sin((depth + shift) / 60) * 2;
    if (idx === 1 && Math.abs(depth - 2415) < 70) {
      base += (1 - Math.abs(depth - 2415) / 70) * 11.5;
    } else if (idx === 2 && Math.abs(depth - 2360) < 50) {
      base += (1 - Math.abs(depth - 2360) / 50) * 7.0;
    }
    return Math.round(base * 10) / 10;
  };

  // 4. Mud Weight / Pressure (SG: 1.05 to 1.55 SG)
  const toMwY = (val: number) => pT + cH - ((Math.max(1.05, Math.min(1.55, val)) - 1.05) / 0.5) * cH;
  const getMwVal = (depth: number, idx: number) => {
    if (depth < 2150) return 1.14 + (idx * 0.02) + Math.sin(depth / 80) * 0.01;
    const progress = Math.min(1, (depth - 2150) / 120);
    return 1.14 + progress * (0.24 + idx * 0.02) + Math.cos(depth / 90) * 0.015;
  };

  const makePath = (idx: number, valFunc: (d: number, i: number) => number, toYFunc: (v: number) => number) => {
    return depthArray
      .map((depth, i) => `${i === 0 ? 'M' : 'L'} ${toX(depth).toFixed(1)} ${toYFunc(valFunc(depth, idx)).toFixed(1)}`)
      .join(' ');
  };

  return (
    <div className="max-w-6xl mx-auto select-none space-y-7 pb-24">
      {/* ─────────────────────────────────────────────────────────────
          1. TOP HEADER & TITLE
          ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4 border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-amber-500">
            <TrendingUp className="h-4 w-4" />
            <span>INVESTIGATION &rsaquo; DRILLING ANALYSIS</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight mt-1 text-slate-900 dark:text-white">
            ANALYSIS
          </h1>
          <p className="text-xs text-slate-700 dark:text-slate-400 mt-1 font-medium">
            Compare drilling performance across nearby wells, examine protective casing, and learn from past drilling issues.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-bold bg-amber-500/10 text-amber-500 border border-amber-500/30">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            COMPARING {activeWells.length} WELLS
          </span>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. SELECT WELLS FOR ANALYSIS
          ───────────────────────────────────────────────────────────── */}
      <div
        className={`rounded-2xl border p-5 md:p-6 transition-all ${
          isDark ? 'bg-[#0b1224] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 border-slate-200 dark:border-slate-800/80">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-900 dark:text-cyan-400 block">
              CHOOSE WELLS TO COMPARE
            </span>
            <h2 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
              Select Wells for Analysis
            </h2>
            <p className="text-xs text-slate-700 dark:text-slate-400 mt-0.5 font-medium">
              Click wells to compare drilling speed, turning angle, torque resistance, and mud pressure side by side.
            </p>
          </div>

          <span className={`text-xs font-mono font-medium px-3 py-1.5 rounded-lg border self-start sm:self-auto ${
            isDark ? 'text-slate-300 bg-slate-900/60 border-slate-800' : 'text-slate-800 bg-slate-100 border-slate-300'
          }`}>
            Comparing: <b className="text-amber-700 dark:text-amber-400 font-bold">{activeWells.length} / 5 Selected</b>
          </span>
        </div>

        {/* Selection Chips */}
        <div className="flex flex-wrap items-center gap-2.5 mt-4">
          {/* Reference Well (Pinned) */}
          <div className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-mono font-bold shadow-xs ${
            isDark ? 'border-cyan-500 bg-cyan-950/40 text-cyan-300' : 'border-cyan-400 bg-cyan-50 text-cyan-950'
          }`}>
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
            <span>[REF] {activeWell.wellName.split(' ')[0]}</span>
            <span className={`text-[10px] uppercase font-bold ${isDark ? 'text-cyan-400' : 'text-cyan-800'}`}>(PINNED)</span>
          </div>

          {/* Offset Wells */}
          {offsetWells.map((w) => {
            const isSelected = selectedWellIds.includes(w.id);
            const activeObj = activeWells.find((aw) => aw.id === w.id);

            return (
              <button
                key={w.id}
                onClick={() => toggleWellSelection(w.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all border ${
                  isSelected && activeObj
                    ? isDark
                      ? `${activeObj.color.border} bg-slate-900/90 ${activeObj.color.text} shadow-sm`
                      : 'border-slate-500 bg-slate-100 text-slate-950 shadow-xs'
                    : isDark
                    ? 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    : 'bg-white border-slate-300 text-slate-800 hover:text-slate-950 hover:bg-slate-50'
                }`}
              >
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    isSelected && activeObj ? activeObj.color.bg : isDark ? 'bg-slate-600' : 'bg-slate-500'
                  }`}
                />
                <span>{w.name} ({w.distanceKm}km)</span>
                <span className="text-[10px] opacity-75">{isSelected ? '✓' : '+'}</span>
              </button>
            );
          })}
        </div>

        {/* Legend Row */}
        <div className="flex flex-wrap items-center gap-5 mt-4 pt-4 border-t border-slate-200 dark:border-slate-800/80 text-xs font-mono">
          {activeWells.map((aw) => (
            <div key={aw.id} className="flex items-center gap-2">
              <span className="w-3.5 h-1.5 rounded-full" style={{ backgroundColor: aw.color.stroke }} />
              <span className="text-slate-950 dark:text-slate-200 font-bold">{aw.name}</span>
              {aw.isRef && <span className="text-[10px] text-cyan-950 dark:text-cyan-400 font-bold">(Reference)</span>}
            </div>
          ))}
          <span className="text-[10px] font-mono text-slate-800 dark:text-slate-400 ml-auto italic font-semibold">
            * Demo/Synthetic Data modeled from DDR/WCR parameters
          </span>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. LARGE READABLE TECHNICAL COMPARISON GRAPHS (2x2 Grid)
          ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ── GRAPH 1: RATE OF TURN vs DEPTH ── */}
        <div
          className={`rounded-2xl border p-5 transition-all flex flex-col justify-between ${
            isDark ? 'bg-[#0b1224] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="mb-2">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-950 dark:text-cyan-400 block">
                  DIRECTIONAL TURNING
                </span>
                <h3 className="text-sm font-bold text-slate-950 dark:text-slate-200 mt-0.5">
                  Rate of Turn (&deg;/30 m) vs Depth (m)
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-800 dark:text-slate-400 font-bold">
                Y: 0 &ndash; 6 &deg;/30m &bull; X: 1,800&ndash;2,800m
              </span>
            </div>
            <p className="text-xs text-slate-900 dark:text-slate-300 mt-1 font-medium leading-relaxed">
              Shows how sharply the drill turns at different depths. Sharp turns increase bending stress on pipes.
            </p>
          </div>

          <div className="w-full relative overflow-hidden">
            <svg
              viewBox={`0 0 ${svgW} ${svgH}`}
              className="w-full h-auto overflow-visible cursor-crosshair"
              onMouseLeave={() => setHoverDepth(null)}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const relX = ((e.clientX - rect.left) / rect.width) * svgW;
                if (relX >= pL && relX <= pL + cW) {
                  setHoverDepth(Math.round(minDepth + ((relX - pL) / cW) * (maxDepth - minDepth)));
                }
              }}
            >
              {[0, 1.5, 3.0, 4.5, 6.0].map((val) => (
                <g key={val}>
                  <line x1={pL} y1={toRotY(val)} x2={pL + cW} y2={toRotY(val)} stroke={isDark ? '#1e293b' : '#cbd5e1'} strokeDasharray="3 3" />
                  <text x={pL - 6} y={toRotY(val) + 3} fill={isDark ? '#94a3b8' : '#0f172a'} fontSize="9" fontFamily="monospace" fontWeight="700" textAnchor="end">
                    {val.toFixed(1)}&deg;
                  </text>
                </g>
              ))}

              {[1800, 2000, 2200, 2400, 2600, 2800].map((d) => (
                <g key={d}>
                  <line x1={toX(d)} y1={pT} x2={toX(d)} y2={pT + cH} stroke={isDark ? '#1e293b' : '#cbd5e1'} strokeDasharray="3 3" />
                  <text x={toX(d)} y={pT + cH + 15} fill={isDark ? '#94a3b8' : '#0f172a'} fontSize="9" fontFamily="monospace" fontWeight="700" textAnchor="middle">
                    {d}m
                  </text>
                </g>
              ))}

              {activeWells.map((aw, i) => (
                <path
                  key={aw.id}
                  d={makePath(i, getRotVal, toRotY)}
                  fill="none"
                  stroke={aw.color.stroke}
                  strokeWidth={aw.isRef ? '2.5' : '2'}
                  strokeLinecap="round"
                />
              ))}

              {hoverDepth && (
                <line x1={toX(hoverDepth)} y1={pT} x2={toX(hoverDepth)} y2={pT + cH} stroke={isDark ? '#94a3b8' : '#0f172a'} strokeDasharray="2 2" strokeWidth="1" />
              )}
            </svg>
          </div>

          <div className="text-[11px] font-mono text-slate-950 dark:text-slate-300 mt-2 pt-2 border-t border-slate-200 dark:border-slate-800/80 flex justify-between font-semibold">
            <span>Sharpest turn zone: 2,120m–2,440m</span>
            {hoverDepth && <span className="text-cyan-950 dark:text-cyan-400 font-bold">Inspecting: {hoverDepth}m depth</span>}
          </div>
        </div>

        {/* ── GRAPH 2: ROP vs DEPTH ── */}
        <div
          className={`rounded-2xl border p-5 transition-all flex flex-col justify-between ${
            isDark ? 'bg-[#0b1224] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="mb-2">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-950 dark:text-emerald-400 block">
                  DRILLING SPEED (ROP)
                </span>
                <h3 className="text-sm font-bold text-slate-950 dark:text-slate-200 mt-0.5">
                  Rate of Penetration (ROP m/hr) vs Depth (m)
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-800 dark:text-slate-400 font-bold">
                Y: 5 &ndash; 45 m/hr &bull; X: 1,800&ndash;2,800m
              </span>
            </div>
            <p className="text-xs text-slate-900 dark:text-slate-300 mt-1 font-medium leading-relaxed">
              Shows how fast the drill bit cuts into rock. Sudden slowdowns reveal tougher rock or clogged drill bits.
            </p>
          </div>

          <div className="w-full relative overflow-hidden">
            <svg
              viewBox={`0 0 ${svgW} ${svgH}`}
              className="w-full h-auto overflow-visible cursor-crosshair"
              onMouseLeave={() => setHoverDepth(null)}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const relX = ((e.clientX - rect.left) / rect.width) * svgW;
                if (relX >= pL && relX <= pL + cW) {
                  setHoverDepth(Math.round(minDepth + ((relX - pL) / cW) * (maxDepth - minDepth)));
                }
              }}
            >
              {[5, 15, 25, 35, 45].map((val) => (
                <g key={val}>
                  <line x1={pL} y1={toRopY(val)} x2={pL + cW} y2={toRopY(val)} stroke={isDark ? '#1e293b' : '#cbd5e1'} strokeDasharray="3 3" />
                  <text x={pL - 6} y={toRopY(val) + 3} fill={isDark ? '#94a3b8' : '#0f172a'} fontSize="9" fontFamily="monospace" fontWeight="700" textAnchor="end">
                    {val}
                  </text>
                </g>
              ))}

              {[1800, 2000, 2200, 2400, 2600, 2800].map((d) => (
                <g key={d}>
                  <line x1={toX(d)} y1={pT} x2={toX(d)} y2={pT + cH} stroke={isDark ? '#1e293b' : '#cbd5e1'} strokeDasharray="3 3" />
                  <text x={toX(d)} y={pT + cH + 15} fill={isDark ? '#94a3b8' : '#0f172a'} fontSize="9" fontFamily="monospace" fontWeight="700" textAnchor="middle">
                    {d}m
                  </text>
                </g>
              ))}

              {activeWells.map((aw, i) => (
                <path
                  key={aw.id}
                  d={makePath(i, getRopVal, toRopY)}
                  fill="none"
                  stroke={aw.color.stroke}
                  strokeWidth={aw.isRef ? '2.5' : '2'}
                  strokeLinecap="round"
                />
              ))}

              {hoverDepth && (
                <line x1={toX(hoverDepth)} y1={pT} x2={toX(hoverDepth)} y2={pT + cH} stroke={isDark ? '#94a3b8' : '#0f172a'} strokeDasharray="2 2" strokeWidth="1" />
              )}
            </svg>
          </div>

          <div className="text-[11px] font-mono text-slate-950 dark:text-slate-300 mt-2 pt-2 border-t border-slate-200 dark:border-slate-800/80 flex justify-between font-semibold">
            <span>Drilling slows down sharply at Panna Shale boundary (~2,150m)</span>
            {hoverDepth && <span className="text-emerald-950 dark:text-emerald-400 font-bold">Inspecting: {hoverDepth}m depth</span>}
          </div>
        </div>

        {/* ── GRAPH 3: TORQUE vs DEPTH ── */}
        <div
          className={`rounded-2xl border p-5 transition-all flex flex-col justify-between ${
            isDark ? 'bg-[#0b1224] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="mb-2">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-900 dark:text-amber-500 block">
                  ROTATIONAL RESISTANCE (TORQUE)
                </span>
                <h3 className="text-sm font-bold text-slate-950 dark:text-slate-200 mt-0.5">
                  Rotary Torque (kft-lb) vs Depth (m)
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-800 dark:text-slate-400 font-bold">
                Y: 8 &ndash; 32 kft-lb &bull; X: 1,800&ndash;2,800m
              </span>
            </div>
            <p className="text-xs text-slate-900 dark:text-slate-300 mt-1 font-medium leading-relaxed">
              Shows rotational drag on the drill pipe. High torque warns that the pipe is grinding or getting stuck against the well wall.
            </p>
          </div>

          <div className="w-full relative overflow-hidden">
            <svg
              viewBox={`0 0 ${svgW} ${svgH}`}
              className="w-full h-auto overflow-visible cursor-crosshair"
              onMouseLeave={() => setHoverDepth(null)}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const relX = ((e.clientX - rect.left) / rect.width) * svgW;
                if (relX >= pL && relX <= pL + cW) {
                  setHoverDepth(Math.round(minDepth + ((relX - pL) / cW) * (maxDepth - minDepth)));
                }
              }}
            >
              {[8, 14, 20, 26, 32].map((val) => (
                <g key={val}>
                  <line x1={pL} y1={toTorqueY(val)} x2={pL + cW} y2={toTorqueY(val)} stroke={isDark ? '#1e293b' : '#cbd5e1'} strokeDasharray="3 3" />
                  <text x={pL - 6} y={toTorqueY(val) + 3} fill={isDark ? '#94a3b8' : '#0f172a'} fontSize="9" fontFamily="monospace" fontWeight="700" textAnchor="end">
                    {val}
                  </text>
                </g>
              ))}

              {[1800, 2000, 2200, 2400, 2600, 2800].map((d) => (
                <g key={d}>
                  <line x1={toX(d)} y1={pT} x2={toX(d)} y2={pT + cH} stroke={isDark ? '#1e293b' : '#cbd5e1'} strokeDasharray="3 3" />
                  <text x={toX(d)} y={pT + cH + 15} fill={isDark ? '#94a3b8' : '#0f172a'} fontSize="9" fontFamily="monospace" fontWeight="700" textAnchor="middle">
                    {d}m
                  </text>
                </g>
              ))}

              {activeWells.map((aw, i) => (
                <path
                  key={aw.id}
                  d={makePath(i, getTorqueVal, toTorqueY)}
                  fill="none"
                  stroke={aw.color.stroke}
                  strokeWidth={aw.isRef ? '2.5' : '2'}
                  strokeLinecap="round"
                />
              ))}

              {hoverDepth && (
                <line x1={toX(hoverDepth)} y1={pT} x2={toX(hoverDepth)} y2={pT + cH} stroke={isDark ? '#94a3b8' : '#0f172a'} strokeDasharray="2 2" strokeWidth="1" />
              )}
            </svg>
          </div>

          <div className="text-[11px] font-mono text-slate-950 dark:text-slate-300 mt-2 pt-2 border-t border-slate-200 dark:border-slate-800/80 flex justify-between font-semibold">
            <span className="text-amber-900 dark:text-amber-400 font-bold">Torque spikes between 2,390m–2,460m mark stuck pipe danger</span>
            {hoverDepth && <span className="text-amber-900 dark:text-amber-400 font-bold">Inspecting: {hoverDepth}m depth</span>}
          </div>
        </div>

        {/* ── GRAPH 4: MUD WEIGHT vs DEPTH ── */}
        <div
          className={`rounded-2xl border p-5 transition-all flex flex-col justify-between ${
            isDark ? 'bg-[#0b1224] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="mb-2">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-950 dark:text-purple-400 block">
                  DRILLING FLUID WEIGHT (PRESSURE CONTROL)
                </span>
                <h3 className="text-sm font-bold text-slate-950 dark:text-slate-200 mt-0.5">
                  Mud Weight / EMW (SG) vs Depth (m)
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-800 dark:text-slate-400 font-bold">
                Y: 1.05 &ndash; 1.55 SG &bull; X: 1,800&ndash;2,800m
              </span>
            </div>
            <p className="text-xs text-slate-900 dark:text-slate-300 mt-1 font-medium leading-relaxed">
              Shows mud density used to control underground pressure. Too light risks a kick; too heavy cracks the rock and causes mud loss.
            </p>
          </div>

          <div className="w-full relative overflow-hidden">
            <svg
              viewBox={`0 0 ${svgW} ${svgH}`}
              className="w-full h-auto overflow-visible cursor-crosshair"
              onMouseLeave={() => setHoverDepth(null)}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const relX = ((e.clientX - rect.left) / rect.width) * svgW;
                if (relX >= pL && relX <= pL + cW) {
                  setHoverDepth(Math.round(minDepth + ((relX - pL) / cW) * (maxDepth - minDepth)));
                }
              }}
            >
              {[1.10, 1.20, 1.30, 1.40, 1.50].map((val) => (
                <g key={val}>
                  <line x1={pL} y1={toMwY(val)} x2={pL + cW} y2={toMwY(val)} stroke={isDark ? '#1e293b' : '#cbd5e1'} strokeDasharray="3 3" />
                  <text x={pL - 6} y={toMwY(val) + 3} fill={isDark ? '#94a3b8' : '#0f172a'} fontSize="9" fontFamily="monospace" fontWeight="700" textAnchor="end">
                    {val.toFixed(2)}
                  </text>
                </g>
              ))}

              {[1800, 2000, 2200, 2400, 2600, 2800].map((d) => (
                <g key={d}>
                  <line x1={toX(d)} y1={pT} x2={toX(d)} y2={pT + cH} stroke={isDark ? '#1e293b' : '#cbd5e1'} strokeDasharray="3 3" />
                  <text x={toX(d)} y={pT + cH + 15} fill={isDark ? '#94a3b8' : '#0f172a'} fontSize="9" fontFamily="monospace" fontWeight="700" textAnchor="middle">
                    {d}m
                  </text>
                </g>
              ))}

              {activeWells.map((aw, i) => (
                <path
                  key={aw.id}
                  d={makePath(i, getMwVal, toMwY)}
                  fill="none"
                  stroke={aw.color.stroke}
                  strokeWidth={aw.isRef ? '2.5' : '2'}
                  strokeLinecap="round"
                />
              ))}

              {hoverDepth && (
                <line x1={toX(hoverDepth)} y1={pT} x2={toX(hoverDepth)} y2={pT + cH} stroke={isDark ? '#94a3b8' : '#0f172a'} strokeDasharray="2 2" strokeWidth="1" />
              )}
            </svg>
          </div>

          <div className="text-[11px] font-mono text-slate-950 dark:text-slate-300 mt-2 pt-2 border-t border-slate-200 dark:border-slate-800/80 flex justify-between font-semibold">
            <span>Mud density increases from 1.15 SG to 1.38 SG to hold back pressured shale</span>
            {hoverDepth && <span className="text-purple-950 dark:text-purple-400 font-bold">Inspecting: {hoverDepth}m depth</span>}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. COLLAPSIBLE TECHNICAL SECTIONS (AFTER GRAPHS)
          Casing Program ▾ • Cementing Particulars ▾ • Lessons Learned ▾
          ───────────────────────────────────────────────────────────── */}
      <div className="space-y-4 pt-2">
        {/* ── ACCORDION 1: CASING PROGRAM ── */}
        <div
          className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
            openSections.casing
              ? isDark
                ? 'bg-[#0b1224] border-cyan-800/60 shadow-md'
                : 'bg-white border-cyan-400 shadow-sm ring-1 ring-cyan-400/20'
              : isDark
              ? 'bg-[#0b1224] border-slate-800 hover:border-slate-700'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
          }`}
        >
          <button
            type="button"
            onClick={() => toggleSection('casing')}
            aria-expanded={openSections.casing}
            className={`w-full flex items-center justify-between p-4 sm:p-5 text-left transition-colors cursor-pointer select-none ${
              openSections.casing
                ? isDark
                  ? 'bg-slate-900/60'
                  : 'bg-slate-50/80'
                : isDark
                ? 'hover:bg-slate-900/40'
                : 'hover:bg-slate-50/60'
            }`}
          >
            <div className="flex items-center gap-3">
              <FileText className={`h-5 w-5 shrink-0 ${isDark ? 'text-cyan-400' : 'text-cyan-800'}`} />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-950'}`}>
                    Casing Program
                  </h3>
                  <span
                    aria-hidden="true"
                    className={`font-mono text-xs font-bold transition-transform duration-200 ${
                      openSections.casing
                        ? isDark ? 'text-cyan-400 rotate-180' : 'text-cyan-700 rotate-180'
                        : isDark ? 'text-slate-400' : 'text-slate-600'
                    }`}
                  >
                    {openSections.casing ? '▴' : '▾'}
                  </span>
                </div>
                <p className={`text-xs mt-0.5 font-medium ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>
                  Casing used at different depths to protect and seal the wellbore
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className={`text-[11px] font-mono font-bold px-2.5 py-1 rounded-md border hidden sm:inline-block ${
                isDark ? 'bg-slate-900 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-800 border-slate-300'
              }`}>
                4 Strings • FIT/LOT
              </span>
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-200 ${
                  openSections.casing
                    ? 'rotate-180 text-cyan-600 dark:text-cyan-400'
                    : isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              />
            </div>
          </button>

          {openSections.casing && (
            <div className="p-5 md:p-6 border-t border-slate-200 dark:border-slate-800/80 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200 dark:border-slate-800/80">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-950 dark:text-cyan-400 block">
                    PROTECTIVE STEEL PIPES
                  </span>
                  <p className="text-xs text-slate-800 dark:text-slate-400 mt-0.5 font-medium">
                    Shows the steel protective pipes installed from surface to bottom to seal off fragile rock and prevent wellbore collapse.
                  </p>
                </div>
                <span className="text-xs font-mono text-slate-800 dark:text-slate-400 self-start sm:self-auto font-semibold">
                  Reference Well &bull; {activeWell.wellName}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-300 dark:border-slate-800 text-[10px] text-slate-900 dark:text-slate-400 uppercase font-bold">
                      <th className="pb-2.5 font-bold">Pipe / String Name</th>
                      <th className="pb-2.5 font-bold">Hole Size</th>
                      <th className="pb-2.5 font-bold">Casing OD (Diameter)</th>
                      <th className="pb-2.5 font-bold">Weight / Grade</th>
                      <th className="pb-2.5 font-bold">Depth Reached</th>
                      <th className="pb-2.5 font-bold">Protected / Isolated Rock</th>
                      <th className="pb-2.5 font-bold text-right">Pressure Test (Integrity)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-500/5 transition-colors">
                      <td className="py-3 font-bold text-slate-950 dark:text-white">Conductor Casing</td>
                      <td className="py-3 text-slate-800 dark:text-slate-300 font-medium">26"</td>
                      <td className="py-3 text-cyan-900 dark:text-cyan-400 font-bold">20"</td>
                      <td className="py-3 text-slate-800 dark:text-slate-300 font-medium">94.0# X-56 BTC</td>
                      <td className="py-3 text-amber-900 dark:text-amber-400 font-bold">165 m MD</td>
                      <td className="py-3 text-slate-800 dark:text-slate-300 font-medium">Surface Sands &amp; Recent Alluvium</td>
                      <td className="py-3 text-right text-emerald-900 dark:text-emerald-400 font-bold">FIT 1.35 SG</td>
                    </tr>
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-500/5 transition-colors">
                      <td className="py-3 font-bold text-slate-950 dark:text-white">Surface Casing</td>
                      <td className="py-3 text-slate-800 dark:text-slate-300 font-medium">17-1/2"</td>
                      <td className="py-3 text-cyan-900 dark:text-cyan-400 font-bold">13-3/8"</td>
                      <td className="py-3 text-slate-800 dark:text-slate-300 font-medium">68.0# K-55 BTC</td>
                      <td className="py-3 text-amber-900 dark:text-amber-400 font-bold">980 m MD</td>
                      <td className="py-3 text-slate-800 dark:text-slate-300 font-medium">Middle Miocene Reactive Claystone</td>
                      <td className="py-3 text-right text-emerald-900 dark:text-emerald-400 font-bold">FIT 1.58 SG</td>
                    </tr>
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-500/5 transition-colors">
                      <td className="py-3 font-bold text-slate-950 dark:text-white">Intermediate Casing</td>
                      <td className="py-3 text-slate-800 dark:text-slate-300 font-medium">12-1/4"</td>
                      <td className="py-3 text-cyan-900 dark:text-cyan-400 font-bold">9-5/8"</td>
                      <td className="py-3 text-slate-800 dark:text-slate-300 font-medium">47.0# L-80 VAM</td>
                      <td className="py-3 text-amber-900 dark:text-amber-400 font-bold">2,180 m MD</td>
                      <td className="py-3 text-slate-800 dark:text-slate-300 font-medium">Bassein Limestone Member</td>
                      <td className="py-3 text-right text-emerald-900 dark:text-emerald-400 font-bold">LOT 1.70 SG</td>
                    </tr>
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-500/5 transition-colors">
                      <td className="py-3 font-bold text-slate-950 dark:text-white">Production Liner</td>
                      <td className="py-3 text-slate-800 dark:text-slate-300 font-medium">8-1/2"</td>
                      <td className="py-3 text-cyan-900 dark:text-cyan-400 font-bold">7"</td>
                      <td className="py-3 text-slate-800 dark:text-slate-300 font-medium">29.0# P-110 Tenaris</td>
                      <td className="py-3 text-amber-900 dark:text-amber-400 font-bold">2,750 m MD</td>
                      <td className="py-3 text-slate-800 dark:text-slate-300 font-medium">Overpressured Panna Shale &amp; Pay Sand</td>
                      <td className="py-3 text-right text-emerald-900 dark:text-emerald-400 font-bold">TOL Test Pass</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* ── ACCORDION 2: CEMENTING PARTICULARS ── */}
        <div
          className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
            openSections.cementing
              ? isDark
                ? 'bg-[#0b1224] border-emerald-800/60 shadow-md'
                : 'bg-white border-emerald-400 shadow-sm ring-1 ring-emerald-400/20'
              : isDark
              ? 'bg-[#0b1224] border-slate-800 hover:border-slate-700'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
          }`}
        >
          <button
            type="button"
            onClick={() => toggleSection('cementing')}
            aria-expanded={openSections.cementing}
            className={`w-full flex items-center justify-between p-4 sm:p-5 text-left transition-colors cursor-pointer select-none ${
              openSections.cementing
                ? isDark
                  ? 'bg-slate-900/60'
                  : 'bg-slate-50/80'
                : isDark
                ? 'hover:bg-slate-900/40'
                : 'hover:bg-slate-50/60'
            }`}
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 className={`h-5 w-5 shrink-0 ${isDark ? 'text-emerald-400' : 'text-emerald-800'}`} />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-950'}`}>
                    Cementing Particulars
                  </h3>
                  <span
                    aria-hidden="true"
                    className={`font-mono text-xs font-bold transition-transform duration-200 ${
                      openSections.cementing
                        ? isDark ? 'text-emerald-400 rotate-180' : 'text-emerald-700 rotate-180'
                        : isDark ? 'text-slate-400' : 'text-slate-600'
                    }`}
                  >
                    {openSections.cementing ? '▴' : '▾'}
                  </span>
                </div>
                <p className={`text-xs mt-0.5 font-medium ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>
                  How and where the well was cemented to create permanent pressure seals
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className={`text-[11px] font-mono font-bold px-2.5 py-1 rounded-md border hidden sm:inline-block ${
                isDark ? 'bg-slate-900 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-800 border-slate-300'
              }`}>
                API Class G Spec
              </span>
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-200 ${
                  openSections.cementing
                    ? 'rotate-180 text-emerald-600 dark:text-emerald-400'
                    : isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              />
            </div>
          </button>

          {openSections.cementing && (
            <div className="p-5 md:p-6 border-t border-slate-200 dark:border-slate-800/80 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200 dark:border-slate-800/80">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-950 dark:text-emerald-400 block">
                    PRESSURE BARRIERS &amp; SEALS
                  </span>
                  <p className="text-xs text-slate-800 dark:text-slate-400 mt-0.5 font-medium">
                    Shows how liquid cement was pumped behind the steel casing to permanently seal rock layers and prevent gas or oil from escaping.
                  </p>
                </div>
                <span className="text-xs font-mono text-slate-800 dark:text-slate-400 self-start sm:self-auto font-semibold">
                  Slurry Design &bull; API Class G Spec
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                {/* Lead Slurry */}
                <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <span className="text-[10px] uppercase font-bold text-slate-900 dark:text-slate-400 block">1. LEAD SLURRY (UPPER SECTION CEMENT)</span>
                  <div className="mt-1 text-base font-bold text-slate-950 dark:text-white">
                    1.56 SG (13.0 ppg)
                  </div>
                  <p className="text-[11px] text-cyan-950 dark:text-cyan-400 font-sans font-semibold mt-1">
                    Lighter cement pumped first to fill the long upper column without cracking delicate formations.
                  </p>
                  <p className="text-[11px] text-slate-800 dark:text-slate-300 font-sans mt-2 leading-relaxed">
                    Lightweight Class G extended slurry blended with 3.0% pre-hydrated bentonite, 0.25 gps retarder, and fluid loss reducer. Pumped with 100% theoretical returns to sea floor.
                  </p>
                </div>

                {/* Tail Slurry */}
                <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <span className="text-[10px] uppercase font-bold text-slate-900 dark:text-slate-400 block">2. TAIL SLURRY (DEEP HIGH-STRENGTH CEMENT)</span>
                  <div className="mt-1 text-base font-bold text-emerald-900 dark:text-emerald-400">
                    1.90 SG (15.8 ppg)
                  </div>
                  <p className="text-[11px] text-emerald-950 dark:text-emerald-400 font-sans font-semibold mt-1">
                    Dense, high-strength cement placed at the bottom to form a leak-proof seal around the oil &amp; gas zone.
                  </p>
                  <p className="text-[11px] text-slate-800 dark:text-slate-300 font-sans mt-2 leading-relaxed">
                    Neat Class G cement formulated with silica flour (35% BWOC) and anti-gas migration additives. Compressive strength develops to &gt;2,500 psi within 24 hours at 115&deg;C BHCT.
                  </p>
                </div>

                {/* Placement & Stand-off */}
                <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <span className="text-[10px] uppercase font-bold text-slate-900 dark:text-slate-400 block">3. PIPE CENTERING &amp; CLEANING</span>
                  <div className="mt-1 text-base font-bold text-amber-900 dark:text-amber-400">
                    85% Stand-Off
                  </div>
                  <p className="text-[11px] text-amber-950 dark:text-amber-400 font-sans font-semibold mt-1">
                    Metal guides keep the pipe centered so cement spreads evenly and mud is thoroughly flushed out.
                  </p>
                  <p className="text-[11px] text-slate-800 dark:text-slate-300 font-sans mt-2 leading-relaxed">
                    Positive bow-spring centralizers placed 1 per joint across hydrocarbon intervals. Preceded by 40 bbls weighted turbulent spacer at 1.45 SG to ensure &gt;95% mud removal efficiency.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── ACCORDION 3: LESSONS LEARNED (MAIN / IMPORTANT SECTION) ── */}
        <div
          className={`rounded-2xl border-2 transition-all duration-200 overflow-hidden ${
            openSections.lessons
              ? isDark
                ? 'bg-[#0f172a] border-amber-500/60 shadow-[0_12px_40px_rgba(251,191,36,0.15)] ring-1 ring-amber-500/20'
                : 'bg-white border-amber-400 shadow-md ring-1 ring-amber-400/20'
              : isDark
              ? 'bg-[#0f172a] border-amber-500/40 hover:border-amber-400/60'
              : 'bg-white border-amber-300 hover:border-amber-400 shadow-2xs'
          }`}
        >
          <button
            type="button"
            onClick={() => toggleSection('lessons')}
            aria-expanded={openSections.lessons}
            className={`w-full flex items-center justify-between p-4 sm:p-5 text-left transition-colors cursor-pointer select-none ${
              openSections.lessons
                ? isDark
                  ? 'bg-amber-950/20'
                  : 'bg-amber-50/60'
                : isDark
                ? 'hover:bg-amber-950/15'
                : 'hover:bg-amber-50/40'
            }`}
          >
            <div className="flex items-center gap-3">
              <Lightbulb className={`h-5 w-5 shrink-0 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-950'}`}>
                    Lessons Learned
                  </h3>
                  <span
                    aria-hidden="true"
                    className={`font-mono text-xs font-bold transition-transform duration-200 ${
                      openSections.lessons
                        ? isDark ? 'text-amber-400 rotate-180' : 'text-amber-700 rotate-180'
                        : isDark ? 'text-amber-400' : 'text-amber-700'
                    }`}
                  >
                    {openSections.lessons ? '▴' : '▾'}
                  </span>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                    isDark
                      ? 'text-amber-300 bg-amber-500/20 border-amber-500/40'
                      : 'text-amber-950 bg-amber-100 border-amber-300 font-extrabold'
                  }`}>
                    ★ MAIN / IMPORTANT SECTION
                  </span>
                </div>
                <p className={`text-xs mt-0.5 font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Important findings, critical hazard categories, and proven prevention steps from past wells
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className={`text-[11px] font-mono font-bold px-2.5 py-1 rounded-md border hidden sm:inline-block ${
                isDark ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'text-amber-950 bg-amber-100 border-amber-300'
              }`}>
                4 Core Hazard Categories
              </span>
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-200 ${
                  openSections.lessons
                    ? 'rotate-180 text-amber-600 dark:text-amber-400'
                    : isDark ? 'text-amber-400' : 'text-amber-600'
                }`}
              />
            </div>
          </button>

          {openSections.lessons && (
            <div className="p-5 md:p-6 border-t border-amber-500/30 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-amber-500/30">
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-amber-800 dark:text-amber-500">
                    <Lightbulb className="h-4 w-4" />
                    <span>KEY DRILLING INSIGHTS</span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-950 dark:text-white mt-1">
                    LESSONS LEARNED &bull; Important findings from previous wells
                  </h2>
                  <p className="text-xs text-slate-800 dark:text-slate-400 mt-0.5 font-medium">
                    Real-world drilling problems and proven prevention steps gathered from past well reports in this field.
                  </p>
                </div>

                <span className={`text-xs font-mono font-bold px-3 py-1.5 rounded-lg border self-start sm:self-auto ${
                  isDark ? 'text-amber-400 bg-amber-500/10 border-amber-500/30' : 'text-amber-950 bg-amber-100 border-amber-300'
                }`}>
                  4 Core Hazard Categories
                </span>
              </div>

              {/* Structured Lessons Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
                {/* LESSON 1: Differential Sticking */}
                <div
                  className={`p-5 rounded-2xl border flex flex-col justify-between ${
                    isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between border-b pb-2.5 border-slate-200 dark:border-slate-800">
                      <span className="text-xs font-mono font-bold text-red-900 dark:text-red-400 flex items-center gap-1.5">
                        <ShieldAlert className="h-4 w-4" />
                        <span>OVERPRESSURED PANNA SHALE</span>
                      </span>
                      <span className="text-[10px] font-mono text-slate-800 dark:text-slate-400 font-bold">64h Lost Time &bull; Kaveri-Deep-01</span>
                    </div>

                    <div className="mt-3.5 space-y-2.5 text-xs font-sans">
                      <div>
                        <span className="font-mono font-bold text-[10px] uppercase text-cyan-950 dark:text-cyan-400 block">EARLY WARNING SIGNS (OBSERVATION)</span>
                        <p className="text-slate-950 dark:text-slate-300 mt-0.5 leading-relaxed font-normal">
                          Severe overpull of 140 klbs and rotary torque spikes exceeding 28 kft-lb while reaming at 2,415m MD across depleted permeable sand stringers.
                        </p>
                      </div>

                      <div>
                        <span className="font-mono font-bold text-[10px] uppercase text-amber-950 dark:text-amber-400 block">WHAT HAPPENED (ROOT CAUSE)</span>
                        <p className="text-slate-950 dark:text-slate-300 mt-0.5 leading-relaxed font-normal">
                          Drill string remained stationary for 18 minutes during MWD survey. Excessive hydrostatic overbalance (0.22 SG) caused differential pack-off against thick permeable mudcake. Jarring operations failed; required spotting 45 bbls organic soaking pill.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800">
                    <span className="font-mono font-bold text-[10px] uppercase text-emerald-950 dark:text-emerald-400 block">
                      HOW TO PREVENT IT IN FUTURE WELLS (RECOMMENDED ACTION)
                    </span>
                    <p className="text-xs text-slate-950 dark:text-slate-200 font-sans font-semibold mt-1 leading-relaxed">
                      Maintain continuous string rotation (&ge;25 RPM) during surveys. Keep fluid loss &lt;4.0 cc/30min using dynamic filtration additives. Reduce MW to 1.34 SG if pore-pressure regression is confirmed.
                    </p>
                  </div>
                </div>

                {/* LESSON 2: Lost Circulation in Fractured Bassein */}
                <div
                  className={`p-5 rounded-2xl border flex flex-col justify-between ${
                    isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between border-b pb-2.5 border-slate-200 dark:border-slate-800">
                      <span className="text-xs font-mono font-bold text-amber-900 dark:text-amber-400 flex items-center gap-1.5">
                        <AlertTriangle className="h-4 w-4" />
                        <span>FRACTURED BASSEIN CARBONATE</span>
                      </span>
                      <span className="text-[10px] font-mono text-slate-800 dark:text-slate-400 font-bold">42h Lost Time &bull; D-33-East-02</span>
                    </div>

                    <div className="mt-3.5 space-y-2.5 text-xs font-sans">
                      <div>
                        <span className="font-mono font-bold text-[10px] uppercase text-cyan-950 dark:text-cyan-400 block">EARLY WARNING SIGNS (OBSERVATION)</span>
                        <p className="text-slate-950 dark:text-slate-300 mt-0.5 leading-relaxed font-normal">
                          Sudden pit volume decrease of 110 bbls over 25 minutes while drilling at 1,980m MD with ECD at 1.28 SG.
                        </p>
                      </div>

                      <div>
                        <span className="font-mono font-bold text-[10px] uppercase text-amber-950 dark:text-amber-400 block">WHAT HAPPENED (ROOT CAUSE)</span>
                        <p className="text-slate-950 dark:text-slate-300 mt-0.5 leading-relaxed font-normal">
                          Bit penetrated cavernous vuggy porosity zone intersected by an active micro-fault. Flow returns dropped to 40%. Required pumping three successive 30 bbls coarse LCM pills (calcium carbonate + nut plug blend).
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800">
                    <span className="font-mono font-bold text-[10px] uppercase text-emerald-950 dark:text-emerald-400 block">
                      HOW TO PREVENT IT IN FUTURE WELLS (RECOMMENDED ACTION)
                    </span>
                    <p className="text-xs text-slate-950 dark:text-slate-200 font-sans font-semibold mt-1 leading-relaxed">
                      Pre-treat active mud system with 15–20 ppb medium LCM prior to penetrating Upper Bassein top. Throttle flow rate from 750 GPM to 550 GPM to suppress surge ECD below 1.22 SG.
                    </p>
                  </div>
                </div>

                {/* LESSON 3: Reactive Claystone Pack-off */}
                <div
                  className={`p-5 rounded-2xl border flex flex-col justify-between ${
                    isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between border-b pb-2.5 border-slate-200 dark:border-slate-800">
                      <span className="text-xs font-mono font-bold text-amber-900 dark:text-amber-400 flex items-center gap-1.5">
                        <ShieldAlert className="h-4 w-4" />
                        <span>MIDDLE MIOCENE CLAYSTONE</span>
                      </span>
                      <span className="text-[10px] font-mono text-slate-800 dark:text-slate-400 font-bold">28h Lost Time &bull; Neelam-North-05</span>
                    </div>

                    <div className="mt-3.5 space-y-2.5 text-xs font-sans">
                      <div>
                        <span className="font-mono font-bold text-[10px] uppercase text-cyan-950 dark:text-cyan-400 block">EARLY WARNING SIGNS (OBSERVATION)</span>
                        <p className="text-slate-950 dark:text-slate-300 mt-0.5 leading-relaxed font-normal">
                          Drastic standpipe pressure increase from 2,400 psi to 3,450 psi with rapid ROP degradation while drilling 17-1/2" section at 1,120m MD.
                        </p>
                      </div>

                      <div>
                        <span className="font-mono font-bold text-[10px] uppercase text-amber-950 dark:text-amber-400 block">WHAT HAPPENED (ROOT CAUSE)</span>
                        <p className="text-slate-950 dark:text-slate-300 mt-0.5 leading-relaxed font-normal">
                          Smectite-rich claystone caused severe bit balling and stabilizer ring accretion. Cuttings accumulated around BHA stabilizers creating annular restriction. Pulled out of hole with heavy balled-up bit.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800">
                    <span className="font-mono font-bold text-[10px] uppercase text-emerald-950 dark:text-emerald-400 block">
                      HOW TO PREVENT IT IN FUTURE WELLS (RECOMMENDED ACTION)
                    </span>
                    <p className="text-xs text-slate-950 dark:text-slate-200 font-sans font-semibold mt-1 leading-relaxed">
                      Maintain 4–6% glycol encapsulation concentration and PHPA polymer sweep every 90m. Utilize optimized tooth profile PDC bit with open blade stand-off to avoid balling.
                    </p>
                  </div>
                </div>

                {/* LESSON 4: High Dogleg Directional Steering */}
                <div
                  className={`p-5 rounded-2xl border flex flex-col justify-between ${
                    isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between border-b pb-2.5 border-slate-200 dark:border-slate-800">
                      <span className="text-xs font-mono font-bold text-cyan-950 dark:text-cyan-400 flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>DIRECTIONAL BUILD SECTION</span>
                      </span>
                      <span className="text-[10px] font-mono text-slate-800 dark:text-slate-400 font-bold">18h Lost Time &bull; Gandhar-Deep-07</span>
                    </div>

                    <div className="mt-3.5 space-y-2.5 text-xs font-sans">
                      <div>
                        <span className="font-mono font-bold text-[10px] uppercase text-cyan-950 dark:text-cyan-400 block">EARLY WARNING SIGNS (OBSERVATION)</span>
                        <p className="text-slate-950 dark:text-slate-300 mt-0.5 leading-relaxed font-normal">
                          Excessive dogleg severity of 5.8&deg;/30m generated keyseat wear and premature casing collar damage during subsequent casing running at 2,240m MD.
                        </p>
                      </div>

                      <div>
                        <span className="font-mono font-bold text-[10px] uppercase text-amber-950 dark:text-amber-400 block">WHAT HAPPENED (ROOT CAUSE)</span>
                        <p className="text-slate-950 dark:text-slate-300 mt-0.5 leading-relaxed font-normal">
                          Over-aggressive sliding in soft formation led to localized micro-doglegs. 9-5/8" casing string hung up at 2,190m requiring dedicated wiper trip and hole opener pass.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800">
                    <span className="font-mono font-bold text-[10px] uppercase text-emerald-950 dark:text-emerald-400 block">
                      HOW TO PREVENT IT IN FUTURE WELLS (RECOMMENDED ACTION)
                    </span>
                    <p className="text-xs text-slate-950 dark:text-slate-200 font-sans font-semibold mt-1 leading-relaxed">
                      Limit planned dogleg severity to &le;3.5&deg;/30m using rotary steerable system (RSS). Perform continuous caliper log before running casing to identify micro-doglegs early.
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer Note */}
              <div className="mt-5 pt-3 border-t border-amber-500/30 flex items-center justify-between text-[11px] font-mono text-slate-800 dark:text-slate-400 font-medium">
                <span>* Evidence-based guidelines compiled from historical Western Asset offset well database.</span>
                <span className="text-amber-900 dark:text-amber-400 font-bold">SIH26121 Drilling Decision Support</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
