# SmartDairy AI REST API Reference

Interactive Swagger OpenAPI 3.0 documentation is exposed at:
**`http://localhost:4000/api/docs`**

---

## 1. Authentication

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Authenticate with email & password, returns JWT | No |
| `GET` | `/api/auth/me` | Fetch authenticated user profile & permissions | Yes |

---

## 2. Cattle Registry

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/cows` | List registered cows with baselines & health | Yes |
| `GET` | `/api/cows/:id` | Get detailed cow profile, sessions & alerts | Yes |
| `POST` | `/api/cows` | Register new cow (FARM_MANAGER / ADMIN) | Yes |
| `PUT` | `/api/cows/:id` | Update cow metadata (FARM_MANAGER / VET) | Yes |

---

## 3. RFID Transceiver & Stall Identification

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/rfid/scan` | Trigger or ingest tag scan (`tagUid`, `readerId`) | Yes |
| `GET` | `/api/rfid/events` | List historical RFID transceiver read events | Yes |

---

## 4. Milking Sessions

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/sessions` | List past milking sessions with pagination | Yes |
| `GET` | `/api/sessions/live` | Current station state, active cow & readings | Yes |
| `GET` | `/api/sessions/:id` | Get session details with time-series readings | Yes |
| `POST` | `/api/sessions/start` | Start session on milking line stall | Yes |
| `POST` | `/api/sessions/:id/end`| Finalize session, calculate yield, run AI | Yes |
| `POST` | `/api/sessions/:id/assign-cow` | Assign animal to UNIDENTIFIED session | Yes |

---

## 5. Inline Sensors & Diagnostics

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/sensors` | List hardware sensor devices & health | Yes |
| `GET` | `/api/sensors/:id` | Get sensor calibration logs & error history | Yes |
| `POST` | `/api/sensors/:id/status`| Update status (ONLINE / OFFLINE / ERROR) | Yes |

---

## 6. Sensor Telemetry Readings & Buffer Sync

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/readings` | Ingest real-time sensor reading | Yes |
| `POST` | `/api/readings/sync` | Sync buffered offline readings (`event_id` dedup) | Yes |
| `GET` | `/api/sessions/:id/readings` | Fetch time-series readings for a session | Yes |

---

## 7. Udder Health & AI Risk Engine

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health/cows` | Health monitoring table with baseline deviations | Yes |
| `GET` | `/api/health/cows/:id` | Full health history & moving baselines | Yes |
| `POST` | `/api/ai/analyze/:sessionId` | Execute AI multi-feature inference on session | Yes |
| `GET` | `/api/ai/cow/:cowId` | Historical AI predictions for animal | Yes |
| `GET` | `/api/ai/weights` | View configurable AI scoring weights | Yes |
| `POST` | `/api/ai/weights` | Update AI scoring weights | Yes |

---

## 8. Alerts & Early Warnings

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/alerts` | List alerts filtered by status and severity | Yes |
| `POST` | `/api/alerts/:id/acknowledge`| Acknowledge active warning | Yes |
| `POST` | `/api/alerts/:id/resolve` | Mark warning as resolved with note | Yes |

---

## 9. Clean-In-Place (CIP) Sanitation

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/cip/status` | Current Clean-In-Place status & telemetry | Yes |
| `POST` | `/api/cip/start` | Start 6-phase automated sanitation sequence | Yes |
| `POST` | `/api/cip/stop` | Terminate CIP cycle and restore line to IDLE | Yes |

---

## 10. Dashboard & Farm Analytics

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/dashboard/summary` | Top-level KPI counts, milk yields, sensor status | Yes |
| `GET` | `/api/dashboard/trends` | 7-day milk volume and risk distributions | Yes |

---

## 11. Simulation & Scenario Runner

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/simulation/start` | Start live timer-based simulator for animal | Yes |
| `POST` | `/api/simulation/stop` | Stop live simulator and trigger evaluation | Yes |
| `POST` | `/api/simulation/pause` | Pause live flow simulation | Yes |
| `POST` | `/api/simulation/resume`| Resume flow simulation | Yes |
| `POST` | `/api/simulation/scenario`| Run one of 9 preset presentation scenarios | Yes |
| `POST` | `/api/simulation/network` | Toggle edge network status online / offline | Yes |
