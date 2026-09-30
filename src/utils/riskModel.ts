import { ActiveDrillingState, OffsetWell, RiskPredictionResult, RiskLevel, IncidentType } from '../types/drilling';
import { FORMATION_LAYERS, OFFSET_WELLS } from '../data/wellsData';

export interface LookAheadAlert {
  id: string;
  severity: RiskLevel;
  title: string;
  message: string;
  offsetWell: OffsetWell;
  depthDelta: number; // currentDepth - incidentDepth (negative means approaching)
  incidentType: IncidentType;
  recommendedAction: string;
  isApproaching: boolean; // within 100m above or 20m below
}

/**
 * Identify look-ahead proximity alerts based on active bit depth vs offset incidents
 */
export function getLookAheadAlerts(activeWell: ActiveDrillingState): LookAheadAlert[] {
  const alerts: LookAheadAlert[] = [];

  OFFSET_WELLS.forEach((well) => {
    const incDepth = well.primaryIncident.depth;
    const depthDelta = activeWell.currentDepth - incDepth;
    // Approaching if between -120m (above) and +30m (passed)
    const isApproaching = depthDelta >= -120 && depthDelta <= 30;

    if (isApproaching) {
      let severity: RiskLevel = 'Moderate';
      const absDelta = Math.abs(depthDelta);

      if (absDelta <= 40 && well.distanceKm <= 5.0) {
        severity = 'Critical';
      } else if (absDelta <= 80 || well.distanceKm <= 8.0) {
        severity = 'High';
      }

      alerts.push({
        id: `alert-${well.id}-${incDepth}`,
        severity,
        title: `Proximity Warning: ${well.primaryIncident.type.toUpperCase()}`,
        message: `Bit at ${activeWell.currentDepth}m is ${Math.abs(depthDelta)}m ${depthDelta < 0 ? 'above' : 'past'} historical incident at ${incDepth}m in offset well ${well.name} (${well.distanceKm} km away). Historical NPT: ${well.primaryIncident.nptHours} hrs.`,
        offsetWell: well,
        depthDelta,
        incidentType: well.primaryIncident.type,
        recommendedAction: well.primaryIncident.preventativeMeasures,
        isApproaching: true,
      });
    }
  });

  // Sort by severity (Critical first) then by closest distance
  const severityOrder: Record<RiskLevel, number> = { Critical: 0, High: 1, Moderate: 2, Low: 3 };
  return alerts.sort((a, b) => {
    const diff = severityOrder[a.severity] - severityOrder[b.severity];
    if (diff !== 0) return diff;
    return Math.abs(a.depthDelta) - Math.abs(b.depthDelta);
  });
}

/**
 * Predict hazards using an ensemble ML simulation model
 */
