import {
  DataQuality,
  SensorStatus,
  RiskLevel
} from '@smartdairy/shared';
import {
  CowMilkingProfile,
  SimulatedRFIDReader,
  SimulatedSomaDetect,
  SimulatedFoodmag,
  SimulatedPHSensor,
  SimulatedAnimalVitalsSensor,
  SimulatedFarmEnvironmentSensor
} from '@smartdairy/sensors';

export interface SimulatedMilkingPoint {
  elapsedSeconds: number;
  flowRate: number;
  totalVolume: number;
  temperature: number;
  conductivity: number;
  ph: number;
  scc: number;
  flowStatus: DataQuality;
  temperatureStatus: DataQuality;
  conductivityStatus: DataQuality;
  phStatus: DataQuality;
  sccStatus: DataQuality;
  overallQuality: DataQuality;
  isComplete: boolean;
}

export class MilkingLineSimulator {
  public rfidReader = new SimulatedRFIDReader();
  public somaDetect = new SimulatedSomaDetect();
  public foodmag = new SimulatedFoodmag();
  public phSensor = new SimulatedPHSensor();
  public vitalsSensor = new SimulatedAnimalVitalsSensor();
  public envSensor = new SimulatedFarmEnvironmentSensor();

  private currentElapsed = 0;
  private currentVolume = 0;
  private activeProfile: CowMilkingProfile | null = null;
  private isSimulating = false;

  public startSession(profile: CowMilkingProfile): void {
    this.activeProfile = profile;
    this.currentElapsed = 0;
    this.currentVolume = 0;
    this.isSimulating = true;
  }

  public stopSession(): void {
    this.isSimulating = false;
  }

  public isRunning(): boolean {
    return this.isSimulating;
  }

  public getElapsed(): number {
    return this.currentElapsed;
  }

  public async tick(stepSeconds = 1): Promise<SimulatedMilkingPoint> {
    if (!this.activeProfile || !this.isSimulating) {
      throw new Error('Simulation session not started');
    }

    this.currentElapsed += stepSeconds;

    // Read all 3 milk sensors
    const flowRes = await this.foodmag.readFlow(
      this.currentElapsed,
      this.currentVolume,
      this.activeProfile
    );
    this.currentVolume = flowRes.totalVolume;

    const sccRes = await this.somaDetect.readSCC(this.activeProfile, this.currentElapsed);
    const phRes = await this.phSensor.readPH(this.activeProfile, this.currentElapsed);

    // Determine overall data quality
    let overallQuality = DataQuality.GOOD;
    if (
      flowRes.status === SensorStatus.OFFLINE ||
      sccRes.status === SensorStatus.OFFLINE ||
      phRes.status === SensorStatus.OFFLINE
    ) {
      overallQuality = DataQuality.OFFLINE;
    } else if (
      flowRes.status === SensorStatus.ERROR ||
      sccRes.status === SensorStatus.ERROR ||
      phRes.status === SensorStatus.ERROR
    ) {
      overallQuality = DataQuality.INVALID;
    }

    // A standard milking session finishes when flow drops below 0.15 L/min after peak, or at 300s
    const isComplete = this.currentElapsed >= 260 && flowRes.flowRate <= 0.15;

    return {
      elapsedSeconds: this.currentElapsed,
      flowRate: flowRes.flowRate,
      totalVolume: this.currentVolume,
      temperature: flowRes.temperature,
      conductivity: flowRes.conductivity,
      ph: phRes.ph,
      scc: sccRes.scc,
      flowStatus: flowRes.quality,
      temperatureStatus: flowRes.quality,
      conductivityStatus: flowRes.quality,
      phStatus: phRes.quality,
      sccStatus: sccRes.quality,
      overallQuality,
      isComplete
    };
  }

  public setSensorFault(sensorType: 'SOMADETECT' | 'FLOWMAG' | 'PH' | 'RFID', status: SensorStatus): void {
    if (sensorType === 'SOMADETECT') this.somaDetect.setStatus(status);
    if (sensorType === 'FLOWMAG') this.foodmag.setStatus(status);
    if (sensorType === 'PH') this.phSensor.setStatus(status);
    if (sensorType === 'RFID') this.rfidReader.setStatus(status);
  }

  public resetAllSensors(): void {
    this.somaDetect.setStatus(SensorStatus.ONLINE);
    this.foodmag.setStatus(SensorStatus.ONLINE);
    this.phSensor.setStatus(SensorStatus.ONLINE);
    this.rfidReader.setStatus(SensorStatus.ONLINE);
    this.vitalsSensor.setStatus(SensorStatus.ONLINE);
    this.envSensor.setStatus(SensorStatus.ONLINE);
  }
}

// Preset Cow Profiles for Demos
export const DEMO_COW_PROFILES: Record<string, CowMilkingProfile> = {
  NORMAL: {
    cowCode: 'COW-001',
    baselineMilkYield: 14.2,
    baselineScc: 110,
    baselinePh: 6.64,
    baselineConductivity: 5.55,
    baselineTemperature: 38.5,
    baselineFlow: 3.8,
    riskProfile: 'NORMAL'
  },
  MODERATE: {
    cowCode: 'COW-021',
    baselineMilkYield: 13.0,
    baselineScc: 140,
    baselinePh: 6.66,
    baselineConductivity: 5.60,
    baselineTemperature: 38.6,
    baselineFlow: 3.4,
    riskProfile: 'MODERATE'
  },
  HIGH_RISK: {
    cowCode: 'COW-026',
    baselineMilkYield: 14.5,
    baselineScc: 130,
    baselinePh: 6.65,
    baselineConductivity: 5.58,
    baselineTemperature: 38.5,
    baselineFlow: 3.9,
    riskProfile: 'HIGH'
  }
};

