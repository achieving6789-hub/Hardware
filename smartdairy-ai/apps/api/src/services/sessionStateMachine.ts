import { prisma } from '@smartdairy/database';
import {
  SessionStatus,
  RfidReadStatus,
  DataQuality,
  RiskLevel
} from '@smartdairy/shared';
import { socketService } from './socketService';

export interface StationStateContext {
  stationId: string;
  status: SessionStatus;
  activeSessionId: string | null;
  scannedTagUid: string | null;
  identifiedCowId: string | null;
  identifiedCowCode: string | null;
  identifiedCowName: string | null;
  lastRfidReadTime: Date | null;
  elapsedSeconds: number;
}

export class SessionStateMachine {
  private static instance: SessionStateMachine;
  // In-memory active station states
  private stationStates = new Map<string, StationStateContext>();

  private constructor() {}

  public static getInstance(): SessionStateMachine {
    if (!SessionStateMachine.instance) {
      SessionStateMachine.instance = new SessionStateMachine();
    }
    return SessionStateMachine.instance;
  }

  public getStationState(stationId: string): StationStateContext {
    let state = this.stationStates.get(stationId);
    if (!state) {
      state = {
        stationId,
        status: SessionStatus.IDLE,
        activeSessionId: null,
        scannedTagUid: null,
        identifiedCowId: null,
        identifiedCowCode: null,
        identifiedCowName: null,
        lastRfidReadTime: null,
        elapsedSeconds: 0
      };
      this.stationStates.set(stationId, state);
    }
    return state;
  }

  public setStationState(stationId: string, updates: Partial<StationStateContext>): StationStateContext {
    const current = this.getStationState(stationId);
    const updated = { ...current, ...updates };
    this.stationStates.set(stationId, updated);
    return updated;
  }

  /**
   * Process incoming RFID scan event.
   * Handles valid cow tags, duplicate scans, and unknown tags.
   */
  public async handleRfidScan(tagUid: string, readerId: string, stationId: string): Promise<any> {
    const currentState = this.getStationState(stationId);

    // Rule: Duplicate RFID - do not create another session if milking or already identified
    if (
      currentState.scannedTagUid === tagUid &&
      (currentState.status === SessionStatus.MILKING ||
        currentState.status === SessionStatus.READY ||
        currentState.status === SessionStatus.RFID_DETECTED)
    ) {
      console.log(`[StateMachine] Duplicate RFID scan ignored for tag: ${tagUid}`);
      await prisma.rfidReadEvent.create({
        data: {
          tagUid,
          readerId,
          cowId: currentState.identifiedCowId,
          readStatus: RfidReadStatus.DUPLICATE,
          signalStrength: -42.0
        }
      });
      return {
        status: RfidReadStatus.DUPLICATE,
        message: 'Duplicate RFID scan ignored. Session already active for this animal.',
        stationState: currentState
      };
    }

    // Lookup cow by RFID UID in database
    const tagRecord = await prisma.rfidTag.findUnique({
      where: { tagUid },
      include: {
        cow: {
          include: {
            baseline: true,
            healthProfile: true
          }
        }
      }
    });

    if (!tagRecord || !tagRecord.cow) {
      // Rule: Unknown RFID - do NOT randomly assign. Create UNIDENTIFIED state
      console.warn(`[StateMachine] Unknown RFID detected: ${tagUid}`);
      await prisma.rfidReadEvent.create({
        data: {
          tagUid,
          readerId,
          cowId: null,
          readStatus: RfidReadStatus.UNKNOWN,
          signalStrength: -48.0
        }
      });

      this.setStationState(stationId, {
        status: SessionStatus.UNIDENTIFIED,
        scannedTagUid: tagUid,
        identifiedCowId: null,
        identifiedCowCode: null,
        identifiedCowName: null,
        lastRfidReadTime: new Date()
      });

      // Also create alert for unknown cow entry
      await prisma.alert.create({
        data: {
          farmId: (await prisma.milkingStation.findUnique({ where: { id: stationId } }))?.farmId || '',
          alertType: 'UNKNOWN_COW',
          severity: 'MEDIUM',
          title: `Unregistered RFID Tag Detected: ${tagUid}`,
          message: `Station ${stationId} detected unregistered RFID transponder ${tagUid}. Operator review required.`,
          status: 'ACTIVE'
        }
      });

      socketService.emitRfidDetected({
        stationId,
        tagUid,
        status: RfidReadStatus.UNKNOWN,
        cow: null
      });

      return {
        status: RfidReadStatus.UNKNOWN,
        message: 'RFID tag detected but not registered to any cow in database.',
        stationState: this.getStationState(stationId)
      };
    }

    // Valid cow identified!
    const cow = tagRecord.cow;
    await prisma.rfidReadEvent.create({
      data: {
        tagUid,
        readerId,
        cowId: cow.id,
        readStatus: RfidReadStatus.SUCCESS,
        signalStrength: -38.5
      }
    });

    await prisma.rfidTag.update({
      where: { id: tagRecord.id },
      data: { lastSeen: new Date() }
    });

    const updatedState = this.setStationState(stationId, {
      status: SessionStatus.READY,
      scannedTagUid: tagUid,
      identifiedCowId: cow.id,
      identifiedCowCode: cow.cowCode,
      identifiedCowName: cow.name,
      lastRfidReadTime: new Date()
    });

    socketService.emitRfidDetected({
      stationId,
      tagUid,
      status: RfidReadStatus.SUCCESS,
      cow: {
        id: cow.id,
        cowCode: cow.cowCode,
        name: cow.name,
        breed: cow.breed,
        baseline: cow.baseline,
        healthProfile: cow.healthProfile
      }
    });

    return {
      status: RfidReadStatus.SUCCESS,
      message: `Cow ${cow.cowCode} (${cow.name}) identified successfully. Ready to attach cluster.`,
      cow,
      stationState: updatedState
    };
  }

