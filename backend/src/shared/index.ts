import { z } from 'zod';

// ==========================================
// ENUMS & CONSTANTS
// ==========================================

export enum UserRole {
  ADMIN = 'ADMIN',
  FARM_MANAGER = 'FARM_MANAGER',
  VETERINARIAN = 'VETERINARIAN',
  OPERATOR = 'OPERATOR'
}

export enum StationStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  MAINTENANCE = 'MAINTENANCE'
}

export enum SessionStatus {
  IDLE = 'IDLE',
  RFID_DETECTED = 'RFID_DETECTED',
  IDENTIFYING = 'IDENTIFYING',
  READY = 'READY',
  MILKING = 'MILKING',
  PAUSED = 'PAUSED',
  ENDING = 'ENDING',
  COMPLETED = 'COMPLETED',
  UNIDENTIFIED = 'UNIDENTIFIED',
  ERROR = 'ERROR',
  CIP = 'CIP'
}

export enum RfidReadStatus {
  SUCCESS = 'SUCCESS',
  UNKNOWN = 'UNKNOWN',
  DUPLICATE = 'DUPLICATE',
  INVALID = 'INVALID'
}

export enum SensorType {
  RFID = 'RFID',
  SOMADETECT = 'SOMADETECT',
  FLOWMAG = 'FLOWMAG',
  PH = 'PH'
}

export enum SensorStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  ERROR = 'ERROR',
  CALIBRATING = 'CALIBRATING'
}

export enum DataQuality {
  GOOD = 'GOOD',
  WARNING = 'WARNING',
  MISSING = 'MISSING',
  INVALID = 'INVALID',
  OFFLINE = 'OFFLINE'
}

export enum RiskLevel {
  LOW = 'LOW',
  MODERATE = 'MODERATE',
  HIGH = 'HIGH',
  VERY_HIGH = 'VERY_HIGH'
}

export enum AlertType {
  MASTITIS_RISK = 'MASTITIS_RISK',
  INDIVIDUAL_COW_RISK = 'INDIVIDUAL_COW_RISK',
  HERD_RISK_INCREASE = 'HERD_RISK_INCREASE',
  SCC_TREND = 'SCC_TREND',
  HIGH_SCC = 'HIGH_SCC',
  MILK_YIELD_DROP = 'MILK_YIELD_DROP',
  CONDUCTIVITY_CHANGE = 'CONDUCTIVITY_CHANGE',
  ANIMAL_ACTIVITY_DROP = 'ANIMAL_ACTIVITY_DROP',
  RUMINATION_DROP = 'RUMINATION_DROP',
  FEED_INTAKE_DROP = 'FEED_INTAKE_DROP',
  ENVIRONMENTAL_STRESS = 'ENVIRONMENTAL_STRESS',
  HYGIENE_WARNING = 'HYGIENE_WARNING',
  VACCINATION_DUE = 'VACCINATION_DUE',
  TREATMENT_HISTORY = 'TREATMENT_HISTORY',
  SENSOR_OFFLINE = 'SENSOR_OFFLINE',
  RFID_ERROR = 'RFID_ERROR',
  UNKNOWN_COW = 'UNKNOWN_COW',
  CIP_WARNING = 'CIP_WARNING',
  DATA_QUALITY = 'DATA_QUALITY'
}

export enum LactationStage {
  EARLY = 'EARLY',
  PEAK = 'PEAK',
  MID = 'MID',
  LATE = 'LATE',
  DRY = 'DRY'
}

export enum HygieneStatus {
  GOOD = 'GOOD',
  ATTENTION = 'ATTENTION',
  POOR = 'POOR'
}

export enum TargetLabel {
  NO_MASTITIS = 'NO_MASTITIS',
  EARLY_WARNING = 'EARLY_WARNING',
  HIGH_RISK = 'HIGH_RISK',
  CONFIRMED_MASTITIS = 'CONFIRMED_MASTITIS'
}

export enum RiskDirection {
  INCREASING = 'INCREASING',
  STABLE = 'STABLE',
  DECREASING = 'DECREASING'
}

export enum DataSourceMode {
  REAL_SENSOR = 'REAL_SENSOR',
  SIMULATED_SENSOR = 'SIMULATED_SENSOR',
  FARM_RECORD = 'FARM_RECORD',
  HISTORICAL_DATABASE = 'HISTORICAL_DATABASE',
  USER_ENTERED = 'USER_ENTERED',
  DERIVED_FEATURE = 'DERIVED_FEATURE',
  AI_OUTPUT = 'AI_OUTPUT'
}

