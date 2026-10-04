import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../database';
import { DEFAULT_RISK_WEIGHTS, PROTOTYPE_DISCLAIMER } from '../shared';
import { simulationService } from '../services/simulationService';
import { authenticateJwt } from '../middleware/auth';

const router = Router();

// In-memory configurable weights
let currentWeights = { ...DEFAULT_RISK_WEIGHTS };

// POST /api/ai/analyze/:sessionId
router.post('/analyze/:sessionId', authenticateJwt, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await simulationService.finalizeSession(req.params.sessionId);
    if (!result) {
      res.status(404).json({ success: false, error: 'Session not found' });
      return;
    }
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
});

// GET /api/ai/cow/:cowId - Get predictions for a cow
router.get('/cow/:cowId', authenticateJwt, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const predictions = await prisma.aiPrediction.findMany({
      where: { cowId: req.params.cowId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        factors: true,
        session: { select: { sessionCode: true, totalVolume: true, averageScc: true } }
      }
    });

    res.json({
      success: true,
      disclaimer: PROTOTYPE_DISCLAIMER,
      predictions
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/ai/weights - View current AI feature weights
router.get('/weights', authenticateJwt, (req: Request, res: Response): void => {
  res.json({
    success: true,
    weights: currentWeights,
    disclaimer: PROTOTYPE_DISCLAIMER
  });
});

// POST /api/ai/weights - Update AI feature weights
router.post('/weights', authenticateJwt, (req: Request, res: Response): void => {
  const updates = req.body;
  currentWeights = { ...currentWeights, ...updates };
  res.json({
    success: true,
    message: 'AI feature scoring weights updated successfully.',
    weights: currentWeights
  });
});

export default router;

