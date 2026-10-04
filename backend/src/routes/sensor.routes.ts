import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../database';
import { SensorStatus } from '../shared';
import { simulationService } from '../services/simulationService';
import { socketService } from '../services/socketService';
import { authenticateJwt } from '../middleware/auth';

const router = Router();

// GET /api/sensors
router.get('/', authenticateJwt, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const sensors = await prisma.sensorDevice.findMany({
      include: {
        station: { select: { id: true, stationCode: true, name: true } },
        healthLogs: { take: 5, orderBy: { timestamp: 'desc' } }
      },
      orderBy: { type: 'asc' }
    });

    res.json({ success: true, sensors });
  } catch (error) {
    next(error);
  }
});

// GET /api/sensors/:id
router.get('/:id', authenticateJwt, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const sensor = await prisma.sensorDevice.findUnique({
      where: { id: req.params.id },
      include: {
        station: true,
        healthLogs: { take: 20, orderBy: { timestamp: 'desc' } }
      }
    });

    if (!sensor) {
      res.status(404).json({ success: false, error: 'Sensor device not found.' });
      return;
    }

    res.json({ success: true, sensor });
  } catch (error) {
    next(error);
  }
});

// POST /api/sensors/:id/status - Update sensor status (e.g. simulate OFFLINE/ERROR/ONLINE)
router.post('/:id/status', authenticateJwt, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, message } = req.body;
    if (!Object.values(SensorStatus).includes(status)) {
      res.status(400).json({ success: false, error: 'Invalid sensor status' });
      return;
    }

    const sensor = await prisma.sensorDevice.update({
      where: { id: req.params.id },
      data: {
        status,
        lastSeen: new Date(),
        errorCount: status === SensorStatus.ERROR ? { increment: 1 } : undefined
      }
    });

    // Write health log
    await prisma.sensorHealthLog.create({
      data: {
        sensorId: sensor.id,
        status,
        message: message || `Sensor status manually changed to ${status}`,
        errorCode: status === SensorStatus.ERROR ? 'ERR_CALIBRATION_DRIFT' : undefined
      }
    });

    // Update simulation engine
    if (sensor.type === 'SOMADETECT') {
      simulationService.getSimulator().setSensorFault('SOMADETECT', status);
    } else if (sensor.type === 'FLOWMAG') {
      simulationService.getSimulator().setSensorFault('FLOWMAG', status);
    } else if (sensor.type === 'PH') {
      simulationService.getSimulator().setSensorFault('PH', status);
    } else if (sensor.type === 'RFID') {
      simulationService.getSimulator().setSensorFault('RFID', status);
    }

    // Broadcast over WebSocket
    socketService.emitSensorStatus({
      sensorId: sensor.id,
      sensorType: sensor.type,
      status
    });

    // If offline or error, create an Alert
    if (status === SensorStatus.OFFLINE || status === SensorStatus.ERROR) {
      await prisma.alert.create({
        data: {
          farmId: (await prisma.milkingStation.findUnique({ where: { id: sensor.stationId } }))?.farmId || '',
          alertType: 'SENSOR_OFFLINE',
          severity: 'HIGH',
          title: `Sensor Fault: ${sensor.name} (${sensor.type})`,
          message: `Hardware device ${sensor.name} reported ${status}. Milk line telemetry quality degraded.`,
          status: 'ACTIVE'
        }
      });
    }

    res.json({ success: true, sensor });
  } catch (error) {
    next(error);
  }
});

export default router;

