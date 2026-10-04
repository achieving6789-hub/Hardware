# 🥛 SmartDairy AI
### *Intelligent Milking Monitoring & Early Mastitis Risk Detection*
#### **Smart India Hackathon (SIH) Hardware-Software Prototype**

---

## 🌟 Executive Summary

**SmartDairy AI** is an intelligent dairy milking-line monitoring and early-warning mastitis detection platform. It solves the core operational and economic challenge of commercial dairy farming: **how to continuously track individual cow udder health using a single shared inline sensing line per stall.**

### The Physical Architecture:
```
COW  --->  RFID IDENTIFICATION  --->  SHARED MILK SENSOR LINE  --->  BULK TANK
                                             │
               ┌─────────────────────────────┼─────────────────────────────┐
               ▼                             ▼                             ▼
          SomaDetect                  ifm SM Foodmag            Mettler Toledo InPro
     (Optical SCC & Cells)       (Flow, Volume, Temp, EC)           (ISFET pH)
               │                             │                             │
               └─────────────────────────────┼─────────────────────────────┘
                                             ▼
                                      EDGE CONTROLLER
                                             ▼
                                    DATABASE (PostgreSQL)
                                             ▼
                                    AI / ML RISK ENGINE
                                             ▼
                                       FARM DASHBOARD
```

---

## ⚡ Key Highlights & Core Principles

1. **Shared Sensing Line + Dynamic Session Association**: A single hygienic flow line accommodates the entire herd sequentially. RFID reads at the stall entrance bind measurements to the correct cow.
2. **Personal Historical Baselines (Not Fixed Thresholds)**: Every cow has a unique 30-day baseline for SCC, milk yield, conductivity, pH, and temperature. The AI evaluates *personal deviation*, not arbitrary generic thresholds.
3. **Multi-Feature Explainable AI (XAI)**: Evaluates Somatic Cell Count trends (30%), Milk yield drops (20%), Electrical conductivity changes (20%), pH shifts (10%), Flow dynamics (10%), Temperature (5%), and Historical momentum (5%).
4. **Clean-In-Place (CIP) Data Isolation**: CIP wash readings are strictly isolated from cow sessions, guaranteeing zero data contamination.
5. **Real-Time WebSockets**: Live telemetry streams to the dashboard every second without page refreshes.
6. **Robust State Machine**: Handles duplicate RFID scans, unregistered tags (`UNIDENTIFIED`), and RFID misses.
7. **Hardware Integration Abstraction**: Extensible interfaces (`IRFIDReader`, `ISCCSensor`, `IFlowSensor`, `IPHSensor`) allow immediate switching to physical IO-Link / Modbus hardware.

---

## 🚀 Quick Start Guide (Local Execution)

### Prerequisites
- **Node.js** (v18+ or v20+ or v24+)
- **npm** (v9+)
- *(Optional: Docker for PostgreSQL)*

### 1. Install Dependencies
From the repository root or inside `smartdairy-ai`:
```bash
cd smartdairy-ai
npm install
```

### 2. Initialize Database & Generate Prisma Client
```bash
npm run db:generate
npm run db:push
```

### 3. Seed Realistic Demo Dataset (30 Cows, Baselines & Sessions)
```bash
npm run db:seed
```

### 4. (Optional) Generate Full 60-Day Historical Dataset CSVs
```bash
npm run dataset:generate
```
*Outputs `cows.csv`, `rfid_tags.csv`, `cow_baselines.csv`, `milking_sessions.csv`, `sensor_readings.csv`, `ai_predictions.csv`, and `alerts.csv` into `data/generated/`.*

### 5. Start Backend API & WebSocket Server
```bash
npm run dev:api
```
*API running at: `http://localhost:4000`*
*Swagger API Docs: `http://localhost:4000/api/docs`*

### 6. Start Frontend Web Application
In another terminal:
```bash
npm run dev:web
```
*Web application available at: `http://localhost:5173`*

---

