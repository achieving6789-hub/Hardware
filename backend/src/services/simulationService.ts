import { prisma } from '../database';
import {
  MilkingLineSimulator,
  DEMO_COW_PROFILES
} from '../simulation';
import {
  RuleBasedRiskModel,
  CowFeatures
} from '../ai';
import {
  SessionStatus,
  SensorStatus,
  DataQuality,
  RiskLevel
} from '../shared';
import { socketService } from './socketService';
import { sessionStateMachine } from './sessionStateMachine';

export class SimulationService {
  private static instance: SimulationService;
  private simulator = new MilkingLineSimulator();
  private riskEngine = new RuleBasedRiskModel();
  private timer: NodeJS.Timeout | null = null;
  private activeSessionId: string | null = null;
  private activeStationId: string | null = null;
  private isPaused = false;
  private tickIntervalMs = 1000; // 1 second real-time clock
  private networkSimulationOnline = true;

  private constructor() {}

  public static getInstance(): SimulationService {
    if (!SimulationService.instance) {
      SimulationService.instance = new SimulationService();
    }
    return SimulationService.instance;
  }

  public getSimulator(): MilkingLineSimulator {
    return this.simulator;
  }

  public isNetworkOnline(): boolean {
    return this.networkSimulationOnline;
  }

  public setNetworkOnline(online: boolean): void {
    this.networkSimulationOnline = online;
    console.log(`[Simulation] Network status set to: ${online ? 'ONLINE' : 'OFFLINE'}`);
  }

  public async startLiveMilking(stationId: string, cowCode = 'COW-001'): Promise<any> {
    this.stopLiveMilking();

    // 1. Identify cow
    const cow = await prisma.cow.findUnique({
      where: { cowCode },
      include: { baseline: true, healthProfile: true }
    });

    if (!cow) throw new Error(`Cow with code ${cowCode} not found in database.`);

    // 2. Transition state machine via RFID
    await sessionStateMachine.handleRfidScan(cow.rfidId, 'RFID-RDR-01', stationId);

    // 3. Create session in DB
    const session = await sessionStateMachine.createAndStartSession(stationId, cow.id);
    this.activeSessionId = session.id;
    this.activeStationId = stationId;
    this.isPaused = false;

    // 4. Configure simulation profile
    const riskType = cow.healthStatus === 'HIGH' ? 'HIGH' : cow.healthStatus === 'MODERATE' ? 'MODERATE' : 'NORMAL';
    this.simulator.startSession({
      cowId: cow.id,
      cowCode: cow.cowCode,
      baselineMilkYield: cow.baseline?.baselineMilkYield || 14.0,
      baselineScc: cow.baseline?.baselineScc || 120,
      baselinePh: cow.baseline?.baselinePh || 6.65,
      baselineConductivity: cow.baseline?.baselineConductivity || 5.60,
      baselineTemperature: cow.baseline?.baselineTemperature || 38.5,
      baselineFlow: cow.baseline?.baselineFlow || 3.8,
      riskProfile: riskType
    });

    // 5. Start high-frequency ticker
    this.timer = setInterval(async () => {
      try {
        await this.handleTick();
      } catch (err) {
        console.error('[Simulation Tick Error]:', err);
      }
    }, this.tickIntervalMs);

    console.log(`[Simulation] Started live milking for ${cow.cowCode} at station ${stationId}.`);
    return session;
  }

  public pauseLiveMilking(): void {
    this.isPaused = true;
    if (this.activeStationId) {
      sessionStateMachine.setStationState(this.activeStationId, { status: SessionStatus.PAUSED });
      socketService.emit('session:updated', { sessionId: this.activeSessionId, status: SessionStatus.PAUSED });
    }
  }

  public resumeLiveMilking(): void {
    this.isPaused = false;
    if (this.activeStationId) {
      sessionStateMachine.setStationState(this.activeStationId, { status: SessionStatus.MILKING });
      socketService.emit('session:updated', { sessionId: this.activeSessionId, status: SessionStatus.MILKING });
    }
  }

