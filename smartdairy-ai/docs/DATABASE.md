# SmartDairy AI Relational Database Documentation

## 1. Relational Entity-Relationship Model

SmartDairy AI enforces a normalized relational database schema via Prisma ORM:

```
               [Farm]
                 |
         +-------+-------+
         |               |
         v               v
 [MilkingStation]      [Cow] <---------> [RfidTag]
         |               |
         |         +-----+-----+-----+
         |         |           |     |
         |         v           v     v
         |   [CowBaseline] [HealthProfile] [RfidReadEvent]
         |         |
         +---------+
         |
         v
  [MilkingSession]
         |
    +----+----+----+
    |         |    |
    v         v    v
 [Readings] [AiPred] [Alert]
              |
              v
       [AiPredFactor]

  [CipSession] (STRICTLY ISOLATED FROM COWS)
       |
       v
  [CipReading]
```

---

## 2. Table Specifications

### 2.1 `users`
Stores user identities, bcrypt password hashes, and system roles (`ADMIN`, `FARM_MANAGER`, `VETERINARIAN`, `OPERATOR`).

### 2.2 `farms`
Farm identification, geographical location, timezone (`Asia/Kolkata`), and herd capacity.

### 2.3 `milking_stations`
Milking stall identification (`STN-01`), hardware line code, online/offline status, and last active timestamp.

### 2.4 `cows`
Cattle registry containing visual ear-tag `cow_code`, electronic `rfid_id`, name, breed, date of birth, age, lactation number, parity, days in milk (DIM), body weight, and health status.

### 2.5 `rfid_tags` & `rfid_read_events`
Electronic transponders and raw event stream captured by the ISO 11785 transceiver antenna (`SUCCESS`, `UNKNOWN`, `DUPLICATE`, `INVALID`).

### 2.6 `milking_sessions`
Encapsulates a distinct milking event on the shared line. Aggregates total milk volume, average flow, peak flow, average temperature, conductivity, pH, composite SCC, milk yield deviation %, AI risk score, and risk level.

### 2.7 `sensor_readings`
High-frequency time-series measurements captured by the shared inline sensor line: flow rate, cumulative volume, temperature, conductivity, pH, and optical SCC.

### 2.8 `sensor_devices` & `sensor_health_logs`
Hardware instrumentation inventory: SomaDetect optical analyzer, ifm SM Foodmag, Mettler Toledo InPro X1 HLS, and RFID transceiver. Tracks calibration status, firmware version, and diagnostic error counts.

### 2.9 `cow_baselines`
Personal historical baseline targets calculated over a 30-day moving window for each cow (baseline yield, baseline SCC, baseline pH, baseline EC, baseline temp, peak flow).

### 2.10 `cow_health_profiles`
Current real-time health profile of each cow, updated dynamically after each milking session.

### 2.11 `ai_predictions` & `ai_prediction_factors`
Inference records produced by the multi-feature AI risk engine. Stores confidence, score, level, natural language explanation, and individual feature contribution percentages.

### 2.12 `alerts` & `alert_events`
Operational alerts dispatched on threshold exceedance (`MASTITIS_RISK`, `HIGH_SCC`, `MILK_YIELD_DROP`, `CONDUCTIVITY_CHANGE`, `SENSOR_OFFLINE`, `UNKNOWN_COW`). Tracks acknowledgement and resolution timestamps and user notes.

### 2.13 `cip_sessions` & `cip_readings`
Sanitation wash logs for Clean-In-Place cycles. **Strictly isolated from cows and milking sessions.**

### 2.14 `audit_logs`
System activity audit trail (logins, session triggers, alert resolutions, sensor changes).