## 🔑 Demo Login Credentials

The login page features **1-Click Demo Buttons** for effortless presentation:

| Role | Email | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@smartdairy.local` | `Admin@123` | Full system access |
| **Farm Manager** | `manager@smartdairy.local` | `Manager@123` | Cattle registry, analytics, alerts |
| **Veterinarian** | `vet@smartdairy.local` | `Vet@123` | Health monitoring, moving baselines, AI factors |
| **Operator** | `operator@smartdairy.local` | `Operator@123` | Live milking controls, RFID scan, CIP |

---

## 🧪 Running Automated Tests

Run the full Vitest unit and integration test suite:
```bash
npm run test
```

Tests include:
- AI Multi-Factor Risk Calculation & Personal Baseline Deviations
- Sensor Driver Simulations & Volume Integration ($\int \text{Flow} \, dt$)
- CIP Chemical Wash Isolation
- End-to-End Milking Workflow (RFID Scan $\to$ Session Creation $\to$ 30+ Readings $\to$ AI Inference $\to$ Alert Generation $\to$ Profile History)

---

## 📂 Project Structure

```
smartdairy-ai/
├── apps/
│   ├── api/                    # Express REST API, Socket.IO, State Machine, Swagger
│   └── web/                    # React 18, Vite, Tailwind CSS, Recharts Dashboard
├── packages/
│   ├── ai/                     # Multi-Feature Weighted Risk Model & XAI Engine
│   ├── database/               # Prisma ORM, Schema (SQLite / PostgreSQL), Seed, Generator
│   ├── sensors/                # Sensor Abstractions (IRFIDReader, ISCCSensor, IFlowSensor, IPHSensor)
│   ├── shared/                 # Shared Enums, Types, Constants, and Zod Schemas
│   └── simulation/             # Physiological Milking Curve & Sensor Stream Engine
├── data/
│   ├── generated/              # Deterministic 60-day CSV dataset exports
│   └── dataset_schema.md       # Full documentation of every dataset column
├── docs/                       # Comprehensive Architecture, API, AI, and Demo Guides
├── docker-compose.yml          # Optional PostgreSQL container orchestrator
└── README.md
```

---

## 📖 Complete Documentation Index

- [System Architecture & Data Flow](file:///c:/Users/maniv/OneDrive/Desktop/Hardware/smartdairy-ai/docs/ARCHITECTURE.md)
- [REST API Reference & Swagger Specs](file:///c:/Users/maniv/OneDrive/Desktop/Hardware/smartdairy-ai/docs/API.md)
- [Relational Database Schema & Tables](file:///c:/Users/maniv/OneDrive/Desktop/Hardware/smartdairy-ai/docs/DATABASE.md)
- [Dataset Generation & Progression Models](file:///c:/Users/maniv/OneDrive/Desktop/Hardware/smartdairy-ai/docs/DATASET.md)
- [Dataset Column Dictionary](file:///c:/Users/maniv/OneDrive/Desktop/Hardware/smartdairy-ai/data/dataset_schema.md)
- [AI Risk Engine & Feature Scoring](file:///c:/Users/maniv/OneDrive/Desktop/Hardware/smartdairy-ai/docs/AI_MODEL.md)
- [Physical Hardware Sensor Integration](file:///c:/Users/maniv/OneDrive/Desktop/Hardware/smartdairy-ai/docs/SENSOR_INTEGRATION.md)
- [SIH Presentation Demo Walkthrough](file:///c:/Users/maniv/OneDrive/Desktop/Hardware/smartdairy-ai/docs/DEMO_GUIDE.md)
- [Troubleshooting & Diagnostics](file:///c:/Users/maniv/OneDrive/Desktop/Hardware/smartdairy-ai/docs/TROUBLESHOOTING.md)

---

## 🛡️ Prototype Disclaimer
*SmartDairy AI produces prototype AI risk estimates for early warning and decision support. It is not a clinical veterinary diagnosis.*
