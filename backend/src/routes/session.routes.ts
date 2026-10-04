import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../database';
import { SessionStartSchema } from '../shared';
import { sessionStateMachine } from '../services/sessionStateMachine';
import { simulationService } from '../services/simulationService';
import { authenticateJwt } from '../middleware/auth';

const router = Router();

// GET /api/sessions - list past sessions
router.get('/', authenticateJwt, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { cowId, status, riskLevel, limit = 50, page = 1 } = req.query;
    const take = Math.min(100, Math.max(1, Number(limit)));
    const skip = (Math.max(1, Number(page)) - 1) * take;

    const where: any = {};
    if (cowId) where.cowId = String(cowId);
    if (status) where.status = String(status);
    if (riskLevel) where.riskLevel = String(riskLevel);

    const [total, sessions] = await Promise.all([
      prisma.milkingSession.count({ where }),
      prisma.milkingSession.findMany({
        where,
        take,
        skip,
        orderBy: { startTime: 'desc' },
        include: {
          cow: { select: { id: true, cowCode: true, name: true, breed: true } },
          station: { select: { id: true, stationCode: true, name: true } },
          predictions: { take: 1, select: { riskScore: true, riskLevel: true, explanation: true } }
        }
      })
    ]);

    res.json({
      success: true,
      total,
      page: Number(page),
      pageSize: take,
      sessions
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/sessions/live - get current live station state
router.get('/live', authenticateJwt, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const station = await prisma.milkingStation.findFirst({
      where: { stationCode: 'STN-01' }
    });

    const stationId = station?.id || 'default_stn';
    const state = sessionStateMachine.getStationState(stationId);

    let activeSession = null;
    let latestReadings: any[] = [];

    if (state.activeSessionId) {
      activeSession = await prisma.milkingSession.findUnique({
        where: { id: state.activeSessionId },
        include: {
          cow: { include: { baseline: true, healthProfile: true } },
          station: true
        }
      });

      latestReadings = await prisma.sensorReading.findMany({
        where: { sessionId: state.activeSessionId },
        take: 30,
        orderBy: { timestamp: 'desc' }
      });
    }

    res.json({
      success: true,
      station: {
        id: stationId,
        code: station?.stationCode || 'STN-01',
        name: station?.name || 'Milking Line Alpha'
      },
      stationState: state,
      activeSession,
      latestReadings: latestReadings.reverse()
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/sessions/:id - get session with readings & predictions
router.get('/:id', authenticateJwt, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const session = await prisma.milkingSession.findUnique({
      where: { id: req.params.id },
      include: {
        cow: { include: { baseline: true, healthProfile: true } },
        station: true,
        readings: { orderBy: { timestamp: 'asc' } },
        predictions: { include: { factors: true } },
        alerts: true
      }
    });

    if (!session) {
      res.status(404).json({ success: false, error: 'Session not found' });
      return;
    }

    res.json({ success: true, session });
  } catch (error) {
    next(error);
  }
});

// POST /api/sessions/start
router.post('/start', authenticateJwt, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { stationId, cowId } = SessionStartSchema.parse(req.body);
    const session = await sessionStateMachine.createAndStartSession(stationId, cowId);
    res.status(201).json({ success: true, session });
  } catch (error) {
    next(error);
  }
});

// POST /api/sessions/:id/end
router.post('/:id/end', authenticateJwt, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await simulationService.finalizeSession(req.params.id);
    if (!result) {
      res.status(404).json({ success: false, error: 'Session not found or already completed.' });
      return;
    }
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
});

// POST /api/sessions/:id/assign-cow (Resolve UNIDENTIFIED session)
router.post(
  '/:id/assign-cow',
  authenticateJwt,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { cowId } = req.body;
      if (!cowId) {
        res.status(400).json({ success: false, error: 'Cow ID is required to assign.' });
        return;
      }
      const updated = await sessionStateMachine.assignCow(req.params.id, cowId);
      res.json({ success: true, session: updated });
    } catch (error) {
      next(error);
    }
  }
);

export default router;