  public async stopLiveMilking(): Promise<any> {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    this.simulator.stopSession();

    if (this.activeSessionId) {
      const sessionId = this.activeSessionId;
      this.activeSessionId = null;
      return await this.finalizeSession(sessionId);
    }
    return null;
  }

  private async handleTick(): Promise<void> {
    if (this.isPaused || !this.activeSessionId) return;

    // Simulate 1 tick of milking line
    const point = await this.simulator.tick(2); // advance 2 seconds per tick for brisk demo

    // Update state machine elapsed
    if (this.activeStationId) {
      sessionStateMachine.setStationState(this.activeStationId, {
        elapsedSeconds: point.elapsedSeconds
      });
    }

    // Save reading to database (if network is simulated online)
    let dbReading: any = null;
    if (this.networkSimulationOnline) {
      try {
        dbReading = await prisma.sensorReading.create({
          data: {
            sessionId: this.activeSessionId,
            timestamp: new Date(),
            flowRate: point.flowRate,
            totalVolume: point.totalVolume,
            temperature: point.temperature,
            conductivity: point.conductivity,
            ph: point.ph,
            scc: point.scc,
            flowStatus: point.flowStatus,
            temperatureStatus: point.temperatureStatus,
            conductivityStatus: point.conductivityStatus,
            phStatus: point.phStatus,
            sccStatus: point.sccStatus,
            dataQuality: point.overallQuality,
            sensorSource: 'SIMULATOR'
          }
        });
      } catch (e) {
        console.error('[Simulation DB Save Error]:', e);
      }
    }

    // Broadcast over WebSocket to all connected clients
    socketService.emitSensorReading({
      sessionId: this.activeSessionId,
      stationId: this.activeStationId,
      timestamp: new Date(),
      reading: point,
      dbId: dbReading?.id
    });

    // Check if session naturally reached end of milking curve
    if (point.isComplete) {
      console.log(`[Simulation] Milk flow completed naturally for session ${this.activeSessionId}. Ending session...`);
      await this.stopLiveMilking();
    }
  }

