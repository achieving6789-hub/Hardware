# SmartDairy AI Troubleshooting Guide

## 1. Common Installation & Setup Issues

### Problem: Prisma Client not found
**Symptom**: `Cannot find module '@prisma/client'` or `PrismaClientInitializationError`.
**Resolution**:
```bash
npm run db:generate
npm run db:push
```

### Problem: Port 4000 or 5173 already in use
**Symptom**: `EADDRINUSE: address already in use :::4000`.
**Resolution**:
1. Identify and kill the occupying process:
   ```powershell
   Get-Process -Id (Get-NetTCPConnection -LocalPort 4000).OwningProcess | Stop-Process
   ```
2. Or change the port in `.env` (`PORT=4001`).

### Problem: WebSocket Telemetry Disconnected
**Symptom**: Top header displays "Connecting..." with a red indicator.
**Resolution**:
1. Verify the backend API server is running on `http://localhost:4000`.
2. Test backend health at `http://localhost:4000/health`.
3. Check browser dev console for any CORS or proxy blocks.

---

## 2. Milking Line & Simulator Scenarios

### Problem: Duplicate RFID scan does not start new session
**Explanation**: This is intentional! The session state machine explicitly guards against duplicate RFID scans if the animal is already in `READY` or `MILKING` status to prevent duplicate sessions.

### Problem: Animal entered stall without RFID scan (RFID Miss)
**Resolution**:
1. Click **RFID Missed** under SIH Presentation Scenario Triggers.
2. The system initiates an `UNIDENTIFIED` session.
3. Use the operator dropdown to assign the correct animal ID manually.

### Problem: Clean-In-Place (CIP) cycle is active and cow cannot be milked
**Explanation**: The shared line is undergoing chemical sanitation (`PRE_RINSE` -> `CAUSTIC` -> `ACID` -> `FINAL_RINSE`). Teat cluster milking is locked out for biosecurity and hygiene. Stop CIP or wait for cycle completion (`COMPLETE`) to restore line state to `IDLE`.
