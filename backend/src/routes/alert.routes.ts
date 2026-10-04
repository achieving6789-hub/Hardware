import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../database';
import { AlertStatus } from '../shared';
import { authenticateJwt } from '../middleware/auth';

const router = Router();

// GET /api/alerts - List all alerts
router.get('/', authenticateJwt, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, severity, cowId } = req.query;

    const where: any = {};
    if (status && status !== 'ALL') where.status = String(status);
    if (severity && severity !== 'ALL') where.severity = String(severity);
    if (cowId) where.cowId = String(cowId);

    const alerts = await prisma.alert.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        cow: { select: { id: true, cowCode: true, name: true, breed: true } },
        session: { select: { id: true, sessionCode: true, totalVolume: true } },
        events: {
          include: { user: { select: { id: true, name: true, role: true } } },
          orderBy: { timestamp: 'desc' }
        }
      }
    });

    const activeCount = await prisma.alert.count({ where: { status: 'ACTIVE' } });

    res.json({
      success: true,
      activeCount,
      totalCount: alerts.length,
      alerts
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/alerts/:id/acknowledge
router.post('/:id/acknowledge', authenticateJwt, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { note } = req.body;

    const alert = await prisma.alert.update({
      where: { id: req.params.id },
      data: {
        status: AlertStatus.ACKNOWLEDGED,
        acknowledgedAt: new Date()
      }
    });

    await prisma.alertEvent.create({
      data: {
        alertId: alert.id,
        userId: req.user?.id,
        action: 'ACKNOWLEDGE',
        note: note || 'Acknowledged by operator.'
      }
    });

    res.json({ success: true, alert });
  } catch (error) {
    next(error);
  }
});

// POST /api/alerts/:id/resolve
router.post('/:id/resolve', authenticateJwt, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { resolutionNote } = req.body;

    const alert = await prisma.alert.update({
      where: { id: req.params.id },
      data: {
        status: AlertStatus.RESOLVED,
        resolvedAt: new Date()
      }
    });

    await prisma.alertEvent.create({
      data: {
        alertId: alert.id,
        userId: req.user?.id,
        action: 'RESOLVE',
        note: resolutionNote || 'Resolved and logged by staff.'
      }
    });

    res.json({ success: true, alert });
  } catch (error) {
    next(error);
  }
});

export default router;