  /**
   * Finalize milking session, run AI risk analysis, and generate alerts
   */
  public async finalizeSession(sessionId: string): Promise<any> {
    const session = await prisma.milkingSession.findUnique({
      where: { id: sessionId },
      include: {
        cow: {
          include: { baseline: true, healthProfile: true }
        },
        readings: { orderBy: { timestamp: 'asc' } },
        station: true
      }
    });

    if (!session) return null;

    const readings = session.readings;
    const count = readings.length || 1;

    // Aggregate session metrics
    const totalVolume = readings.length > 0 ? readings[readings.length - 1].totalVolume : 14.2;
    const peakFlow = Math.max(...(readings.map((r) => r.flowRate).concat([3.8])));
    const averageFlow = parseFloat((totalVolume / (Math.max(1, readings.length * 2) / 60)).toFixed(2));
    const averageTemp = parseFloat((readings.reduce((acc, r) => acc + r.temperature, 0) / count).toFixed(1));
    const averageCond = parseFloat((readings.reduce((acc, r) => acc + r.conductivity, 0) / count).toFixed(2));
    const averagePh = parseFloat((readings.reduce((acc, r) => acc + r.ph, 0) / count).toFixed(2));
    const averageScc = Math.round(readings.reduce((acc, r) => acc + r.scc, 0) / count);

    const cow = session.cow;
    const baseline = cow?.baseline;
    const baselineYield = baseline?.baselineMilkYield || 14.0;
    const yieldDeviation = parseFloat((((totalVolume - baselineYield) / baselineYield) * 100).toFixed(1));

    // Prepare CowFeatures for AI Risk Engine
    const features: CowFeatures = {
      cowId: cow?.id || 'unknown',
      sessionId: session.id,
      currentScc: averageScc,
      scc7DayAverage: baseline?.baselineScc ? baseline.baselineScc * 1.05 : 125,
      scc30DayAverage: baseline?.baselineScc || 120,
      sccChangePercent: baseline?.baselineScc
        ? parseFloat((((averageScc - baseline.baselineScc) / baseline.baselineScc) * 100).toFixed(1))
        : 0,
      currentMilkYield: totalVolume,
      milkYield7DayAverage: baselineYield * 0.98,
      milkYieldChangePercent: yieldDeviation,
      currentConductivity: averageCond,
      conductivityBaseline: baseline?.baselineConductivity || 5.6,
      conductivityChangePercent: baseline?.baselineConductivity
        ? parseFloat((((averageCond - baseline.baselineConductivity) / baseline.baselineConductivity) * 100).toFixed(1))
        : 0,
      currentPh: averagePh,
      phBaseline: baseline?.baselinePh || 6.65,
      phDeviation: parseFloat((averagePh - (baseline?.baselinePh || 6.65)).toFixed(2)),
      currentTemperature: averageTemp,
      temperatureBaseline: baseline?.baselineTemperature || 38.5,
      currentFlowRate: averageFlow,
      peakFlow,
      flowPatternChange: 0,
      daysInMilk: cow?.daysInMilk || 60,
      lactationNumber: cow?.lactationNumber || 2,
      previousRiskScore: cow?.healthProfile?.currentRiskScore || 15
    };

    // Run AI Risk Model
    const riskResult = this.riskEngine.calculateRisk(features);

    // Retrieve recent risk scores for trend calculation
    const recentPredictions = cow
      ? await prisma.aiPrediction.findMany({
          where: { cowId: cow.id },
          orderBy: { createdAt: 'desc' },
          take: 5
        })
      : [];
    const trendHistory = recentPredictions.map((p) => p.riskScore).reverse();
    trendHistory.push(riskResult.riskScore);

    // Calculate 24-72h Predictive Forecast (SIH PS 26109 Core Objective)
    const forecastResult = this.riskEngine.calculateForecast
      ? this.riskEngine.calculateForecast(riskResult.riskScore, trendHistory, features)
      : {
          currentRiskScore: riskResult.riskScore,
          currentRiskLevel: riskResult.riskLevel,
          forecastScore: riskResult.riskScore,
          forecastLevel: riskResult.riskLevel,
          riskDirection: 'STABLE' as any,
          forecastHorizon: 'Next 24–72 hours',
          confidence: 0.94,
          topFactors: [],
          recommendedAction: 'Continue routine line monitoring.'
        };

    // Save AI Prediction with Forecasting to Database
    if (cow) {
      const prediction = await prisma.aiPrediction.create({
        data: {
          cowId: cow.id,
          sessionId: session.id,
          riskScore: riskResult.riskScore,
          riskLevel: riskResult.riskLevel,
          forecastScore: forecastResult.forecastScore,
          forecastLevel: forecastResult.forecastLevel,
          riskDirection: forecastResult.riskDirection,
          forecastHorizon: forecastResult.forecastHorizon,
          recommendedAction: forecastResult.recommendedAction,
          targetLabel: forecastResult.forecastLevel === RiskLevel.VERY_HIGH ? 'CONFIRMED_MASTITIS' : forecastResult.forecastLevel === RiskLevel.HIGH ? 'HIGH_RISK' : forecastResult.forecastLevel === RiskLevel.MODERATE ? 'EARLY_WARNING' : 'NO_MASTITIS',
          predictionType: 'MASTITIS_RISK',
          confidence: riskResult.confidence,
          explanation: riskResult.explanation
        }
      });

      // Save individual factor contributions
      await prisma.aiPredictionFactor.createMany({
        data: riskResult.factors.map((f) => ({
          predictionId: prediction.id,
          factorName: f.factorName,
          factorValue: f.factorValue,
          baselineValue: f.baselineValue,
          deviationPercent: f.deviationPercent,
          contribution: f.contribution,
          direction: f.direction
        }))
      });

      // Update Cow Health Profile with both Current Risk and Predictive Forecast
      await prisma.cowHealthProfile.upsert({
        where: { cowId: cow.id },
        create: {
          cowId: cow.id,
          currentRiskScore: riskResult.riskScore,
          currentRiskLevel: riskResult.riskLevel,
          forecastRiskScore: forecastResult.forecastScore,
          forecastRiskLevel: forecastResult.forecastLevel,
          riskDirection: forecastResult.riskDirection,
          recommendedAction: forecastResult.recommendedAction,
          currentScc: averageScc,
          currentPh: averagePh,
          currentConductivity: averageCond,
          currentTemperature: averageTemp,
          currentMilkYield: totalVolume,
          lastMilkingDate: new Date()
        },
        update: {
          currentRiskScore: riskResult.riskScore,
          currentRiskLevel: riskResult.riskLevel,
          forecastRiskScore: forecastResult.forecastScore,
          forecastRiskLevel: forecastResult.forecastLevel,
          riskDirection: forecastResult.riskDirection,
          recommendedAction: forecastResult.recommendedAction,
          currentScc: averageScc,
          currentPh: averagePh,
          currentConductivity: averageCond,
          currentTemperature: averageTemp,
          currentMilkYield: totalVolume,
          lastMilkingDate: new Date()
        }
      });

      // Trigger Alert if risk or forecast is HIGH or VERY_HIGH
      if (
        riskResult.riskLevel === RiskLevel.HIGH ||
        riskResult.riskLevel === RiskLevel.VERY_HIGH ||
        forecastResult.forecastLevel === RiskLevel.HIGH ||
        forecastResult.forecastLevel === RiskLevel.VERY_HIGH
      ) {
        const isCritical = riskResult.riskLevel === RiskLevel.VERY_HIGH || forecastResult.forecastLevel === RiskLevel.VERY_HIGH;
        const newAlert = await prisma.alert.create({
          data: {
            farmId: session.station.farmId,
            cowId: cow.id,
            sessionId: session.id,
            alertType: forecastResult.riskDirection === 'INCREASING' ? 'INDIVIDUAL_COW_RISK' : 'MASTITIS_RISK',
            severity: isCritical ? 'CRITICAL' : 'HIGH',
            title: `Early Mastitis Warning: ${cow.cowCode} (${forecastResult.riskDirection} Risk)`,
            message: `${riskResult.explanation} Recommended Action: ${forecastResult.recommendedAction}`,
            status: 'ACTIVE'
          }
        });
        socketService.emitAlertCreated(newAlert);
      }
    }

    // Complete session in state machine & DB
    const finalSession = await sessionStateMachine.completeSession(sessionId, {
      totalVolume,
      averageFlow,
      peakFlow,
      averageTemperature: averageTemp,
      averageConductivity: averageCond,
      averagePh: averagePh,
      averageScc: averageScc,
      milkYieldDeviationPercent: yieldDeviation,
      riskScore: riskResult.riskScore,
      riskLevel: riskResult.riskLevel
    });

    console.log(`[Simulation] Session ${sessionId} completed. AI Risk Score: ${riskResult.riskScore} (${riskResult.riskLevel}), Forecast: ${forecastResult.forecastScore} (${forecastResult.forecastLevel}, ${forecastResult.riskDirection})`);
    return {
      session: finalSession,
      riskResult,
      forecastResult
    };
  }

