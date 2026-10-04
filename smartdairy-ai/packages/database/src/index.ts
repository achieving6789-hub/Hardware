import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

// Safeguard: Ensure we use the isolated demo database, preserving the original dev.db untouched
const prismaDir = path.resolve(__dirname, '../prisma');
const devDbPath = path.join(prismaDir, 'dev.db');
const demoDbPath = path.join(prismaDir, 'demo.db');

try {
  // If demo.db doesn't exist yet, copy from dev.db template
  if (!fs.existsSync(demoDbPath) && fs.existsSync(devDbPath)) {
    fs.copyFileSync(devDbPath, demoDbPath);
    console.log('[SmartDairy DB] Initialized demo database demo.db from dev.db template.');
  }

  // Ensure DATABASE_URL targets demo.db, never overwriting dev.db
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('dev.db')) {
    const formattedPath = demoDbPath.replace(/\\/g, '/');
    process.env.DATABASE_URL = `file:${formattedPath}`;
  }
} catch (e) {
  console.warn('[SmartDairy DB] Database auto-setup check warning:', e);
}

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma = global.__prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

export const IS_DEMO_DATABASE = true;
export const ACTIVE_DATABASE_NAME = 'demo.db';

export * from '@prisma/client';
export default prisma;

