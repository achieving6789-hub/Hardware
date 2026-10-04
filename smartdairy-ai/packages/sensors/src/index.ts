import { SensorStatus, DataQuality, RfidReadStatus } from '@smartdairy/shared';

export interface CowMilkingProfile {
  cowId?: string;
  cowCode?: string;
  baselineMilkYield: number;     // e.g. 14 L
  baselineScc: number;           // e.g. 110 k cells/mL
  baselinePh: number;            // e.g. 6.65
  baselineConductivity: number;  // e.g. 5.6 mS/cm
  baselineTemperature: number;   // e.g. 38.5 °C
  baselineFlow: number;          // peak flow ~3.8 L/min
  riskProfile: 'NORMAL' | 'MODERATE' | 'HIGH';
}

export interface RfidReadResult {
  tagUid: string;
  readerId: string;
  status: RfidReadStatus;
  signalStrength: number;
  timestamp: Date;
  quality: DataQuality;
}

export interface SCCReadingResult {
  scc: number;
  trend: 'STABLE' | 'RISING' | 'FALLING';
  status: SensorStatus;
  quality: DataQuality;
  timestamp: Date;
}

export interface FlowReadingResult {
  flowRate: number;       // L/min
  totalVolume: number;    // cumulative Liters
  flowDirection: 'FORWARD' | 'REVERSE' | 'NONE';
  mediumPresent: boolean;
  conductivity: number;   // mS/cm
  temperature: number;    // °C
  status: SensorStatus;
  quality: DataQuality;
  timestamp: Date;
}

export interface PHReadingResult {
  ph: number;
  calibrationStatus: 'CALIBRATED' | 'REQUIRES_CALIBRATION' | 'ERROR';
  status: SensorStatus;
  quality: DataQuality;
  timestamp: Date;
}

// ==========================================
// CORE SENSOR INTERFACES
// ==========================================

export interface IRFIDReader {
  scanTag(tagUid?: string): Promise<RfidReadResult>;
  getStatus(): SensorStatus;
  setStatus(status: SensorStatus): void;
}

export interface ISCCSensor {
  readSCC(profile?: CowMilkingProfile, elapsedSeconds?: number): Promise<SCCReadingResult>;
  getStatus(): SensorStatus;
  setStatus(status: SensorStatus): void;
}

export interface IFlowSensor {
  readFlow(elapsedSeconds: number, previousVolume: number, profile?: CowMilkingProfile): Promise<FlowReadingResult>;
  getStatus(): SensorStatus;
  setStatus(status: SensorStatus): void;
}

export interface IPHSensor {
  readPH(profile?: CowMilkingProfile, elapsedSeconds?: number): Promise<PHReadingResult>;
  getStatus(): SensorStatus;
  setStatus(status: SensorStatus): void;
}

// ==========================================
// SIMULATION IMPLEMENTATIONS
// ==========================================

export class SimulatedRFIDReader implements IRFIDReader {
  private status: SensorStatus = SensorStatus.ONLINE;
  private readerId: string;

  constructor(readerId = 'RFID-RDR-01') {
    this.readerId = readerId;
  }

  getStatus(): SensorStatus {
    return this.status;
  }

  setStatus(status: SensorStatus): void {
    this.status = status;
  }

  async scanTag(tagUid = 'RFID-TAG-001'): Promise<RfidReadResult> {
    if (this.status === SensorStatus.OFFLINE || this.status === SensorStatus.ERROR) {
      return {
        tagUid: '',
        readerId: this.readerId,
        status: RfidReadStatus.INVALID,
        signalStrength: 0,
        timestamp: new Date(),
        quality: DataQuality.OFFLINE
      };
    }

    return {
      tagUid,
      readerId: this.readerId,
      status: RfidReadStatus.SUCCESS,
      signalStrength: -40 - Math.random() * 15,
      timestamp: new Date(),
      quality: DataQuality.GOOD
    };
  }
}

export class SimulatedSomaDetect implements ISCCSensor {
  private status: SensorStatus = SensorStatus.ONLINE;

