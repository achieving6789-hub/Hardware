import { prisma } from '@smartdairy/database';
import { SensorReadingInput } from '@smartdairy/shared';

export class OfflineQueueService {
  private static instance: OfflineQueueService;

  private constructor() {}

  public static getInstance(): OfflineQueueService {
    if (!OfflineQueueService.instance) {
      OfflineQueueService.instance = new OfflineQueueService();
    }
    return OfflineQueueService.instance;
  }

  /**
   * Idempotent ingestion of buffered sensor readings.
   * If reading with eventId already exists, it will not be duplicated.
   */
  public async syncBufferedReadings(readings: SensorReadingInput[]): Promise<{ inserted: number; skipped: number }> {
    let inserted = 0;
    let skipped = 0;

    for (const r of readings) {
      if (r.eventId) {
        const existing = await prisma.sensorReading.findUnique({
          where: { eventId: r.eventId }
        });
        if (existing) {
          skipped++;
          continue;
        }
      }

      await prisma.sensorReading.create({
        data: {
          sessionId: r.sessionId,
          timestamp: r.timestamp ? new Date(r.timestamp) : new Date(),
          flowRate: r.flowRate,
          totalVolume: r.totalVolume,
          temperature: r.temperature,
          conductivity: r.conductivity,
          ph: r.ph,
          scc: r.scc,
          flowStatus: r.flowStatus,
          temperatureStatus: r.temperatureStatus,
          conductivityStatus: r.conductivityStatus,
          phStatus: r.phStatus,
          sccStatus: r.sccStatus,
          dataQuality: r.dataQuality,
          sensorSource: r.sensorSource || 'OFFLINE_BUFFER',
          eventId: r.eventId || undefined
        }
      });
      inserted++;
    }

    console.log(`[OfflineQueue] Synced buffered readings: ${inserted} inserted, ${skipped} skipped (deduplicated).`);
    return { inserted, skipped };
  }
}

export const offlineQueueService = OfflineQueueService.getInstance();
