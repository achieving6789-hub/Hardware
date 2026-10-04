import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../database';
import { CowCreateSchema, UserRole } from '../shared';
import { authenticateJwt, requireRoles } from '../middleware/auth';

const router = Router();

// GET /api/cows - list all cows with baselines and current health status
router.get('/', authenticateJwt, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { riskLevel, breed, search } = req.query;

    const whereClause: any = {};
    if (riskLevel && riskLevel !== 'undefined' && riskLevel !== 'ALL') {
      whereClause.healthStatus = String(riskLevel);
    }
    if (breed && breed !== 'undefined' && breed !== 'ALL') {
      whereClause.breed = String(breed);
    }
    if (search && search !== 'undefined' && String(search).trim() !== '') {
      const q = String(search).trim();
      whereClause.OR = [
        { cowCode: { contains: q } },
        { name: { contains: q } },
        { rfidId: { contains: q } }
      ];
    }

    const cows = await prisma.cow.findMany({
      where: whereClause,
      include: {
        baseline: true,
        healthProfile: true,
        rfidTag: true,
        alerts: {
          where: { status: 'ACTIVE' },
          take: 3
        }
      },
      orderBy: { cowCode: 'asc' }
    });

    res.json({ success: true, count: cows.length, cows });
  } catch (error) {
    next(error);
  }
});

// GET /api/cows/:id - get single cow with detailed history
router.get('/:id', authenticateJwt, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const cow = await prisma.cow.findUnique({
      where: { id: req.params.id },
      include: {
        farm: true,
        baseline: true,
        healthProfile: true,
        rfidTag: true,
        sessions: {
          orderBy: { startTime: 'desc' },
          take: 30,
          include: {
            predictions: { include: { factors: true } }
          }
        },
        alerts: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        predictions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { factors: true }
        }
      }
    });

    if (!cow) {
      res.status(404).json({ success: false, error: 'Cow not found.' });
      return;
    }

    res.json({ success: true, cow });
  } catch (error) {
    next(error);
  }
});

// POST /api/cows - create a new cow (Admin / Farm Manager)
router.post(
  '/',
  authenticateJwt,
  requireRoles(UserRole.FARM_MANAGER),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = CowCreateSchema.parse(req.body);
      const farmId = data.farmId || req.user?.farmId || (await prisma.farm.findFirst())?.id;

      if (!farmId) {
        res.status(400).json({ success: false, error: 'No farm registered in the system.' });
        return;
      }

      const cow = await prisma.cow.create({
        data: {
          farmId,
          cowCode: data.cowCode,
          rfidId: data.rfidId,
          name: data.name,
          breed: data.breed,
          age: data.age,
          lactationNumber: data.lactationNumber,
          parity: data.parity,
          daysInMilk: data.daysInMilk,
          bodyWeight: data.bodyWeight,
          status: data.status,
          healthStatus: data.healthStatus
        }
      });

      // Automatically create RFID tag and initial baseline
      await prisma.rfidTag.create({
        data: {
          tagUid: data.rfidId,
          cowId: cow.id,
          status: 'ACTIVE'
        }
      });

      await prisma.cowBaseline.create({
        data: {
          cowId: cow.id,
          baselineMilkYield: 14.0,
          baselineScc: 120.0,
          baselinePh: 6.65,
          baselineConductivity: 5.60,
          baselineTemperature: 38.5,
          baselineFlow: 3.8,
          calculationWindowDays: 30
        }
      });

      await prisma.cowHealthProfile.create({
        data: {
          cowId: cow.id,
          currentRiskScore: 10.0,
          currentRiskLevel: 'LOW',
          currentScc: 120.0,
          currentPh: 6.65,
          currentConductivity: 5.60,
          currentTemperature: 38.5,
          currentMilkYield: 14.0,
          lastMilkingDate: new Date()
        }
      });

      // Audit log
      await prisma.auditLog.create({
        data: {
          userId: req.user?.id,
          action: 'COW_REGISTERED',
          entityType: 'COW',
          entityId: cow.id,
          details: JSON.stringify({ cowCode: cow.cowCode, rfidId: cow.rfidId })
        }
      });

      res.status(201).json({ success: true, cow });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/cows/:id - update cow
router.put(
  '/:id',
  authenticateJwt,
  requireRoles(UserRole.FARM_MANAGER, UserRole.VETERINARIAN),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const cow = await prisma.cow.update({
        where: { id: req.params.id },
        data: req.body
      });

      await prisma.auditLog.create({
        data: {
          userId: req.user?.id,
          action: 'COW_UPDATED',
          entityType: 'COW',
          entityId: cow.id,
          details: JSON.stringify(req.body)
        }
      });

      res.json({ success: true, cow });
    } catch (error) {
      next(error);
    }
  }
);

export default router;