  getStatus(): SensorStatus {
    return this.status;
  }

  setStatus(status: SensorStatus): void {
    this.status = status;
  }

  async readSCC(profile?: CowMilkingProfile, elapsedSeconds = 0): Promise<SCCReadingResult> {
    if (this.status === SensorStatus.OFFLINE || this.status === SensorStatus.ERROR) {
      return {
        scc: 0,
        trend: 'STABLE',
        status: this.status,
        quality: DataQuality.OFFLINE,
        timestamp: new Date()
      };
    }

    const baseline = profile?.baselineScc || 120;
    let scc = baseline;
    let trend: 'STABLE' | 'RISING' | 'FALLING' = 'STABLE';

    if (profile?.riskProfile === 'HIGH') {
      // High-risk: SCC increases dramatically over milking
      scc = baseline * 2.8 + Math.min(elapsedSeconds * 4, 350) + (Math.random() * 40 - 20);
      trend = 'RISING';
    } else if (profile?.riskProfile === 'MODERATE') {
      scc = baseline * 1.5 + (Math.random() * 30 - 15);
      trend = 'RISING';
    } else {
      // Normal: tight variation around baseline
      scc = baseline + (Math.random() * 20 - 10);
      trend = 'STABLE';
    }

    return {
      scc: Math.max(20, Math.round(scc)),
      trend,
      status: this.status,
      quality: DataQuality.GOOD,
      timestamp: new Date()
    };
  }
}

export class SimulatedFoodmag implements IFlowSensor {
  private status: SensorStatus = SensorStatus.ONLINE;

  getStatus(): SensorStatus {
    return this.status;
  }

  setStatus(status: SensorStatus): void {
    this.status = status;
  }

  async readFlow(
    elapsedSeconds: number,
    previousVolume: number,
    profile?: CowMilkingProfile
  ): Promise<FlowReadingResult> {
    if (this.status === SensorStatus.OFFLINE || this.status === SensorStatus.ERROR) {
      return {
        flowRate: 0,
        totalVolume: previousVolume,
        flowDirection: 'NONE',
        mediumPresent: false,
        conductivity: 0,
        temperature: 0,
        status: this.status,
        quality: DataQuality.OFFLINE,
        timestamp: new Date()
      };
    }

    // Milking curve: 0-30s ramp up, 30-180s peak/plateau, 180-300s decline tail
    const peakFlow = profile?.baselineFlow || 3.8;
    let flowRate = 0;

    if (elapsedSeconds < 20) {
      // RAMP UP
      flowRate = (elapsedSeconds / 20) * (peakFlow * 0.85);
    } else if (elapsedSeconds < 140) {
      // PEAK & STABLE
      const noise = (Math.random() * 0.4 - 0.2);
      flowRate = peakFlow + noise;
    } else if (elapsedSeconds < 240) {
      // DECLINE
      const decayRatio = Math.max(0, 1 - (elapsedSeconds - 140) / 100);
      flowRate = peakFlow * decayRatio + (Math.random() * 0.15);
    } else {
      // END
      flowRate = Math.max(0, 0.2 - (elapsedSeconds - 240) * 0.02);
    }

    if (profile?.riskProfile === 'HIGH') {
      // High-risk: reduced total flow & uneven pattern
      flowRate = flowRate * 0.72;
    } else if (profile?.riskProfile === 'MODERATE') {
      flowRate = flowRate * 0.88;
    }

    flowRate = Math.max(0, parseFloat(flowRate.toFixed(2)));
    const deltaVolume = (flowRate / 60) * 1; // 1 second step
    const totalVolume = parseFloat((previousVolume + deltaVolume).toFixed(3));

    // Temperature (°C)
    const baseTemp = profile?.baselineTemperature || 38.5;
    const tempNoise = (Math.random() * 0.2 - 0.1);
    const temperature = parseFloat((baseTemp + (profile?.riskProfile === 'HIGH' ? 0.6 : 0) + tempNoise).toFixed(1));

    // Conductivity (mS/cm): Normal milk is 5.2 - 6.0 mS/cm. Mastitis leads to Na+/Cl- leakage -> 6.8 - 8.0+
    const baseCond = profile?.baselineConductivity || 5.6;
    let cond = baseCond + (Math.random() * 0.15 - 0.075);
    if (profile?.riskProfile === 'HIGH') {
      cond = baseCond + 1.4 + (Math.random() * 0.2);
    } else if (profile?.riskProfile === 'MODERATE') {
      cond = baseCond + 0.6 + (Math.random() * 0.15);
    }
    const conductivity = parseFloat(cond.toFixed(2));

    return {
      flowRate,
      totalVolume,
      flowDirection: flowRate > 0.05 ? 'FORWARD' : 'NONE',
      mediumPresent: flowRate > 0.05,
      conductivity,
      temperature,
      status: this.status,
      quality: DataQuality.GOOD,
      timestamp: new Date()
    };
  }
}

