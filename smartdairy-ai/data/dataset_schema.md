# SmartDairy AI Dataset Schema Documentation

This document describes the schema, parameters, units of measurement, and statistical properties of the simulated milking line and animal health dataset generated for the **SmartDairy AI** prototype.

---

## 1. cows.csv

Contains individual cow metadata, breed registration, lactation stage, and ground-truth demonstration health status.

| Column | Data Type | Units / Format | Description |
| :--- | :--- | :--- | :--- |
| `id` | String | Unique ID | Primary identifier for the cow |
| `farm_id` | String | Reference | Identifier of the farm (`farm_01`) |
| `cow_code` | String | e.g. `COW-001` | Official visible ear-tag code |
| `rfid_id` | String | e.g. `RFID-982701` | Electronic ISO 11784/11785 RFID transponder UID |
| `name` | String | Text | Farm pet name |
| `breed` | String | Text | Breed (`Holstein Friesian`, `Jersey`, `Gir`, `Sahiwal`) |
| `age` | Float | Years | Animal age in years |
| `lactation_number` | Integer | Count | Number of lactations completed |
| `parity` | Integer | Count | Parity rank |
| `days_in_milk` | Integer | Days | Days since last calving (DIM) |
| `body_weight` | Float | kg | Body weight in kilograms |
| `status` | String | Enum | Operational status (`ACTIVE`, `DRY`, `SICK`, `QUARANTINE`) |
| `health_status` | String | Enum | Baseline risk group: `LOW` (20 cows), `MODERATE` (5 cows), `HIGH` (5 cows) |

---

## 2. rfid_tags.csv

Mapping of physical RFID electronic ear-tags / collars to cows.

| Column | Data Type | Description |
| :--- | :--- | :--- |
| `id` | String | Primary Key |
| `tag_uid` | String | Unique RFID UID read by transceiver |
| `cow_id` | String | Foreign key to `cows.id` |
| `status` | String | `ACTIVE`, `INACTIVE`, `REPLACED` |
| `assigned_at` | ISO-8601 | Tag assignment timestamp |

---

## 3. cow_baselines.csv

Individual cow historical personal baselines calculated over a 30-day moving window. Every sensor reading is compared against each cow's own baseline.

| Column | Data Type | Units | Description |
| :--- | :--- | :--- | :--- |
| `id` | String | Primary Key | Baseline record identifier |
| `cow_id` | String | Reference | Foreign key to cow |
| `baseline_milk_yield` | Float | Liters (L) | Cow-specific typical session yield (~12.5 - 18.5 L) |
| `baseline_scc` | Float | k cells/mL | Baseline Somatic Cell Count (~90 - 160 k/mL) |
| `baseline_pH` | Float | pH units | Healthy milk normal pH (~6.62 - 6.69) |
| `baseline_conductivity`| Float | mS/cm | Healthy milk electrical conductivity (~5.45 - 5.75 mS/cm) |
| `baseline_temperature` | Float | °C | Deep body / milk line temperature (~38.4 - 38.7 °C) |
| `baseline_flow` | Float | L/min | Normal peak milking milk flow rate (~3.4 - 4.2 L/min) |
| `calculation_window_days`| Integer | Days | Moving calculation window (default 30 days) |

---

## 4. milking_sessions.csv

Summary record for each distinct milking event on the shared sensor line.

| Column | Data Type | Units | Description |
| :--- | :--- | :--- | :--- |
| `id` | String | Primary Key | Session identifier |
| `session_code` | String | e.g. `SES-000001` | Human-readable session code |
| `cow_id` | String | Reference | Assigned cow ID |
| `station_id` | String | Reference | Milking station / stall identifier |
| `rfid_tag_id` | String | Reference | RFID tag read during cow entry |
| `start_time` | ISO-8601 | UTC Timestamp | Start of teat cup cluster attachment |
| `end_time` | ISO-8601 | UTC Timestamp | Milk flow cessation and cluster detach |
| `status` | String | Enum | `COMPLETED`, `UNIDENTIFIED`, `ERROR` |
| `total_volume` | Float | Liters (L) | Total cumulative milk yield harvested |
| `average_flow` | Float | L/min | Mean flow rate during session |
| `peak_flow` | Float | L/min | Maximum recorded flow rate |
| `average_temperature` | Float | °C | Mean milk temperature |
| `average_conductivity`| Float | mS/cm | Mean electrical conductivity |
| `average_ph` | Float | pH units | Mean milk line pH |
| `average_scc` | Float | k cells/mL | Composite Somatic Cell Count estimate |
| `milk_yield_deviation_percent` | Float | % | Yield percentage deviation vs cow's baseline |
| `risk_score` | Float | 0 - 100 | AI mastitis risk score |
| `risk_level` | String | Enum | `LOW`, `MODERATE`, `HIGH`, `VERY_HIGH` |

---

## 5. sensor_readings.csv

High-frequency time-series measurements captured by the shared inline sensor suite:

- **SomaDetect**: Inline optical SCC sensor.
- **ifm SM Foodmag**: Hygienic magnetic-inductive flow meter with conductivity and temperature.
- **Mettler Toledo InPro X1 HLS**: Inline hygienic ISFET pH sensor.

| Column | Data Type | Units | Description |
| :--- | :--- | :--- | :--- |
| `id` | String | Primary Key | Reading identifier |
| `session_id` | String | Reference | Associated milking session |
| `timestamp` | ISO-8601 | UTC Timestamp | Instantaneous sensor measurement time |
| `flow_rate` | Float | L/min | Instantaneous milk flow rate |
| `total_volume` | Float | Liters (L) | Cumulative volume at timestamp |
| `temperature` | Float | °C | Instantaneous temperature |
| `conductivity` | Float | mS/cm | Instantaneous electrical conductivity |
| `ph` | Float | pH units | Instantaneous pH |
| `scc` | Float | k cells/mL | Instantaneous optical SCC estimate |
| `data_quality` | String | Enum | `GOOD`, `WARNING`, `MISSING`, `INVALID`, `OFFLINE` |

---

## 6. ai_predictions.csv

Explainable AI inference records generated at the conclusion of each milking session.

| Column | Data Type | Description |
| :--- | :--- | :--- |
| `id` | String | Primary Key |
| `cow_id` | String | Cow reference |
| `session_id` | String | Session reference |
| `risk_score` | Float (0 - 100) | Multi-factor weighted score |
| `risk_level` | String | `LOW`, `MODERATE`, `HIGH`, `VERY_HIGH` |
| `prediction_type` | String | `MASTITIS_RISK` |
| `confidence` | Float (0 - 1) | Model confidence estimate (e.g. 0.94) |
| `explanation` | Text | Natural-language explanation of contributing deviations |
| `created_at` | ISO-8601 | Timestamp of AI prediction |

---

## 7. alerts.csv

Operational early-warning notifications generated when sensor readings exceed thresholds.

| Column | Data Type | Description |
| :--- | :--- | :--- |
| `id` | String | Primary Key |
| `farm_id` | String | Farm reference |
| `cow_id` | String | Cow reference |
| `session_id` | String | Session reference |
| `alert_type` | String | `MASTITIS_RISK`, `HIGH_SCC`, `MILK_YIELD_DROP`, `CONDUCTIVITY_CHANGE` |
| `severity` | String | `INFO`, `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` |
| `title` | String | Short title |
| `message` | String | Detailed warning message |
| `status` | String | `ACTIVE`, `ACKNOWLEDGED`, `RESOLVED` |
| `created_at` | ISO-8601 | Timestamp of alert generation |
