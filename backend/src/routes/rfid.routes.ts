import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../database';
import { RfidScanSchema } from '../shared';
import { sessionStateMachine } from '../services/sessionStateMachine';
import { authenticateJwt } from '../middleware/auth';

const router = Router();

// POST /api/rfid/scan
router.post('/scan', authenticateJwt, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = RfidScanSchema.parse(req.body);
    const stationId = data.stationId || (await prisma.milkingStation.findFirst())?.id || 'default_stn';

    const result = await sessionStateMachine.handleRfidScan(data.tagUid, data.readerId, stationId);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
});

// GET /api/rfid/events
router.get('/events', authenticateJwt, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const events = await prisma.rfidReadEvent.findMany({
      take: 50,
      orderBy: { timestamp: 'desc' },
      include: {
        cow: {
          select: { id: true, cowCode: true, name: true, breed: true }
        }
      }
    });

    res.json({ success: true, count: events.length, events });
  } catch (error) {
    next(error);
  }
});

export default router;

