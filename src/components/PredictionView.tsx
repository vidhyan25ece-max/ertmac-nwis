import React from 'react';
import { ActiveDrillingState, RiskPredictionResult } from '../types/drilling';
import { FORMATION_LAYERS } from '../data/wellsData';
import { useTheme } from '../context/ThemeContext';
import { RefreshCw, Sliders, AlertTriangle } from 'lucide-react';

interface PredictionViewProps {
  activeWell: ActiveDrillingState;
  prediction: RiskPredictionResult;
  onUpdateParams: (params: Partial<ActiveDrillingState>) => void;
  onResetParams: () => void;
}

export const PredictionView: React.FC<PredictionViewProps> = ({
  activeWell,
  prediction,
  onUpdateParams,
  onResetParams,
}) => {
  const { isDark } = useTheme();

  const handleScenarioPreset = (scenario: string) => {
    switch (scenario) {
      case 'sticking':
        onUpdateParams({
          currentDepth: 2415,
          mudWeight: 1.42,
          torque: 24.0,
          rop: 4.0,
        });
        break;
      case 'mudloss':
        onUpdateParams({
          currentDepth: 2442,
          mudWeight: 1.46,
          torque: 16.0,
          rop: 8.0,
        });
        break;
      case 'safe':
        onUpdateParams({
          currentDepth: 2360,
          mudWeight: 1.34,
          torque: 15.0,
          rop: 14.0,
        });
        break;
    }
  };

  // Synthetic depth-vs-risk curve data points
  const depthCurve = [
    { depth: 500, stuck: 10, loss: 10 },
    { depth: 1000, stuck: 20, loss: 12 },
    { depth: 1420, stuck: 25, loss: 20 },
    { depth: 1985, stuck: 30, loss: 65 }, // Bassein limestone loss
    { depth: 2150, stuck: 45, loss: 35 },
    { depth: 2390, stuck: 75, loss: 55 },
    { depth: 2415, stuck: 88, loss: 60 }, // Kaveri stuck pipe peak
    { depth: 2442, stuck: 65, loss: 92 }, // Neelam mud loss peak
    { depth: 2680, stuck: 40, loss: 45 },
    { depth: 2915, stuck: 30, loss: 55 }, // Sagar-Kiran fault loss
    { depth: 3200, stuck: 25, loss: 20 },
    { depth: 3450, stuck: 15, loss: 15 },
  ];

  // Circular gauge rendering helper
  const renderGauge = (value: number, label: string, colorHex: string, riskLevel: string) => {
    const radius = 54;
    const stroke = 8;
    const normRadius = radius - stroke * 2;
    const circumference = normRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (value / 100) * circumference;

    return (
      <div
        className={`rounded-xl border p-5 flex flex-col items-center justify-center transition-all ${
          isDark
            ? 'bg-[#0b1224] border-slate-800 shadow-[0_4px_24px_rgba(0,0,0,0.4)]'
            : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <span className={`text-xs font-mono font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>
          {label}
        </span>

        {/* SVG Circular Ring Gauge */}
        <div className="relative my-3 flex items-center justify-center">
          <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
            {/* Background ring */}
            <circle
              stroke={isDark ? '#1e293b' : '#e2e8f0'}
              fill="transparent"
              strokeWidth={stroke}
              r={normRadius}
              cx={radius}
              cy={radius}
            />
            {/* Value fill ring */}
            <circle
              stroke={colorHex}
              fill="transparent"
              strokeWidth={stroke}
              strokeDasharray={`${circumference} ${circumference}`}
              style={{ strokeDashoffset }}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
              r={normRadius}
              cx={radius}
              cy={radius}
            />
          </svg>

          {/* Center value display */}
          <div className="absolute flex flex-col items-center justify-center">
            <span className="font-mono text-2xl font-black" style={{ color: colorHex }}>
              {value}%
            </span>
          </div>
        </div>

        {/* Risk Level Badge */}
        <span
          className="rounded-full px-3 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wider border"
          style={{
            color: colorHex,
            backgroundColor: `${colorHex}15`,
            borderColor: `${colorHex}40`,
          }}
        >
          {riskLevel}
        </span>
      </div>
    );
  };

  const getStuckLevel = (val: number) => (val > 60 ? 'CRITICAL' : val > 35 ? 'HIGH' : 'LOW');
  const getLossLevel = (val: number) => (val > 60 ? 'HIGH' : val > 35 ? 'MEDIUM' : 'LOW');

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3 border-slate-200 dark:border-slate-800">
        <div>
          <h1 className={`text-xl font-bold font-mono tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Machine Learning Hazard Prediction
          </h1>
          <p className={`text-xs mt-0.5 font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Random Forest & Gradient Boosted Ensemble Model • Trained on 12 Offset Wells
          </p>
        </div>

        <button
          onClick={onResetParams}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-mono font-medium transition-all ${
            isDark
              ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              : 'bg-white text-slate-800 border border-slate-300 hover:bg-slate-50 shadow-xs'
          }`}
        >
          <RefreshCw className="h-3 w-3" />
          <span>Reset Baseline</span>
        </button>
      </div>

      {/* LARGE CENTRAL RISK VISUALIZATION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {renderGauge(
          prediction.stuckPipeRisk,
          'STUCK PIPE RISK',
          prediction.stuckPipeRisk > 60 ? '#ef4444' : prediction.stuckPipeRisk > 35 ? '#f59e0b' : '#10b981',
          getStuckLevel(prediction.stuckPipeRisk)
        )}

        {renderGauge(
          prediction.mudLossRisk,
          'MUD LOSS RISK',
          prediction.mudLossRisk > 60 ? '#ef4444' : prediction.mudLossRisk > 35 ? '#f59e0b' : '#10b981',
          getLossLevel(prediction.mudLossRisk)
        )}
      </div>

      {/* RISK VS DEPTH CHART */}
      <div
        className={`rounded-xl border p-5 transition-all ${
          isDark
            ? 'bg-[#0b1224] border-slate-800 shadow-[0_4px_24px_rgba(0,0,0,0.4)]'
            : 'bg-white border-slate-200 shadow-xs'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className={`text-xs font-mono font-bold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-900'}`}>
              Risk vs Depth Trajectory Profile
            </h3>
            <span className={`text-[11px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>
              Subsurface risk projection from 500 m to 3,450 m
            </span>
          </div>

          <div className="flex items-center gap-4 text-[10px] font-mono text-slate-700 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-4 bg-red-500/30 border border-red-500 rounded"></span> Historical Risk Corridor (2,390–2,430m)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500"></span> Current Depth Marker
            </span>
          </div>
        </div>

        {/* Chart SVG */}
        <div className="w-full h-44 relative">
          <svg viewBox="0 0 540 140" className="w-full h-full overflow-visible">
            {/* Historical Risk Zone Highlight Band: 2390m - 2430m */}
            {(() => {
              const startX = ((2390 - 500) / 2950) * 500 + 20;
              const endX = ((2440 - 500) / 2950) * 500 + 20;
              const w = endX - startX;
              return (
                <g>
                  <rect
                    x={startX}
                    y={10}
                    width={w}
                    height={100}
                    fill="rgba(239, 68, 68, 0.12)"
                    stroke="rgba(239, 68, 68, 0.4)"
                    strokeDasharray="3 3"
                    rx="4"
                  />
                  <text
                    x={startX + w / 2}
                    y={22}
                    fill="#ef4444"
                    fontSize="7"
                    fontFamily="monospace"
                    textAnchor="middle"
                    fontWeight="bold"
                  >
                    PANNA RISK ZONE
                  </text>
                </g>
              );
            })()}

            {/* Grid Lines */}
            <line x1="20" y1="30" x2="520" y2="30" stroke={isDark ? '#1e293b' : '#e2e8f0'} strokeWidth="1" />
            <line x1="20" y1="65" x2="520" y2="65" stroke={isDark ? '#1e293b' : '#e2e8f0'} strokeWidth="1" />
            <line x1="20" y1="110" x2="520" y2="110" stroke={isDark ? '#334155' : '#cbd5e1'} strokeWidth="1" />

            {/* Stuck Pipe Risk Curve (Red/Amber) */}
            {(() => {
              const points = depthCurve.map((d) => {
                const x = ((d.depth - 500) / 2950) * 500 + 20;
                const y = 110 - (d.stuck / 100) * 85;
                return `${x},${y}`;
              });
              return (
                <path
                  d={`M ${points.join(' L ')}`}
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="2.5"
                />
              );
            })()}

            {/* Mud Loss Risk Curve (Amber) */}
            {(() => {
              const points = depthCurve.map((d) => {
                const x = ((d.depth - 500) / 2950) * 500 + 20;
                const y = 110 - (d.loss / 100) * 85;
                return `${x},${y}`;
              });
              return (
                <path
                  d={`M ${points.join(' L ')}`}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="1.8"
                  strokeDasharray="4 2"
                />
              );
            })()}

            {/* CURRENT DEPTH VERTICAL MARKER */}
            {(() => {
              const bitX = Math.max(20, Math.min(520, ((activeWell.currentDepth - 500) / 2950) * 500 + 20));
              return (
                <g>
                  <line
                    x1={bitX}
                    y1={8}
                    x2={bitX}
                    y2={110}
                    stroke="#f59e0b"
                    strokeWidth="2"
                    strokeDasharray="3 2"
                  />
                  <polygon
                    points={`${bitX - 4},8 ${bitX + 4},8 ${bitX},14`}
                    fill="#f59e0b"
                  />
                  <rect
                    x={bitX - 44}
                    y={-4}
                    width={88}
                    height={14}
                    rx="3"
                    fill="#f59e0b"
                  />
                  <text
                    x={bitX}
                    y={6}
                    fill="#000000"
                    fontSize="8"
                    fontFamily="monospace"
                    textAnchor="middle"
                    fontWeight="bold"
                  >
                    BIT: {activeWell.currentDepth} m
                  </text>
                </g>
              );
            })()}
          </svg>
        </div>

        <div className={`flex justify-between text-[10px] font-mono pt-1 ${isDark ? 'text-slate-500' : 'text-slate-600 font-semibold'}`}>
          <span>500 m</span>
          <span>1,420 m (Bassein Top)</span>
          <span>1,985 m (Loss Facies)</span>
          <span>2,415 m (Stuck Pipe Peak)</span>
          <span>3,450 m (Target Depth)</span>
        </div>
      </div>

      {/* COMPACT CONTROL PANEL (INPUT CONTROLS) */}
      <div
        className={`rounded-xl border p-5 transition-all ${
          isDark
            ? 'bg-[#0b1224] border-slate-800 shadow-[0_4px_24px_rgba(0,0,0,0.4)]'
            : 'bg-white border-slate-200 shadow-xs'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3 border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
            <h3 className={`text-xs font-mono font-bold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-900'}`}>
              Compact Drilling Controls & Presets
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleScenarioPreset('safe')}
              className={`rounded-md px-2.5 py-1 text-xs font-mono font-medium transition-colors ${
                isDark
                  ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/40 hover:bg-emerald-900/40'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
              }`}
            >
              Safe Operating Baseline
            </button>
            <button
              onClick={() => handleScenarioPreset('sticking')}
              className={`rounded-md px-2.5 py-1 text-xs font-mono font-medium transition-colors ${
                isDark
                  ? 'bg-red-950/40 text-red-400 border border-red-800/40 hover:bg-red-900/40'
                  : 'bg-red-50 text-red-800 border border-red-300 hover:bg-red-100'
              }`}
            >
              Differential Sticking (2,415m)
            </button>
            <button
              onClick={() => handleScenarioPreset('mudloss')}
              className={`rounded-md px-2.5 py-1 text-xs font-mono font-medium transition-colors ${
                isDark
                  ? 'bg-amber-950/40 text-amber-400 border border-amber-800/40 hover:bg-amber-900/40'
                  : 'bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100'
              }`}
            >
              Fracture Mud Loss (2,442m)
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
          {/* Depth Slider */}
          <div>
            <div className="flex justify-between">
              <span className={isDark ? 'text-slate-400' : 'text-slate-700 font-medium'}>Depth:</span>
              <span className={`font-bold ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>{activeWell.currentDepth} m</span>
            </div>
            <input
              type="range"
              min={500}
              max={activeWell.targetDepth}
              step={5}
              value={activeWell.currentDepth}
              onChange={(e) => onUpdateParams({ currentDepth: Number(e.target.value) })}
              className="mt-1 w-full h-1.5 cursor-pointer appearance-none rounded-lg bg-slate-300 dark:bg-slate-700 accent-cyan-600 dark:accent-cyan-400"
            />
          </div>

          {/* Mud Weight */}
          <div>
            <div className="flex justify-between">
              <span className={isDark ? 'text-slate-400' : 'text-slate-700 font-medium'}>Mud Weight:</span>
              <span className={`font-bold ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}>{activeWell.mudWeight.toFixed(2)} SG</span>
            </div>
            <input
              type="range"
              min={1.1}
              max={1.6}
              step={0.01}
              value={activeWell.mudWeight}
              onChange={(e) => onUpdateParams({ mudWeight: Number(e.target.value) })}
              className="mt-1 w-full h-1.5 cursor-pointer appearance-none rounded-lg bg-slate-300 dark:bg-slate-700 accent-cyan-600 dark:accent-cyan-400"
            />
          </div>

          {/* Torque */}
          <div>
            <div className="flex justify-between">
              <span className={isDark ? 'text-slate-400' : 'text-slate-700 font-medium'}>Torque:</span>
              <span className={`font-bold ${activeWell.torque > 20 ? (isDark ? 'text-red-400' : 'text-red-700') : (isDark ? 'text-slate-300' : 'text-slate-800')}`}>
                {activeWell.torque.toFixed(1)} kft-lb
              </span>
            </div>
            <input
              type="range"
              min={5}
              max={35}
              step={0.5}
              value={activeWell.torque}
              onChange={(e) => onUpdateParams({ torque: Number(e.target.value) })}
              className="mt-1 w-full h-1.5 cursor-pointer appearance-none rounded-lg bg-slate-300 dark:bg-slate-700 accent-cyan-600 dark:accent-cyan-400"
            />
          </div>

          {/* ROP */}
          <div>
            <div className="flex justify-between">
              <span className={isDark ? 'text-slate-400' : 'text-slate-700 font-medium'}>ROP:</span>
              <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{activeWell.rop.toFixed(1)} m/hr</span>
            </div>
            <input
              type="range"
              min={2}
              max={45}
              step={0.5}
              value={activeWell.rop}
              onChange={(e) => onUpdateParams({ rop: Number(e.target.value) })}
              className="mt-1 w-full h-1.5 cursor-pointer appearance-none rounded-lg bg-slate-300 dark:bg-slate-700 accent-cyan-600 dark:accent-cyan-400"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
