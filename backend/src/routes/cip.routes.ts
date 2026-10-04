import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../database';
import { cipService } from '../services/cipService';
import { authenticateJwt } from '../middleware/auth';

const router = Router();

// GET /api/cip/status
router.get('/status', authenticateJwt, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const station = await prisma.milkingStation.findFirst({ where: { stationCode: 'STN-01' } });
    const stationId = station?.id || 'default_stn';
    const status = await cipService.getCipStatus(stationId);
    res.json({ success: true, ...status });
  } catch (error) {
    next(error);
  }
});

// POST /api/cip/start
router.post('/start', authenticateJwt, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { stationId } = req.body;
    const targetStationId = stationId || (await prisma.milkingStation.findFirst())?.id || 'default_stn';
    const result = await cipService.startCip(targetStationId);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
});

// POST /api/cip/stop
router.post('/stop', authenticateJwt, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await cipService.stopCip();
    res.json({ success: true, message: 'CIP cycle terminated. Line returned to IDLE.' });
  } catch (error) {
    next(error);
  }
});

export default router;

