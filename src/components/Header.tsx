import React from 'react';
import { ActiveDrillingState } from '../types/drilling';
import { Play, Pause, RotateCcw, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  activeWell: ActiveDrillingState;
  onDepthChange: (newDepth: number) => void;
  isSimulating: boolean;
  onToggleSimulate: () => void;
  onResetDepth: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeWell,
  onDepthChange,
  isSimulating,
  onToggleSimulate,
  onResetDepth,
}) => {
  const { theme, isDark, toggleTheme } = useTheme();

  return (
    <header
      className={`border-b px-4 py-2 transition-colors ${
        isDark ? 'border-slate-800 bg-[#090e1c] text-slate-100' : 'border-slate-300 bg-white text-slate-900 shadow-xs'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Compact Status */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 font-mono text-sm font-bold tracking-tight">
            <span className={isDark ? 'text-white' : 'text-slate-900'}>eRTMAC-NWIS</span>
            <span className={isDark ? 'text-slate-600' : 'text-slate-300'}>|</span>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">PROTOTYPE</span>
          </div>

          <div
            className={`hidden items-center gap-2 text-xs font-mono sm:flex ${
              isDark ? 'text-slate-400' : 'text-slate-600 font-medium'
            }`}
          >
            <span>•</span>
            <span>{activeWell.wellId}</span>
            <span>•</span>
            <span className="font-bold text-amber-600 dark:text-amber-400">{activeWell.currentDepth} m</span>
          </div>
        </div>

        {/* Compact Depth Scrubber & Controls */}
        <div className="flex flex-1 max-w-md items-center gap-2.5 px-2">
          <span className={`text-[11px] font-mono shrink-0 font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Depth:
          </span>
          <input
            type="range"
            min={500}
            max={activeWell.targetDepth}
            step={5}
            value={activeWell.currentDepth}
            onChange={(e) => onDepthChange(Number(e.target.value))}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-300 dark:bg-slate-700 accent-cyan-600 dark:accent-cyan-400"
            title="Adjust drilling depth"
          />
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={onToggleSimulate}
              className={`flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-mono font-semibold transition-colors ${
                isSimulating
                  ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30'
                  : isDark
                  ? 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
                  : 'bg-slate-100 text-slate-800 border border-slate-300 hover:bg-slate-200'
              }`}
              title={isSimulating ? 'Pause drilling simulation' : 'Auto-advance depth'}
            >
              {isSimulating ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
              <span>{isSimulating ? 'Pause' : 'Auto'}</span>
            </button>
            <button
              onClick={onResetDepth}
              className={`rounded p-1 text-[11px] border transition-colors ${
                isDark
                  ? 'border-slate-800 bg-slate-800/60 text-slate-400 hover:text-slate-200'
                  : 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
              }`}
              title="Reset depth to 2,360m"
            >
              <RotateCcw className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Right side: Dark / Light Mode Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-mono font-semibold transition-all ${
              isDark
                ? 'border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
                : 'border border-slate-300 bg-slate-100 text-slate-800 hover:bg-slate-200 shadow-xs'
            }`}
            title="Toggle theme"
          >
            {isDark ? (
              <>
                <Sun className="h-3.5 w-3.5 text-amber-400" />
                <span>☀ Light</span>
              </>
            ) : (
              <>
                <Moon className="h-3.5 w-3.5 text-slate-800" />
                <span>🌙 Dark</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