export function predictDrillingHazards(activeWell: ActiveDrillingState): RiskPredictionResult {
  const depth = activeWell.currentDepth;
  const currentLayer = FORMATION_LAYERS.find(
    (l) => depth >= l.topDepth && depth <= l.bottomDepth
  ) || FORMATION_LAYERS[0];

  const mudWeight = activeWell.mudWeight;
  const porePress = currentLayer.porePressureGradient;
  const fracGrad = currentLayer.fractureGradient;

  // Overbalance calculation
  const overbalanceDelta = mudWeight - porePress; // Positive = overbalanced
  const fractureMargin = fracGrad - mudWeight; // Lower = higher risk of fracturing/losses

  // 1. Base Stuck Pipe Risk calculation
  let stuckPipeScore = 15;
  if (currentLayer.name.includes('Panna')) {
    stuckPipeScore += 35; // Panna marine shale has severe differential sticking history
  } else if (currentLayer.name.includes('Claystone')) {
    stuckPipeScore += 20; // Reactive gumbo
  }

  // Overbalance penalty: if overbalance > 0.08 SG (approx 120 psi at 2400m)
  if (overbalanceDelta > 0.12) {
    stuckPipeScore += 30;
  } else if (overbalanceDelta > 0.05) {
    stuckPipeScore += 15;
  }

  // Torque & ROP indications
  if (activeWell.torque > 20) stuckPipeScore += 15;
  if (activeWell.rop < 5 && activeWell.torque > 15) stuckPipeScore += 10;

  // Offset proximity amplifier: if within 80m of offset stuck pipe
  const nearbyStuckOffset = OFFSET_WELLS.find(
    (w) => w.primaryIncident.type === 'Stuck Pipe' && Math.abs(w.primaryIncident.depth - depth) <= 80
  );
  if (nearbyStuckOffset) {
    const proximityMultiplier = Math.max(1, 2.0 - nearbyStuckOffset.distanceKm / 10);
    stuckPipeScore = Math.min(96, Math.round(stuckPipeScore * proximityMultiplier));
  }

  stuckPipeScore = Math.max(5, Math.min(95, stuckPipeScore));

  // 2. Mud Loss / Lost Circulation Risk calculation
  let mudLossScore = 12;
  if (currentLayer.name.includes('Limestone') || currentLayer.name.includes('Fractured')) {
    mudLossScore += 28; // Karst/vuggy
  }

  // Low fracture margin penalty
  if (fractureMargin < 0.05) {
    mudLossScore += 40; // Hydrostatic ECD breaks rock!
  } else if (fractureMargin < 0.12) {
    mudLossScore += 22;
  }

  // High flow rate or SPP surges ECD
  if (activeWell.flowRate > 620) mudLossScore += 12;
  if (activeWell.spp > 3000) mudLossScore += 10;

  const nearbyLossOffset = OFFSET_WELLS.find(
    (w) => w.primaryIncident.type === 'Mud Loss' && Math.abs(w.primaryIncident.depth - depth) <= 80
  );
  if (nearbyLossOffset) {
    const proximityMultiplier = Math.max(1, 2.0 - nearbyLossOffset.distanceKm / 10);
    mudLossScore = Math.min(98, Math.round(mudLossScore * proximityMultiplier));
  }
  mudLossScore = Math.max(5, Math.min(95, mudLossScore));

  // 3. Kick / Influx Risk calculation
  let kickScore = 8;
  if (overbalanceDelta < 0.02) {
    // Underbalance danger!
    kickScore += 45;
  }
  if (activeWell.gasReading > 3.0) kickScore += 30;
  if (activeWell.rop > 25 && currentLayer.name.includes('Panna')) kickScore += 20; // Drilling break
  kickScore = Math.max(4, Math.min(92, kickScore));

  // 4. Tight Hole Risk
  let tightHoleScore = Math.round((stuckPipeScore * 0.7 + (activeWell.torque > 18 ? 20 : 5)));
  tightHoleScore = Math.max(5, Math.min(90, tightHoleScore));

  // Determine overall risk level
  const maxRisk = Math.max(stuckPipeScore, mudLossScore, kickScore, tightHoleScore);
  let overallRiskLevel: RiskLevel = 'Low';
  if (maxRisk >= 75) overallRiskLevel = 'Critical';
  else if (maxRisk >= 55) overallRiskLevel = 'High';
  else if (maxRisk >= 35) overallRiskLevel = 'Moderate';

  let primaryHazard: IncidentType = 'Stuck Pipe';
  if (mudLossScore > stuckPipeScore && mudLossScore >= kickScore) primaryHazard = 'Mud Loss';
  else if (kickScore > stuckPipeScore && kickScore > mudLossScore) primaryHazard = 'Gas Influx / Kick';

  // Find nearest offset incident
  let nearestOffset = OFFSET_WELLS[0];
  let minDepthDiff = 99999;
  OFFSET_WELLS.forEach((w) => {
    const diff = Math.abs(w.primaryIncident.depth - depth);
    if (diff < minDepthDiff) {
      minDepthDiff = diff;
      nearestOffset = w;
    }
  });

  // Calculate SHAP feature importance
  const shapFactors = [
    {
      parameter: 'Hydrostatic Overbalance / Underbalance',
      impact: Math.round(Math.abs(overbalanceDelta) * 160 + (overbalanceDelta > 0.1 ? 25 : 10)),
      trend: overbalanceDelta > 0.08 ? ('increases_risk' as const) : ('decreases_risk' as const),
      recommendation: overbalanceDelta > 0.08
        ? `Mud weight (${mudWeight} SG) is ${(overbalanceDelta * 100).toFixed(1)}% above pore pressure (${porePress} SG). Reduce to 1.34 SG to avoid differential sticking.`
        : `Safe overbalance margin maintained.`,
    },
    {
      parameter: 'Offset Historical Incident Correlation',
      impact: minDepthDiff < 100 ? 32 : 12,
      trend: minDepthDiff < 100 ? ('increases_risk' as const) : ('neutral' as const),
      recommendation: minDepthDiff < 100
        ? `High correlation with ${nearestOffset.name} incident at ${nearestOffset.primaryIncident.depth}m (${minDepthDiff}m delta).`
        : `No immediate offset incidents within 100m vertical window.`,
    },
    {
      parameter: 'Formation Lithology Sensitivity',
      impact: currentLayer.name.includes('Panna') ? 28 : 14,
      trend: currentLayer.name.includes('Panna') ? ('increases_risk' as const) : ('neutral' as const),
      recommendation: `Current formation is ${currentLayer.name}. Narrow drilling margin between pore (${porePress} SG) and fracture (${fracGrad} SG).`,
    },
    {
      parameter: 'Rotary Torque & Drag Fluctuation',
      impact: activeWell.torque > 18 ? 20 : 8,
      trend: activeWell.torque > 18 ? ('increases_risk' as const) : ('decreases_risk' as const),
      recommendation: activeWell.torque > 18
        ? `Torque is ${activeWell.torque} kft-lb (elevated). Check for cuttings bed or keyseating.`
        : `Torque signature is within normal baseline (<18 kft-lb).`,
    },
    {
      parameter: 'ECD & Flow Rate Stress',
      impact: activeWell.flowRate > 600 ? 18 : 9,
      trend: activeWell.flowRate > 600 ? ('increases_risk' as const) : ('neutral' as const),
      recommendation: activeWell.flowRate > 600
        ? `Flow rate (${activeWell.flowRate} GPM) elevates annular friction and fracture risk.`
        : `Flow rate is within safe hydraulic envelope.`,
    },
  ];

  // Specific mitigations based on highest risk
  const mitigationAdvisory: string[] = [];
  if (stuckPipeScore >= 50) {
    mitigationAdvisory.push('Limit stationary drill string time to < 90 seconds during connections.');
    mitigationAdvisory.push('Pump 25 bbl high-viscosity pill followed by low-viscosity sweep to clean cuttings.');
    mitigationAdvisory.push('Ensure 40 bbl oil-based pipe-lax soaking pill and jarring equipment are ready on deck.');
  }
  if (mudLossScore >= 50) {
    mitigationAdvisory.push(`Maintain mud weight ceiling at 1.34 SG (current: ${mudWeight} SG).`);
    mitigationAdvisory.push('Pre-treat active pits with 20 ppb medium calcium carbonate & nut plug.');
    mitigationAdvisory.push('Reduce pump rate to 500 GPM to drop ECD by 0.04 SG.');
  }
  if (kickScore >= 40) {
    mitigationAdvisory.push('Perform immediate 10-minute flow check upon any 3 m/hr ROP increase.');
    mitigationAdvisory.push('Verify degasser readiness and test choke manifold valves.');
  }
  if (mitigationAdvisory.length === 0) {
    mitigationAdvisory.push('All parameters within green operating envelope. Continue planned drilling schedule.');
    mitigationAdvisory.push('Perform routine hole cleaning sweeps every 60 meters.');
  }

  return {
    stuckPipeRisk: stuckPipeScore,
    mudLossRisk: mudLossScore,
    kickRisk: kickScore,
    tightHoleRisk: tightHoleScore,
    overallRiskLevel,
    primaryHazard,
    nearestOffsetIncident: {
      wellName: nearestOffset.name,
      incidentType: nearestOffset.primaryIncident.type,
      depth: nearestOffset.primaryIncident.depth,
      distanceToBit: minDepthDiff,
      nptHours: nearestOffset.primaryIncident.nptHours,
      reportName: nearestOffset.primaryIncident.reportName,
    },
    shapFactors,
    mitigationAdvisory,
  };
}