export class SimulatedPHSensor implements IPHSensor {
  private status: SensorStatus = SensorStatus.ONLINE;
  private calibration: 'CALIBRATED' | 'REQUIRES_CALIBRATION' | 'ERROR' = 'CALIBRATED';

  getStatus(): SensorStatus {
    return this.status;
  }

  setStatus(status: SensorStatus): void {
    this.status = status;
  }

  async readPH(profile?: CowMilkingProfile, elapsedSeconds = 0): Promise<PHReadingResult> {
    if (this.status === SensorStatus.OFFLINE || this.status === SensorStatus.ERROR) {
      return {
        ph: 0,
        calibrationStatus: this.calibration,
        status: this.status,
        quality: DataQuality.OFFLINE,
        timestamp: new Date()
      };
    }

    const basePh = profile?.baselinePh || 6.65;
    let ph = basePh + (Math.random() * 0.06 - 0.03);

    if (profile?.riskProfile === 'HIGH') {
      ph = basePh + 0.35 + (Math.random() * 0.08); // elevated pH in mastitic milk
    } else if (profile?.riskProfile === 'MODERATE') {
      ph = basePh + 0.15 + (Math.random() * 0.05);
    }

    return {
      ph: parseFloat(ph.toFixed(2)),
      calibrationStatus: this.calibration,
      status: this.status,
      quality: DataQuality.GOOD,
      timestamp: new Date()
    };
  }
}

// ==========================================
// EXTENSIBLE VENDOR API ADAPTERS (FUTURE HARDWARE)
// ==========================================

export class VendorSomaDetectAPI implements ISCCSensor {
  private apiUrl: string;
  private apiKey: string;
  private status: SensorStatus = SensorStatus.ONLINE;

  constructor(apiUrl: string, apiKey: string) {
    this.apiUrl = apiUrl;
    this.apiKey = apiKey;
  }

  getStatus(): SensorStatus {
    return this.status;
  }

  setStatus(status: SensorStatus): void {
    this.status = status;
  }

  async readSCC(): Promise<SCCReadingResult> {
    // In production, HTTP call to vendor's edge or cloud API
    return {
      scc: 135,
      trend: 'STABLE',
      status: this.status,
      quality: DataQuality.GOOD,
      timestamp: new Date()
    };
  }
}

export class VendorFoodmagAPI implements IFlowSensor {
  private status: SensorStatus = SensorStatus.ONLINE;

  getStatus(): SensorStatus {
    return this.status;
  }

  setStatus(status: SensorStatus): void {
    this.status = status;
  }

  async readFlow(elapsed: number, prevVol: number): Promise<FlowReadingResult> {
    return {
      flowRate: 3.5,
      totalVolume: prevVol + 0.058,
      flowDirection: 'FORWARD',
      mediumPresent: true,
      conductivity: 5.65,
      temperature: 38.6,
      status: this.status,
      quality: DataQuality.GOOD,
      timestamp: new Date()
    };
  }
}

