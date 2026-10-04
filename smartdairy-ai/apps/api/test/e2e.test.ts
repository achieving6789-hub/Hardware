import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '@smartdairy/database';

describe('Integration & End-to-End Scenario: Live Milking & Risk Workflow', () => {
  const app = createApp();
  let authToken = '';
  let testCow: any = null;
  let testStation: any = null;

  beforeAll(async () => {
    // Authenticate with seeded Admin credentials
    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'admin@smartdairy.local',
      password: 'Admin@123'
    });

    if (loginRes.status === 200) {
      authToken = loginRes.body.token;
    }

    testCow = await prisma.cow.findFirst({ where: { cowCode: 'COW-001' } });
    testStation = await prisma.milkingStation.findFirst({ where: { stationCode: 'STN-01' } });
  });

  it('Step 1: Authenticates user and checks token verification', async () => {
    expect(authToken).toBeTruthy();
    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${authToken}`);
    expect(meRes.status).toBe(200);
    expect(meRes.body.user.email).toBe('admin@smartdairy.local');
  });

  it('Step 2: Scans Cow RFID tag and identifies animal', async () => {
    if (!testCow) return;
    const scanRes = await request(app)
      .post('/api/rfid/scan')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        tagUid: testCow.rfidId,
        readerId: 'RFID-RDR-01',
        stationId: testStation?.id
      });

    expect(scanRes.status).toBe(200);
    expect(scanRes.body.status).toBe('SUCCESS');
    expect(scanRes.body.cow.cowCode).toBe('COW-001');
  });

  it('Step 3: Creates and starts a milking session on the line', async () => {
    if (!testCow || !testStation) return;
    const startRes = await request(app)
      .post('/api/sessions/start')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        stationId: testStation.id,
        cowId: testCow.id
      });

    expect(startRes.status).toBe(201);
    expect(startRes.body.session.id).toBeDefined();
    expect(startRes.body.session.status).toBe('MILKING');

    const sessionId = startRes.body.session.id;

    // Step 4: Stream 30+ simulated sensor readings to the session
    const readings = [];
    let curVol = 0;
    for (let i = 1; i <= 32; i++) {
      const flow = i < 5 ? (i / 5) * 3.8 : i > 25 ? 3.8 * (1 - (i - 25) / 7) : 3.8;
      curVol += (flow / 60) * 2;
      readings.push({
        sessionId,
        timestamp: new Date().toISOString(),
        flowRate: parseFloat(flow.toFixed(2)),
        totalVolume: parseFloat(curVol.toFixed(3)),
        temperature: 38.5,
        conductivity: 5.58,
        ph: 6.65,
        scc: 115,
        eventId: `e2e_event_${sessionId}_${i}`
      });
    }

    const syncRes = await request(app)
      .post('/api/readings/sync')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ readings });

    expect(syncRes.status).toBe(200);
    expect(syncRes.body.inserted).toBe(32);

    // Step 5: Finalize and complete milking session
    const endRes = await request(app)
      .post(`/api/sessions/${sessionId}/end`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(endRes.status).toBe(200);
    expect(endRes.body.session.status).toBe('COMPLETED');
    expect(endRes.body.session.totalVolume).toBeGreaterThan(0);
    expect(endRes.body.riskResult.riskScore).toBeDefined();
    expect(endRes.body.riskResult.explanation).toBeDefined();

    // Step 6: Verify Dashboard reflects the updated harvest
    const dashRes = await request(app)
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${authToken}`);

    expect(dashRes.status).toBe(200);
    expect(dashRes.body.summary.totalCows).toBeGreaterThan(0);

    // Step 7: Verify Cow Profile has the completed session in history
    const cowProfileRes = await request(app)
      .get(`/api/cows/${testCow.id}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(cowProfileRes.status).toBe(200);
    expect(cowProfileRes.body.cow.sessions.length).toBeGreaterThan(0);
  });
});
