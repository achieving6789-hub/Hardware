# SmartDairy AI — SIH Demonstration & Presentation Guide

This guide walks through the live presentation flow for the Smart India Hackathon (SIH).

---

## 1. Demo Credentials

| Role | Email | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@smartdairy.local` | `Admin@123` | Complete system access |
| **Farm Manager** | `manager@smartdairy.local` | `Manager@123` | Cattle registry, analytics, alerts |
| **Veterinarian** | `vet@smartdairy.local` | `Vet@123` | Health monitoring, trends, AI factors |
| **Operator** | `operator@smartdairy.local` | `Operator@123` | Live milking controls, RFID scan, CIP |

*(Or click any of the 4 One-Click Role buttons on the Login page).*

---

## 2. Step-by-Step SIH Pitch Flow

### Step 1: Farm Dashboard (Overview)
- Open `/dashboard`.
- Highlight key metrics: Herd Size (30 cows), Today's Harvest Volume, Sensor Availability (100%), and Active Alerts.
- Point out that all data is generated dynamically from individual cow baselines.

### Step 2: Live Milking Screen (Flagship Demonstration)
- Navigate to `/live-milking`.
- Click **COW-001 (Normal)** in the RFID entrance controls.
- Show that COW-001 is identified and line state transitions to `READY`.
- Click **START MILKING**.
- Point out live telemetry streaming over WebSockets:
  - ifm Foodmag: Flow rate ramps up to 3.8 L/min, cumulative volume accumulates (`flow × dt`).
  - SomaDetect: SCC stays stable near personal baseline (~110 k/mL).
  - InPro X1: pH remains healthy (6.65).
  - Foodmag EC: Conductivity steady at 5.58 mS/cm.
  - Live Moving Charts show physiological milking curve.
  - AI Risk Meter stays in the green (`LOW RISK`, Score 12).
- Click **END MILKING** (or wait for auto-detach).
- Review session completion and AI prediction summary.

### Step 3: High-Risk Mastitis Early Warning Demonstration
- On `/live-milking`, click **COW-026 (High)** under RFID controls.
- Click **START MILKING**.
- Observe the multi-sensor deviation:
  - SomaDetect optical SCC surges to 650+ k/mL (+400%).
  - Electrical conductivity rises to 7.2 mS/cm (+28%).
  - Milk yield drops by 28%.
  - AI Risk Gauge leaps into `HIGH / VERY HIGH RISK` (Score ~82).
- Click **END MILKING**.
- Immediately navigate to `/alerts`: show the newly generated **Critical Udder Health Alert** for COW-026 with exact factor breakdown.
- Click **Acknowledge** or **Resolve** and show the dashboard active alert count drop in real time!

### Step 4: Cow Moving Baselines (7D / 30D / 60D)
- Navigate to `/cows/cow_26`.
- Inspect COW-026's personal baseline targets.
- Switch time filter between `7D`, `30D`, and `60D`.
- Show the 60-day trend where day 1–20 is normal, days 21–35 show subtle SCC rise, days 36–50 show conductivity rise, and days 51–60 display clinical mastitis.

### Step 5: Clean-In-Place (CIP) Isolation Guarantee
- Navigate to `/cip`.
- Click **Start CIP Sanitation**.
- Watch the 6-phase wash timeline: `PRE_RINSE` -> `CAUSTIC` (75 °C) -> `RINSE` -> `ACID` (68 °C) -> `FINAL_RINSE` -> `COMPLETE`.
- Highlight the prominent notice: **"CIP DATA IS NOT ASSOCIATED WITH ANY COW."**
- Show that cow milking is safely locked out during wash cycles.

### Step 6: Hardware Sensor Health & Fault Injection
- Navigate to `/sensors`.
- Click **Simulate Offline** on SomaDetect.
- Show that status updates to `OFFLINE` and data quality degrades gracefully without emitting fake data.
- Restore to `ONLINE`.

### Step 7: Configurable AI Risk Weights
- Navigate to `/settings`.
- Show how judges can adjust the importance of SCC trend, milk yield drop, or electrical conductivity using interactive sliders.
- Click **Apply & Save AI Weights** and confirm live engine updates.
