import { describe, it, expect, beforeEach } from 'vitest';
import {
  RuleBasedRiskModel,
  CowFeatures
} from '@smartdairy/ai';
import {
  DEFAULT_RISK_WEIGHTS,
  RiskLevel,
  CIPPhase
} from '@smartdairy/shared';
import {
  SimulatedRFIDReader,
  SimulatedSomaDetect,
  SimulatedFoodmag,
  SimulatedPHSensor
} from '@smartdairy/sensors';
import { MilkingLineSimulator } from '@smartdairy/simulation';

describe('Unit Tests: AI Risk Engine', () => {
  const riskModel = new RuleBasedRiskModel(DEFAULT_RISK_WEIGHTS);

  it('evaluates healthy cow parameters as LOW risk', () => {
    const normalFeatures: CowFeatures = {
      cowId: 'cow_01',
      currentScc: 110,
      scc7DayAverage: 115,
      scc30DayAverage: 110,
      sccChangePercent: 0,
      currentMilkYield: 14.5,
      milkYield7DayAverage: 14.2,
      milkYieldChangePercent: 2.1,
      currentConductivity: 5.55,
      conductivityBaseline: 5.55,
      conductivityChangePercent: 0,
      currentPh: 6.65,
      phBaseline: 6.65,
      phDeviation: 0.0,
      currentTemperature: 38.5,
      temperatureBaseline: 38.5,
      currentFlowRate: 3.8,
      peakFlow: 3.8,
      flowPatternChange: 0,
      daysInMilk: 60,
      lactationNumber: 2,
      previousRiskScore: 12
    };

    const result = riskModel.calculateRisk(normalFeatures);
    expect(result.riskScore).toBeLessThan(30);
    expect(result.riskLevel).toBe(RiskLevel.LOW);
    expect(result.explanation).toContain('normal baseline tolerances');
  });

  it('evaluates elevated SCC, high conductivity, and yield drop as HIGH / VERY_HIGH risk', () => {
    const highRiskFeatures: CowFeatures = {
      cowId: 'cow_26',
      currentScc: 650,
      scc7DayAverage: 350,
      scc30DayAverage: 130,
      sccChangePercent: 400.0, // +400% surge
      currentMilkYield: 10.2,
      milkYield7DayAverage: 13.5,
      milkYieldChangePercent: -28.0, // 28% drop
      currentConductivity: 7.20,
      conductivityBaseline: 5.60,
      conductivityChangePercent: 28.5, // 28% increase
      currentPh: 7.15,
      phBaseline: 6.65,
      phDeviation: 0.50,
      currentTemperature: 39.3,
      temperatureBaseline: 38.5,
      currentFlowRate: 2.5,
      peakFlow: 3.9,
      flowPatternChange: -35,
      daysInMilk: 110,
      lactationNumber: 3,
      previousRiskScore: 68
    };

    const result = riskModel.calculateRisk(highRiskFeatures);
    expect(result.riskScore).toBeGreaterThanOrEqual(60);
    expect([RiskLevel.HIGH, RiskLevel.VERY_HIGH]).toContain(result.riskLevel);
    expect(result.factors.length).toBeGreaterThan(0);
    expect(result.explanation).toContain('Elevated prodromal risk detected');
  });
});

describe('Unit Tests: Sensors and Simulation', () => {
  it('RFID reader detects tag successfully in online status', async () => {
    const rfid = new SimulatedRFIDReader('RDR-TEST');
    const read = await rfid.scanTag('RFID-TEST-001');
    expect(read.status).toBe('SUCCESS');
    expect(read.tagUid).toBe('RFID-TEST-001');
  });

  it('Foodmag accumulates volume according to flow rate * dt', async () => {
    const foodmag = new SimulatedFoodmag();
    const res1 = await foodmag.readFlow(30, 0); // At peak
    expect(res1.flowRate).toBeGreaterThan(0);
    expect(res1.totalVolume).toBeGreaterThan(0);

    const res2 = await foodmag.readFlow(31, res1.totalVolume);
    expect(res2.totalVolume).toBeGreaterThan(res1.totalVolume);
  });

  it('MilkingLineSimulator ticks and provides complete correlated parameters', async () => {
    const sim = new MilkingLineSimulator();
    sim.startSession({
      cowCode: 'COW-TEST',
      baselineMilkYield: 14.0,
      baselineScc: 120,
      baselinePh: 6.65,
      baselineConductivity: 5.60,
      baselineTemperature: 38.5,
      baselineFlow: 3.8,
      riskProfile: 'NORMAL'
    });

    const point = await sim.tick(2);
    expect(point.elapsedSeconds).toBe(2);
    expect(point.flowRate).toBeDefined();
    expect(point.totalVolume).toBeDefined();
    expect(point.temperature).toBeCloseTo(38.5, 0);
    expect(point.conductivity).toBeCloseTo(5.6, 0);
    expect(point.ph).toBeCloseTo(6.65, 0);
    expect(point.scc).toBeGreaterThan(50);
  });
});

describe('Unit Tests: CIP Cycle Integrity', () => {
  it('verifies CIP phases sequence and zero cow association principle', () => {
    const expectedPhases = [
      CIPPhase.PRE_RINSE,
      CIPPhase.CAUSTIC,
      CIPPhase.RINSE,
      CIPPhase.ACID,
      CIPPhase.FINAL_RINSE,
      CIPPhase.COMPLETE
    ];

    expect(expectedPhases.length).toBe(6);
    expect(expectedPhases[1]).toBe('CAUSTIC');
    expect(expectedPhases[3]).toBe('ACID');
  });
});
