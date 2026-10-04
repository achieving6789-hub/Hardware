import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../database';
import {
  PROTOTYPE_DISCLAIMER,
  AnimalVitalsInputSchema,
  FarmEnvironmentInputSchema,
  VaccinationRecordInputSchema,
  TreatmentRecordInputSchema,
  RiskLevel,
  RiskDirection
} from '../shared';
import { RuleBasedRiskModel } from '../ai';
import { authenticateJwt } from '../middleware/auth';

const router = Router();
const aiEngine = new RuleBasedRiskModel();

// GET /api/health/herd-forecast - Herd-level Mastitis Risk Forecasting (SIH PS 26109 Core Objective)
router.get('/herd-forecast', authenticateJwt, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [cows, latestEnv] = await Promise.all([
      prisma.cow.findMany({
        include: {
          healthProfile: true,
          baseline: true
        }
      }),
      prisma.farmEnvironmentReading.findFirst({
        orderBy: { timestamp: 'desc' }
      })
    ]);

    const cowSummaries = cows.map((c) => ({
      cowId: c.id,
      cowCode: c.cowCode,
      riskScore: c.healthProfile?.currentRiskScore || 15,
      forecastRiskScore: c.healthProfile?.forecastRiskScore || 15,
      riskLevel: (c.healthProfile?.currentRiskLevel as RiskLevel) || RiskLevel.LOW,
      lactationStage: c.lactationStage,
      riskDirection: (c.healthProfile?.riskDirection as RiskDirection) || RiskDirection.STABLE
    }));

    const envData = latestEnv
      ? {
          thi: (1.8 * latestEnv.temperature + 32) - (0.55 - 0.0055 * latestEnv.humidity) * (1.8 * latestEnv.temperature - 26),
          hygieneScore: latestEnv.hygieneScore,
          ambientTemp: latestEnv.temperature
        }
      : { thi: 68, hygieneScore: 2, ambientTemp: 24 };

    const herdRiskResult = aiEngine.calculateHerdRiskIndex(cowSummaries, envData);

    res.json({
      success: true,
      title: 'Herd-Level Early Mastitis Risk Forecasting',
      sihProblemStatement: 'PS 26109',
      disclaimer: PROTOTYPE_DISCLAIMER,
      forecastHorizon: 'Next 24–72 hours',
      herdRisk: herdRiskResult,
      environmentTelemetry: latestEnv || {
        temperature: 24.5,
        humidity: 62.0,
        hygieneScore: 2.0,
        hygieneStatus: 'GOOD',
        sensorSource: 'SIMULATOR',
        timestamp: new Date()
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/health/cows - Udder Health Risk Monitoring table data
router.get('/cows', authenticateJwt, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { riskLevel, sortBy = 'risk', sortOrder = 'desc' } = req.query;

    const where: any = {};
    if (riskLevel && riskLevel !== 'ALL') {
      where.currentRiskLevel = String(riskLevel);
    }

    const healthProfiles = await prisma.cowHealthProfile.findMany({
      where,
      include: {
        cow: {
          include: {
            baseline: true,
            alerts: { where: { status: 'ACTIVE' }, take: 1, orderBy: { createdAt: 'desc' } },
            vitalsReadings: { orderBy: { timestamp: 'desc' }, take: 1 }
          }
        }
      }
    });

    const items = healthProfiles.map((p) => {
      const cow = p.cow;
      const base = cow.baseline;
      const latestVitals = cow.vitalsReadings[0];

      const sccDeviation = base?.baselineScc
        ? parseFloat((((p.currentScc - base.baselineScc) / base.baselineScc) * 100).toFixed(1))
        : 0;

      const yieldDeviation = base?.baselineMilkYield
        ? parseFloat((((p.currentMilkYield - base.baselineMilkYield) / base.baselineMilkYield) * 100).toFixed(1))
        : 0;

      const condDeviation = base?.baselineConductivity
        ? parseFloat((((p.currentConductivity - base.baselineConductivity) / base.baselineConductivity) * 100).toFixed(1))
        : 0;

      return {
        id: p.id,
        cowId: cow.id,
        cowCode: cow.cowCode,
        name: cow.name,
        breed: cow.breed,
        daysInMilk: cow.daysInMilk,
        lactationNumber: cow.lactationNumber,
        lactationStage: cow.lactationStage,
        currentRiskScore: p.currentRiskScore,
        currentRiskLevel: p.currentRiskLevel,
        forecastRiskScore: p.forecastRiskScore,
        forecastRiskLevel: p.forecastRiskLevel,
        riskDirection: p.riskDirection,
        recommendedAction: p.recommendedAction,
        currentScc: p.currentScc,
        sccDeviationPercent: sccDeviation,
        currentMilkYield: p.currentMilkYield,
        yieldDeviationPercent: yieldDeviation,
        currentConductivity: p.currentConductivity,
        conductivityDeviationPercent: condDeviation,
        currentPh: p.currentPh,
        currentTemperature: p.currentTemperature,
        lastMilkingDate: p.lastMilkingDate,
        ruminationMinutes: latestVitals?.ruminationMinutes || 480,
        activitySteps: latestVitals?.activitySteps || 3200,
        numPreviousMastitisEpisodes: cow.numPreviousMastitisEpisodes,
        activeAlert: cow.alerts[0] || null
      };
    });

    // Custom sorting
    items.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'risk') comparison = b.currentRiskScore - a.currentRiskScore;
      else if (sortBy === 'forecast') comparison = b.forecastRiskScore - a.forecastRiskScore;
      else if (sortBy === 'scc') comparison = b.currentScc - a.currentScc;
      else if (sortBy === 'yield') comparison = b.currentMilkYield - a.currentMilkYield;
      else if (sortBy === 'conductivity') comparison = b.currentConductivity - a.currentConductivity;
      else if (sortBy === 'code') comparison = a.cowCode.localeCompare(b.cowCode);

      return sortOrder === 'asc' ? -comparison : comparison;
    });

    res.json({
      success: true,
      title: 'Individual Cow Udder Health & Early Forecast Monitoring',
      disclaimer: PROTOTYPE_DISCLAIMER,
      count: items.length,
      cows: items
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/health/cows/:id - Detailed health & forecast dossier with multimodal history
router.get('/cows/:cowId', authenticateJwt, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const cow = await prisma.cow.findUnique({
      where: { id: req.params.cowId },
      include: {
        baseline: true,
        healthProfile: true,
        sessions: {
          orderBy: { startTime: 'desc' },
          take: 30,
          include: {
            predictions: { include: { factors: true } }
          }
        },
        alerts: { orderBy: { createdAt: 'desc' }, take: 20 },
        vitalsReadings: { orderBy: { timestamp: 'desc' }, take: 15 },
        vaccinations: { orderBy: { administeredDate: 'desc' } },
        treatments: { orderBy: { treatmentDate: 'desc' } }
      }
    });

    if (!cow) {
      res.status(404).json({ success: false, error: 'Cow not found' });
      return;
    }

    res.json({
      success: true,
      disclaimer: PROTOTYPE_DISCLAIMER,
      cow
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/health/vitals - Ingest animal vitals (neck collar / pedometer)
router.post('/vitals', authenticateJwt, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsed = AnimalVitalsInputSchema.parse(req.body);
    const reading = await prisma.animalVitalsReading.create({
      data: {
        cowId: parsed.cowId,
        timestamp: parsed.timestamp ? new Date(parsed.timestamp) : new Date(),
        bodyTemperature: parsed.bodyTemperature,
        activitySteps: parsed.activitySteps,
        ruminationMinutes: parsed.ruminationMinutes,
        feedIntakeKg: parsed.feedIntakeKg,
        sensorSource: parsed.sensorSource,
        dataQuality: parsed.dataQuality
      }
    });
    res.status(201).json({ success: true, reading });
  } catch (error) {
    next(error);
  }
});

// GET /api/health/environment - Get barn environment status & history
router.get('/environment', authenticateJwt, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const readings = await prisma.farmEnvironmentReading.findMany({
      orderBy: { timestamp: 'desc' },
      take: 24
    });
    const latest = readings[0] || null;
    res.json({
      success: true,
      latest,
      history: readings
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/health/environment - Ingest barn telemetry
router.post('/environment', authenticateJwt, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsed = FarmEnvironmentInputSchema.parse(req.body);
    const reading = await prisma.farmEnvironmentReading.create({
      data: {
        farmId: parsed.farmId || 'farm-sih-01',
        timestamp: parsed.timestamp ? new Date(parsed.timestamp) : new Date(),
        temperature: parsed.temperature,
        humidity: parsed.humidity,
        hygieneScore: parsed.hygieneScore,
        hygieneStatus: parsed.hygieneStatus,
        sensorSource: parsed.sensorSource
      }
    });
    res.status(201).json({ success: true, reading });
  } catch (error) {
    next(error);
  }
});

// POST /api/health/vaccinations - Add vaccination record
router.post('/vaccinations', authenticateJwt, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsed = VaccinationRecordInputSchema.parse(req.body);
    const record = await prisma.vaccinationRecord.create({
      data: {
        cowId: parsed.cowId,
        vaccineName: parsed.vaccineName,
        administeredDate: parsed.administeredDate ? new Date(parsed.administeredDate) : new Date(),
        nextDueDate: parsed.nextDueDate ? new Date(parsed.nextDueDate) : null,
        status: parsed.status,
        notes: parsed.notes
      }
    });
    res.status(201).json({ success: true, record });
  } catch (error) {
    next(error);
  }
});

// POST /api/health/treatments - Add treatment record
router.post('/treatments', authenticateJwt, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsed = TreatmentRecordInputSchema.parse(req.body);
    const record = await prisma.treatmentRecord.create({
      data: {
        cowId: parsed.cowId,
        treatmentName: parsed.treatmentName,
        treatmentDate: parsed.treatmentDate ? new Date(parsed.treatmentDate) : new Date(),
        reason: parsed.reason,
        durationDays: parsed.durationDays,
        outcome: parsed.outcome,
        notes: parsed.notes
      }
    });
    res.status(201).json({ success: true, record });
  } catch (error) {
    next(error);
  }
});

export default router;


