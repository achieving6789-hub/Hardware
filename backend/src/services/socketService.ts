import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';

export class SocketService {
  private static instance: SocketService;
  private io: SocketIOServer | null = null;

  private constructor() {}

  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  public init(httpServer: HttpServer, frontendUrl = '*'): void {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: frontendUrl === '*' ? '*' : [frontendUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
        methods: ['GET', 'POST'],
        credentials: true
      }
    });

    this.io.on('connection', (socket) => {
      console.log(`[WebSocket] Client connected: ${socket.id}`);

      socket.on('disconnect', () => {
        console.log(`[WebSocket] Client disconnected: ${socket.id}`);
      });
    });

    console.log('[WebSocket] Socket.IO server initialized successfully.');
  }

  public emit(event: string, payload: any): void {
    if (!this.io) {
      // In testing or before HTTP listening
      return;
    }
    this.io.emit(event, payload);
  }

  public emitSensorReading(reading: any): void {
    this.emit('sensor:reading', reading);
  }

  public emitSessionStarted(session: any): void {
    this.emit('session:started', session);
  }

  public emitSessionUpdated(session: any): void {
    this.emit('session:updated', session);
  }

  public emitSessionCompleted(summary: any): void {
    this.emit('session:completed', summary);
  }

  public emitRfidDetected(rfidEvent: any): void {
    this.emit('rfid:detected', rfidEvent);
  }

  public emitAlertCreated(alert: any): void {
    this.emit('alert:created', alert);
  }

  public emitSensorStatus(statusPayload: any): void {
    this.emit('sensor:status', statusPayload);
  }

  public emitCipUpdated(cipPayload: any): void {
    this.emit('cip:updated', cipPayload);
  }
}

export const socketService = SocketService.getInstance();

