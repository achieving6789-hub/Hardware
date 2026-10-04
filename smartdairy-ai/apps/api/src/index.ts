import * as http from 'http';
import * as dotenv from 'dotenv';
dotenv.config();

import { createApp } from './app';
import { socketService } from './services/socketService';

const PORT = Number(process.env.PORT) || 4000;
const app = createApp();
const server = http.createServer(app);

// Initialize Socket.IO server
socketService.init(server, process.env.FRONTEND_URL || 'http://localhost:5173');

server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🐄 SmartDairy AI Backend Server Started`);
  console.log(`📡 Listening on: http://localhost:${PORT}`);
  console.log(`📖 Swagger API Docs: http://localhost:${PORT}/api/docs`);
  console.log(`🔌 WebSocket Server: ws://localhost:${PORT}`);
  console.log(`====================================================`);
});

export { app, server };