  /**
   * Run one of the 9 preset demo scenarios
   */
  public async runDemoScenario(scenario: string, stationId: string, customCowId?: string): Promise<any> {
    console.log(`[Simulation] Running demo scenario: ${scenario}`);

    switch (scenario) {
      case 'NORMAL_COW': {
        this.simulator.resetAllSensors();
        return await this.startLiveMilking(stationId, 'COW-001');
      }
      case 'EARLY_WARNING': {
        this.simulator.resetAllSensors();
        return await this.startLiveMilking(stationId, 'COW-021');
      }
      case 'HIGH_RISK': {
        this.simulator.resetAllSensors();
        return await this.startLiveMilking(stationId, 'COW-026');
      }
      case 'RFID_MISSED': {
        this.stopLiveMilking();
        this.simulator.resetAllSensors();
        // Start session without RFID identification -> marked UNIDENTIFIED
        const unidentifiedSession = await sessionStateMachine.createAndStartSession(stationId);
        this.activeSessionId = unidentifiedSession.id;
        this.activeStationId = stationId;
        this.simulator.startSession({
          ...DEMO_COW_PROFILES.NORMAL,
          cowCode: 'UNIDENTIFIED'
        });
        this.timer = setInterval(() => this.handleTick(), this.tickIntervalMs);
        return {
          status: 'UNIDENTIFIED_SESSION',
          message: 'RFID Missed. Session started as UNIDENTIFIED. Operator can assign cow manually.',
          session: unidentifiedSession
        };
      }
      case 'UNKNOWN_RFID': {
        return await sessionStateMachine.handleRfidScan('RFID-UNKNOWN-999', 'RFID-RDR-01', stationId);
      }
      case 'SENSOR_FAILURE': {
        // Toggle SomaDetect and pH sensor to offline
        this.simulator.setSensorFault('SOMADETECT', SensorStatus.OFFLINE);
        this.simulator.setSensorFault('PH', SensorStatus.ERROR);
        socketService.emitSensorStatus({
          stationId,
          sensors: {
            somaDetect: SensorStatus.OFFLINE,
            phSensor: SensorStatus.ERROR
          }
        });
        return {
          status: 'SENSOR_FAULT_TRIGGERED',
          message: 'Simulated SomaDetect OFFLINE and pH Sensor ERROR. Data quality degraded to WARNING/OFFLINE.'
        };
      }
      case 'NETWORK_FAILURE': {
        this.setNetworkOnline(false);
        return {
          status: 'NETWORK_OFFLINE',
          message: 'Simulated edge network failure. Live readings buffered in edge memory.'
        };
      }
      case 'CIP_CYCLE': {
        this.stopLiveMilking();
        sessionStateMachine.setStationState(stationId, { status: SessionStatus.CIP });
        return {
          status: 'CIP_TRIGGERED',
          message: 'Clean-In-Place pipeline activated. Milking locked. CIP data strictly isolated.'
        };
      }
      case 'MULTI_COW_FLOW':
      case 'MULTIPLE_COWS': {
        // Multi-cow sequential demonstration: step through cows safely
        this.simulator.resetAllSensors();
        const session1 = await this.startLiveMilking(stationId, 'COW-001');
        return {
          status: 'MULTI_COW_SEQUENCE_STARTED',
          message: 'Sequential Multi-Cow pipeline initiated. Step 1 (COW-001) milking active on shared line.',
          session: session1
        };
      }
      case 'HERD_RISK_INCREASE': {
        // Multi-cow prodromal surge across the herd
        const cows = await prisma.cow.findMany({ take: 6 });
        for (let i = 0; i < cows.length; i++) {
          const cow = cows[i];
          const newScore = 60 + i * 5;
          await prisma.cowHealthProfile.upsert({
            where: { cowId: cow.id },
            create: {
              cowId: cow.id,
              currentRiskScore: newScore - 10,
              currentRiskLevel: 'HIGH',
              forecastRiskScore: newScore + 10,
              forecastRiskLevel: 'VERY_HIGH',
              riskDirection: 'INCREASING',
              recommendedAction: 'Cluster-wide disinfection and veterinary physical palpation.'
            },
            update: {
              currentRiskScore: newScore - 10,
              currentRiskLevel: 'HIGH',
              forecastRiskScore: newScore + 10,
              forecastRiskLevel: 'VERY_HIGH',
              riskDirection: 'INCREASING',
              recommendedAction: 'Cluster-wide disinfection and veterinary physical palpation.'
            }
          });
        }
        const station = await prisma.milkingStation.findUnique({ where: { id: stationId } });
        const farmId = station?.farmId || 'farm-sih-01';
        const herdAlert = await prisma.alert.create({
          data: {
            farmId,
            alertType: 'HERD_RISK_INCREASE',
            severity: 'CRITICAL',
            title: 'Herd Risk Index Surge: 6 Cows Trending Upward',
            message: 'Multi-cow predictive forecast shows 35% of milking herd entering high mastitis risk over the next 48 hours. Parlor sanitation review required.',
            status: 'ACTIVE'
          }
        });
        socketService.emitAlertCreated(herdAlert);
        return {
          status: 'HERD_RISK_INCREASED',
          message: 'Simulated herd-wide prodromal surge: 6 cows updated to INCREASING risk trajectory; critical herd warning generated.',
          alert: herdAlert
        };
      }
      case 'ENVIRONMENTAL_STRESS': {
        const station = await prisma.milkingStation.findUnique({ where: { id: stationId } });
        const farmId = station?.farmId || 'farm-sih-01';
        const envReading = await prisma.farmEnvironmentReading.create({
          data: {
            farmId,
            temperature: 36.2,
            humidity: 84.0,
            hygieneScore: 4.5,
            hygieneStatus: 'POOR',
            sensorSource: 'SIMULATOR'
          }
        });
        const envAlert = await prisma.alert.create({
          data: {
            farmId,
            alertType: 'ENVIRONMENTAL_STRESS',
            severity: 'HIGH',
            title: 'Barn Heat & Humidity Stress (THI 85.4 - Severe)',
            message: 'Ambient temp 36.2°C and 84% humidity exceeded heat stress threshold. Cow immune response suppressed; udder infection risk elevated.',
            status: 'ACTIVE'
          }
        });
        socketService.emitAlertCreated(envAlert);
        return {
          status: 'ENVIRONMENTAL_STRESS_ACTIVE',
          message: 'Simulated severe ambient heat stress (THI 85.4) and wet bedding hygiene score 4.5.',
          reading: envReading,
          alert: envAlert
        };
      }
      case 'ACTIVITY_DROP': {
        const targetCow = customCowId
          ? await prisma.cow.findUnique({ where: { id: customCowId } })
          : await prisma.cow.findFirst({ where: { cowCode: 'COW-021' } });
        if (!targetCow) throw new Error('Target cow not found for activity drop scenario');

        const vitalsReading = await prisma.animalVitalsReading.create({
          data: {
            cowId: targetCow.id,
            bodyTemperature: 39.4,
            activitySteps: 1350, // -55% vs baseline
            ruminationMinutes: 390,
            feedIntakeKg: 38.0,
            sensorSource: 'SIMULATOR',
            dataQuality: 'GOOD'
          }
        });
        const station = await prisma.milkingStation.findUnique({ where: { id: stationId } });
        const activityAlert = await prisma.alert.create({
          data: {
            farmId: station?.farmId || 'farm-sih-01',
            cowId: targetCow.id,
            alertType: 'ANIMAL_ACTIVITY_DROP',
            severity: 'HIGH',
            title: `Pedometry Lethargy Alert: ${targetCow.cowCode} -58% Steps`,
            message: `Collar/Pedometer telemetry indicates 1,350 daily steps (baseline 3,200). Early systemic symptom prior to visible mastitis clinical signs.`,
            status: 'ACTIVE'
          }
        });
        socketService.emitAlertCreated(activityAlert);
        return {
          status: 'ACTIVITY_DROP_LOGGED',
          message: `Logged sharp activity drop for ${targetCow.cowCode} (1,350 steps/day) and generated pedometry alert.`,
          reading: vitalsReading,
          alert: activityAlert
        };
      }
      case 'RUMINATION_DROP': {
        const targetCow = customCowId
          ? await prisma.cow.findUnique({ where: { id: customCowId } })
          : await prisma.cow.findFirst({ where: { cowCode: 'COW-026' } });
        if (!targetCow) throw new Error('Target cow not found for rumination drop scenario');

        const vitalsReading = await prisma.animalVitalsReading.create({
          data: {
            cowId: targetCow.id,
            bodyTemperature: 39.6,
            activitySteps: 2200,
            ruminationMinutes: 240, // -50% vs baseline
            feedIntakeKg: 31.0,
            sensorSource: 'SIMULATOR',
            dataQuality: 'GOOD'
          }
        });
        const station = await prisma.milkingStation.findUnique({ where: { id: stationId } });
        const ruminationAlert = await prisma.alert.create({
          data: {
            farmId: station?.farmId || 'farm-sih-01',
            cowId: targetCow.id,
            alertType: 'RUMINATION_DROP',
            severity: 'HIGH',
            title: `Severe Rumination Suppression: ${targetCow.cowCode} (240 min/day)`,
            message: `Acoustic rumination collar reports 240 min/day (normal: 480 min). Rumination dropped 50% indicating pain and metabolic stress.`,
            status: 'ACTIVE'
          }
        });
        socketService.emitAlertCreated(ruminationAlert);
        return {
          status: 'RUMINATION_DROP_LOGGED',
          message: `Logged acute rumination drop for ${targetCow.cowCode} (240 min/day) and generated collar alert.`,
          reading: vitalsReading,
          alert: ruminationAlert
        };
      }
      case 'FEED_INTAKE_DROP': {
        const targetCow = customCowId
          ? await prisma.cow.findUnique({ where: { id: customCowId } })
          : await prisma.cow.findFirst({ where: { cowCode: 'COW-021' } });
        if (!targetCow) throw new Error('Target cow not found for feed intake drop scenario');

        const vitalsReading = await prisma.animalVitalsReading.create({
          data: {
            cowId: targetCow.id,
            bodyTemperature: 39.1,
            activitySteps: 2600,
            ruminationMinutes: 410,
            feedIntakeKg: 22.5, // -50% vs baseline
            sensorSource: 'SIMULATOR',
            dataQuality: 'GOOD'
          }
        });
        const station = await prisma.milkingStation.findUnique({ where: { id: stationId } });
        const feedAlert = await prisma.alert.create({
          data: {
            farmId: station?.farmId || 'farm-sih-01',
            cowId: targetCow.id,
            alertType: 'FEED_INTAKE_DROP',
            severity: 'MEDIUM',
            title: `Appetite Drop Alert: ${targetCow.cowCode} (22.5 kg/day)`,
            message: `Automated feed bunk scale recorded 22.5 kg dry matter intake vs personal baseline 45.0 kg.`,
            status: 'ACTIVE'
          }
        });
        socketService.emitAlertCreated(feedAlert);
        return {
          status: 'FEED_INTAKE_DROP_LOGGED',
          message: `Logged feed intake drop for ${targetCow.cowCode} (22.5 kg/day).`,
          reading: vitalsReading,
          alert: feedAlert
        };
      }
      case 'RESET': {
        await this.stopLiveMilking();
        this.simulator.resetAllSensors();
        this.setNetworkOnline(true);
        sessionStateMachine.setStationState(stationId, {
          status: SessionStatus.IDLE,
          activeSessionId: null,
          scannedTagUid: null,
          identifiedCowId: null,
          identifiedCowCode: null,
          identifiedCowName: null,
          elapsedSeconds: 0
        });
        socketService.emitSensorStatus({
          stationId,
          sensors: {
            somaDetect: SensorStatus.ONLINE,
            foodmag: SensorStatus.ONLINE,
            phSensor: SensorStatus.ONLINE,
            rfid: SensorStatus.ONLINE
          }
        });
        return {
          status: 'RESET_COMPLETE',
          message: 'Simulation line and hardware sensors reset to IDLE and ONLINE.'
        };
      }
      default:
        throw new Error(`Unknown scenario: ${scenario}`);
    }
  }
}

export const simulationService = SimulationService.getInstance();

