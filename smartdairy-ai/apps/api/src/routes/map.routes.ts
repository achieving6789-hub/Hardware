import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '@smartdairy/database';

const router = Router();

// Primary farm coordinates (Tamil Nadu Agricultural & Livestock Research Station, India)
const BASE_LAT = 11.01684;
const BASE_LNG = 76.95582;

// Offset zones around the dairy complex
const ZONES = [
  {
    id: 'milking_parlor',
    name: 'Milking Parlor & STN-01 Sensor Line',
    nameTa: 'பால் கறக்கும் அரங்கம் & STN-01 உணரி வரிசை',
    nameHi: 'दुग्ध दोहन केंद्र एवं STN-01 सेंसर लाइन',
    type: 'PARLOR',
    color: '#06b6d4',
    polygon: [
      [BASE_LAT + 0.0003, BASE_LNG - 0.0003],
      [BASE_LAT + 0.0003, BASE_LNG + 0.0001],
      [BASE_LAT + 0.00005, BASE_LNG + 0.0001],
      [BASE_LAT + 0.00005, BASE_LNG - 0.0003]
    ]
  },
  {
    id: 'stall_block_a',
    name: 'Stall Block A (High Yielding HF Herd)',
    nameTa: 'தொழுவம் பிரிவு A (அதிக பால் தரும் எச்.எஃப் மாடுகள்)',
    nameHi: 'तबेला ब्लॉक A (उच्च उपज वाली एचएफ गायें)',
    type: 'BARN',
    color: '#3b82f6',
    polygon: [
      [BASE_LAT + 0.0003, BASE_LNG + 0.0002],
      [BASE_LAT + 0.0003, BASE_LNG + 0.0006],
      [BASE_LAT + 0.00005, BASE_LNG + 0.0006],
      [BASE_LAT + 0.00005, BASE_LNG + 0.0002]
    ]
  },
  {
    id: 'grazing_pasture',
    name: 'Open Grazing Pasture & Fodder Field',
    nameTa: 'பசுந்தீவன மேய்ச்சல் நிலம்',
    nameHi: 'हरा चारा एवं खुला चारागाह',
    type: 'PASTURE',
    color: '#10b981',
    polygon: [
      [BASE_LAT - 0.0001, BASE_LNG - 0.0004],
      [BASE_LAT - 0.0001, BASE_LNG + 0.0006],
      [BASE_LAT - 0.00045, BASE_LNG + 0.0006],
      [BASE_LAT - 0.00045, BASE_LNG - 0.0004]
    ]
  },
  {
    id: 'quarantine_ward',
    name: 'Isolation Ward & Veterinary Clinic',
    nameTa: 'தனிமைப்படுத்தல் சிகிச்சை பிரிவு',
    nameHi: 'पृथक वार्ड एवं पशु चिकित्सा क्लिनिक',
    type: 'CLINIC',
    color: '#ef4444',
    polygon: [
      [BASE_LAT + 0.00002, BASE_LNG - 0.0006],
      [BASE_LAT + 0.0003, BASE_LNG - 0.0006],
      [BASE_LAT + 0.0003, BASE_LNG - 0.00035],
      [BASE_LAT + 0.00002, BASE_LNG - 0.00035]
    ]
  },
  {
    id: 'bulk_tank_facility',
    name: 'Bulk Milk Chilling & CIP Sanitation Station',
    nameTa: 'மொத்த பால் குளிரூட்டி & CIP சுத்திகரிப்பு பிரிவு',
    nameHi: 'थोक दूध शीतलन केंद्र एवं सीआईपी इकाई',
    type: 'PROCESSING',
    color: '#8b5cf6',
    polygon: [
      [BASE_LAT - 0.00002, BASE_LNG - 0.0003],
      [BASE_LAT - 0.00002, BASE_LNG + 0.0001],
      [BASE_LAT - 0.00009, BASE_LNG + 0.0001],
      [BASE_LAT - 0.00009, BASE_LNG - 0.0003]
    ]
  }
];

// Fixed facility markers
const FACILITIES = [
  {
    id: 'fac-milking-line',
    name: 'Inline Milk Sensing Unit STN-01',
    nameTa: 'உணரி வரிசை STN-01',
    nameHi: 'सेंसर लाइन STN-01',
    type: 'MILKING_STATION',
    lat: BASE_LAT + 0.00018,
    lng: BASE_LNG - 0.0001,
    status: 'ONLINE',
    details: 'Flow, Optical SCC, pH & EC Sensors active'
  },
  {
    id: 'fac-bulk-tank',
    name: 'Bulk Milk Tank (5,000L Chiller)',
    nameTa: 'பால் குளிரூட்டும் தொட்டி (5000 லிட்டர்)',
    nameHi: 'थोक दूध टैंक (5000L चिलर)',
    type: 'BULK_TANK',
    lat: BASE_LAT - 0.00005,
    lng: BASE_LNG - 0.0001,
    status: 'OPTIMAL',
    details: 'Temperature: 3.8°C | Volume: 3,420L'
  },
  {
    id: 'fac-cip',
    name: 'Automated Clean-In-Place System',
    nameTa: 'தானியங்கி CIP சுத்திகரிப்பு',
    nameHi: 'स्वचालित सीआईपी प्रणाली',
    type: 'CIP_STATION',
    lat: BASE_LAT - 0.00005,
    lng: BASE_LNG + 0.00002,
    status: 'STANDBY',
    details: 'Acid/Alkali wash loops ready'
  },
  {
    id: 'fac-vet',
    name: 'Veterinary Diagnostic Center',
    nameTa: 'கால்நடை பரிசோதனை மையம்',
    nameHi: 'पशु चिकित्सा निदान केंद्र',
    type: 'VET_CLINIC',
    lat: BASE_LAT + 0.00015,
    lng: BASE_LNG - 0.00048,
    status: 'ACTIVE',
    details: 'Dr. Ramesh Kumar on duty'
  }
];

