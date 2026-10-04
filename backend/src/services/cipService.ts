import { prisma } from '../database';
import { CIPPhase, SessionStatus, CIP_ISOLATION_NOTICE } from '../shared';
import { socketService } from './socketService';
import { sessionStateMachine } from './sessionStateMachine';

export class CipService {
  private static instance: CipService;
  private activeCipTimer: NodeJS.Timeout | null = null;
  private activeCipSessionId: string | null = null;
  private activeStationId: string | null = null;
  private currentPhaseIndex = 0;

  private readonly PHASES: CIPPhase[] = [
    CIPPhase.PRE_RINSE,
    CIPPhase.CAUSTIC,
    CIPPhase.RINSE,
    CIPPhase.ACID,
    CIPPhase.FINAL_RINSE,
    CIPPhase.COMPLETE
  ];

  private constructor() {}

  public static getInstance(): CipService {
    if (!CipService.instance) {
      CipService.instance = new CipService();
    }
    return CipService.instance;
  }

  public async startCip(stationId: string): Promise<any> {
    this.stopCip();

    const cipSession = await prisma.cipSession.create({
      data: {
        stationId,
        startTime: new Date(),
        status: 'IN_PROGRESS',
        phase: CIPPhase.PRE_RINSE
      }
    });

    this.activeCipSessionId = cipSession.id;
    this.activeStationId = stationId;
    this.currentPhaseIndex = 0;

    // Set milking station to CIP status to block animal milking
    sessionStateMachine.setStationState(stationId, {
      status: SessionStatus.CIP,
      activeSessionId: null,
      identifiedCowId: null,
      identifiedCowCode: null,
      identifiedCowName: null
    });

    // Advance CIP phases every 5 seconds for demonstration
    this.activeCipTimer = setInterval(async () => {
      await this.advanceCipTick();
    }, 5000);

    socketService.emitCipUpdated({
      cipSessionId: cipSession.id,
      stationId,
      phase: CIPPhase.PRE_RINSE,
      status: 'IN_PROGRESS',
      isolationNotice: CIP_ISOLATION_NOTICE,
      readings: { flow: 12.0, temperature: 40.0, conductivity: 1.0 }
    });

    return {
      message: 'CIP Cycle started. Station locked for hygienic cleaning.',
      cipSession,
      isolationNotice: CIP_ISOLATION_NOTICE
    };
  }

  public async stopCip(): Promise<any> {
    if (this.activeCipTimer) {
      clearInterval(this.activeCipTimer);
      this.activeCipTimer = null;
    }

    if (this.activeCipSessionId) {
      const sessionId = this.activeCipSessionId;
      this.activeCipSessionId = null;

      await prisma.cipSession.update({
        where: { id: sessionId },
        data: {
          endTime: new Date(),
          status: 'COMPLETED',
          phase: CIPPhase.COMPLETE
        }
      });

      if (this.activeStationId) {
        sessionStateMachine.setStationState(this.activeStationId, {
          status: SessionStatus.IDLE
        });
      }

      socketService.emitCipUpdated({
        cipSessionId: sessionId,
        stationId: this.activeStationId,
        phase: CIPPhase.COMPLETE,
        status: 'COMPLETED',
        isolationNotice: CIP_ISOLATION_NOTICE
      });
    }
  }

  private async advanceCipTick(): Promise<void> {
    if (!this.activeCipSessionId || !this.activeStationId) return;

    this.currentPhaseIndex++;
    if (this.currentPhaseIndex >= this.PHASES.length) {
      await this.stopCip();
      return;
    }

    const currentPhase = this.PHASES[this.currentPhaseIndex];

    // Realistic wash chemicals telemetry
    let flow = 14.5;
    let temp = 45.0;
    let cond = 2.0;

    if (currentPhase === CIPPhase.CAUSTIC) {
      temp = 75.0; // hot caustic wash
      cond = 18.5; // high alkaline conductivity
    } else if (currentPhase === CIPPhase.RINSE) {
      temp = 42.0;
      cond = 1.8;
    } else if (currentPhase === CIPPhase.ACID) {
      temp = 68.0; // hot acid descaler
      cond = 12.5;
    } else if (currentPhase === CIPPhase.FINAL_RINSE) {
      temp = 20.0; // cold sanitizing water
      cond = 0.8;
    }

    // Store reading strictly in cip_readings table (NEVER in sensor_readings or cow sessions)
    const reading = await prisma.cipReading.create({
      data: {
        cipSessionId: this.activeCipSessionId,
        timestamp: new Date(),
        flow,
        temperature: temp,
        conductivity: cond,
        phase: currentPhase
      }
    });

    await prisma.cipSession.update({
      where: { id: this.activeCipSessionId },
      data: { phase: currentPhase }
    });

    socketService.emitCipUpdated({
      cipSessionId: this.activeCipSessionId,
      stationId: this.activeStationId,
      phase: currentPhase,
      status: 'IN_PROGRESS',
      isolationNotice: CIP_ISOLATION_NOTICE,
      readings: { flow, temperature: temp, conductivity: cond },
      latestReading: reading
    });
  }

  public async getCipStatus(stationId: string): Promise<any> {
    const latestCip = await prisma.cipSession.findFirst({
      where: { stationId },
      orderBy: { startTime: 'desc' },
      include: { readings: { take: 10, orderBy: { timestamp: 'desc' } } }
    });

    return {
      activeSessionId: this.activeCipSessionId,
      isCleaningActive: !!this.activeCipSessionId,
      latestCip,
      isolationNotice: CIP_ISOLATION_NOTICE
    };
  }
}

export const cipService = CipService.getInstance();

