import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io('/', {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    socket.on('connect', () => {
      console.log(`[Socket.IO Client] Connected to real-time telemetry stream: ${socket?.id}`);
    });

    socket.on('disconnect', (reason) => {
      console.warn(`[Socket.IO Client] Disconnected: ${reason}`);
    });
  }

  return socket;
}
