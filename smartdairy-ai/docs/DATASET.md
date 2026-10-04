# SmartDairy AI Dataset Generation & Evaluation

## 1. Dataset Generation Methodology

The SmartDairy AI dataset was deterministically synthesized using a seeded pseudo-random number generator (Mulberry32) to model physiological milk production and mastitis disease progression across 30 dairy cows over a 60-day historical window.

### Statistical Properties:
- **Herd Size**: 30 cows
  - 20 Normal Cows (`LOW` risk baseline)
  - 5 Moderate Risk Cows (`MODERATE` risk developing after day 30)
  - 5 High Risk Cows (`HIGH / VERY_HIGH` demonstration progression)
- **Sessions Per Day**: 2 (Morning shift at 06:00, Evening shift at 17:00)
- **Time Duration**: 60 days
- **Total Historical Milking Sessions**: $30 \times 60 \times 2 = 3600 \text{ sessions}$
- **Total Sensor Readings**: Tens of thousands of time-series measurements

---

## 2. High-Risk Cow Disease Progression Model

Rather than random noise, high-risk cows follow a realistic immunological and physiological progression:

- **Days 1 – 20 (Healthy Phase)**:
  Parameters remain stable around the cow's personal baseline ($\text{SCC } \sim 110\text{ k/mL}, \text{EC } \sim 5.58\text{ mS/cm}, \text{Yield } \sim 14.5\text{ L}$).
- **Days 21 – 35 (Early Immunological Response)**:
  Somatic Cell Count increases gradually by $30\% - 60\%$. Other parameters remain within normal range.
- **Days 36 – 45 (Electrolyte Permeability Shift)**:
  Mammary epithelial tight junctions begin leaking; electrical conductivity increases to $6.2 - 6.5\text{ mS/cm}$. SCC exceeds $300\text{ k/mL}$.
- **Days 46 – 50 (Secretory Decline)**:
  Milk yield begins dropping by $10\% - 20\%$. pH shifts slightly toward blood pH ($6.8 - 6.9$).
- **Days 51 – 60 (Acute Mastitis Demonstration)**:
  SCC surges to $650 - 900+\text{ k/mL}$ ($+400\%$), EC reaches $7.0 - 7.5\text{ mS/cm}$, milk yield plummets by $28\% - 35\%$, temperature increases by $0.7\text{ °C}$. The AI risk engine flags `HIGH / VERY_HIGH` ($82/100$) and triggers critical early-warning alerts.

---

## 3. CSV Dataset Exports

The dataset generator produces 7 standardized CSV files in `data/generated/`:
1. `cows.csv`
2. `rfid_tags.csv`
3. `cow_baselines.csv`
4. `milking_sessions.csv`
5. `sensor_readings.csv`
6. `ai_predictions.csv`
7. `alerts.csv`

To regenerate or export fresh CSVs at any time, run:
```bash
npm run dataset:generate
```