export enum AlertSeverity {
  INFO = 'INFO',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum AlertStatus {
  ACTIVE = 'ACTIVE',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  RESOLVED = 'RESOLVED'
}

export enum CIPPhase {
  PRE_RINSE = 'PRE_RINSE',
  CAUSTIC = 'CAUSTIC',
  RINSE = 'RINSE',
  ACID = 'ACID',
  FINAL_RINSE = 'FINAL_RINSE',
  COMPLETE = 'COMPLETE'
}

// Prototype category disclaimer constant (SIH PS 26109 Mandatory Disclaimers)
export const PROTOTYPE_DISCLAIMER = "Prototype AI risk estimate — not a veterinary diagnosis.";
export const CIP_ISOLATION_NOTICE = "CIP DATA IS NOT ASSOCIATED WITH ANY COW.";
export const DEMO_DATA_NOTICE = "Demo Sensor Data (Simulator Active)";
export const SIH_OBJECTIVE_TITLE = "AI-Based Predictive Modelling for Early Forecasting of Bovine Mastitis in Indian Dairy Farms";
export const SIH_OBJECTIVE_SUMMARY = "Predict mastitis risk BEFORE clinical signs appear at both individual-cow and herd level using real-time and historical farm data.";

// Default AI Feature Weights (Configurable & Explainable Baseline)
export interface RiskWeights {
  sccTrendWeight: number;            // 0.30 (30%)
  milkYieldWeight: number;           // 0.20 (20%)
  conductivityWeight: number;        // 0.20 (20%)
  phDeviationWeight: number;         // 0.10 (10%)
  flowPatternWeight: number;         // 0.10 (10%)
  temperatureWeight: number;         // 0.05 (5%)
  historicalRiskWeight: number;      // 0.05 (5%)
  
  // Extended Contextual SIH Weights
  animalActivityWeight?: number;     // e.g. 0.05
  ruminationWeight?: number;         // e.g. 0.05
  environmentalStressWeight?: number;// e.g. 0.05
  hygieneWeight?: number;             // e.g. 0.05
  treatmentHistoryWeight?: number;   // e.g. 0.05
}

export const DEFAULT_RISK_WEIGHTS: RiskWeights = {
  sccTrendWeight: 0.30,
  milkYieldWeight: 0.20,
  conductivityWeight: 0.20,
  phDeviationWeight: 0.10,
  flowPatternWeight: 0.10,
  temperatureWeight: 0.05,
  historicalRiskWeight: 0.05,
  animalActivityWeight: 0.05,
  ruminationWeight: 0.05,
  environmentalStressWeight: 0.05,
  hygieneWeight: 0.05,
  treatmentHistoryWeight: 0.05
};

// ==========================================
// ZOD VALIDATION SCHEMAS
// ==========================================

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(4)
});

export const RegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(4, 'Password must be at least 4 characters'),
  role: z.nativeEnum(UserRole).default(UserRole.OPERATOR),
  farmName: z.string().optional()
});

export const CowCreateSchema = z.object({
  farmId: z.string().optional(),
  cowCode: z.string().min(1),
  rfidId: z.string().min(1),
  name: z.string().min(1),
  breed: z.string().default('Holstein Friesian'),
  dateOfBirth: z.string().optional(),
  age: z.number().nonnegative().default(4),
  lactationNumber: z.number().int().positive().default(1),
  parity: z.number().int().nonnegative().default(1),
  daysInMilk: z.number().int().nonnegative().default(60),
  bodyWeight: z.number().positive().default(580),
  status: z.string().default('ACTIVE'),
  healthStatus: z.nativeEnum(RiskLevel).default(RiskLevel.LOW)
});

export const RfidScanSchema = z.object({
  tagUid: z.string().min(1),
  readerId: z.string().min(1),
  stationId: z.string().optional(),
  signalStrength: z.number().optional().default(-45)
});

export const SessionStartSchema = z.object({
  cowId: z.string().optional(),
  stationId: z.string().min(1),
  rfidTagUid: z.string().optional()
});

export const SensorReadingInputSchema = z.object({
  sessionId: z.string().min(1),
  timestamp: z.string().or(z.date()).optional(),
  flowRate: z.number().nonnegative(),
  totalVolume: z.number().nonnegative(),
  temperature: z.number(),
  conductivity: z.number().nonnegative(),
  ph: z.number().nonnegative(),
  scc: z.number().nonnegative(),
  flowStatus: z.nativeEnum(DataQuality).default(DataQuality.GOOD),
  temperatureStatus: z.nativeEnum(DataQuality).default(DataQuality.GOOD),
  conductivityStatus: z.nativeEnum(DataQuality).default(DataQuality.GOOD),
  phStatus: z.nativeEnum(DataQuality).default(DataQuality.GOOD),
  sccStatus: z.nativeEnum(DataQuality).default(DataQuality.GOOD),
  dataQuality: z.nativeEnum(DataQuality).default(DataQuality.GOOD),
  sensorSource: z.string().default('SIMULATOR'),
  eventId: z.string().optional()
});

export const AlertAcknowledgeSchema = z.object({
  note: z.string().optional()
});

export const AlertResolveSchema = z.object({
  resolutionNote: z.string().optional()
});

