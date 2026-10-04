import { Router, Request, Response, NextFunction } from 'express';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { prisma, ACTIVE_DATABASE_NAME, IS_DEMO_DATABASE } from '../database';
import { LoginSchema, RegisterSchema } from '../shared';
import { authenticateJwt } from '../middleware/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'smartdairy-super-secret-jwt-key-2026-sih';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// GET /api/auth/database-info
router.get('/database-info', (_req: Request, res: Response) => {
  res.json({
    success: true,
    database: ACTIVE_DATABASE_NAME || 'demo.db',
    isDemo: IS_DEMO_DATABASE ?? true,
    message: 'Operating on isolated Demo Database. The original database is preserved and untouched.'
  });
});

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validated = RegisterSchema.parse(req.body);
    const normalizedEmail = validated.email.trim().toLowerCase();

    // Check if user already exists in demo database
    const existing = await prisma.user.findFirst({
      where: {
        email: {
          equals: normalizedEmail
        }
      }
    });

    if (existing) {
      res.status(400).json({
        success: false,
        error: 'An account with this email is already registered in the demo database.'
      });
      return;
    }

    // Get primary demo farm or create one if database is fresh
    let farm = await prisma.farm.findFirst();
    if (!farm) {
      farm = await prisma.farm.create({
        data: {
          name: validated.farmName?.trim() || 'SmartDairy Demo Dairy Unit',
          location: 'Stall Block A, Zone 1',
          timezone: 'Asia/Kolkata',
          numberOfCows: 30
        }
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(validated.password, 10);

    // Create user in isolated demo database
    const user = await prisma.user.create({
      data: {
        name: validated.name.trim(),
        email: normalizedEmail,
        passwordHash,
        role: validated.role || 'OPERATOR',
        farmId: farm.id
      },
      include: { farm: true }
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, farmId: user.farmId },
      JWT_SECRET,
      { expiresIn: (JWT_EXPIRES_IN || '7d') as any }
    );

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'USER_REGISTER',
        entityType: 'USER',
        entityId: user.id,
        details: JSON.stringify({
          email: user.email,
          role: user.role,
          registeredIn: 'demo.db',
          note: 'Stored in isolated demo database'
        })
      }
    });

    res.status(201).json({
      success: true,
      message: 'Account registered and saved into demo database.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        farmId: user.farmId,
        farmName: user.farm?.name
      },
      database: 'demo.db'
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = LoginSchema.parse(req.body);
    const normalizedEmail = email.trim().toLowerCase();

    // Check case-insensitive in demo database
    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: normalizedEmail
        }
      },
      include: { farm: true }
    });

    if (!user) {
      res.status(401).json({ success: false, error: 'Invalid email or password.' });
      return;
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      res.status(401).json({ success: false, error: 'Invalid email or password.' });
      return;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, farmId: user.farmId },
      JWT_SECRET,
      { expiresIn: (JWT_EXPIRES_IN || '7d') as any }
    );

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'USER_LOGIN',
        entityType: 'USER',
        entityId: user.id,
        details: JSON.stringify({ email: user.email, role: user.role, database: 'demo.db' })
      }
    });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        farmId: user.farmId,
        farmName: user.farm?.name
      },
      database: 'demo.db'
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/me
router.get('/me', authenticateJwt, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { farm: true }
    });

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        farmId: user.farmId,
        farmName: user.farm?.name
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;