export class VendorInProX1HLS implements IPHSensor {
  private status: SensorStatus = SensorStatus.ONLINE;

  getStatus(): SensorStatus {
    return this.status;
  }

  setStatus(status: SensorStatus): void {
    this.status = status;
  }

  async readPH(profile?: CowMilkingProfile, elapsedSeconds = 0): Promise<PHReadingResult> {
    return {
      ph: 6.67,
      calibrationStatus: 'CALIBRATED',
      status: this.status,
      quality: DataQuality.GOOD,
      timestamp: new Date()
    };
  }
}

// ==========================================
// SIH PS 26109 AUXILIARY SENSORS & TELEMETRY
// ==========================================

export interface AnimalVitalsReadingResult {
  cowId: string;
  bodyTemperature: number; // °C (normal: 38.0 - 39.2)
  heartRate: number;       // bpm (normal: 60 - 80)
  respirationRate: number; // breaths/min (normal: 20 - 35)
  ruminationMinutes: number; // mins/day (normal: 450 - 550)
  activitySteps: number;   // steps/day (normal: 2500 - 4000)
  lyingTimeHours: number;  // hrs/day (normal: 10 - 14)
  feedIntakeKg: number;    // kg/day (normal: 35 - 55)
  waterIntakeLiters: number; // L/day (normal: 60 - 110)
  status: SensorStatus;
  quality: DataQuality;
  timestamp: Date;
}

export interface FarmEnvironmentReadingResult {
  barnId: string;
  ambientTemperature: number; // °C
  relativeHumidity: number;   // %
  thi: number;                // Temperature Humidity Index
  ventilationStatus: 'GOOD' | 'MODERATE' | 'POOR';
  hygieneScore: number;       // 1 - 5 (1 clean, 5 dirty)
  ammoniaPpm: number;         // ppm
  status: SensorStatus;
  quality: DataQuality;
  timestamp: Date;
}

export interface IAnimalVitalsSensor {
  readVitals(cowId: string, riskProfile?: 'NORMAL' | 'MODERATE' | 'HIGH'): Promise<AnimalVitalsReadingResult>;
  getStatus(): SensorStatus;
  setStatus(status: SensorStatus): void;
}

export interface IFarmEnvironmentSensor {
  readEnvironment(barnId?: string, isStressScenario?: boolean): Promise<FarmEnvironmentReadingResult>;
  getStatus(): SensorStatus;
  setStatus(status: SensorStatus): void;
}

export class SimulatedAnimalVitalsSensor implements IAnimalVitalsSensor {
  private status: SensorStatus = SensorStatus.ONLINE;

  getStatus(): SensorStatus {
    return this.status;
  }

  setStatus(status: SensorStatus): void {
    this.status = status;
  }