export const SimulationScenarioSchema = z.object({
  scenario: z.enum([
    'NORMAL_COW',
    'EARLY_WARNING',
    'HIGH_RISK',
    'RFID_MISSED',
    'UNKNOWN_RFID',
    'SENSOR_FAILURE',
    'NETWORK_FAILURE',
    'CIP_CYCLE',
    'MULTIPLE_COWS',
    'MULTI_COW_FLOW',
    'RESET',
    'HERD_RISK_INCREASE',
    'ENVIRONMENTAL_STRESS',
    'ACTIVITY_DROP',
    'RUMINATION_DROP',
    'FEED_INTAKE_DROP'
  ]),
  stationId: z.string().optional(),
  cowId: z.string().optional(),
  targetDurationSeconds: z.number().optional()
});

export const AnimalVitalsInputSchema = z.object({
  cowId: z.string().min(1),
  timestamp: z.string().or(z.date()).optional(),
  bodyTemperature: z.number().positive(),
  activitySteps: z.number().int().nonnegative(),
  ruminationMinutes: z.number().int().nonnegative(),
  feedIntakeKg: z.number().nonnegative(),
  sensorSource: z.string().default('SIMULATOR'),
  dataQuality: z.nativeEnum(DataQuality).default(DataQuality.GOOD)
});

export const FarmEnvironmentInputSchema = z.object({
  farmId: z.string().optional(),
  timestamp: z.string().or(z.date()).optional(),
  temperature: z.number(),
  humidity: z.number().nonnegative(),
  hygieneScore: z.number().nonnegative(),
  hygieneStatus: z.nativeEnum(HygieneStatus).default(HygieneStatus.GOOD),
  sensorSource: z.string().default('SIMULATOR')
});

export const VaccinationRecordInputSchema = z.object({
  cowId: z.string().min(1),
  vaccineName: z.string().min(1),
  administeredDate: z.string().or(z.date()).optional(),
  nextDueDate: z.string().or(z.date()).optional(),
  status: z.string().default('COMPLETED'),
  notes: z.string().optional()
});

export const TreatmentRecordInputSchema = z.object({
  cowId: z.string().min(1),
  treatmentName: z.string().min(1),
  treatmentDate: z.string().or(z.date()).optional(),
  reason: z.string().min(1),
  durationDays: z.number().int().positive().default(3),
  outcome: z.string().default('RECOVERED'),
  notes: z.string().optional()
});

// ==========================================
// TYPES & DTOs
// ==========================================

export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type CowCreateInput = z.infer<typeof CowCreateSchema>;
export type RfidScanInput = z.infer<typeof RfidScanSchema>;
export type SessionStartInput = z.infer<typeof SessionStartSchema>;
export type SensorReadingInput = z.infer<typeof SensorReadingInputSchema>;
export type SimulationScenarioInput = z.infer<typeof SimulationScenarioSchema>;
export type AnimalVitalsInput = z.infer<typeof AnimalVitalsInputSchema>;
export type FarmEnvironmentInput = z.infer<typeof FarmEnvironmentInputSchema>;
export type VaccinationRecordInput = z.infer<typeof VaccinationRecordInputSchema>;
export type TreatmentRecordInput = z.infer<typeof TreatmentRecordInputSchema>;

export interface ForecastResult {
  currentRiskScore: number;
  currentRiskLevel: RiskLevel;
  forecastScore: number;
  forecastLevel: RiskLevel;
  riskDirection: RiskDirection;
  forecastHorizon: string; // e.g. "Next 24–72 hours"
  confidence: number;
  topFactors: Array<{
    name: string;
    deviation: string;
    impact: string;
    source: DataSourceMode;
  }>;
  recommendedAction: string;
}

export interface HerdRiskResult {
  herdRiskIndex: number; // 0-100
  herdRiskLevel: RiskLevel;
  herdRiskTrend: RiskDirection;
  cowsMonitored: number;
  lowRiskCount: number;
  moderateRiskCount: number;
  highRiskCount: number;
  veryHighRiskCount: number;
  increasingRiskCount: number;
  newWarnings24h: number;
  environmentalStressLevel: string; // LOW, MODERATE, HIGH
  hygieneStatus: HygieneStatus;
  forecastSummary: string;
  recommendedAction: string;
}

export interface LiveSensorState {
  sessionId: string;
  cowId: string | null;
  cowCode: string | null;
  cowName: string | null;
  stationId: string;
  stationCode: string;
  status: SessionStatus;
  elapsedSeconds: number;
  flowRate: number;
  totalVolume: number;
  temperature: number;
  conductivity: number;
  ph: number;
  scc: number;
  currentRiskScore: number;
  currentRiskLevel: RiskLevel;
  sensorHealth: {
    rfid: SensorStatus;
    somaDetect: SensorStatus;
    foodmag: SensorStatus;
    phSensor: SensorStatus;
  };
  latestReadingTime: string;
}

export interface PredictionFactor {
  factorName: string;
  factorValue: number;
  baselineValue: number;
  deviationPercent: number;
  contribution: number;
  direction: 'INCREASE' | 'DECREASE' | 'NEUTRAL';
}

export interface RiskAssessmentResult {
  riskScore: number;
  riskLevel: RiskLevel;
  confidence: number;
  factors: PredictionFactor[];
  explanation: string;
}

