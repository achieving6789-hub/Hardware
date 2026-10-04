import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../database';

const router = Router();

// Primary farm & village coordinates (Coimbatore / Pollachi Rural Dairy Belt, Tamil Nadu, India)
const BASE_LAT = 11.01684;
const BASE_LNG = 76.95582;

// Village Danger Zones & Outbreak Hotspots for Govt / Vet / Admin Surveillance
const VILLAGE_DANGER_ZONES = [
  {
    id: 'quarantine_ward',
    name: 'Red Danger Zone 1: Isolation & Critical Mastitis Ward',
    nameTa: 'சிவப்பு ஆபத்து மண்டலம் 1: தீவிர மடிநோய் தனிமைப்படுத்தல் பிரிவு',
    nameHi: 'रेड डेंजर जोन 1: गंभीर मैस्टाइटिस पृथक वार्ड',
    village: 'Livestock Research Unit, Thondamuthur Road',
    villageTa: 'கால்நடை ஆராய்ச்சி மையம், தொண்டாமுத்தூர் ரோடு',
    villageHi: 'पशुधन अनुसंधान इकाई, थोंडामुथुर रोड',
    riskSeverity: 'CRITICAL',
    color: '#ef4444',
    polygon: [
      [BASE_LAT + 0.00002, BASE_LNG - 0.0006],
      [BASE_LAT + 0.0003, BASE_LNG - 0.0006],
      [BASE_LAT + 0.0003, BASE_LNG - 0.00035],
      [BASE_LAT + 0.00002, BASE_LNG - 0.00035]
    ],
    details: '4 Cows in Active Acute Mastitis Quarantine. High Streptococcus agalactiae risk.'
  },
  {
    id: 'thondamuthur_danger_cluster',
    name: 'Red Danger Zone 2: Thondamuthur Village Outbreak Cluster',
    nameTa: 'சிவப்பு ஆபத்து மண்டலம் 2: தொண்டாமுத்தூர் கிராம தொற்று ஆபத்து பகுதி',
    nameHi: 'रेड डेंजर जोन 2: थोंडामुथुर गांव प्रकोप क्लस्टर',
    village: 'Thondamuthur Village, Block 4',
    villageTa: 'தொண்டாமுத்தூர் கிராமம், தொகுதி 4',
    villageHi: 'थोंडामुथुर गांव, ब्लॉक 4',
    riskSeverity: 'HIGH',
    color: '#dc2626',
    polygon: [
      [BASE_LAT + 0.0008, BASE_LNG - 0.0012],
      [BASE_LAT + 0.0012, BASE_LNG - 0.0007],
      [BASE_LAT + 0.0009, BASE_LNG - 0.0004],
      [BASE_LAT + 0.0005, BASE_LNG - 0.0009]
    ],
    details: 'Subclinical Mastitis cluster detected. Somatic cell count exceeding 750k cells/ml.'
  },
  {
    id: 'kinathukadavu_risk_zone',
    name: 'Amber Risk Zone: Kinathukadavu Village Dairy Belt',
    nameTa: 'மஞ்சள் எச்சரிக்கை மண்டலம்: கிணத்துக்கடவு பால்பண்ணை பகுதி',
    nameHi: 'अंबर चेतावनी क्षेत्र: किनाथुकादावु डेयरी बेल्ट',
    village: 'Kinathukadavu Rural Dairy Sector',
    villageTa: 'கிணத்துக்கடவு ஊரக பால் மண்டலம்',
    villageHi: 'किनाथुकादावु ग्रामीण डेयरी क्षेत्र',
    riskSeverity: 'MODERATE',
    color: '#f59e0b',
    polygon: [
      [BASE_LAT - 0.0006, BASE_LNG + 0.0004],
      [BASE_LAT - 0.0003, BASE_LNG + 0.0011],
      [BASE_LAT - 0.0008, BASE_LNG + 0.0013],
      [BASE_LAT - 0.0011, BASE_LNG + 0.0006]
    ],
    details: 'Elevated electrical conductivity reported in bulk milk pickups.'
  },
  {
    id: 'milking_parlor_risk',
    name: 'Sensing Chute & Parlor Surveillance: STN-01',
    nameTa: 'உணரி வரிசை & பால் கறவை அரங்கம்: STN-01',
    nameHi: 'मिल्किंग पार्लर निगरानी केंद्र: STN-01',
    village: 'Central Farm Tech Compound',
    villageTa: 'மத்திய பண்ணை தொழில்நுட்ப மையம்',
    villageHi: 'केंद्रीय फार्म तकनीकी परिसर',
    riskSeverity: 'MODERATE',
    color: '#06b6d4',
    polygon: [
      [BASE_LAT + 0.0003, BASE_LNG - 0.0003],
      [BASE_LAT + 0.0003, BASE_LNG + 0.0001],
      [BASE_LAT + 0.00005, BASE_LNG + 0.0001],
      [BASE_LAT + 0.00005, BASE_LNG - 0.0003]
    ],
    details: 'Inline Optical Somatic Cell Counter & ISFET pH Sensor live streaming.'
  },
  {
    id: 'safe_grazing_pasture',
    name: 'Green Safe Zone: Bio-Secured Grazing Pasture',
    nameTa: 'பச்சை பாதுகாப்பு மண்டலம்: பாதுகாக்கப்பட்ட மேய்ச்சல் நிலம்',
    nameHi: 'ग्रीन सुरक्षित क्षेत्र: संरक्षित चारागाह',
    village: 'Vedapatti Pasture Boundary',
    villageTa: 'வேடபட்டி மேய்ச்சல் எல்லை',
    villageHi: 'वेदापट्टी चारागाह सीमा',
    riskSeverity: 'LOW',
    color: '#10b981',
    polygon: [
      [BASE_LAT - 0.0001, BASE_LNG - 0.0004],
      [BASE_LAT - 0.0001, BASE_LNG + 0.0006],
      [BASE_LAT - 0.00045, BASE_LNG + 0.0006],
      [BASE_LAT - 0.00045, BASE_LNG - 0.0004]
    ],
    details: 'Healthy cattle herd grazing under solar-powered RFID fencing.'
  }
];