  async readVitals(cowId: string, riskProfile: 'NORMAL' | 'MODERATE' | 'HIGH' = 'NORMAL'): Promise<AnimalVitalsReadingResult> {
    if (this.status === SensorStatus.OFFLINE || this.status === SensorStatus.ERROR) {
      return {
        cowId,
        bodyTemperature: 0,
        heartRate: 0,
        respirationRate: 0,
        ruminationMinutes: 0,
        activitySteps: 0,
        lyingTimeHours: 0,
        feedIntakeKg: 0,
        waterIntakeLiters: 0,
        status: this.status,
        quality: DataQuality.OFFLINE,
        timestamp: new Date()
      };
    }

    let bodyTemperature = 38.6 + (Math.random() * 0.4 - 0.2);
    let heartRate = 68 + Math.round(Math.random() * 8 - 4);
    let respirationRate = 26 + Math.round(Math.random() * 4 - 2);
    let ruminationMinutes = 480 + Math.round(Math.random() * 40 - 20);
    let activitySteps = 3200 + Math.round(Math.random() * 400 - 200);
    let lyingTimeHours = 11.5 + (Math.random() * 1.0 - 0.5);
    let feedIntakeKg = 44 + (Math.random() * 4 - 2);
    let waterIntakeLiters = 85 + (Math.random() * 10 - 5);

    if (riskProfile === 'HIGH') {
      // Subclinical/early prodromal signs: elevated temp, dropped rumination, dropped activity, reduced feed
      bodyTemperature += 0.9; // 39.5°C
      heartRate += 16;        // 84 bpm
      respirationRate += 12;  // 38 breaths/min
      ruminationMinutes -= 160; // 320 min (sharp drop)
      activitySteps -= 1100;    // 2100 steps (lethargy)
      lyingTimeHours += 2.8;    // lying down more
      feedIntakeKg -= 12;       // dropped appetite
      waterIntakeLiters -= 20;
    } else if (riskProfile === 'MODERATE') {
      bodyTemperature += 0.4;
      heartRate += 8;
      respirationRate += 6;
      ruminationMinutes -= 70;
      activitySteps -= 500;
      feedIntakeKg -= 5;
    }

    return {
      cowId,
      bodyTemperature: parseFloat(bodyTemperature.toFixed(2)),
      heartRate,
      respirationRate,
      ruminationMinutes: Math.max(100, ruminationMinutes),
      activitySteps: Math.max(500, activitySteps),
      lyingTimeHours: parseFloat(lyingTimeHours.toFixed(1)),
      feedIntakeKg: parseFloat(feedIntakeKg.toFixed(1)),
      waterIntakeLiters: parseFloat(waterIntakeLiters.toFixed(1)),
      status: this.status,
      quality: DataQuality.GOOD,
      timestamp: new Date()
    };
  }
}

export class SimulatedFarmEnvironmentSensor implements IFarmEnvironmentSensor {
  private status: SensorStatus = SensorStatus.ONLINE;

  getStatus(): SensorStatus {
    return this.status;
  }

  setStatus(status: SensorStatus): void {
    this.status = status;
  }

  async readEnvironment(barnId = 'BARN-01', isStressScenario = false): Promise<FarmEnvironmentReadingResult> {
    if (this.status === SensorStatus.OFFLINE || this.status === SensorStatus.ERROR) {
      return {
        barnId,
        ambientTemperature: 0,
        relativeHumidity: 0,
        thi: 0,
        ventilationStatus: 'POOR',
        hygieneScore: 1,
        ammoniaPpm: 0,
        status: this.status,
        quality: DataQuality.OFFLINE,
        timestamp: new Date()
      };
    }

    let ambientTemperature = 26.5 + (Math.random() * 2 - 1);
    let relativeHumidity = 65 + (Math.random() * 6 - 3);
    let hygieneScore = 2; // Clean/moderate
    let ammoniaPpm = 8 + (Math.random() * 3 - 1.5);
    let ventilationStatus: 'GOOD' | 'MODERATE' | 'POOR' = 'GOOD';

    if (isStressScenario) {
      ambientTemperature = 34.2 + (Math.random() * 2); // Heat stress in Indian summer
      relativeHumidity = 78 + (Math.random() * 5);     // High humidity (monsoon/hot humid)
      hygieneScore = 4;                                // Dirty bedding/water puddling
      ammoniaPpm = 22 + (Math.random() * 4);
      ventilationStatus = 'POOR';
    }

    // THI formula: THI = (1.8 * T + 32) - (0.55 - 0.0055 * RH) * (1.8 * T - 26)
    const T = ambientTemperature;
    const RH = relativeHumidity;
    const thi = (1.8 * T + 32) - (0.55 - 0.0055 * RH) * (1.8 * T - 26);

    return {
      barnId,
      ambientTemperature: parseFloat(ambientTemperature.toFixed(1)),
      relativeHumidity: parseFloat(relativeHumidity.toFixed(1)),
      thi: parseFloat(thi.toFixed(1)),
      ventilationStatus,
      hygieneScore,
      ammoniaPpm: parseFloat(ammoniaPpm.toFixed(1)),
      status: this.status,
      quality: DataQuality.GOOD,
      timestamp: new Date()
    };
  }
}

