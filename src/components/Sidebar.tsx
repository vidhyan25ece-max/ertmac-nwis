import React from 'react';
import {
  LayoutDashboard,
  Compass,
  FileSearch,
  Cpu,
  AlertOctagon,
  GitCompare,
  TrendingUp,
} from 'lucide-react';
import { LookAheadAlert } from '../utils/riskModel';
import { useTheme } from '../context/ThemeContext';

export type TabId = 'dashboard' | 'gis' | 'intelligence' | 'prediction' | 'alerts' | 'correlation' | 'analysis';

interface SidebarProps {
  currentTab: TabId;
  onSelectTab: (tab: TabId) => void;
  alerts: LookAheadAlert[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  alerts,
}) => {
  const { isDark } = useTheme();
  const alertCount = alerts.filter((a) => a.severity === 'Critical' || a.severity === 'High').length;

  const navItems = [
    { id: 'dashboard' as TabId, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'gis' as TabId, label: 'Nearby Wells', icon: Compass },
    { id: 'intelligence' as TabId, label: 'Historical Intelligence', icon: FileSearch },
    { id: 'prediction' as TabId, label: 'Risk Prediction', icon: Cpu },
    {
      id: 'alerts' as TabId,
      label: 'Alerts',
      icon: AlertOctagon,
      badge: alertCount > 0 ? alertCount : undefined,
    },
  ];

  const investigationItems = [
    { id: 'correlation' as TabId, label: 'Correlation', icon: GitCompare },
    { id: 'analysis' as TabId, label: 'Analysis', icon: TrendingUp },
  ];

  return (
    <aside
      className={`w-56 shrink-0 border-r p-3 flex flex-col justify-between transition-colors ${
        isDark ? 'border-slate-800 bg-[#090e1c] text-slate-200' : 'border-slate-200 bg-white text-slate-800'
      }`}
    >
      <div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-xs font-medium transition-all ${
                  isActive
                    ? isDark
                      ? 'bg-cyan-950/40 text-cyan-300 border border-cyan-800/40'
                      : 'bg-cyan-50 text-cyan-800 border border-cyan-300 font-semibold'
                    : isDark
                    ? 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`h-4 w-4 ${
                      isActive
                        ? isDark
                          ? 'text-cyan-400'
                          : 'text-cyan-700'
                        : isDark
                        ? 'text-slate-500'
                        : 'text-slate-500'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-red-500 font-mono text-[10px] font-bold text-white">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Investigation Section */}
          <div className="pt-3 pb-1 px-3">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400">
              INVESTIGATION
            </span>
          </div>

          {investigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-xs font-medium transition-all ${
                  isActive
                    ? isDark
                      ? 'bg-cyan-950/40 text-cyan-300 border border-cyan-800/40'
                      : 'bg-cyan-50 text-cyan-800 border border-cyan-300 font-semibold'
                    : isDark
                    ? 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`h-4 w-4 ${
                      isActive
                        ? isDark
                          ? 'text-cyan-400'
                          : 'text-cyan-700'
                        : isDark
                        ? 'text-slate-500'
                        : 'text-slate-500'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      <div className={`border-t pt-3 text-[11px] leading-tight ${isDark ? 'border-slate-800/80 text-slate-400' : 'border-slate-200 text-slate-600 font-medium'}`}>
        <div>SIH26121 Prototype</div>
        <div className="text-[10px] mt-0.5 opacity-90">Synthetic demo data</div>
      </div>
    </aside>
  );
};
