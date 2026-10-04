import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../database';
import { SimulationScenarioSchema } from '../shared';
import { simulationService } from '../services/simulationService';
import { authenticateJwt } from '../middleware/auth';

const router = Router();

// POST /api/simulation/start
router.post('/start', authenticateJwt, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { stationId, cowCode = 'COW-001' } = req.body;
    const targetStation = stationId || (await prisma.milkingStation.findFirst())?.id || 'default_stn';
    const session = await simulationService.startLiveMilking(targetStation, cowCode);
    res.json({ success: true, message: `Live milking started for ${cowCode}`, session });
  } catch (error) {
    next(error);
  }
});

// POST /api/simulation/stop
router.post('/stop', authenticateJwt, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await simulationService.stopLiveMilking();
    res.json({ success: true, message: 'Live milking stopped.', result });
  } catch (error) {
    next(error);
  }
});

// POST /api/simulation/pause
router.post('/pause', authenticateJwt, (req: Request, res: Response): void => {
  simulationService.pauseLiveMilking();
  res.json({ success: true, message: 'Milking paused.' });
});

// POST /api/simulation/resume
router.post('/resume', authenticateJwt, (req: Request, res: Response): void => {
  simulationService.resumeLiveMilking();
  res.json({ success: true, message: 'Milking resumed.' });
});

// POST /api/simulation/scenario
router.post('/scenario', authenticateJwt, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = SimulationScenarioSchema.parse(req.body);
    const stationId = data.stationId || (await prisma.milkingStation.findFirst())?.id || 'default_stn';

    const result = await simulationService.runDemoScenario(data.scenario, stationId, data.cowId);
    res.json({ success: true, scenario: data.scenario, result });
  } catch (error) {
    next(error);
  }
});

// POST /api/simulation/network - Toggle edge network simulator
router.post('/network', authenticateJwt, (req: Request, res: Response): void => {
  const { online } = req.body;
  simulationService.setNetworkOnline(Boolean(online));
  res.json({
    success: true,
    networkOnline: simulationService.isNetworkOnline(),
    message: `Edge network status set to ${simulationService.isNetworkOnline() ? 'ONLINE' : 'OFFLINE'}`
  });
});

export default router;

