import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '@smartdairy/database';
import { SessionStatus } from '@smartdairy/shared';
import { sessionStateMachine } from '../services/sessionStateMachine';
import { authenticateJwt } from '../middleware/auth';

const router = Router();

// GET /api/dashboard/summary
router.get('/summary', authenticateJwt, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalCows,
      highRiskCows,
      moderateRiskCows,
      increasingRiskProfiles,
      forecastWarningProfiles,
      activeAlertsCount,
      todaySessions,
      sensors,
      stations,
      latestEnv
    ] = await Promise.all([
      prisma.cow.count(),
      prisma.cow.count({ where: { healthStatus: 'HIGH' } }),
      prisma.cow.count({ where: { healthStatus: 'MODERATE' } }),
      prisma.cowHealthProfile.count({ where: { riskDirection: 'INCREASING' } }),
      prisma.cowHealthProfile.count({ where: { forecastRiskLevel: { in: ['HIGH', 'VERY_HIGH'] } } }),
      prisma.alert.count({ where: { status: 'ACTIVE' } }),
      prisma.milkingSession.findMany({
        where: { startTime: { gte: today }, status: 'COMPLETED' },
        select: { totalVolume: true }
      }),
      prisma.sensorDevice.findMany({ select: { id: true, name: true, type: true, status: true } }),
      prisma.milkingStation.findMany({ select: { id: true, stationCode: true, name: true, status: true } }),
      prisma.farmEnvironmentReading.findFirst({ orderBy: { timestamp: 'desc' } })
    ]);

    // Calculate today's harvested milk
    const todayMilkVolume = parseFloat(
      todaySessions.reduce((acc, s) => acc + (s.totalVolume || 0), 0).toFixed(1)
    );
    const avgMilkPerCow = totalCows > 0 ? parseFloat((todayMilkVolume / totalCows).toFixed(1)) : 0;

    // Check active milking count from station states
    let activeMilkingCount = 0;
    for (const stn of stations) {
      const state = sessionStateMachine.getStationState(stn.id);
      if (state.status === SessionStatus.MILKING) {
        activeMilkingCount++;
      }
    }

    const sensorsOnline = sensors.filter((s) => s.status === 'ONLINE').length;
    const sensorAvailabilityPercent = sensors.length > 0 ? Math.round((sensorsOnline / sensors.length) * 100) : 100;

    // Calculate Herd Risk Index (0-100)
    let herdRiskIndex = 18;
    if (totalCows > 0) {
      const highRatio = highRiskCows / totalCows;
      const modRatio = moderateRiskCows / totalCows;
      let envBonus = 0;
      if (latestEnv) {
        const thi = (1.8 * latestEnv.temperature + 32) - (0.55 - 0.0055 * latestEnv.humidity) * (1.8 * latestEnv.temperature - 26);
        if (thi > 76) envBonus = 10;
      }
      herdRiskIndex = Math.min(100, Math.round(highRatio * 70 + modRatio * 35 + 15 + envBonus));
    }

    let herdRiskLevel = 'LOW';
    if (herdRiskIndex >= 70) herdRiskLevel = 'VERY_HIGH';
    else if (herdRiskIndex >= 50) herdRiskLevel = 'HIGH';
    else if (herdRiskIndex >= 30) herdRiskLevel = 'MODERATE';

    // Recent 5 active alerts
    const recentAlerts = await prisma.alert.findMany({
      where: { status: 'ACTIVE' },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        cow: { select: { cowCode: true, name: true } }
      }
    });

    res.json({
      success: true,
      summary: {
        totalCows,
        cowsMonitored: totalCows,
        activeMilking: activeMilkingCount,
        todayMilk: todayMilkVolume,
        averageMilkPerCow: avgMilkPerCow,
        highRiskCows,
        moderateRiskCows,
        lowRiskCows: Math.max(0, totalCows - (highRiskCows + moderateRiskCows)),
        increasingRiskCows: increasingRiskProfiles,
        forecastWarnings: forecastWarningProfiles,
        herdRiskIndex,
        herdRiskLevel,
        herdRiskTrend: increasingRiskProfiles >= 2 ? 'INCREASING' : 'STABLE',
        activeAlerts: activeAlertsCount,
        sensorAvailability: sensorAvailabilityPercent,
        sensorsTotal: sensors.length,
        sensorsOnline,
        environmentalStressLevel: latestEnv && latestEnv.temperature > 32 ? 'HIGH' : 'LOW'
      },
      recentAlerts,
      stations
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/dashboard/trends
router.get('/trends', authenticateJwt, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // 7-day milk production & risk trend
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const pastSessions = await prisma.milkingSession.findMany({
      where: { startTime: { gte: sevenDaysAgo }, status: 'COMPLETED' },
      select: {
        startTime: true,
        totalVolume: true,
        averageScc: true,
        averageConductivity: true,
        riskScore: true
      },
      orderBy: { startTime: 'asc' }
    });

    // Aggregate by day
    const dayMap = new Map<string, { date: string; volume: number; scc: number; conductivity: number; count: number; risk: number }>();

    for (const s of pastSessions) {
      const dayKey = s.startTime.toISOString().split('T')[0];
      const entry = dayMap.get(dayKey) || { date: dayKey, volume: 0, scc: 0, conductivity: 0, count: 0, risk: 0 };
      entry.volume += s.totalVolume || 0;
      entry.scc += s.averageScc || 0;
      entry.conductivity += s.averageConductivity || 0;
      entry.risk += s.riskScore || 0;
      entry.count++;
      dayMap.set(dayKey, entry);
    }

    const dailyTrends = Array.from(dayMap.values()).map((d) => ({
      date: d.date,
      totalMilk: parseFloat(d.volume.toFixed(1)),
      averageScc: d.count > 0 ? Math.round(d.scc / d.count) : 0,
      averageConductivity: d.count > 0 ? parseFloat((d.conductivity / d.count).toFixed(2)) : 0,
      averageRiskScore: d.count > 0 ? Math.round(d.risk / d.count) : 0
    }));

    // Risk distribution
    const riskDistribution = [
      { name: 'Low Risk (0-29)', count: await prisma.cowHealthProfile.count({ where: { currentRiskLevel: 'LOW' } }), color: '#10b981' },
      { name: 'Moderate Risk (30-59)', count: await prisma.cowHealthProfile.count({ where: { currentRiskLevel: 'MODERATE' } }), color: '#f59e0b' },
      { name: 'High Risk (60-79)', count: await prisma.cowHealthProfile.count({ where: { currentRiskLevel: 'HIGH' } }), color: '#ef4444' },
      { name: 'Very High (80-100)', count: await prisma.cowHealthProfile.count({ where: { currentRiskLevel: 'VERY_HIGH' } }), color: '#991b1b' }
    ];

    res.json({
      success: true,
      dailyTrends,
      riskDistribution
    });
  } catch (error) {
    next(error);
  }
});

export default router;
