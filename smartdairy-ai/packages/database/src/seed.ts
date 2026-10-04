import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Seed random generator
function createRng(seed = 987654321) {
  let s = seed;
  return function () {
    let t = (s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = createRng(101);

const BREEDS = ['Holstein Friesian', 'Jersey', 'Gir', 'Sahiwal', 'Crossbred HF-Gir'];
const COW_NAMES = [
  'Ganga', 'Kamadhenu', 'Surabhi', 'Bella', 'Daisy', 'Lakshmi', 'Nandini', 'Gauri',
  'Buttercup', 'Luna', 'Kalyani', 'Radha', 'Molly', 'Rosie', 'Yamuna', 'Godavari',
  'Tulsi', 'Amrita', 'Meera', 'Kaveri', 'Shreya', 'Chitra', 'Ananya', 'Tara',
  'Bhavani', 'Veda', 'Durga', 'Sita', 'Parvati', 'Anandi'
];

async function seed() {
  console.log('[Seed] Starting SmartDairy AI database seeding...');

  // Clean existing tables in proper order
  console.log('[Seed] Resetting database tables...');
  await prisma.auditLog.deleteMany();
  await prisma.alertEvent.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.aiPredictionFactor.deleteMany();
  await prisma.aiPrediction.deleteMany();
  await prisma.animalVitalsReading.deleteMany();
  await prisma.farmEnvironmentReading.deleteMany();
  await prisma.vaccinationRecord.deleteMany();
  await prisma.treatmentRecord.deleteMany();
  await prisma.sensorReading.deleteMany();
  await prisma.milkingSession.deleteMany();
  await prisma.cipReading.deleteMany();
  await prisma.cipSession.deleteMany();
  await prisma.sensorHealthLog.deleteMany();
  await prisma.sensorDevice.deleteMany();
  await prisma.rfidReadEvent.deleteMany();
  await prisma.rfidTag.deleteMany();
  await prisma.cowHealthProfile.deleteMany();
  await prisma.cowBaseline.deleteMany();
  await prisma.cow.deleteMany();
  await prisma.milkingStation.deleteMany();
  await prisma.user.deleteMany();
  await prisma.farm.deleteMany();

  // 1. Create Farm
  console.log('[Seed] Creating demo Farm...');
  const farm = await prisma.farm.create({
    data: {
      name: 'SmartDairy Research & Commercial Dairy Unit',
      location: 'Pune / Anand Agri-Tech Corridor, India',
      timezone: 'Asia/Kolkata',
      numberOfCows: 30
    }
  });

  // 2. Create Users (with bcrypt hashed passwords)
  console.log('[Seed] Creating demo accounts...');
  const adminPassword = await bcrypt.hash('Admin@123', 10);
  const managerPassword = await bcrypt.hash('Manager@123', 10);
  const vetPassword = await bcrypt.hash('Vet@123', 10);
  const opPassword = await bcrypt.hash('Operator@123', 10);

  const admin = await prisma.user.create({
    data: {
      name: 'Dr. Rajesh Sharma (Admin)',
      email: 'admin@smartdairy.local',
      passwordHash: adminPassword,
      role: 'ADMIN',
      farmId: farm.id
    }
  });

  await prisma.user.create({
    data: {
      name: 'Vikram Patil (Farm Manager)',
      email: 'manager@smartdairy.local',
      passwordHash: managerPassword,
      role: 'FARM_MANAGER',
      farmId: farm.id
    }
  });

  await prisma.user.create({
    data: {
      name: 'Dr. Ananya Roy (Veterinarian)',
      email: 'vet@smartdairy.local',
      passwordHash: vetPassword,
      role: 'VETERINARIAN',
      farmId: farm.id
    }
  });

  await prisma.user.create({
    data: {
      name: 'Ramesh Gowda (Milking Operator)',
      email: 'operator@smartdairy.local',
      passwordHash: opPassword,
      role: 'OPERATOR',
      farmId: farm.id
    }
  });

  // 3. Create Milking Stations
  console.log('[Seed] Creating Milking Stations...');
  const station1 = await prisma.milkingStation.create({
    data: {
      farmId: farm.id,
      name: 'Milking Line Alpha (Shared Inline Sensors)',
      stationCode: 'STN-01',
      status: 'ONLINE',
      lastActive: new Date()
    }
  });

  const station2 = await prisma.milkingStation.create({
    data: {
      farmId: farm.id,
      name: 'Milking Line Beta (Secondary Line)',
      stationCode: 'STN-02',
      status: 'ONLINE',
      lastActive: new Date()
    }
  });

  // 4. Create Sensor Devices for Station 1
  console.log('[Seed] Registering inline hardware sensors...');
  const sccDevice = await prisma.sensorDevice.create({
    data: {
      name: 'SomaDetect Inline Optical Milk Analyzer',
      type: 'SOMADETECT',
      stationId: station1.id,
      manufacturer: 'SomaDetect Inc.',
      model: 'SD-Optical-Line-400',
      status: 'ONLINE',
      lastSeen: new Date(),
      firmwareVersion: '3.4.1',
      calibrationStatus: 'CALIBRATED',
      maintenanceDue: new Date('2027-01-15')
    }
  });

  const flowDevice = await prisma.sensorDevice.create({
    data: {
      name: 'ifm SM Foodmag Hygienic Flow & Conductivity Meter',
      type: 'FLOWMAG',
      stationId: station1.id,
      manufacturer: 'ifm electronic gmbh',
      model: 'SM6000-Foodmag-IO-Link',
      status: 'ONLINE',
      lastSeen: new Date(),
      firmwareVersion: '2.1.8',
      calibrationStatus: 'CALIBRATED',
      maintenanceDue: new Date('2027-03-20')
    }
  });

  const phDevice = await prisma.sensorDevice.create({
    data: {
      name: 'Mettler Toledo InPro X1 HLS ISFET pH Sensor',
      type: 'PH',
      stationId: station1.id,
      manufacturer: 'Mettler Toledo Process Analytics',
      model: 'InPro X1 HLS-Hygienic',
      status: 'ONLINE',
      lastSeen: new Date(),
      firmwareVersion: '1.9.0',
      calibrationStatus: 'CALIBRATED',
      maintenanceDue: new Date('2026-12-10')
    }
  });

  const rfidDevice = await prisma.sensorDevice.create({
    data: {
      name: 'Allflex / Dairymaster HDX/FDX RFID Transceiver Antenna',
      type: 'RFID',
      stationId: station1.id,
      manufacturer: 'Allflex Livestock Intelligence',
      model: 'ISO-11785-GateReader',
      status: 'ONLINE',
      lastSeen: new Date(),
      firmwareVersion: '4.0.2',
      calibrationStatus: 'CALIBRATED',
      maintenanceDue: new Date('2027-06-01')
    }
  });

  // 5. Create 30 Cows with RFID Tags, Baselines, and Health Profiles
  console.log('[Seed] Seeding 30 cows with unique historical baselines and health groups...');
  const createdCows = [];

  for (let i = 1; i <= 30; i++) {
    const cowCode = `COW-${i.toString().padStart(3, '0')}`;
    const rfidId = `RFID-9827${i.toString().padStart(2, '0')}`;
    let healthStatus = 'LOW';
    if (i >= 21 && i <= 25) healthStatus = 'MODERATE';
    if (i >= 26) healthStatus = 'HIGH';

    const breed = BREEDS[i % BREEDS.length];
    const name = COW_NAMES[i - 1];
    const age = parseFloat((3.0 + (i % 5) * 0.8).toFixed(1));
    const lactationNumber = (i % 4) + 1;
    const parity = lactationNumber;
    const daysInMilk = 40 + (i * 7) % 180;
    const bodyWeight = Math.round(520 + (i * 13) % 140);

    const lactationStages = ['EARLY', 'PEAK', 'MID', 'LATE', 'DRY'];
    const lactationStage = lactationStages[i % lactationStages.length];
    const prevHistory = i >= 26
      ? 'Recurring clinical mastitis in prior lactation (Right Rear quarter)'
      : i >= 21
      ? 'Subclinical mastitis episode resolved with intramammary infusion'
      : 'None reported; healthy udder history';
    const numEpisodes = i >= 26 ? 2 : i >= 21 ? 1 : 0;
    const lastEpisodeDate = i >= 21 ? new Date(Date.now() - (60 + i * 3) * 86400000) : null;

    const baselineYield = parseFloat((12.5 + (i * 0.35) % 6.0).toFixed(1));
    const baselineScc = Math.round(90 + (i * 7) % 70);
    const baselinePh = parseFloat((6.62 + ((i * 3) % 8) * 0.01).toFixed(2));
    const baselineCond = parseFloat((5.45 + ((i * 4) % 10) * 0.03).toFixed(2));
    const baselineTemp = parseFloat((38.45 + ((i * 2) % 6) * 0.05).toFixed(1));
    const baselineFlow = parseFloat((3.4 + ((i * 3) % 8) * 0.1).toFixed(1));

    const cow = await prisma.cow.create({
      data: {
        farmId: farm.id,
        cowCode,
        rfidId,
        name,
        breed,
        age,
        lactationNumber,
        parity,
        daysInMilk,
        bodyWeight,
        status: 'ACTIVE',
        healthStatus,
        lactationStage,
        previousMastitisHistory: i >= 21,
        previousDiseaseHistory: i % 7 === 0 ? 'Mild ketosis 6 months ago' : 'No chronic systemic illnesses',
        previousTreatmentHistory: i >= 21 ? 'Intramammary cefquinome & meloxicam' : 'Routine deworming & vitamins',
        numPreviousMastitisEpisodes: numEpisodes,
        lastMastitisEpisodeDate: lastEpisodeDate,
        dateOfBirth: new Date(Date.now() - age * 365 * 24 * 60 * 60 * 1000)
      }
    });

    createdCows.push(cow);

    // RFID Tag
    await prisma.rfidTag.create({
      data: {
        tagUid: rfidId,
        cowId: cow.id,
        status: 'ACTIVE',
        lastSeen: new Date()
      }
    });

    // Cow Baseline
    await prisma.cowBaseline.create({
      data: {
        cowId: cow.id,
        baselineMilkYield: baselineYield,
        baselineScc: baselineScc,
        baselinePh: baselinePh,
        baselineConductivity: baselineCond,
        baselineTemperature: baselineTemp,
        baselineFlow: baselineFlow,
        calculationWindowDays: 30
      }
    });

    // Initial Health Profile with 24-72h Early Warning Forecast
    let currentRiskScore = 15.0;
    let currentRiskLevel = 'LOW';
    let currentScc = baselineScc;
    let currentCond = baselineCond;
    let currentPh = baselinePh;
    let currentYield = baselineYield;
    let forecastRiskScore = 16.0;
    let forecastRiskLevel = 'LOW';
    let riskDirection = 'STABLE';
    let recommendedAction = 'Routine milking & sanitization. All biometric indicators stable.';

    if (healthStatus === 'MODERATE') {
      currentRiskScore = 48.0;
      currentRiskLevel = 'MODERATE';
      forecastRiskScore = 58.0;
      forecastRiskLevel = 'HIGH';
      riskDirection = 'INCREASING';
      recommendedAction = 'Early watch: Re-measure somatic cell count during next milking shift; monitor teat condition.';
      currentScc = baselineScc * 1.6;
      currentCond = baselineCond + 0.65;
      currentYield = baselineYield * 0.92;
      currentPh = baselinePh + 0.12;
    } else if (healthStatus === 'HIGH') {
      currentRiskScore = 82.0;
      currentRiskLevel = 'VERY_HIGH';
      forecastRiskScore = 90.0;
      forecastRiskLevel = 'VERY_HIGH';
      riskDirection = 'INCREASING';
      recommendedAction = 'IMMEDIATE VET ATTENTION: Perform quarter California Mastitis Test (CMT), isolate cow milking cluster.';
      currentScc = baselineScc * 3.4;
      currentCond = baselineCond + 1.55;
      currentYield = baselineYield * 0.74;
      currentPh = baselinePh + 0.38;
    }

    await prisma.cowHealthProfile.create({
      data: {
        cowId: cow.id,
        currentRiskScore,
        currentRiskLevel,
        forecastRiskScore,
        forecastRiskLevel,
        riskDirection,
        recommendedAction,
        currentScc: parseFloat(currentScc.toFixed(1)),
        currentPh: parseFloat(currentPh.toFixed(2)),
        currentConductivity: parseFloat(currentCond.toFixed(2)),
        currentTemperature: healthStatus === 'HIGH' ? 39.2 : 38.5,
        currentMilkYield: parseFloat(currentYield.toFixed(2)),
        lastMilkingDate: new Date()
      }
    });
  }

  // 6. Seed Recent Historical Milking Sessions (Last 14 days for all 30 cows = 840 sessions with AI predictions)
  console.log('[Seed] Seeding 14 days of realistic sessions, AI predictions & factors...');
  const now = new Date();
  let sessionCounter = 0;

  for (let day = 14; day >= 1; day--) {
    const sessionDate = new Date(now.getTime() - day * 24 * 60 * 60 * 1000);

    for (let shift = 0; shift < 2; shift++) {
      sessionDate.setHours(shift === 0 ? 6 : 17, 0, 0, 0);

      for (let cIdx = 0; cIdx < createdCows.length; cIdx++) {
        const cow = createdCows[cIdx];
        sessionCounter++;
        const sCode = `SES-${sessionCounter.toString().padStart(6, '0')}`;
        const startTime = new Date(sessionDate.getTime() + (cIdx * 3) * 60 * 1000);
        const endTime = new Date(startTime.getTime() + (280 + (cIdx % 4) * 15) * 1000);

        let sccVal = 110 + (cIdx * 3) % 40 + (rng() * 20 - 10);
        let yieldVal = 14.0 + (cIdx * 0.2) % 3.0 + (rng() * 1.2 - 0.6);
        let condVal = 5.55 + (rng() * 0.1 - 0.05);
        let phVal = 6.64 + (rng() * 0.04 - 0.02);
        let tempVal = 38.5 + (rng() * 0.2 - 0.1);
        let peakFlow = 3.8;
        let riskScore = 14;
        let riskLevel = 'LOW';

        if (cow.healthStatus === 'MODERATE') {
          const factor = (15 - day) / 14; // progressively rises
          sccVal = 130 + factor * 140 + (rng() * 20 - 10);
          condVal = 5.60 + factor * 0.6 + (rng() * 0.08);
          yieldVal = 13.5 - factor * 1.5;
          phVal = 6.66 + factor * 0.1;
          riskScore = Math.round(30 + factor * 26);
          riskLevel = 'MODERATE';
        } else if (cow.healthStatus === 'HIGH') {
          const factor = (15 - day) / 14;
          sccVal = 140 + factor * 580 + (rng() * 40 - 20);
          condVal = 5.58 + factor * 1.5 + (rng() * 0.1);
          yieldVal = 14.8 - factor * 4.2;
          phVal = 6.65 + factor * 0.36;
          tempVal = 38.5 + factor * 0.7;
          riskScore = Math.round(45 + factor * 43);
          riskLevel = riskScore >= 80 ? 'VERY_HIGH' : 'HIGH';
        }

        sccVal = Math.round(sccVal);
        yieldVal = parseFloat(yieldVal.toFixed(2));
        condVal = parseFloat(condVal.toFixed(2));
        phVal = parseFloat(phVal.toFixed(2));
        tempVal = parseFloat(tempVal.toFixed(1));

        const session = await prisma.milkingSession.create({
          data: {
            sessionCode: sCode,
            cowId: cow.id,
            stationId: station1.id,
            startTime,
            endTime,
            status: 'COMPLETED',
            totalVolume: yieldVal,
            averageFlow: parseFloat((peakFlow * 0.7).toFixed(2)),
            peakFlow,
            averageTemperature: tempVal,
            averageConductivity: condVal,
            averagePh: phVal,
            averageScc: sccVal,
            milkYieldDeviationPercent: cow.healthStatus === 'HIGH' ? -24.5 : cow.healthStatus === 'MODERATE' ? -8.2 : 1.5,
            riskScore,
            riskLevel
          }
        });

        // AI Prediction
        const explanation =
          riskScore >= 60
            ? `Significant deviation from baseline: SCC reached ${sccVal} k/mL, milk yield dropped by ${Math.abs(session.milkYieldDeviationPercent)}%, electrical conductivity rose to ${condVal} mS/cm. Udder-health risk elevated. Prototype AI risk estimate — not a veterinary diagnosis.`
            : riskScore >= 30
            ? `Moderate deviation from baseline: Elevated SCC (${sccVal} k/mL) and conductivity (${condVal} mS/cm). Continued monitoring recommended.`
            : `All milk parameters align with historical personal baseline tolerances for ${cow.cowCode}.`;

        const forecastScore = Math.min(100, Math.round(riskScore * 1.08));
        const forecastLevel = forecastScore >= 80 ? 'VERY_HIGH' : forecastScore >= 60 ? 'HIGH' : forecastScore >= 30 ? 'MODERATE' : 'LOW';
        const targetLabel = forecastLevel === 'VERY_HIGH' ? 'CONFIRMED_MASTITIS' : forecastLevel === 'HIGH' ? 'HIGH_RISK' : forecastLevel === 'MODERATE' ? 'EARLY_WARNING' : 'NO_MASTITIS';

        const prediction = await prisma.aiPrediction.create({
          data: {
            cowId: cow.id,
            sessionId: session.id,
            riskScore,
            riskLevel,
            forecastScore,
            forecastLevel,
            riskDirection: cow.healthStatus !== 'LOW' ? 'INCREASING' : 'STABLE',
            forecastHorizon: '24_72_HOURS',
            recommendedAction: riskScore >= 60 ? 'Immediate CMT quarter examination & unit isolation.' : riskScore >= 30 ? 'Teat dip disinfection & monitor rumination.' : 'Routine monitoring.',
            targetLabel,
            predictionType: 'MASTITIS_RISK',
            confidence: 0.94,
            explanation,
            createdAt: endTime
          }
        });

        // Prediction Factors
        await prisma.aiPredictionFactor.createMany({
          data: [
            {
              predictionId: prediction.id,
              factorName: 'SCC_TREND',
              factorValue: sccVal,
              baselineValue: 120,
              deviationPercent: parseFloat((((sccVal - 120) / 120) * 100).toFixed(1)),
              contribution: parseFloat((riskScore * 0.32).toFixed(2)),
              direction: sccVal >= 120 ? 'INCREASE' : 'DECREASE'
            },
            {
              predictionId: prediction.id,
              factorName: 'MILK_YIELD_DROP',
              factorValue: yieldVal,
              baselineValue: 14.5,
              deviationPercent: parseFloat((((yieldVal - 14.5) / 14.5) * 100).toFixed(1)),
              contribution: parseFloat((riskScore * 0.22).toFixed(2)),
              direction: yieldVal >= 14.5 ? 'INCREASE' : 'DECREASE'
            },
            {
              predictionId: prediction.id,
              factorName: 'CONDUCTIVITY_CHANGE',
              factorValue: condVal,
              baselineValue: 5.58,
              deviationPercent: parseFloat((((condVal - 5.58) / 5.58) * 100).toFixed(1)),
              contribution: parseFloat((riskScore * 0.24).toFixed(2)),
              direction: condVal >= 5.58 ? 'INCREASE' : 'DECREASE'
            }
          ]
        });

        // Generate Time-series Sensor Readings for the last day's sessions for instant live playback
        if (day === 1 && (cow.cowCode === 'COW-001' || cow.cowCode === 'COW-021' || cow.cowCode === 'COW-026')) {
          const readingsData = [];
          let currentVol = 0;
          for (let step = 0; step < 40; step++) {
            const frac = step / 39;
            let flowRate = 0;
            if (frac < 0.2) flowRate = (frac / 0.2) * peakFlow;
            else if (frac < 0.7) flowRate = peakFlow + (rng() * 0.2 - 0.1);
            else flowRate = peakFlow * (1 - (frac - 0.7) / 0.3);
            flowRate = Math.max(0.08, flowRate);
            currentVol += (flowRate / 60) * 8;

            readingsData.push({
              sessionId: session.id,
              timestamp: new Date(startTime.getTime() + step * 7 * 1000),
              flowRate: parseFloat(flowRate.toFixed(2)),
              totalVolume: parseFloat(currentVol.toFixed(3)),
              temperature: tempVal,
              conductivity: condVal,
              ph: phVal,
              scc: sccVal,
              dataQuality: 'GOOD',
              sensorSource: 'SIMULATOR'
            });
          }
          await prisma.sensorReading.createMany({ data: readingsData });
        }
      }
    }
  }

  // 7. Seed Active & Recent Alerts
  console.log('[Seed] Seeding sample farm alerts...');
  const highRiskCow = createdCows[25]; // COW-026
  const modRiskCow = createdCows[20]; // COW-021

  await prisma.alert.create({
    data: {
      farmId: farm.id,
      cowId: highRiskCow.id,
      alertType: 'MASTITIS_RISK',
      severity: 'CRITICAL',
      title: `Critical Udder Health Alert: ${highRiskCow.cowCode} (${highRiskCow.name})`,
      message: `Multi-sensor warning: Somatic Cell Count surged to 680 k/mL (+420% vs baseline), Conductivity elevated to 7.15 mS/cm (+28%), and milk yield dropped by 28%. Early intervention recommended.`,
      status: 'ACTIVE',
      createdAt: new Date(now.getTime() - 25 * 60 * 1000)
    }
  });

  await prisma.alert.create({
    data: {
      farmId: farm.id,
      cowId: modRiskCow.id,
      alertType: 'CONDUCTIVITY_CHANGE',
      severity: 'MEDIUM',
      title: `Conductivity Shift Detected: ${modRiskCow.cowCode}`,
      message: `Electrical conductivity has shown a steady upward deviation (+12% above personal baseline) across 3 consecutive sessions.`,
      status: 'ACTIVE',
      createdAt: new Date(now.getTime() - 3 * 3600 * 1000)
    }
  });

  await prisma.alert.create({
    data: {
      farmId: farm.id,
      cowId: createdCows[27].id, // COW-028
      alertType: 'MILK_YIELD_DROP',
      severity: 'HIGH',
      title: `Sudden Yield Drop: ${createdCows[27].cowCode}`,
      message: `Yield fell from typical 15.2 L to 10.8 L (-29%). SCC also elevated.`,
      status: 'ACTIVE',
      createdAt: new Date(now.getTime() - 8 * 3600 * 1000)
    }
  });

  await prisma.alert.create({
    data: {
      farmId: farm.id,
      alertType: 'SENSOR_OFFLINE',
      severity: 'LOW',
      title: `Scheduled Sensor Self-Check`,
      message: `Mettler Toledo InPro X1 pH sensor completed routine zero-point verification. Status: CALIBRATED.`,
      status: 'RESOLVED',
      createdAt: new Date(now.getTime() - 24 * 3600 * 1000),
      acknowledgedAt: new Date(now.getTime() - 23 * 3600 * 1000),
      resolvedAt: new Date(now.getTime() - 22 * 3600 * 1000)
    }
  });

  // 8. Seed CIP Session (Clean-In-Place)
  console.log('[Seed] Seeding isolated CIP session...');
  const cip = await prisma.cipSession.create({
    data: {
      stationId: station1.id,
      startTime: new Date(now.getTime() - 45 * 60 * 1000),
      endTime: new Date(now.getTime() - 15 * 60 * 1000),
      status: 'COMPLETED',
      phase: 'COMPLETE'
    }
  });

  // CIP readings (strictly isolated from cow data)
  const cipReadings = [
    { cipSessionId: cip.id, timestamp: new Date(now.getTime() - 44 * 60 * 1000), flow: 12.5, temperature: 42.0, conductivity: 1.2, phase: 'PRE_RINSE' },
    { cipSessionId: cip.id, timestamp: new Date(now.getTime() - 36 * 60 * 1000), flow: 15.0, temperature: 75.0, conductivity: 18.5, phase: 'CAUSTIC' },
    { cipSessionId: cip.id, timestamp: new Date(now.getTime() - 28 * 60 * 1000), flow: 14.2, temperature: 45.0, conductivity: 2.1, phase: 'RINSE' },
    { cipSessionId: cip.id, timestamp: new Date(now.getTime() - 22 * 60 * 1000), flow: 14.8, temperature: 68.0, conductivity: 12.4, phase: 'ACID' },
    { cipSessionId: cip.id, timestamp: new Date(now.getTime() - 16 * 60 * 1000), flow: 13.5, temperature: 22.0, conductivity: 0.8, phase: 'FINAL_RINSE' }
  ];
  await prisma.cipReading.createMany({ data: cipReadings });

  // 9. Seed Farm Environment Telemetry (Last 24 hours of ambient temperature, humidity, THI, hygiene)
  console.log('[Seed] Seeding 24h of farm environmental telemetry (THI, hygiene score)...');
  const envReadings = [];
  for (let h = 24; h >= 0; h--) {
    const t = new Date(now.getTime() - h * 3600 * 1000);
    const hour = t.getHours();
    // Diurnal variation: cool early morning, hotter in afternoon
    const baseTemp = 24.0 + 8.0 * Math.sin(((hour - 6) / 24) * 2 * Math.PI);
    const ambientTemp = parseFloat((baseTemp + (rng() * 1.5 - 0.75)).toFixed(1));
    const humidity = parseFloat((70.0 - 15.0 * Math.sin(((hour - 6) / 24) * 2 * Math.PI) + (rng() * 4.0 - 2.0)).toFixed(1));
    const hygieneScore = parseFloat((2.0 + (rng() * 0.8)).toFixed(1));

    envReadings.push({
      farmId: farm.id,
      timestamp: t,
      temperature: ambientTemp,
      humidity,
      hygieneScore,
      hygieneStatus: hygieneScore > 3.5 ? 'ATTENTION' : 'GOOD',
      sensorSource: 'SIMULATOR'
    });
  }
  await prisma.farmEnvironmentReading.createMany({ data: envReadings });

  // 10. Seed Animal Vitals (Neck Collar & Pedometer Telemetry for all 30 cows)
  console.log('[Seed] Seeding auxiliary animal vitals (rumination, activity, body temperature)...');
  const vitalsData = [];
  for (const cow of createdCows) {
    const isHigh = cow.healthStatus === 'HIGH';
    const isMod = cow.healthStatus === 'MODERATE';

    // 7 days of daily vitals per cow
    for (let d = 7; d >= 0; d--) {
      const vTime = new Date(now.getTime() - d * 24 * 3600 * 1000);
      let bodyTemp = 38.5 + (rng() * 0.3);
      let steps = 3200 + Math.round(rng() * 400 - 200);
      let rumination = 480 + Math.round(rng() * 40 - 20);
      let feedIntake = 44.0 + (rng() * 4 - 2);

      if (isHigh && d <= 2) {
        // High risk: prodromal drop in rumination and activity, elevated temp
        bodyTemp += 0.8;
        steps -= 1200;
        rumination -= 170;
        feedIntake -= 14.0;
      } else if (isMod && d <= 1) {
        bodyTemp += 0.3;
        steps -= 400;
        rumination -= 60;
        feedIntake -= 5.0;
      }

      vitalsData.push({
        cowId: cow.id,
        timestamp: vTime,
        bodyTemperature: parseFloat(bodyTemp.toFixed(2)),
        activitySteps: Math.max(500, steps),
        ruminationMinutes: Math.max(100, rumination),
        feedIntakeKg: parseFloat(feedIntake.toFixed(1)),
        sensorSource: 'SIMULATOR',
        dataQuality: 'GOOD'
      });
    }
  }
  await prisma.animalVitalsReading.createMany({ data: vitalsData });

  // 11. Seed Vaccination Records
  console.log('[Seed] Seeding cattle vaccination history (FMD, HS, BQ, Theileriosis)...');
  const vaccinations = [];
  for (const cow of createdCows) {
    vaccinations.push({
      cowId: cow.id,
      vaccineName: 'Foot and Mouth Disease (FMD) Quadrivalent',
      administeredDate: new Date(now.getTime() - 120 * 86400 * 1000),
      nextDueDate: new Date(now.getTime() + 60 * 86400 * 1000),
      status: 'COMPLETED',
      notes: 'Administered 2ml deep IM under National Animal Disease Control Programme.'
    });
    vaccinations.push({
      cowId: cow.id,
      vaccineName: 'Hemorrhagic Septicemia (HS) + Black Quarter (BQ) Combined',
      administeredDate: new Date(now.getTime() - 210 * 86400 * 1000),
      nextDueDate: new Date(now.getTime() + 155 * 86400 * 1000),
      status: 'COMPLETED',
      notes: 'Pre-monsoon booster completed.'
    });
    if (cow.breed.includes('HF') || cow.breed.includes('Jersey')) {
      vaccinations.push({
        cowId: cow.id,
        vaccineName: 'Theileriosis Rakshavac-T',
        administeredDate: new Date(now.getTime() - 340 * 86400 * 1000),
        nextDueDate: new Date(now.getTime() + 25 * 86400 * 1000),
        status: 'COMPLETED',
        notes: 'Crossbred protection schedule verified.'
      });
    }
  }
  await prisma.vaccinationRecord.createMany({ data: vaccinations });

  // 12. Seed Treatment Records for Mastitis & High-Risk Cows
  console.log('[Seed] Seeding veterinary treatment history records...');
  const treatments = [];
  for (let idx = 20; idx < createdCows.length; idx++) {
    const cow = createdCows[idx];
    treatments.push({
      cowId: cow.id,
      treatmentName: 'Intramammary Cefquinome Infusion + Flunixin Meglumine',
      treatmentDate: new Date(now.getTime() - (35 + idx * 2) * 86400 * 1000),
      reason: 'Subclinical mastitis with elevated somatic cell count in Right Rear quarter',
      durationDays: 3,
      outcome: 'RECOVERED',
      notes: 'CMT negative 5 days post-treatment. Normal milk withholding period respected.'
    });
  }
  await prisma.treatmentRecord.createMany({ data: treatments });

  // 13. Initial Audit Log
  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: 'SYSTEM_INITIALIZATION',
      entityType: 'FARM',
      entityId: farm.id,
      details: JSON.stringify({ message: 'SmartDairy AI farm initialized with 30 registered cattle, hardware sensor line, and multimodal SIH telemetry.' })
    }
  });

  console.log('[Seed] ✅ Seeding completed successfully!');
  console.log('--- Demo Login Credentials ---');
  console.log('Admin:        admin@smartdairy.local    / Admin@123');
  console.log('Farm Manager: manager@smartdairy.local  / Manager@123');
  console.log('Veterinarian: vet@smartdairy.local      / Vet@123');
  console.log('Operator:     operator@smartdairy.local / Operator@123');
}

seed()
  .catch((err) => {
    console.error('[Seed] Error during seeding:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
