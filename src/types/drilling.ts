export type IncidentType = 'Stuck Pipe' | 'Mud Loss' | 'Gas Influx / Kick' | 'Tight Hole / Stuck Pipe Risk' | 'Equipment Failure / Bit Wear';

export type RiskLevel = 'Low' | 'Moderate' | 'High' | 'Critical';

export interface FormationLayer {
  name: string;
  topDepth: number; // m MD
  bottomDepth: number; // m MD
  lithology: 'Clay/Alluvium' | 'Claystone/Shale' | 'Limestone' | 'Overpressured Marine Shale' | 'Fractured Carbonate' | 'Basalt/Basement';
  color: string;
  porePressureGradient: number; // SG equivalent
  fractureGradient: number; // SG equivalent
  hazards: string[];
}

export interface DDRReport {
  reportId: string;
  dayNumber: number;
  date: string;
  depthStart: number;
  depthEnd: number;
  formation: string;
  mudWeight: number; // SG
  flowRate: number; // GPM
  spp: number; // psi
  rop: number; // m/hr
  operationsSummary: string;
  incidentDetail?: string;
  correctiveActions?: string;
  nptHours: number;
}

export interface OffsetWell {
  id: string;
  name: string;
  operator: string;
  spudYear: number;
  latitude: number;
  longitude: number;
  distanceKm: number;
  azimuthDeg: number;
  maxDepth: number;
  targetFormation: string;
  mudWeightAverage: number;
  primaryIncident: {
    type: IncidentType;
    depth: number;
    formation: string;
    nptHours: number;
    severity: RiskLevel;
    reportName: string;
    summary: string;
    lessonsLearned: string[];
    rootCause: string;
    preventativeMeasures: string;
  };
  ddrReports: DDRReport[];
  trajectory: { md: number; tvd: number; deviation: number }[];
}

export interface ActiveDrillingState {
  wellId: string;
  wellName: string;
  basin: string;
  rigName: string;
  targetDepth: number;
  currentDepth: number; // scrubbable
  latitude: number;
  longitude: number;
  mudWeight: number; // SG
  rop: number; // m/hr
  flowRate: number; // GPM
  spp: number; // psi
  torque: number; // kft-lb
  wob: number; // klbs
  rpm: number; // RPM
  chokePressure: number; // psi
  gasReading: number; // %
}

export interface RiskPredictionResult {
  stuckPipeRisk: number; // 0 - 100
  mudLossRisk: number; // 0 - 100
  kickRisk: number; // 0 - 100
  tightHoleRisk: number; // 0 - 100
  overallRiskLevel: RiskLevel;
  primaryHazard: IncidentType;
  nearestOffsetIncident?: {
    wellName: string;
    incidentType: IncidentType;
    depth: number;
    distanceToBit: number;
    nptHours: number;
    reportName: string;
  };
  shapFactors: {
    parameter: string;
    impact: number; // % contribution
    trend: 'increases_risk' | 'decreases_risk' | 'neutral';
    recommendation: string;
  }[];
  mitigationAdvisory: string[];
}