  /**
   * Start a milking session.
   * If cowId was not scanned by RFID (RFID Miss), creates an UNIDENTIFIED session.
   */
  public async createAndStartSession(stationId: string, manualCowId?: string): Promise<any> {
    const currentState = this.getStationState(stationId);
    let targetCowId = currentState.identifiedCowId || manualCowId;
    let sessionStatus = SessionStatus.MILKING;

    if (!targetCowId) {
      // RFID Missed scenario: create temporary session with UNIDENTIFIED status
      sessionStatus = SessionStatus.UNIDENTIFIED;
      console.warn(`[StateMachine] Starting session with RFID missed. Marked as UNIDENTIFIED.`);
    }

    const sessionCount = await prisma.milkingSession.count();
    const sessionCode = `SES-${(sessionCount + 1).toString().padStart(6, '0')}`;

    const newSession = await prisma.milkingSession.create({
      data: {
        sessionCode,
        cowId: targetCowId,
        stationId,
        rfidTagId: currentState.scannedTagUid,
        startTime: new Date(),
        status: sessionStatus
      },
      include: {
        cow: {
          include: {
            baseline: true,
            healthProfile: true
          }
        }
      }
    });

    this.setStationState(stationId, {
      status: sessionStatus,
      activeSessionId: newSession.id,
      identifiedCowId: targetCowId || null,
      identifiedCowCode: newSession.cow?.cowCode || null,
      identifiedCowName: newSession.cow?.name || null,
      elapsedSeconds: 0
    });

    socketService.emitSessionStarted(newSession);

    return newSession;
  }

  /**
   * Assign cow manually to an unidentified session
   */
  public async assignCow(sessionId: string, cowId: string): Promise<any> {
    const cow = await prisma.cow.findUnique({
      where: { id: cowId },
      include: { baseline: true, healthProfile: true }
    });

    if (!cow) throw new Error('Cow not found');

    const updatedSession = await prisma.milkingSession.update({
      where: { id: sessionId },
      data: {
        cowId: cow.id,
        status: SessionStatus.MILKING
      },
      include: { cow: true }
    });

    this.setStationState(updatedSession.stationId, {
      status: SessionStatus.MILKING,
      identifiedCowId: cow.id,
      identifiedCowCode: cow.cowCode,
      identifiedCowName: cow.name
    });

    socketService.emitSessionUpdated(updatedSession);
    return updatedSession;
  }

  /**
   * Complete milking session and reset station to IDLE
   */
  public async completeSession(sessionId: string, summaryData: any): Promise<any> {
    const updated = await prisma.milkingSession.update({
      where: { id: sessionId },
      data: {
        endTime: new Date(),
        status: SessionStatus.COMPLETED,
        totalVolume: summaryData.totalVolume || 0,
        averageFlow: summaryData.averageFlow || 0,
        peakFlow: summaryData.peakFlow || 0,
        averageTemperature: summaryData.averageTemperature || 38.5,
        averageConductivity: summaryData.averageConductivity || 5.6,
        averagePh: summaryData.averagePh || 6.65,
        averageScc: summaryData.averageScc || 120,
        milkYieldDeviationPercent: summaryData.milkYieldDeviationPercent || 0,
        riskScore: summaryData.riskScore || 0,
        riskLevel: summaryData.riskLevel || 'LOW'
      },
      include: {
        cow: true,
        predictions: { include: { factors: true } }
      }
    });

    this.setStationState(updated.stationId, {
      status: SessionStatus.IDLE,
      activeSessionId: null,
      scannedTagUid: null,
      identifiedCowId: null,
      identifiedCowCode: null,
      identifiedCowName: null,
      elapsedSeconds: 0
    });

    socketService.emitSessionCompleted(updated);
    return updated;
  }
}

export const sessionStateMachine = SessionStateMachine.getInstance();
