import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../database';
import { SensorReadingInputSchema } from '../shared';
import { offlineQueueService } from '../services/offlineQueueService';
import { socketService } from '../services/socketService';
import { authenticateJwt } from '../middleware/auth';

const router = Router();

// POST /api/readings - Ingest a real-time sensor reading
router.post('/', authenticateJwt, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = SensorReadingInputSchema.parse(req.body);

    const reading = await prisma.sensorReading.create({
      data: {
        sessionId: data.sessionId,
        timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
        flowRate: data.flowRate,
        totalVolume: data.totalVolume,
        temperature: data.temperature,
        conductivity: data.conductivity,
        ph: data.ph,
        scc: data.scc,
        flowStatus: data.flowStatus,
        temperatureStatus: data.temperatureStatus,
        conductivityStatus: data.conductivityStatus,
        phStatus: data.phStatus,
        sccStatus: data.sccStatus,
        dataQuality: data.dataQuality,
        sensorSource: data.sensorSource || 'EDGE_DIRECT',
        eventId: data.eventId || undefined
      }
    });

    socketService.emitSensorReading({
      sessionId: data.sessionId,
      timestamp: reading.timestamp,
      reading
    });

    res.status(201).json({ success: true, reading });
  } catch (error) {
    next(error);
  }
});

// POST /api/readings/sync - Sync queued offline buffer readings (idempotent with event_id)
router.post('/sync', authenticateJwt, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { readings } = req.body;
    if (!Array.isArray(readings)) {
      res.status(400).json({ success: false, error: 'Readings array required.' });
      return;
    }

    const validated = readings.map((r) => SensorReadingInputSchema.parse(r));
    const result = await offlineQueueService.syncBufferedReadings(validated);

    res.json({
      success: true,
      message: `Offline synchronization completed: ${result.inserted} inserted, ${result.skipped} skipped.`,
      ...result
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/sessions/:id/readings
router.get('/session/:sessionId', authenticateJwt, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const readings = await prisma.sensorReading.findMany({
      where: { sessionId: req.params.sessionId },
      orderBy: { timestamp: 'asc' }
    });

    res.json({ success: true, count: readings.length, readings });
  } catch (error) {
    next(error);
  }
});

export default router;