// Govt & Veterinary Disease Surveillance Facilities
const GOVT_VET_FACILITIES = [
  {
    id: 'fac-gov-lab',
    name: 'Govt Veterinary Clinical Disease Diagnostic Lab',
    nameTa: 'அரசு கால்நடை நோய் பரிசோதனை ஆய்வகம்',
    nameHi: 'सरकारी पशु रोग निदान प्रयोगशाला',
    type: 'GOVT_LAB',
    lat: BASE_LAT + 0.00015,
    lng: BASE_LNG - 0.00048,
    status: 'ACTIVE_TRIAGE',
    officer: 'Dr. S. Ramesh, B.V.Sc (Animal Husbandry Dept)',
    officerTa: 'மருத்துவர் எஸ். ரமேஷ் (கால்நடை பராமரிப்பு துறை)',
    details: 'Equipped for rapid PCR & Somatic Cell Culturing'
  },
  {
    id: 'fac-checkpost',
    name: 'Village Bio-Security & Livestock Checkpost',
    nameTa: 'கிராம கால்நடை உயிரியல் பாதுகாப்பு சோதனைச் சாவடி',
    nameHi: 'गांव जैव-सुरक्षा एवं पशुधन चेकपोस्ट',
    type: 'CHECKPOST',
    lat: BASE_LAT + 0.0007,
    lng: BASE_LNG - 0.0008,
    status: 'SURVEILLANCE',
    officer: 'TN Animal Husbandry Quarantine Wing',
    officerTa: 'தமிழ்நாடு கால்நடை நோய் தடுப்பு பிரிவு',
    details: 'Mandatory thermal scanning & udder inspection before milk dispatch'
  },
  {
    id: 'fac-bulk-chiller',
    name: 'Dairy Co-operative Bulk Milk Chiller (5000L)',
    nameTa: 'பால் உற்பத்தியாளர் கூட்டுறவு குளிரூட்டி (5000 லி)',
    nameHi: 'डेयरी सहकारी थोक दूध चिलर (5000L)',
    type: 'BULK_CHILLER',
    lat: BASE_LAT - 0.00005,
    lng: BASE_LNG - 0.0001,
    status: 'OPTIMAL',
    officer: 'Aavin Quality Control Inspector',
    officerTa: 'ஆவின் பால் தரக் கட்டுப்பாட்டு அதிகாரி',
    details: 'Temperature: 3.8°C | Antibiotic residue test: NEGATIVE'
  },
  {
    id: 'fac-stn01-line',
    name: 'Sensorized Milking Station STN-01',
    nameTa: 'உணரி வரிசை பால் கறக்கும் நிலையம் STN-01',
    nameHi: 'सेंसरयुक्त दुग्ध दोहन स्टेशन STN-01',
    type: 'MILKING_LINE',
    lat: BASE_LAT + 0.00018,
    lng: BASE_LNG - 0.0001,
    status: 'ONLINE',
    officer: 'SmartDairy Hardware Line Controller',
    officerTa: 'ஸ்மார்ட் டெய்ரி வன்பொருள் கட்டுப்பாட்டு சாதனம்',
    details: 'Automatic pneumatic diversion active for high SCC milk (>400k)'
  }
];

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

    // Assign realistic GPS coordinates placing critical/risk cows in danger zones
    const mappedCows = cows.map((cow, index) => {
      const latestHealth = cow.healthProfile;
      const latestSession = cow.sessions?.[0];
      const riskScore = latestHealth?.currentRiskScore ?? (cow.healthStatus === 'CRITICAL' ? 88 : cow.healthStatus === 'HIGH' ? 68 : cow.healthStatus === 'MODERATE' ? 42 : 12);
      const riskLevel = (cow.healthStatus as 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL') || 'LOW';

      const r1 = pseudoRandom(index * 13 + 1);
      const r2 = pseudoRandom(index * 17 + 2);

      let lat = BASE_LAT;
      let lng = BASE_LNG;
      let zoneName = 'Stall Block A (Feeding Shed)';
      let isDangerHotspot = false;

      if (riskLevel === 'CRITICAL' || riskLevel === 'HIGH') {
        // Red Danger Zone: Isolation Ward & Village Outbreak Cluster
        isDangerHotspot = true;
        if (index % 2 === 0) {
          lat = BASE_LAT + 0.00008 + r1 * 0.00018;
          lng = BASE_LNG - 0.00055 + r2 * 0.00015;
          zoneName = 'Red Danger Zone 1: Acute Isolation Pen';
        } else {
          lat = BASE_LAT + 0.0007 + r1 * 0.0003;
          lng = BASE_LNG - 0.0008 + r2 * 0.0003;
          zoneName = 'Red Danger Zone 2: Thondamuthur Village Cluster';
        }
      } else if (riskLevel === 'MODERATE') {
        // Amber Zone: Observation Chute & Village periphery
        lat = BASE_LAT + 0.00012 + r1 * 0.00014;
        lng = BASE_LNG - 0.00025 + r2 * 0.00025;
        zoneName = 'Amber Risk Zone: Milking Observation Chute';
      } else {
        // Safe Zone: Green Pastures
        if (index % 2 === 0) {
          lat = BASE_LAT - 0.00015 - r1 * 0.00025;
          lng = BASE_LNG - 0.0003 + r2 * 0.0008;
          zoneName = 'Green Safe Zone: Open Pasture Grazing Area';
        } else {
          lat = BASE_LAT + 0.0001 + r1 * 0.00018;
          lng = BASE_LNG + 0.00025 + r2 * 0.0003;
          zoneName = 'Green Safe Zone: Stall Pen A';
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
        isDangerHotspot,
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
        location: 'Thondamuthur & Kinathukadavu Rural Dairy Sector, Coimbatore, Tamil Nadu',
        locationTa: 'தொண்டாமுத்தூர் & கிணத்துக்கடவு ஊரக பால் மண்டலம், கோயம்புத்தூர், தமிழ்நாடு',
        center: [BASE_LAT, BASE_LNG],
        zoom: 17,
        totalCows: mappedCows.length,
        criticalCows: mappedCows.filter(c => c.riskLevel === 'CRITICAL' || c.riskLevel === 'HIGH').length,
        moderateCows: mappedCows.filter(c => c.riskLevel === 'MODERATE').length,
        healthyCows: mappedCows.filter(c => c.riskLevel === 'LOW').length,
        dangerPlacesCount: 2
      },
      zones: VILLAGE_DANGER_ZONES,
      facilities: GOVT_VET_FACILITIES,
      cows: mappedCows
    });
  } catch (error) {
    next(error);
  }
});

export default router;