// Deterministic random generator for realistic positioning
function pseudoRandom(seed: number) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

// GET /api/map/farm-geo
router.get('/farm-geo', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const farm = await prisma.farm.findFirst({
      include: {
        stations: true
      }
    });

    const cows = await prisma.cow.findMany({
      include: {
        rfidTag: true,
        healthProfile: true,
        baseline: true,
        sessions: {
          take: 1,
          orderBy: { startTime: 'desc' }
        }
      }
    });

    // Assign realistic GPS coordinates based on health status and zones
    const mappedCows = cows.map((cow, index) => {
      const latestHealth = cow.healthProfile;
      const latestSession = cow.sessions[0];
      const riskScore = latestHealth?.riskScore ?? latestSession?.riskScore ?? (cow.healthStatus === 'CRITICAL' ? 88 : cow.healthStatus === 'HIGH' ? 68 : cow.healthStatus === 'MODERATE' ? 42 : 12);
      const riskLevel = (cow.healthStatus as 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL') || 'LOW';

      const r1 = pseudoRandom(index * 13 + 1);
      const r2 = pseudoRandom(index * 17 + 2);

      let lat = BASE_LAT;
      let lng = BASE_LNG;
      let zoneName = 'Stall Block A';

      if (riskLevel === 'CRITICAL' || riskLevel === 'HIGH') {
        // Positioned in or near the Quarantine Ward
        lat = BASE_LAT + 0.00008 + r1 * 0.00018;
        lng = BASE_LNG - 0.00055 + r2 * 0.00015;
        zoneName = 'Quarantine & Treatment Ward';
      } else if (riskLevel === 'MODERATE') {
        // Near the Milking Parlor entrance or Stall Pen
        lat = BASE_LAT + 0.00012 + r1 * 0.00014;
        lng = BASE_LNG - 0.00025 + r2 * 0.00025;
        zoneName = 'Milking Observation Chute';
      } else {
        // Low risk: spread across Stall Block A & Open Grazing Pasture
        if (index % 2 === 0) {
          // Open Grazing Pasture
          lat = BASE_LAT - 0.00015 - r1 * 0.00025;
          lng = BASE_LNG - 0.0003 + r2 * 0.0008;
          zoneName = 'Open Pasture Grazing Area';
        } else {
          // Stall Block A
          lat = BASE_LAT + 0.0001 + r1 * 0.00018;
          lng = BASE_LNG + 0.00025 + r2 * 0.0003;
          zoneName = 'Stall Block A (Feeding Shed)';
        }
      }

      return {
        id: cow.id,
        cowCode: cow.cowCode,
        name: cow.name,
        breed: cow.breed,
        rfidTag: cow.rfidTag?.tagUid || cow.rfidId || `TAG-${cow.cowCode}`,
        riskLevel,
        riskScore: Math.round(riskScore),
        lactationNumber: cow.lactationNumber,
        daysInMilk: cow.daysInMilk,
        lastYield: latestSession?.totalVolume ? Number(latestSession.totalVolume.toFixed(1)) : 14.5,
        status: cow.status,
        zoneName,
        lat: Number(lat.toFixed(6)),
        lng: Number(lng.toFixed(6))
      };
    });

    res.json({
      success: true,
      farm: {
        id: farm?.id || 'demo-farm-01',
        name: farm?.name || 'SmartDairy Research & Livestock Station',
        location: farm?.location || 'Coimbatore, Tamil Nadu, India',
        center: [BASE_LAT, BASE_LNG],
        zoom: 18,
        totalCows: mappedCows.length,
        criticalCows: mappedCows.filter(c => c.riskLevel === 'CRITICAL' || c.riskLevel === 'HIGH').length,
        moderateCows: mappedCows.filter(c => c.riskLevel === 'MODERATE').length,
        healthyCows: mappedCows.filter(c => c.riskLevel === 'LOW').length
      },
      zones: ZONES,
      facilities: FACILITIES,
      cows: mappedCows
    });
  } catch (error) {
    next(error);
  }
});

export default router;
