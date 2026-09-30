import React, { useState } from 'react';
import { ActiveDrillingState, OffsetWell, IncidentType, RiskLevel } from '../types/drilling';
import { FORMATION_LAYERS, OFFSET_WELLS } from '../data/wellsData';
import { useTheme } from '../context/ThemeContext';
import { TabId } from './Sidebar';
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Sparkles,
  X,
  AlertTriangle,
  MapPin,
  Activity,
  FileText,
  ShieldAlert,
} from 'lucide-react';

interface LoggedIncident {
  id: string;
  wellId: string;
  type: IncidentType;
  depth: number;
  formation: string;
  severity: RiskLevel;
  summary: string;
  timestamp: string;
}

interface CorrelationViewProps {
  activeWell: ActiveDrillingState;
  offsetWells: OffsetWell[];
  selectedWell: OffsetWell | null;
  onSelectOffsetWell?: (well: OffsetWell) => void;
  onSetDepth?: (depth: number) => void;
  onNavigateTab?: (tab: TabId) => void;
}

export const CorrelationView: React.FC<CorrelationViewProps> = ({
  activeWell,
  offsetWells,
  selectedWell,
  onSelectOffsetWell,
}) => {
  const { isDark } = useTheme();

  // Selected Reference Well ID (default: 'ACTIVE' for active rig)
  const [referenceWellId, setReferenceWellId] = useState<string>('ACTIVE');

  // Dedicated in-place detail view for a specific well (null = show related wells list)
  const [inspectingWellId, setInspectingWellId] = useState<string | null>(null);

  // User-logged incidents state
  const [loggedIncidents, setLoggedIncidents] = useState<Record<string, LoggedIncident[]>>({
    ACTIVE: [
      {
        id: 'inc-act-1',
        wellId: 'ACTIVE',
        type: 'Tight Hole / Stuck Pipe Risk',
        depth: 2360,
        formation: 'Panna Formation / Marine Shale',
        severity: 'High',
        summary: 'Elevated torque (18.2 kft-lb) and drag observed near Panna formation boundary.',
        timestamp: 'Active Shift',
      },
    ],
  });

  // Modal open state for "+ Log Incident"
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [incidentType, setIncidentType] = useState<IncidentType>('Stuck Pipe');
  const [incidentDepth, setIncidentDepth] = useState<number>(activeWell.currentDepth);
  const [incidentFormation, setIncidentFormation] = useState<string>('Panna Formation / Marine Shale');
  const [incidentSeverity, setIncidentSeverity] = useState<RiskLevel>('High');
  const [incidentSummary, setIncidentSummary] = useState<string>('');

  // Correlate calculation trigger
  const [isCorrelating, setIsCorrelating] = useState<boolean>(false);

  // Reference well resolution
  const isRefActive = referenceWellId === 'ACTIVE';
  const currentOffsetRef = !isRefActive ? offsetWells.find((w) => w.id === referenceWellId) : null;

  const refWellName = isRefActive
    ? activeWell.wellName
    : currentOffsetRef?.name || 'Selected Well';

  const refWellDepth = isRefActive
    ? activeWell.currentDepth
    : currentOffsetRef?.primaryIncident.depth || currentOffsetRef?.maxDepth || 2400;

  const refWellLocation = isRefActive
    ? `${activeWell.basin} • Offshore`
    : `${currentOffsetRef?.operator.split(' ')[0] || 'Western Asset'} • Cambay Basin`;

  const refWellStatus = isRefActive ? 'ACTIVE' : 'HISTORICAL';

  const refWellFormation = isRefActive
    ? 'Panna Formation'
    : currentOffsetRef?.targetFormation.split('/')[0].trim() || 'Panna Formation';

  // Compute related offset wells comparison with the reference well
  const relatedWells = offsetWells
    .filter((w) => (isRefActive ? true : w.id !== referenceWellId))
    .map((offset) => {
      let dist = offset.distanceKm;
      if (!isRefActive && currentOffsetRef) {
        const dx = (offset.longitude - currentOffsetRef.longitude) * 111.0;
        const dy = (offset.latitude - currentOffsetRef.latitude) * 111.0;
        dist = Math.round(Math.hypot(dx, dy) * 10) / 10;
        if (isNaN(dist) || dist <= 0) dist = Math.abs(offset.distanceKm - currentOffsetRef.distanceKm) + 0.8;
      }

      const depthDiff = offset.primaryIncident.depth - refWellDepth;
      const depthDiffStr = depthDiff >= 0 ? `+${depthDiff} m` : `${depthDiff} m`;

      const formationMatch =
        offset.targetFormation.toLowerCase().includes(refWellFormation.toLowerCase()) ||
        refWellFormation.toLowerCase().includes(offset.targetFormation.toLowerCase().split('/')[0].trim());

      const formationResult: 'MATCH' | 'DIFFERENT' = formationMatch ? 'MATCH' : 'DIFFERENT';
      const eventPresent = !!offset.primaryIncident.type;
      const eventName = offset.primaryIncident.type;

      return {
        well: offset,
        distanceKm: dist,
        depthDiffStr,
        depthDiff,
        formationResult,
        eventPresent,
        eventName,
        incidentDepth: offset.primaryIncident.depth,
      };
    });

  // Sort by distance from reference well
  relatedWells.sort((a, b) => a.distanceKm - b.distanceKm);

  // Active inspecting well for detail view
  const detailedItem = inspectingWellId ? relatedWells.find((item) => item.well.id === inspectingWellId) : null;
  const inspectedOffsetWell = detailedItem ? detailedItem.well : null;

  // Handle Log Incident form submission
  const handleSaveIncident = (e: React.FormEvent) => {
    e.preventDefault();
    const newInc: LoggedIncident = {
      id: `inc-${Date.now()}`,
      wellId: referenceWellId,
      type: incidentType,
      depth: Number(incidentDepth),
      formation: incidentFormation,
      severity: incidentSeverity,
      summary: incidentSummary.trim() || `${incidentType} recorded at ${incidentDepth}m.`,
      timestamp: 'Just now',
    };

    setLoggedIncidents((prev) => ({
      ...prev,
      [referenceWellId]: [newInc, ...(prev[referenceWellId] || [])],
    }));

    setIsModalOpen(false);
    setIncidentSummary('');
  };

  const handleCorrelateClick = () => {
    setIsCorrelating(true);
    setTimeout(() => {
      setIsCorrelating(false);
    }, 300);
  };

  const handleViewWell = (well: OffsetWell) => {
    setInspectingWellId(well.id);
    if (onSelectOffsetWell) {
      onSelectOffsetWell(well);
    }
  };

  return (
    <div className="max-w-5xl mx-auto select-none space-y-7 pb-16">
      {/* ─────────────────────────────────────────────────────────────
          VIEW A: DEDICATED WELL CORRELATION DETAIL VIEW (In-Place)
          Focused only on well-to-well correlation
          ───────────────────────────────────────────────────────────── */}
      {detailedItem && inspectedOffsetWell ? (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Back Action & In-Place Well Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <button
              onClick={() => setInspectingWellId(null)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
                isDark
                  ? 'bg-slate-800/80 hover:bg-slate-800 text-cyan-400 hover:text-cyan-300 border border-slate-700'
                  : 'bg-white hover:bg-slate-100 text-cyan-700 hover:text-cyan-800 border border-slate-200 shadow-sm'
              }`}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>&larr; Back to Correlation</span>
            </button>

            {/* In-Place Nearby Well Switcher */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-[11px] font-mono font-bold text-slate-800 dark:text-slate-400 uppercase">
                OFFSET WELL:
              </span>
              <select
                value={detailedItem.well.id}
                onChange={(e) => setInspectingWellId(e.target.value)}
                className={`rounded-xl border px-3 py-1.5 text-xs font-mono font-bold outline-none cursor-pointer ${
                  isDark
                    ? 'bg-slate-900 border-slate-700 text-amber-400 focus:border-cyan-400'
                    : 'bg-white border-slate-300 text-slate-900 focus:border-cyan-600 shadow-xs'
                }`}
              >
                {relatedWells.map((item) => (
                  <option key={item.well.id} value={item.well.id}>
                    {item.well.name} ({item.distanceKm} km away)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Header of Detail View */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b pb-4 border-slate-200 dark:border-slate-800">
            <div>
              <div className="text-[11px] font-mono text-cyan-900 dark:text-cyan-400 font-bold uppercase tracking-wider">
                OFFSET CORRELATION DETAIL &bull; {detailedItem.well.id}
              </div>
              <h1 className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">
                {detailedItem.well.name}
              </h1>
              <p className="text-xs text-slate-700 dark:text-slate-400 mt-0.5 font-medium">
                {detailedItem.well.operator} &bull; Spud Year: {detailedItem.well.spudYear} &bull; Basin: Cambay Offshore Sector
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${
                  detailedItem.formationResult === 'MATCH'
                    ? isDark
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-emerald-50 text-emerald-900 border-emerald-300'
                    : isDark
                    ? 'bg-slate-500/10 text-slate-400 border-slate-500/30'
                    : 'bg-slate-100 text-slate-800 border-slate-300'
                }`}
              >
                FORMATION: {detailedItem.formationResult}
              </span>
            </div>
          </div>

          {/* Essential Comparison Grid */}
          <div
            className={`rounded-2xl border p-6 transition-all ${
              isDark ? 'bg-[#0b1224] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 dark:text-slate-400 mb-4">
              COMPARISON WITH REFERENCE WELL ({refWellName})
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
              <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-900/60 border-slate-800/80' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-[10px] text-slate-800 dark:text-slate-400 uppercase block font-bold">DISTANCE</span>
                <span className="text-sm font-bold text-amber-700 dark:text-amber-500 mt-1 block">
                  {detailedItem.distanceKm} km
                </span>
                <span className="text-[10px] text-slate-700 dark:text-slate-400 mt-0.5 block font-medium">
                  Bearing: {detailedItem.well.azimuthDeg}&deg;
                </span>
              </div>

              <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-900/60 border-slate-800/80' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-[10px] text-slate-800 dark:text-slate-400 uppercase block font-bold">DEPTH VARIANCE</span>
                <span className="text-sm font-bold text-slate-950 dark:text-white mt-1 block">
                  {detailedItem.depthDiffStr}
                </span>
                <span className="text-[10px] text-slate-700 dark:text-slate-400 mt-0.5 block font-medium">
                  {detailedItem.incidentDepth}m vs {refWellDepth}m
                </span>
              </div>

              <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-900/60 border-slate-800/80' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-[10px] text-slate-800 dark:text-slate-400 uppercase block font-bold">FORMATION</span>
                <span className="text-sm font-bold text-cyan-950 dark:text-cyan-400 mt-1 block truncate">
                  {detailedItem.well.targetFormation.split('/')[0]}
                </span>
                <span className="text-[10px] text-slate-700 dark:text-slate-400 mt-0.5 block font-semibold">
                  Lithology: {detailedItem.formationResult}
                </span>
              </div>

              <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-900/60 border-slate-800/80' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-[10px] text-slate-800 dark:text-slate-400 uppercase block font-bold">HISTORICAL EVENT</span>
                <span className="text-sm font-bold text-red-700 dark:text-red-400 mt-1 block">
                  {detailedItem.eventPresent ? 'PRESENT' : 'NONE'}
                </span>
                <span className="text-[10px] text-slate-800 dark:text-slate-400 mt-0.5 block truncate font-semibold">
                  {detailedItem.eventName}
                </span>
              </div>
            </div>

            {/* Geological Correlation Relationship Narrative */}
            <div className="mt-5 pt-5 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-950 dark:text-slate-400 block">
                CORRELATION RELATIONSHIP &amp; STRATIGRAPHIC INSIGHT
              </span>
              <p className="text-xs text-slate-950 dark:text-slate-200 leading-relaxed font-sans">
                {detailedItem.well.primaryIncident.summary}
              </p>
            </div>
          </div>

          {/* Historical Incident & Report Citation */}
          <div
            className={`rounded-2xl border p-6 transition-all ${
              isDark ? 'bg-[#0b1224] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-950 dark:text-slate-400 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
                <span>PRIMARY INCIDENT RECORD</span>
              </h3>
              <span
                className={`text-xs font-mono font-bold px-2.5 py-1 rounded border ${
                  isDark
                    ? 'text-red-400 bg-red-950/30 border-red-500/30'
                    : 'text-red-900 bg-red-50 border-red-300'
                }`}
              >
                {detailedItem.well.primaryIncident.severity} Severity &bull; {detailedItem.well.primaryIncident.nptHours}h NPT
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <span className="font-bold text-slate-950 dark:text-slate-400 block text-[10px] uppercase font-mono">ROOT CAUSE</span>
                <p className="text-slate-950 dark:text-slate-200 mt-1 font-sans leading-relaxed">
                  {detailedItem.well.primaryIncident.rootCause}
                </p>
              </div>

              <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <span className="font-bold text-slate-950 dark:text-slate-400 block text-[10px] uppercase font-mono">PREVENTATIVE RECOMMENDATIONS</span>
                <p className="text-slate-950 dark:text-slate-200 mt-1 font-sans leading-relaxed">
                  {detailedItem.well.primaryIncident.preventativeMeasures}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 text-[11px] font-mono text-slate-800 dark:text-slate-400 font-medium">
                <span className="flex items-center gap-1.5 font-bold text-cyan-950 dark:text-cyan-400">
                  <FileText className="h-3.5 w-3.5 text-cyan-800 dark:text-cyan-400" />
                  Source: {detailedItem.well.primaryIncident.reportName}
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-300">Incident Depth: {detailedItem.incidentDepth}m MD</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ─────────────────────────────────────────────────────────────
            VIEW B: MAIN CORRELATION LIST VIEW
            Focused on Reference Well + Related Wells
            ───────────────────────────────────────────────────────────── */
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Page Title & Short Description */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4 border-slate-200 dark:border-slate-800">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                CORRELATION
              </h1>
              <p className="text-xs text-slate-700 dark:text-slate-400 mt-1 font-medium">
                Subsurface stratigraphy matching and offset well correlation.
              </p>
            </div>

            {/* Status Badge */}
            <div className="self-start sm:self-auto">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-bold border ${
                isDark
                  ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                  : 'bg-amber-50 text-amber-900 border-amber-300'
              }`}>
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                READY FOR ML CORRELATION
              </span>
            </div>
          </div>

          {/* Reference Well Selection Bar & Essential Info */}
          <div
            className={`rounded-2xl border p-5 md:p-6 transition-all ${
              isDark ? 'bg-[#0b1224] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            {/* Top Selector & Action Buttons */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800/80">
              <div className="flex-1 max-w-md">
                <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-900 dark:text-slate-400 block mb-1.5">
                  REFERENCE WELL
                </label>
                <select
                  value={referenceWellId}
                  onChange={(e) => setReferenceWellId(e.target.value)}
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-xs font-mono font-bold outline-none cursor-pointer transition-all ${
                    isDark
                      ? 'bg-slate-900 border-slate-700 text-white focus:border-cyan-400'
                      : 'bg-white border-slate-300 text-slate-900 focus:border-cyan-600'
                  }`}
                >
                  <option value="ACTIVE">
                    [ACTIVE] {activeWell.wellName} — {activeWell.currentDepth}m MD
                  </option>
                  {offsetWells.map((w) => (
                    <option key={w.id} value={w.id}>
                      [OFFSET] {w.name} ({w.distanceKm} km) — {w.primaryIncident.type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Compact Actions: + Log Incident & CORRELATE */}
              <div className="flex items-center gap-3 self-start md:self-end">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold border transition-all ${
                    isDark
                      ? 'bg-slate-800/80 hover:bg-slate-800 text-slate-200 border-slate-700 hover:border-cyan-500/50'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-900 border-slate-300 hover:border-cyan-600'
                  }`}
                >
                  <Plus className="h-3.5 w-3.5 text-cyan-700 dark:text-cyan-400" />
                  <span>+ Log Incident</span>
                </button>

                <button
                  onClick={handleCorrelateClick}
                  disabled={isCorrelating}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-mono font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-[0_4px_16px_rgba(251,191,36,0.2)] transition-all hover:-translate-y-0.5"
                >
                  {isCorrelating ? (
                    <>
                      <span className="h-3 w-3 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>CORRELATING...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>CORRELATE</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Essential Reference Well Details */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 text-xs font-mono">
              <div>
                <span className="text-[10px] text-slate-800 dark:text-slate-400 uppercase font-bold block">WELL NAME</span>
                <span className="font-bold text-slate-950 dark:text-white mt-1 block truncate">
                  {refWellName}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-800 dark:text-slate-400 uppercase font-bold block">DEPTH</span>
                <span className="font-bold text-amber-750 dark:text-amber-500 mt-1 block text-amber-800">
                  {refWellDepth} m MD
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-800 dark:text-slate-400 uppercase font-bold block">LOCATION</span>
                <span className="font-bold text-slate-950 dark:text-slate-200 mt-1 block truncate">
                  {refWellLocation}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-800 dark:text-slate-400 uppercase font-bold block">STATUS</span>
                <span className="inline-flex items-center gap-1.5 font-bold text-cyan-950 dark:text-cyan-400 mt-1">
                  <Activity className="h-3 w-3 text-cyan-800 dark:text-cyan-400" />
                  <span>{refWellStatus}</span>
                </span>
              </div>
            </div>

            {/* Logged Incidents Indicator on Reference Well */}
            {loggedIncidents[referenceWellId]?.length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-950 dark:text-slate-400 text-[11px] font-semibold">
                  Logged Incident:{' '}
                  <b className="text-amber-800 dark:text-amber-400 font-bold">{loggedIncidents[referenceWellId][0].type}</b> @{' '}
                  {loggedIncidents[referenceWellId][0].depth}m MD
                </span>
                <span className="text-[10px] text-slate-800 dark:text-slate-400 font-bold">
                  {loggedIncidents[referenceWellId].length} incident(s) on file
                </span>
              </div>
            )}
          </div>

          {/* Related Wells Section Header */}
          <div className="flex items-center justify-between pt-2">
            <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-950 dark:text-slate-400">
              RELATED WELLS ({relatedWells.length})
            </h2>
            <span className="text-[11px] font-mono text-slate-800 dark:text-slate-400 font-semibold">
              Cross-well proximity comparison
            </span>
          </div>

          {/* Vertically Arranged Clean Comparison Rows/Cards */}
          <div className="space-y-3">
            {relatedWells.map((item) => {
              const { well, distanceKm, depthDiffStr, formationResult, eventPresent, eventName } = item;

              return (
                <div
                  key={well.id}
                  className={`rounded-xl border p-4 sm:p-5 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isDark
                      ? 'bg-[#0b1224] border-slate-800 hover:border-slate-700'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                  }`}
                >
                  <div className="min-w-[200px]">
                    <div className="text-[10px] font-mono text-cyan-950 dark:text-cyan-400 font-bold">
                      {well.id}
                    </div>
                    <div className="text-sm font-bold text-slate-950 dark:text-white mt-0.5">
                      {well.name}
                    </div>
                    <div className="text-xs text-slate-800 dark:text-slate-400 font-mono mt-1 flex items-center gap-1.5 font-semibold">
                      <MapPin className="h-3 w-3 text-amber-700 dark:text-amber-500" />
                      <span>{distanceKm} km away</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-6 sm:gap-10 text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-slate-800 dark:text-slate-400 block font-bold">DEPTH DIFF</span>
                      <span className="font-bold text-slate-950 dark:text-slate-200 mt-0.5 block">
                        {depthDiffStr}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-800 dark:text-slate-400 block font-bold">FORMATION</span>
                      <span
                        className={`inline-block font-bold text-[10px] px-2 py-0.5 rounded mt-0.5 border ${
                          formationResult === 'MATCH'
                            ? isDark
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-emerald-50 text-emerald-950 border-emerald-300'
                            : isDark
                            ? 'bg-slate-500/10 text-slate-400 border-slate-500/30'
                            : 'bg-slate-100 text-slate-900 border-slate-300'
                        }`}
                      >
                        {formationResult}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-800 dark:text-slate-400 block font-bold">EVENT</span>
                      <span
                        className={`inline-block font-bold text-[10px] px-2 py-0.5 rounded mt-0.5 border ${
                          eventPresent
                            ? isDark
                              ? 'bg-red-950/30 text-red-400 border-red-500/30'
                              : 'bg-red-50 text-red-950 border-red-300'
                            : isDark
                            ? 'bg-slate-800 text-slate-400 border-slate-700'
                            : 'bg-slate-100 text-slate-900 border-slate-300'
                        }`}
                      >
                        {eventPresent ? `PRESENT • ${eventName}` : 'NONE'}
                      </span>
                    </div>
                  </div>

                  {/* Right Action: VIEW WELL → (Opens in-place detail view, DOES NOT open GIS) */}
                  <div className="shrink-0 self-end md:self-center">
                    <button
                      onClick={() => handleViewWell(well)}
                      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all group border ${
                        isDark
                          ? 'bg-cyan-600/10 hover:bg-cyan-600 text-cyan-400 hover:text-white border-cyan-500/30'
                          : 'bg-cyan-50 hover:bg-cyan-600 text-cyan-950 hover:text-white border-cyan-300'
                      }`}
                    >
                      <span>VIEW WELL</span>
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          LOG INCIDENT MODAL (Clean, Compact, Minimal)
          ───────────────────────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl relative ${
              isDark ? 'bg-[#0f172a] border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-700">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-400 block">
                  INCIDENT RECORDER
                </span>
                <h3 className="text-base font-bold mt-0.5 text-slate-900 dark:text-white">
                  Log Incident &bull; {refWellName}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveIncident} className="space-y-4 mt-4 text-xs font-mono">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-400">
                  Incident Type *
                </label>
                <select
                  value={incidentType}
                  onChange={(e) => setIncidentType(e.target.value as IncidentType)}
                  className={`w-full rounded-xl border px-3 py-2 outline-none font-sans font-semibold ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900 focus:border-cyan-600'
                  }`}
                >
                  <option value="Stuck Pipe">Stuck Pipe</option>
                  <option value="Mud Loss">Mud Loss</option>
                  <option value="Gas Influx / Kick">Gas Influx / Kick</option>
                  <option value="Tight Hole / Stuck Pipe Risk">Tight Hole / Stuck Pipe Risk</option>
                  <option value="Equipment Failure / Bit Wear">Equipment Failure / Bit Wear</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-400">
                    Depth (m MD) *
                  </label>
                  <input
                    type="number"
                    value={incidentDepth}
                    onChange={(e) => setIncidentDepth(Number(e.target.value))}
                    className={`w-full rounded-xl border px-3 py-2 outline-none font-mono ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900 focus:border-cyan-600'
                    }`}
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-400">
                    Severity *
                  </label>
                  <select
                    value={incidentSeverity}
                    onChange={(e) => setIncidentSeverity(e.target.value as RiskLevel)}
                    className={`w-full rounded-xl border px-3 py-2 outline-none font-sans font-semibold ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900 focus:border-cyan-600'
                    }`}
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-400">
                  Formation
                </label>
                <select
                  value={incidentFormation}
                  onChange={(e) => setIncidentFormation(e.target.value)}
                  className={`w-full rounded-xl border px-3 py-2 outline-none font-sans ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900 focus:border-cyan-600'
                  }`}
                >
                  {FORMATION_LAYERS.map((f) => (
                    <option key={f.name} value={f.name}>
                      {f.name} ({f.topDepth}&ndash;{f.bottomDepth}m)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-400">
                  Operational Details
                </label>
                <textarea
                  rows={2}
                  value={incidentSummary}
                  onChange={(e) => setIncidentSummary(e.target.value)}
                  placeholder="e.g. Overpull 120 klbs during reaming across sand stringer..."
                  className={`w-full rounded-xl border p-2.5 outline-none font-sans text-xs ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900 focus:border-cyan-600'
                  }`}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold font-mono bg-cyan-600 hover:bg-cyan-500 text-white shadow-md transition-all"
                >
                  SAVE INCIDENT
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
