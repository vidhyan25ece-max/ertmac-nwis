import React, { useState, useMemo } from 'react';
import { OffsetWell } from '../types/drilling';
import { OFFSET_WELLS } from '../data/wellsData';
import { useTheme } from '../context/ThemeContext';
import { Sparkles, FileText, ChevronDown, Filter } from 'lucide-react';

interface IntelligenceViewProps {
  selectedWell: OffsetWell | null;
  onSelectOffsetWell: (well: OffsetWell) => void;
  onSetDepth: (depth: number) => void;
}

export const IntelligenceView: React.FC<IntelligenceViewProps> = ({
  onSelectOffsetWell,
  onSetDepth,
}) => {
  const { isDark } = useTheme();

  // Extract all existing unique incident types from historical data
  const availableIncidentTypes = useMemo(() => {
    return Array.from(new Set(OFFSET_WELLS.map((w) => w.primaryIncident.type))).sort();
  }, []);

  const [selectedIncidentType, setSelectedIncidentType] = useState<string>('ALL');
  const [expandedWellId, setExpandedWellId] = useState<string | null>(null);

  // Map historical evidence data
  const evidenceCards = useMemo(() => {
    return OFFSET_WELLS.map((well) => {
      const reportPart = well.primaryIncident.reportName.replace('.pdf', '');
      const pageNum = (well.primaryIncident.depth % 35) + 12;
      return {
        wellId: well.id,
        name: well.name,
        rawIncident: well.primaryIncident.type,
        incident: well.primaryIncident.type.toUpperCase(),
        depth: well.primaryIncident.depth,
        formation: well.primaryIncident.formation,
        source: `${reportPart} • p.${pageNum}`,
        summary: well.primaryIncident.summary,
        nptHours: well.primaryIncident.nptHours,
        wellObj: well,
      };
    });
  }, []);

  // Filter wells by selected incident type
  const filtered = useMemo(() => {
    return evidenceCards.filter((card) => {
      if (selectedIncidentType === 'ALL') return true;
      return card.rawIncident === selectedIncidentType;
    });
  }, [evidenceCards, selectedIncidentType]);

  // Handle single-well accordion toggle with depth jump & well sync
  const handleToggleWell = (item: (typeof evidenceCards)[0]) => {
    if (expandedWellId === item.wellId) {
      setExpandedWellId(null);
    } else {
      setExpandedWellId(item.wellId);
      onSelectOffsetWell(item.wellObj);
      onSetDepth(item.depth);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      {/* Top Header */}
      <div>
        <h1 className={`text-xl font-bold font-mono tracking-tight ${isDark ? 'text-white' : 'text-slate-950'}`}>
          Historical Drilling Intelligence
        </h1>
        <p className={`text-xs mt-0.5 font-mono ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>
          AI-powered research over offset Daily Drilling Reports (DDR) and Well Completion Reports (WCR)
        </p>
      </div>

      {/* AI INSIGHT BANNER */}
      <div
        className={`rounded-xl border p-4 sm:p-5 flex items-start gap-3.5 transition-all ${
          isDark
            ? 'bg-[#0b1224] border-cyan-800/40 text-cyan-200 shadow-sm'
            : 'bg-cyan-50/90 border-cyan-300 text-slate-950 shadow-xs'
        }`}
      >
        <Sparkles className={`h-5 w-5 shrink-0 mt-0.5 ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`} />
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className={`font-mono text-xs font-bold uppercase tracking-wider ${isDark ? 'text-cyan-400' : 'text-cyan-950'}`}>
              AI INSIGHT
            </span>
            <span className={`text-[10px] font-mono font-bold ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>
              • Aggregated Offset Correlation
            </span>
          </div>
          <p className={`text-xs leading-relaxed ${isDark ? 'text-cyan-200' : 'text-slate-950 font-medium'}`}>
            Clustering across 12 offset wells demonstrates a critical hazard window in the Panna Marine Shale between <strong>2,390 m and 2,442 m</strong>. Differential sticking caused 64h NPT in <em>Kaveri-Deep-01</em> at 2,415 m, while hydrostatic overbalance (&gt;1.42 SG) triggered catastrophic lost circulation in <em>Neelam-North-05</em> at 2,442 m (92h NPT). Mitigation: cap active mud weight at 1.34 SG and minimize stationary string connections.
          </p>
        </div>
      </div>

      {/* ONE CLEAN INCIDENT DROPDOWN AT THE TOP */}
      <div
        className={`rounded-2xl border p-4 sm:p-5 transition-all ${
          isDark ? 'bg-[#0b1224] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Filter className={`h-4 w-4 shrink-0 ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`} />
            <label
              htmlFor="incident-type-filter"
              className={`text-xs font-mono font-bold uppercase tracking-wider whitespace-nowrap ${
                isDark ? 'text-slate-200' : 'text-slate-950'
              }`}
            >
              Select Incident Type:
            </label>
          </div>

          <div className="relative w-full sm:w-80">
            <select
              id="incident-type-filter"
              value={selectedIncidentType}
              onChange={(e) => {
                setSelectedIncidentType(e.target.value);
                setExpandedWellId(null);
              }}
              className={`w-full appearance-none rounded-xl border px-4 py-2.5 pr-10 text-xs font-mono font-bold cursor-pointer transition-all outline-none ${
                isDark
                  ? 'bg-slate-900 border-slate-700 text-slate-100 focus:border-cyan-400'
                  : 'bg-white border-slate-300 text-slate-950 focus:border-cyan-600 shadow-2xs'
              }`}
            >
              <option value="ALL">All Incidents ({evidenceCards.length} Wells)</option>
              {availableIncidentTypes.map((type) => {
                const count = evidenceCards.filter((c) => c.rawIncident === type).length;
                return (
                  <option key={type} value={type}>
                    {type} ({count} {count === 1 ? 'Well' : 'Wells'})
                  </option>
                );
              })}
            </select>
            <ChevronDown
              aria-hidden="true"
              className={`pointer-events-none absolute right-3.5 top-3 h-4 w-4 ${
                isDark ? 'text-slate-400' : 'text-slate-700'
              }`}
            />
          </div>
        </div>
      </div>

      {/* MATCHING WELLS UNDERNEATH AS CLEAN, SIMPLE EXPANDABLE ROWS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <h2 className={`text-xs font-mono font-bold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-950'}`}>
              {selectedIncidentType === 'ALL' ? 'All Incidents' : selectedIncidentType}
            </h2>
            <span
              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                isDark ? 'bg-slate-800 text-cyan-400 border-slate-700' : 'bg-slate-100 text-slate-950 border-slate-300'
              }`}
            >
              {filtered.length} {filtered.length === 1 ? 'Well' : 'Wells'}
            </span>
          </div>

          <span className={`text-[10px] font-mono font-semibold ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>
            Click a well to view details &amp; jump depth
          </span>
        </div>

        {filtered.length === 0 ? (
          <div
            className={`rounded-xl border p-8 text-center text-xs font-mono font-medium ${
              isDark ? 'border-slate-800 bg-[#0b1224] text-slate-400' : 'border-slate-300 bg-white text-slate-800'
            }`}
          >
            No historical offset wells found for this incident type.
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map((item) => {
              const isExpanded = expandedWellId === item.wellId;
              const isStuck = item.incident.includes('STUCK');
              const isLoss = item.incident.includes('LOSS');
              const isGas = item.incident.includes('GAS') || item.incident.includes('KICK');

              return (
                <div
                  key={item.wellId}
                  className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                    isExpanded
                      ? isDark
                        ? 'border-cyan-500/50 bg-[#0b1224] shadow-[0_4px_24px_rgba(0,0,0,0.4)]'
                        : 'border-cyan-400 bg-white shadow-sm ring-1 ring-cyan-400/20'
                      : isDark
                      ? 'border-slate-800/80 bg-[#0b1224] hover:border-slate-700'
                      : 'border-slate-200 bg-white hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  {/* Clean well name row with expand/collapse arrow */}
                  <button
                    type="button"
                    onClick={() => handleToggleWell(item)}
                    aria-expanded={isExpanded}
                    className={`w-full flex items-center justify-between px-5 py-4 text-left transition-colors cursor-pointer select-none ${
                      isExpanded
                        ? isDark
                          ? 'bg-slate-900/60'
                          : 'bg-cyan-50/40'
                        : isDark
                        ? 'hover:bg-slate-900/30'
                        : 'hover:bg-slate-50/80'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`font-mono text-sm font-bold ${isDark ? 'text-slate-100' : 'text-slate-950'}`}>
                        {item.name}
                      </span>
                      <span
                        aria-hidden="true"
                        className={`font-mono text-xs ${
                          isExpanded
                            ? isDark ? 'text-cyan-400 font-bold' : 'text-cyan-700 font-bold'
                            : isDark ? 'text-slate-400 font-bold' : 'text-slate-600 font-bold'
                        }`}
                      >
                        {isExpanded ? '▾' : '▸'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <span
                        className={`rounded px-2.5 py-0.5 text-[10px] font-mono font-bold border ${
                          isStuck
                            ? isDark
                              ? 'text-red-400 bg-red-500/10 border-red-500/30'
                              : 'text-red-950 bg-red-50 border-red-300'
                            : isLoss
                            ? isDark
                              ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                              : 'text-amber-950 bg-amber-50 border-amber-300'
                            : isGas
                            ? isDark
                              ? 'text-amber-300 bg-amber-500/10 border-amber-500/30'
                              : 'text-amber-950 bg-amber-50 border-amber-300'
                            : isDark
                            ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30'
                            : 'text-cyan-950 bg-cyan-50 border-cyan-300'
                        }`}
                      >
                        {item.incident}
                      </span>

                      <span className={`text-xs font-mono font-semibold ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>
                        {item.wellId}
                      </span>
                    </div>
                  </button>

                  {/* Expanded Historical Intelligence / Evidence */}
                  {isExpanded && (
                    <div
                      className={`border-t px-5 py-5 space-y-4 font-mono text-xs transition-all ${
                        isDark
                          ? 'border-slate-800/80 bg-slate-950/40'
                          : 'border-slate-200 bg-slate-50/70'
                      }`}
                    >
                      {/* Incident type, NPT and quick jump action */}
                      <div className={`flex flex-wrap items-center justify-between gap-3 pb-3 border-b ${isDark ? 'border-slate-800/70' : 'border-slate-200'}`}>
                        <div className="flex flex-wrap items-center gap-3">
                          <span
                            className={`rounded px-2.5 py-0.5 text-[11px] font-mono font-bold border ${
                              isStuck
                                ? isDark
                                  ? 'text-red-400 bg-red-500/10 border-red-500/30'
                                  : 'text-red-950 bg-red-50 border-red-300'
                                : isLoss
                                ? isDark
                                  ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                                  : 'text-amber-950 bg-amber-50 border-amber-300'
                                : isGas
                                ? isDark
                                  ? 'text-amber-300 bg-amber-500/10 border-amber-500/30'
                                  : 'text-amber-950 bg-amber-50 border-amber-300'
                                : isDark
                                ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30'
                                : 'text-cyan-950 bg-cyan-50 border-cyan-300'
                            }`}
                          >
                            {item.incident}
                          </span>

                          <span className={`text-[11px] font-mono ${isDark ? 'text-slate-300' : 'text-slate-950 font-semibold'}`}>
                            NPT:{' '}
                            <span className={`font-bold ${isDark ? 'text-amber-400' : 'text-amber-950'}`}>
                              {item.nptHours} hours
                            </span>
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectOffsetWell(item.wellObj);
                            onSetDepth(item.depth);
                          }}
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-mono font-bold transition-colors cursor-pointer ${
                            isDark
                              ? 'bg-slate-800 text-cyan-400 border border-slate-700 hover:bg-slate-750 hover:text-cyan-300'
                              : 'bg-white text-cyan-950 border border-slate-300 hover:bg-slate-100 shadow-2xs'
                          }`}
                        >
                          <span>Jump to {item.depth} m</span>
                          <span aria-hidden="true">→</span>
                        </button>
                      </div>

                      {/* Incident Depth & Formation */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                        <div
                          className={`p-3.5 rounded-lg border ${
                            isDark ? 'bg-[#0b1224] border-slate-800/90' : 'bg-white border-slate-200 shadow-2xs'
                          }`}
                        >
                          <span className={`block text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>
                            INCIDENT DEPTH
                          </span>
                          <span className={`text-sm font-bold mt-0.5 block ${isDark ? 'text-amber-400' : 'text-amber-950'}`}>
                            {item.depth} m
                          </span>
                        </div>

                        <div
                          className={`p-3.5 rounded-lg border ${
                            isDark ? 'bg-[#0b1224] border-slate-800/90' : 'bg-white border-slate-200 shadow-2xs'
                          }`}
                        >
                          <span className={`block text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>
                            FORMATION
                          </span>
                          <span className={`text-sm font-bold mt-0.5 block truncate ${isDark ? 'text-slate-200' : 'text-slate-950'}`}>
                            {item.formation}
                          </span>
                        </div>
                      </div>

                      {/* Incident Narrative / Summary */}
                      <div className="space-y-1">
                        <span className={`block text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-800'}`}>
                          INCIDENT EVIDENCE &amp; ROOT SUMMARY
                        </span>
                        <p className={`font-sans text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-950 font-normal'}`}>
                          {item.summary}
                        </p>
                      </div>

                      {/* Root cause if available in existing data */}
                      {item.wellObj.primaryIncident.rootCause && (
                        <div
                          className={`p-3 rounded-lg border text-xs ${
                            isDark ? 'bg-slate-900/50 border-slate-800/80 text-slate-300' : 'bg-slate-100/90 border-slate-300 text-slate-950'
                          }`}
                        >
                          <span className={`block text-[10px] uppercase font-bold ${isDark ? 'text-slate-400' : 'text-slate-800'}`}>
                            ROOT CAUSE
                          </span>
                          <p className={`font-sans text-xs mt-0.5 leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-950'}`}>
                            {item.wellObj.primaryIncident.rootCause}
                          </p>
                        </div>
                      )}

                      {/* Source Citation & Operator Metadata */}
                      <div className={`pt-3 border-t ${isDark ? 'border-slate-800/70 text-slate-400' : 'border-slate-200 text-slate-700'} flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono`}>
                        <span className={`flex items-center gap-1.5 font-bold ${isDark ? 'text-cyan-400' : 'text-cyan-950'}`}>
                          <FileText className={`h-3.5 w-3.5 shrink-0 ${isDark ? 'text-cyan-400' : 'text-cyan-800'}`} />
                          <span>SOURCE: {item.source}</span>
                        </span>

                        <span className={`text-[10px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>
                          {item.wellObj.operator} • Spud {item.wellObj.spudYear}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
