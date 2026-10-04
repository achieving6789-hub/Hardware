# SmartDairy AI Architecture Documentation

## 1. System Overview

**SmartDairy AI** is an intelligent dairy milking-line monitoring and early-warning mastitis detection platform. It solves the core economic challenge of dairy farms: **monitoring individual cows during milking using a single shared inline sensing line per stall.**

```
+-----------------------------------------------------------------------------------+
|                                  PHYSICAL STALL                                   |
|                                                                                   |
|  [COW ENTRY] ---> [RFID TRANSCEIVER (ISO 11785)]                                 |
|                         |                                                         |
|                         v                                                         |
|                [MILKING CLUSTER ATTACHED]                                         |
|                         |                                                         |
|                         v (Shared Inline Milk Tube)                               |
|        +--------------------------------------------------+                       |
|        | 1. SomaDetect (Optical SCC & Spectral Analyzer)  |                       |
|        | 2. ifm SM Foodmag (Magnetic Flow, Temp & EC)     |                       |
|        | 3. Mettler Toledo InPro X1 HLS (ISFET pH)        |                       |
|        +--------------------------------------------------+                       |
|                         |                                                         |
|                         v (Hygienic Flow)                                         |
|                 [BULK MILK TANK]                                                  |
+-----------------------------------------------------------------------------------+
                          | (RS-485 / IO-Link / Industrial Ethernet)
                          v
+-----------------------------------------------------------------------------------+
|                           EDGE CONTROLLER & BACKEND                               |
|                                                                                   |
|  +--------------------+    +--------------------+    +-------------------------+  |
|  | Hardware Adaptors  | -> | Session State Mach | -> | Correlated Time-Series  |  |
|  | (IRFID, IFlow, etc)|    | (IDLE -> MILK ->..) |    | Storage (PostgreSQL)    |  |
|  +--------------------+    +--------------------+    +-------------------------+  |
|                                                               |                   |
|                                                               v                   |
|                                                      +-------------------------+  |
|                                                      | Feature Extraction &    |  |
|                                                      | Personal Baseline Comp  |  |
|                                                      +-------------------------+  |
|                                                               |                   |
|                                                               v                   |
|                                                      +-------------------------+  |
|                                                      | Multi-Feature AI Risk   |  |
|                                                      | Engine (0 - 100 Score)  |  |
|                                                      +-------------------------+  |
|                                                               |                   |
|                                                               v                   |
|                                                      +-------------------------+  |
|                                                      | Alerts & Notifications  |  |
|                                                      +-------------------------+  |
+-----------------------------------------------------------------------------------+
                          | (REST APIs + Socket.IO WebSockets)
                          v
+-----------------------------------------------------------------------------------+
|                         FARM WEB APPLICATION (VITE + REACT)                       |
|                                                                                   |
|  * Live Milking Telemetry Dashboard                                              |
|  * Udder Health Risk Monitoring Table                                             |
|  * Individual Cow Moving Baselines (7D / 30D / 60D)                               |
|  * Clean-In-Place (CIP) Wash Isolation                                            |
|  * Hardware Sensor Health & Diagnostics                                           |
+-----------------------------------------------------------------------------------+
```

---

## 2. Shared Sensing Line Concept & Session Separation

In typical milking parlors, installing 40 laboratory analyzers per stall is economically prohibitive. SmartDairy AI employs **one shared sensor line per stall**.

1. **Animal Identification**: An RFID transceiver at the stall entrance identifies the cow transponder UID.
2. **Session Binding**: A unique `milking_session` is instantiated and bound to `cow_id` and `station_id`.
3. **Data Integrity Guarantee**:
   - Duplicate RFID reads do not spawn extraneous sessions.
   - Unregistered RFID tags create an `UNIDENTIFIED` session awaiting manual operator assignment, preventing arbitrary data pollution.
   - Clean-In-Place (CIP) chemical wash cycles run strictly under `CIP` state, guaranteeing zero milk or animal contamination.

---

## 3. Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Recharts, Lucide React, Socket.IO Client.
- **Backend**: Node.js, Express, TypeScript, Socket.IO, Helmet, CORS, Rate-Limiting, Zod.
- **Database**: PostgreSQL (Prisma ORM) / SQLite zero-config local dev.
- **AI/ML Layer**: Weighted Multi-Feature Risk Engine with explainable natural language output, structured with an extensible `IRiskModel` interface.
- **Testing**: Vitest, Supertest integration & end-to-end suite.
