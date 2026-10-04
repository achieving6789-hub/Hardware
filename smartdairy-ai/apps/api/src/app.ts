import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { openApiSpec } from './swagger';

// Import Route Handlers
import authRoutes from './routes/auth.routes';
import cowRoutes from './routes/cow.routes';
import rfidRoutes from './routes/rfid.routes';
import sessionRoutes from './routes/session.routes';
import sensorRoutes from './routes/sensor.routes';
import readingRoutes from './routes/reading.routes';
import healthRoutes from './routes/health.routes';
import aiRoutes from './routes/ai.routes';
import alertRoutes from './routes/alert.routes';
import cipRoutes from './routes/cip.routes';
import dashboardRoutes from './routes/dashboard.routes';
import simulationRoutes from './routes/simulation.routes';

import { errorHandler } from './middleware/errorHandler';

export function createApp(): Express {
  const app = express();

  // Security headers with Swagger allowance
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' }
    })
  );

  // CORS configuration
  app.use(
    cors({
      origin: true,
      credentials: true
    })
  );

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Basic API Rate Limiter
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000, // generous for real-time demos
    standardHeaders: true,
    legacyHeaders: false
  });
  app.use('/api', limiter);

  // Health check endpoint
  app.get('/health', (req: Request, res: Response) => {
    res.json({
      status: 'UP',
      service: 'SmartDairy AI Backend',
      timestamp: new Date().toISOString()
    });
  });

  // Swagger Documentation
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));

  // Mount API Modules
  app.use('/api/auth', authRoutes);
  app.use('/api/cows', cowRoutes);
  app.use('/api/rfid', rfidRoutes);
  app.use('/api/sessions', sessionRoutes);
  app.use('/api/sensors', sensorRoutes);
  app.use('/api/readings', readingRoutes);
  app.use('/api/health', healthRoutes);
  app.use('/api/ai', aiRoutes);
  app.use('/api/alerts', alertRoutes);
  app.use('/api/cip', cipRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/simulation', simulationRoutes);

  // Centralized Error Handling
  app.use(errorHandler);

  return app;
}

export default createApp;
