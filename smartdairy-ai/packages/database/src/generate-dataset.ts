import * as fs from 'fs';
import * as path from 'path';

// Deterministic Pseudo-Random Number Generator (Mulberry32)
function createRng(seed = 123456789) {
  let s = seed;
  return function () {
    let t = (s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = createRng(42);

function randRange(min: number, max: number): number {
  return min + rng() * (max - min);
}

function randInt(min: number, max: number): number {
  return Math.floor(randRange(min, max + 1));
}

interface CowMeta {
  id: string;
  cowCode: string;
  rfidId: string;
  name: string;
  breed: string;
  age: number;
  lactationNumber: number;
  parity: number;
  daysInMilk: number;
  bodyWeight: number;
  healthStatus: 'LOW' | 'MODERATE' | 'HIGH';
  baselineYield: number;
  baselineScc: number;
  baselinePh: number;
  baselineCond: number;
  baselineTemp: number;
  baselineFlow: number;
}

const BREEDS = ['Holstein Friesian', 'Jersey', 'Gir', 'Sahiwal', 'Crossbred HF-Gir'];
const COW_NAMES = [
  'Ganga', 'Kamadhenu', 'Surabhi', 'Bella', 'Daisy', 'Lakshmi', 'Nandini', 'Gauri',
  'Buttercup', 'Luna', 'Kalyani', 'Radha', 'Molly', 'Rosie', 'Yamuna', 'Godavari',
  'Tulsi', 'Amrita', 'Meera', 'Kaveri', 'Shreya', 'Chitra', 'Ananya', 'Tara',
  'Bhavani', 'Veda', 'Durga', 'Sita', 'Parvati', 'Anandi'
];

export async function generateDataset(outputDir = path.resolve(__dirname, '../../../data/generated')) {
  console.log(`[Dataset] Generating deterministic SmartDairy AI dataset in: ${outputDir}`);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const cows: CowMeta[] = [];
  const cowCsvRows: string[] = [
    'id,farm_id,cow_code,rfid_id,name,breed,age,lactation_number,parity,days_in_milk,body_weight,status,health_status'
  ];
  const rfidCsvRows: string[] = ['id,tag_uid,cow_id,status,assigned_at'];
  const baselineCsvRows: string[] = [
    'id,cow_id,baseline_milk_yield,baseline_scc,baseline_pH,baseline_conductivity,baseline_temperature,baseline_flow,calculation_window_days'
  ];
  const sessionCsvRows: string[] = [
    'id,session_code,cow_id,station_id,rfid_tag_id,start_time,end_time,status,total_volume,average_flow,peak_flow,average_temperature,average_conductivity,average_ph,average_scc,milk_yield_deviation_percent,risk_score,risk_level'
  ];
  const predictionCsvRows: string[] = [
    'id,cow_id,session_id,risk_score,risk_level,prediction_type,confidence,explanation,created_at'
  ];
  const alertCsvRows: string[] = [
    'id,farm_id,cow_id,session_id,alert_type,severity,title,message,status,created_at'
  ];
  const readingsCsvRows: string[] = [
    'id,session_id,timestamp,flow_rate,total_volume,temperature,conductivity,ph,scc,data_quality'
  ];

  // 1. Create 30 Cows:
  // 1-20: Normal (LOW)
  // 21-25: Moderate risk (MODERATE)
  // 26-30: High risk demo cows (HIGH)
  for (let i = 1; i <= 30; i++) {
    const cowCode = `COW-${i.toString().padStart(3, '0')}`;
    const rfidId = `RFID-9827${i.toString().padStart(2, '0')}`;
    const id = `cow_${i}`;
    let healthStatus: 'LOW' | 'MODERATE' | 'HIGH' = 'LOW';
    if (i >= 21 && i <= 25) healthStatus = 'MODERATE';
    if (i >= 26) healthStatus = 'HIGH';

    const breed = BREEDS[i % BREEDS.length];
    const name = COW_NAMES[i - 1];
    const age = parseFloat((3.0 + (i % 5) * 0.8).toFixed(1));
    const lactationNumber = (i % 4) + 1;
    const parity = lactationNumber;
    const daysInMilk = 40 + (i * 7) % 180;
    const bodyWeight = Math.round(520 + (i * 13) % 140);

    // Each cow has unique personal baselines
    const baselineYield = parseFloat((12.5 + (i * 0.35) % 6.0).toFixed(1));
    const baselineScc = Math.round(90 + (i * 7) % 70); // 90 - 160 k/mL
    const baselinePh = parseFloat((6.62 + ((i * 3) % 8) * 0.01).toFixed(2));
    const baselineCond = parseFloat((5.45 + ((i * 4) % 10) * 0.03).toFixed(2));
    const baselineTemp = parseFloat((38.45 + ((i * 2) % 6) * 0.05).toFixed(1));
    const baselineFlow = parseFloat((3.4 + ((i * 3) % 8) * 0.1).toFixed(1));

    const cow: CowMeta = {
      id,
      cowCode,
      rfidId,
      name,
      breed,
      age,
      lactationNumber,
      parity,
      daysInMilk,
      bodyWeight,
      healthStatus,
      baselineYield,
      baselineScc,
      baselinePh,
      baselineCond,
      baselineTemp,
      baselineFlow
    };
    cows.push(cow);

    cowCsvRows.push(
      `${id},farm_01,${cowCode},${rfidId},"${name}",${breed},${age},${lactationNumber},${parity},${daysInMilk},${bodyWeight},ACTIVE,${healthStatus}`
    );
    rfidCsvRows.push(`rfid_${i},${rfidId},${id},ACTIVE,2026-08-01T00:00:00Z`);
    baselineCsvRows.push(
      `base_${i},${id},${baselineYield},${baselineScc},${baselinePh},${baselineCond},${baselineTemp},${baselineFlow},30`
    );
  }

  // 2. Generate 60 days of historical sessions for each cow (2 sessions per day)
  // Target: 30 cows * 60 days * 2 sessions = 3600 sessions!
  const now = new Date('2026-10-03T18:00:00Z');
  let sessionIndex = 0;
  let readingIndex = 0;
  let alertIndex = 0;
  let predictionIndex = 0;

  for (let dayOffset = 59; dayOffset >= 0; dayOffset--) {
    const dayDate = new Date(now.getTime() - dayOffset * 24 * 60 * 60 * 1000);
    const dayNumber = 60 - dayOffset; // 1 to 60

    for (let shift = 0; shift < 2; shift++) {
      const shiftHour = shift === 0 ? 6 : 17;
      dayDate.setUTCHours(shiftHour, 0, 0, 0);

      for (const cow of cows) {
        sessionIndex++;
        const sessionId = `ses_${sessionIndex}`;
        const sessionCode = `SES-${sessionIndex.toString().padStart(6, '0')}`;
        const sessionTime = new Date(dayDate.getTime() + randInt(0, 90) * 60 * 1000);
        const endTime = new Date(sessionTime.getTime() + randInt(240, 360) * 1000);

        // Parameters progression based on cow type and day
        let scc = cow.baselineScc + randRange(-12, 12);
        let yieldVol = cow.baselineYield + randRange(-0.8, 0.8);
        let cond = cow.baselineCond + randRange(-0.06, 0.06);
        let ph = cow.baselinePh + randRange(-0.03, 0.03);
        let temp = cow.baselineTemp + randRange(-0.1, 0.1);
        let flow = cow.baselineFlow + randRange(-0.1, 0.1);

        if (cow.healthStatus === 'MODERATE') {
          // Days 1-30 normal, 31-60 gradual increase
          if (dayNumber > 30) {
            const factor = (dayNumber - 30) / 30;
            scc += factor * (cow.baselineScc * 0.9);
            cond += factor * 0.7;
            yieldVol -= factor * (cow.baselineYield * 0.12);
            ph += factor * 0.12;
            temp += factor * 0.25;
          }
        } else if (cow.healthStatus === 'HIGH') {
          // Days 1-20 normal
          // Days 21-35 small SCC rise
          // Days 36-45 conductivity rises
          // Days 46-50 yield drops
          // Days 51-60 high risk!
          if (dayNumber > 20 && dayNumber <= 35) {
            scc += ((dayNumber - 20) / 15) * 120;
          } else if (dayNumber > 35 && dayNumber <= 45) {
            scc += 120 + ((dayNumber - 35) / 10) * 200;
            cond += ((dayNumber - 35) / 10) * 0.6;
          } else if (dayNumber > 45 && dayNumber <= 50) {
            scc += 320 + ((dayNumber - 45) / 5) * 300;
            cond += 0.6 + ((dayNumber - 45) / 5) * 0.7;
            yieldVol -= ((dayNumber - 45) / 5) * (cow.baselineYield * 0.22);
            ph += 0.2;
            temp += 0.4;
          } else if (dayNumber > 50) {
            scc += 650 + randRange(50, 250);
            cond += 1.4 + randRange(0.1, 0.3);
            yieldVol -= cow.baselineYield * 0.28 + randRange(0.2, 0.5);
            ph += 0.38 + randRange(0.02, 0.08);
            temp += 0.7 + randRange(0.05, 0.2);
          }
        }

        scc = Math.max(40, Math.round(scc));
        yieldVol = parseFloat(Math.max(3.5, yieldVol).toFixed(2));
        cond = parseFloat(cond.toFixed(2));
        ph = parseFloat(ph.toFixed(2));
        temp = parseFloat(temp.toFixed(1));
        flow = parseFloat(Math.max(1.0, flow).toFixed(2));

        const yieldDev = parseFloat((((yieldVol - cow.baselineYield) / cow.baselineYield) * 100).toFixed(1));
        const sccDev = parseFloat((((scc - cow.baselineScc) / cow.baselineScc) * 100).toFixed(1));

        // Estimate risk score
        let riskScore = 12 + randRange(-5, 5);
        if (cow.healthStatus === 'MODERATE' && dayNumber > 30) {
          riskScore = 32 + ((dayNumber - 30) / 30) * 22 + randRange(-4, 4);
        } else if (cow.healthStatus === 'HIGH') {
          if (dayNumber > 20 && dayNumber <= 35) riskScore = 25 + ((dayNumber - 20) / 15) * 15;
          else if (dayNumber > 35 && dayNumber <= 45) riskScore = 40 + ((dayNumber - 35) / 10) * 20;
          else if (dayNumber > 45 && dayNumber <= 50) riskScore = 60 + ((dayNumber - 45) / 5) * 18;
          else if (dayNumber > 50) riskScore = 78 + randRange(2, 16);
        }
        riskScore = Math.min(98, Math.max(5, Math.round(riskScore)));

        let riskLevel = 'LOW';
        if (riskScore >= 80) riskLevel = 'VERY_HIGH';
        else if (riskScore >= 60) riskLevel = 'HIGH';
        else if (riskScore >= 30) riskLevel = 'MODERATE';

        sessionCsvRows.push(
          `${sessionId},${sessionCode},${cow.id},station_01,rfid_${cow.id.replace('cow_', '')},${sessionTime.toISOString()},${endTime.toISOString()},COMPLETED,${yieldVol},${(flow * 0.7).toFixed(2)},${flow},${temp},${cond},${ph},${scc},${yieldDev},${riskScore},${riskLevel}`
        );

        // Record AI Prediction
        predictionIndex++;
        const predId = `pred_${predictionIndex}`;
        let explanation = 'Parameters aligned with historical baseline.';
        if (riskLevel === 'HIGH' || riskLevel === 'VERY_HIGH') {
          explanation = `Significant deviation: SCC surged by +${sccDev}% (${scc} k/mL), Milk yield dropped by ${Math.abs(yieldDev)}%, Conductivity elevated to ${cond} mS/cm. Prototype AI risk estimate — not a veterinary diagnosis.`;
        } else if (riskLevel === 'MODERATE') {
          explanation = `Moderate deviation: SCC +${sccDev}%, Conductivity +${(((cond - cow.baselineCond)/cow.baselineCond)*100).toFixed(1)}%. Recommend continued monitoring.`;
        }
        predictionCsvRows.push(
          `${predId},${cow.id},${sessionId},${riskScore},${riskLevel},MASTITIS_RISK,0.94,"${explanation}",${endTime.toISOString()}`
        );

        // Generate Alert if high risk on recent days
        if ((riskLevel === 'HIGH' || riskLevel === 'VERY_HIGH') && dayOffset <= 10) {
          alertIndex++;
          const alertId = `alt_${alertIndex}`;
          const severity = riskLevel === 'VERY_HIGH' ? 'CRITICAL' : 'HIGH';
          const title = `Elevated Mastitis Risk Detected: ${cow.cowCode}`;
          const message = `Automated early-warning: SCC reached ${scc} k/mL (+${sccDev}%), milk yield fell by ${Math.abs(yieldDev)}%. Personal baseline exceeded.`;
          const status = dayOffset <= 2 ? 'ACTIVE' : 'RESOLVED';
          alertCsvRows.push(
            `${alertId},farm_01,${cow.id},${sessionId},MASTITIS_RISK,${severity},"${title}","${message}",${status},${endTime.toISOString()}`
          );
        }

        // Generate detailed time-series sensor readings for the most recent 5 days for rich interactive charts
        if (dayOffset <= 5) {
          const readingPoints = 30; // 30 points per session
          let curVol = 0;
          for (let step = 0; step < readingPoints; step++) {
            readingIndex++;
            const t = step / (readingPoints - 1);
            // Bell-like flow curve
            let fRate = 0;
            if (t < 0.2) fRate = (t / 0.2) * flow;
            else if (t < 0.7) fRate = flow + randRange(-0.15, 0.15);
            else fRate = flow * (1 - (t - 0.7) / 0.3);
            fRate = parseFloat(Math.max(0.05, fRate).toFixed(2));
            curVol += fRate * 0.15;

            const readingTime = new Date(sessionTime.getTime() + step * 8 * 1000);
            readingsCsvRows.push(
              `rd_${readingIndex},${sessionId},${readingTime.toISOString()},${fRate},${curVol.toFixed(2)},${(temp + randRange(-0.1, 0.1)).toFixed(1)},${(cond + randRange(-0.04, 0.04)).toFixed(2)},${(ph + randRange(-0.02, 0.02)).toFixed(2)},${Math.round(scc + randRange(-8, 8))},GOOD`
            );
          }
        }
      }
    }
  }

    // Write all CSV files
  fs.writeFileSync(path.join(outputDir, 'cows.csv'), cowCsvRows.join('\n'), 'utf8');
  fs.writeFileSync(path.join(outputDir, 'rfid_tags.csv'), rfidCsvRows.join('\n'), 'utf8');
  fs.writeFileSync(path.join(outputDir, 'cow_baselines.csv'), baselineCsvRows.join('\n'), 'utf8');
  fs.writeFileSync(path.join(outputDir, 'milking_sessions.csv'), sessionCsvRows.join('\n'), 'utf8');
  fs.writeFileSync(path.join(outputDir, 'ai_predictions.csv'), predictionCsvRows.join('\n'), 'utf8');
  fs.writeFileSync(path.join(outputDir, 'alerts.csv'), alertCsvRows.join('\n'), 'utf8');
  fs.writeFileSync(path.join(outputDir, 'sensor_readings.csv'), readingsCsvRows.join('\n'), 'utf8');

  // SIH PS 26109 Auxiliary Multi-Modal Datasets
  const animalVitalsRows = ['id,cow_id,timestamp,body_temperature,heart_rate,respiration_rate,rumination_minutes,activity_steps,lying_time_hours,feed_intake_kg,water_intake_liters,sensor_source'];
  const activityRows = ['id,cow_id,timestamp,daily_steps,lying_time_hours,activity_index,restlessness_events'];
  const ruminationRows = ['id,cow_id,timestamp,rumination_minutes,chewing_rate_per_min,night_rumination_minutes'];
  const feedRows = ['id,cow_id,timestamp,dry_matter_intake_kg,water_intake_liters,feeding_bouts'];
  const envRows = ['id,farm_id,timestamp,ambient_temperature,relative_humidity,thi,hygiene_score,ventilation_status'];
  const vaccinationRows = ['id,cow_id,vaccine_name,administered_date,next_due_date,status,batch_no'];
  const treatmentRows = ['id,cow_id,treatment_name,treatment_date,reason,duration_days,outcome,withholding_period_days'];
  const mastitisHistoryRows = ['id,cow_id,episode_date,affected_quarter,severity_grade,peak_scc,pathogen_isolated,resolution_date'];

  const startDate = new Date(now.getTime() - 60 * 24 * 3600 * 1000);
  let auxIdx = 0;
  for (const cow of cows) {
    for (let d = 30; d >= 0; d--) {
      auxIdx++;
      const vDate = new Date(startDate.getTime() + (60 - d) * 24 * 3600 * 1000);
      const isHigh = cow.healthStatus === 'HIGH' && d <= 5;
      const isMod = cow.healthStatus === 'MODERATE' && d <= 3;

      let bTemp = cow.baselineTemp + randRange(-0.2, 0.2);
      let steps = 3200 + randInt(-300, 300);
      let rumMin = 480 + randInt(-30, 30);
      let feedKg = 44.0 + randRange(-3, 3);
      let waterL = 85.0 + randRange(-5, 5);
      let lyingH = 11.5 + randRange(-0.8, 0.8);

      if (isHigh) {
        bTemp += 0.85;
        steps -= 1250;
        rumMin -= 180;
        feedKg -= 13.0;
        waterL -= 18.0;
        lyingH += 2.5;
      } else if (isMod) {
        bTemp += 0.35;
        steps -= 450;
        rumMin -= 65;
        feedKg -= 4.5;
      }

      animalVitalsRows.push(
        `vit_${auxIdx},${cow.id},${vDate.toISOString()},${bTemp.toFixed(2)},${randInt(62, 78)},${randInt(22, 32)},${rumMin},${steps},${lyingH.toFixed(1)},${feedKg.toFixed(1)},${waterL.toFixed(1)},SIMULATOR`
      );

      activityRows.push(
        `act_${auxIdx},${cow.id},${vDate.toISOString()},${steps},${lyingH.toFixed(1)},${(steps / 3200).toFixed(2)},${isHigh ? 6 : 1}`
      );

      ruminationRows.push(
        `rum_${auxIdx},${cow.id},${vDate.toISOString()},${rumMin},${randInt(52, 60)},${Math.round(rumMin * 0.65)}`
      );

      feedRows.push(
        `feed_${auxIdx},${cow.id},${vDate.toISOString()},${feedKg.toFixed(1)},${waterL.toFixed(1)},${randInt(9, 14)}`
      );
    }

    // Vaccinations
    vaccinationRows.push(
      `vax_${cow.id}_1,${cow.id},"FMD Quadrivalent Booster",2026-06-15,2026-12-15,COMPLETED,BATCH-FMD-991`
    );
    vaccinationRows.push(
      `vax_${cow.id}_2,${cow.id},"HS + BQ Combined",2026-04-10,2027-04-10,COMPLETED,BATCH-HSBQ-402`
    );

    // Treatments & Mastitis History for moderate/high
    if (cow.healthStatus !== 'LOW') {
      treatmentRows.push(
        `trt_${cow.id},${cow.id},"Intramammary Cefquinome & Flunixin",2026-08-20,"Subclinical mastitis prodromal spike",3,RECOVERED,4`
      );
      mastitisHistoryRows.push(
        `mh_${cow.id},${cow.id},2026-08-19,RIGHT_REAR,SUBCLINICAL,420,Staphylococcus aureus,2026-08-24`
      );
    }
  }

  // 60 days of Farm Environment readings
  for (let d = 60; d >= 0; d--) {
    const eDate = new Date(startDate.getTime() + d * 24 * 3600 * 1000);
    const ambientT = 26.5 + randRange(-4, 6);
    const rh = 68.0 + randRange(-12, 14);
    const thi = (1.8 * ambientT + 32) - (0.55 - 0.0055 * rh) * (1.8 * ambientT - 26);
    const hyg = parseFloat((2.0 + randRange(-0.5, 1.8)).toFixed(1));
    envRows.push(
      `env_${d},farm_01,${eDate.toISOString()},${ambientT.toFixed(1)},${rh.toFixed(1)},${thi.toFixed(1)},${hyg},${thi > 76 ? 'POOR' : 'GOOD'}`
    );
  }

  fs.writeFileSync(path.join(outputDir, 'animal_vitals.csv'), animalVitalsRows.join('\n'), 'utf8');
  fs.writeFileSync(path.join(outputDir, 'activity_data.csv'), activityRows.join('\n'), 'utf8');
  fs.writeFileSync(path.join(outputDir, 'rumination_data.csv'), ruminationRows.join('\n'), 'utf8');
  fs.writeFileSync(path.join(outputDir, 'feed_intake.csv'), feedRows.join('\n'), 'utf8');
  fs.writeFileSync(path.join(outputDir, 'farm_environment.csv'), envRows.join('\n'), 'utf8');
  fs.writeFileSync(path.join(outputDir, 'vaccination_records.csv'), vaccinationRows.join('\n'), 'utf8');
  fs.writeFileSync(path.join(outputDir, 'treatment_records.csv'), treatmentRows.join('\n'), 'utf8');
  fs.writeFileSync(path.join(outputDir, 'mastitis_history.csv'), mastitisHistoryRows.join('\n'), 'utf8');

  console.log(`[Dataset] Successfully exported all SIH PS 26109 datasets:`);
  console.log(` - cows.csv: 30 cows`);
  console.log(` - rfid_tags.csv: 30 tags`);
  console.log(` - cow_baselines.csv: 30 personal baselines`);
  console.log(` - milking_sessions.csv: ${sessionIndex} sessions (60 days historical)`);
  console.log(` - ai_predictions.csv: ${predictionIndex} predictions with forecasting`);
  console.log(` - alerts.csv: ${alertIndex} alerts`);
  console.log(` - sensor_readings.csv: ${readingIndex} time-series sensor points`);
  console.log(` - animal_vitals.csv: ${animalVitalsRows.length - 1} biometric collar/scale readings`);
  console.log(` - activity_data.csv: ${activityRows.length - 1} pedometer records`);
  console.log(` - rumination_data.csv: ${ruminationRows.length - 1} rumination records`);
  console.log(` - feed_intake.csv: ${feedRows.length - 1} feed intake records`);
  console.log(` - farm_environment.csv: ${envRows.length - 1} THI and climate records`);
  console.log(` - vaccination_records.csv: ${vaccinationRows.length - 1} vaccination records`);
  console.log(` - treatment_records.csv: ${treatmentRows.length - 1} veterinary treatments`);
  console.log(` - mastitis_history.csv: ${mastitisHistoryRows.length - 1} historical episodes`);
}

if (require.main === module) {
  generateDataset().catch(console.error);
}

