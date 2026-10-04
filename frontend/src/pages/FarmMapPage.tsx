import React, { useEffect, useState, useRef } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  MapPin,
  Compass,
  Layers,
  Activity,
  AlertTriangle,
  CheckCircle,
  Eye,
  RefreshCw,
  Search,
  Filter,
  AlertOctagon,
  ShieldAlert,
  Building2,
  Navigation,
  Globe,
  Radio,
  Milk,
  Stethoscope
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface GeoCow {
  id: string;
  cowCode: string;
  name: string;
  breed: string;
  rfidTag: string;
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  riskScore: number;
  isDangerHotspot?: boolean;
  lactationNumber: number;
  daysInMilk: number;
  lastYield: number;
  status: string;
  zoneName: string;
  lat: number;
  lng: number;
}

interface GeoZone {
  id: string;
  name: string;
  nameTa?: string;
  nameHi?: string;
  village?: string;
  villageTa?: string;
  villageHi?: string;
  riskSeverity: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  color: string;
  polygon: [number, number][];
  details: string;
}

interface GeoFacility {
  id: string;
  name: string;
  nameTa?: string;
  nameHi?: string;
  type: string;
  lat: number;
  lng: number;
  status: string;
  officer?: string;
  officerTa?: string;
  details: string;
}

interface FarmMapData {
  farm: {
    id: string;
    name: string;
    location: string;
    locationTa?: string;
    center: [number, number];
    zoom: number;
    totalCows: number;
    criticalCows: number;
    moderateCows: number;
    healthyCows: number;
    dangerPlacesCount: number;
  };
  zones: GeoZone[];
  facilities: GeoFacility[];
  cows: GeoCow[];
}

export const FarmMapPage: React.FC<{ onNavigate?: (page: string, params?: any) => void }> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { language, t } = useLanguage();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const zonesLayerRef = useRef<L.LayerGroup | null>(null);

  const [mapData, setMapData] = useState<FarmMapData | null>(null);
  const [selectedCow, setSelectedCow] = useState<GeoCow | null>(null);
  const [selectedZone, setSelectedZone] = useState<GeoZone | null>(null);

  // Default to showing DANGER PLACES ONLY as requested by user
  const [filterMode, setFilterMode] = useState<'DANGER_ONLY' | 'ALL'>('DANGER_ONLY');
  const [mapLayerType, setMapLayerType] = useState<'GOOGLE_HYBRID' | 'GOOGLE_ROADMAP'>('GOOGLE_HYBRID');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLiveGps, setIsLiveGps] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Role Protection check: ONLY ADMIN (Govt) and VET can access
  const isAuthorized = user?.role === 'ADMIN' || user?.role === 'VETERINARIAN';

  // Load geo data from backend
  const fetchMapData = async () => {
    try {
      const res = await api.getFarmGeoData();
      if (res.success) {
        setMapData(res);
      }
    } catch (err) {
      console.error('[FarmMap] Failed to load farm geo data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMapData();
  }, []);

  // Initialize Leaflet Map with Google Maps imagery
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current || !mapData || !isAuthorized) return;

    const center = mapData.farm.center;
    const map = L.map(mapContainerRef.current, {
      center: center,
      zoom: 17,
      maxZoom: 20,
      minZoom: 14,
      zoomControl: false
    });

    // ORIGINAL GOOGLE MAPS TILES
    // Google Hybrid: Satellite imagery with village names & road overlays
    const googleHybridUrl = 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}';
    const tile = L.tileLayer(googleHybridUrl, {
      attribution: '&copy; Google Maps | Govt Animal Husbandry Disease Surveillance',
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
    }).addTo(map);

    tileLayerRef.current = tile;
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const zonesGroup = L.layerGroup().addTo(map);
    const markersGroup = L.layerGroup().addTo(map);

    zonesLayerRef.current = zonesGroup;
    markersLayerRef.current = markersGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [mapData, isAuthorized]);

  // Switch between Google Hybrid (Satellite) and Google Roadmap
  const handleToggleMapLayer = (layer: 'GOOGLE_HYBRID' | 'GOOGLE_ROADMAP') => {
    setMapLayerType(layer);
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const url =
      layer === 'GOOGLE_HYBRID'
        ? 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}' // Google Hybrid Satellite + Roads
        : 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}'; // Google Standard Roadmap

    tileLayerRef.current = L.tileLayer(url, {
      attribution: '&copy; Google Maps | SmartDairy AI',
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
    }).addTo(map);
  };

  // Render Village Danger Zones & Surveillance Facilities
  useEffect(() => {
    const map = mapInstanceRef.current;
    const zonesGroup = zonesLayerRef.current;
    if (!map || !zonesGroup || !mapData) return;

    zonesGroup.clearLayers();

    // Filter zones if DANGER_ONLY is active
    const zonesToRender = mapData.zones.filter((zone) => {
      if (filterMode === 'DANGER_ONLY') {
        return zone.riskSeverity === 'CRITICAL' || zone.riskSeverity === 'HIGH';
      }
      return true;
    });

    zonesToRender.forEach((zone) => {
      const isCritical = zone.riskSeverity === 'CRITICAL' || zone.riskSeverity === 'HIGH';
      const zoneName = language === 'ta' && zone.nameTa ? zone.nameTa : language === 'hi' && zone.nameHi ? zone.nameHi : zone.name;
      const villageName = language === 'ta' && zone.villageTa ? zone.villageTa : zone.village || 'Village Sector';

      const polygon = L.polygon(zone.polygon, {
        color: zone.color,
        fillColor: zone.color,
        fillOpacity: isCritical ? 0.35 : 0.15,
        weight: isCritical ? 3 : 2,
        dashArray: isCritical ? '6, 6' : '3, 3'
      });

      polygon.bindTooltip(
        `<div style="font-family: inherit; text-align: center;">
          <div style="font-weight: 800; font-size: 11px; color: ${isCritical ? '#f87171' : '#38bdf8'}">${zoneName}</div>
          <div style="font-size: 9px; color: #cbd5e1;">📍 ${villageName}</div>
        </div>`,
        {
          permanent: isCritical,
          direction: 'center',
          className: `custom-zone-label ${isCritical ? 'border-red-500' : ''}`
        }
      );

      polygon.on('click', () => {
        setSelectedZone(zone);
        setSelectedCow(null);
      });

      polygon.addTo(zonesGroup);
    });

    // Render Govt & Veterinary Facilities
    mapData.facilities.forEach((fac) => {
      const facName = language === 'ta' && fac.nameTa ? fac.nameTa : fac.name;
      const officer = language === 'ta' && fac.officerTa ? fac.officerTa : fac.officer;

      const getIconHtml = () => {
        if (fac.type === 'GOVT_LAB') {
          return `<div class="flex items-center justify-center h-9 w-9 rounded-full bg-rose-600 border-2 border-white shadow-xl text-white font-bold text-base shadow-rose-600/50 ring-4 ring-rose-500/40 animate-pulse">🏥</div>`;
        }
        if (fac.type === 'CHECKPOST') {
          return `<div class="flex items-center justify-center h-8 w-8 rounded-full bg-amber-500 border-2 border-white shadow-lg text-white font-bold text-sm shadow-amber-500/40">🚧</div>`;
        }
        if (fac.type === 'BULK_CHILLER') {
          return `<div class="flex items-center justify-center h-8 w-8 rounded-full bg-indigo-600 border-2 border-white shadow-lg text-white font-bold text-sm shadow-indigo-600/50">🛢️</div>`;
        }
        return `<div class="flex items-center justify-center h-8 w-8 rounded-full bg-cyan-500 border-2 border-white shadow-lg text-white font-bold text-sm shadow-cyan-500/50">🥛</div>`;
      };

      const icon = L.divIcon({
        className: 'custom-facility-pin',
        html: getIconHtml(),
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });

      const marker = L.marker([fac.lat, fac.lng], { icon });
      marker.bindPopup(`
        <div style="font-family: inherit; min-width: 220px; color: #0f172a; padding: 4px;">
          <h4 style="font-weight: 800; margin: 0 0 4px 0; color: #dc2626; font-size: 13px;">${facName}</h4>
          <div style="font-size: 11px; margin-bottom: 4px; color: #475569;">${fac.details}</div>
          ${officer ? `<div style="font-size: 10px; color: #0284c7; font-weight: 600; margin-bottom: 4px;">👨‍⚕️ ${officer}</div>` : ''}
          <span style="font-size: 10px; background: #fee2e2; color: #991b1b; padding: 2px 6px; border-radius: 9999px; font-weight: bold;">
            SURVEILLANCE STATUS: ${fac.status}
          </span>
        </div>
      `);
      marker.addTo(zonesGroup);
    });
  }, [mapData, language, filterMode]);

  // Render Cattle with focus on DANGER / OUTBREAK ANIMALS
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    if (!map || !markersGroup || !mapData) return;

    markersGroup.clearLayers();

    // Filter cows: In DANGER_ONLY mode, only render CRITICAL and HIGH risk cattle!
    const filteredCows = mapData.cows.filter((cow) => {
      const matchesSearch =
        cow.cowCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cow.rfidTag.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (filterMode === 'DANGER_ONLY') {
        return cow.riskLevel === 'CRITICAL' || cow.riskLevel === 'HIGH';
      }
      return true;
    });

    filteredCows.forEach((cow) => {
      const isCritical = cow.riskLevel === 'CRITICAL' || cow.riskLevel === 'HIGH';
      const isModerate = cow.riskLevel === 'MODERATE';

      const pinBg = isCritical
        ? 'bg-rose-600 border-white ring-4 ring-rose-500/50 animate-bounce'
        : isModerate
        ? 'bg-amber-500 border-white ring-2 ring-amber-500/30'
        : 'bg-emerald-500 border-white ring-1 ring-emerald-500/30';

      const iconHtml = `
        <div class="relative flex items-center justify-center cursor-pointer group">
          <div class="h-8 w-8 rounded-full ${pinBg} border-2 text-white flex items-center justify-center shadow-2xl transition-transform hover:scale-125">
            <span class="text-xs font-bold">${isCritical ? '🚨' : isModerate ? '⚠️' : '🐄'}</span>
          </div>
          <div class="absolute -bottom-5 whitespace-nowrap bg-rose-950 text-[10px] text-rose-200 font-extrabold px-1.5 py-0.5 rounded shadow-lg border border-rose-600">
            ${cow.cowCode} (${cow.riskScore})
          </div>
        </div>
      `;

      const icon = L.divIcon({
        className: 'custom-cow-danger-pin',
        html: iconHtml,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const marker = L.marker([cow.lat, cow.lng], { icon });

      marker.on('click', () => {
        setSelectedCow(cow);
        setSelectedZone(null);
        map.panTo([cow.lat, cow.lng], { animate: true });
      });

      marker.addTo(markersGroup);
    });
  }, [mapData, filterMode, searchQuery]);

  // Live GPS drift simulation
  useEffect(() => {
    if (!isLiveGps || !mapData) return;

    const interval = setInterval(() => {
      setMapData((prev) => {
        if (!prev) return null;
        const updatedCows = prev.cows.map((cow) => {
          const latDrift = (Math.random() - 0.5) * 0.000015;
          const lngDrift = (Math.random() - 0.5) * 0.000015;
          return {
            ...cow,
            lat: Number((cow.lat + latDrift).toFixed(6)),
            lng: Number((cow.lng + lngDrift).toFixed(6))
          };
        });
        return { ...prev, cows: updatedCows };
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [isLiveGps, mapData]);

  const handleFocusCow = (cow: GeoCow) => {
    setSelectedCow(cow);
    setSelectedZone(null);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([cow.lat, cow.lng], 19, { animate: true });
    }
  };

  const handleResetView = () => {
    if (mapInstanceRef.current && mapData) {
      mapInstanceRef.current.setView(mapData.farm.center, 17, { animate: true });
    }
  };

  // If a Farmer or unauthorized role tries to open the map
  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center glass-panel rounded-3xl border border-rose-500/40 max-w-xl mx-auto my-12">
        <ShieldAlert className="h-16 w-16 text-rose-500 mb-4 animate-pulse" />
        <h2 className="text-xl font-black text-white">
          {language === 'ta' ? 'அரசு & மருத்துவ அதிகாரி பிரத்தியேக பிரிவு' : 'Restricted Outbreak Surveillance Area'}
        </h2>
        <p className="mt-2 text-sm text-slate-300">
          {language === 'ta'
            ? 'இந்த வரைபடம் அரசு நோய் தடுப்பு அதிகாரிகள் மற்றும் கால்நடை மருத்துவர்களுக்காக மட்டுமே வடிவமைக்கப்பட்டுள்ளது. விவசாயிகள் தங்களின் மாடுகள் தகவல்களை மந்தை பதிவேட்டில் (Cattle Herd) காணலாம்.'
            : 'This Disease & Outbreak Risk Map is restricted to Government Veterinary Surveillance Officers and Animal Husbandry authorities.'}
        </p>
        <button
          onClick={() => onNavigate && onNavigate('dashboard')}
          className="mt-6 px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/30 transition-all cursor-pointer"
        >
          {language === 'ta' ? 'முகப்புக்கு திரும்பு' : 'Back to Dashboard'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Govt Advisory Top Alert Banner */}
      <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-rose-950/90 via-red-900/60 to-rose-950/90 border border-rose-500/60 p-3 sm:p-4 text-xs text-rose-200 shadow-xl shadow-rose-950/30">
        <div className="flex items-center gap-3">
          <AlertOctagon className="h-6 w-6 text-rose-400 shrink-0 animate-pulse" />
          <div>
            <div className="font-extrabold text-sm text-white flex items-center gap-2">
              <span>{t('map.govt_advisory')}</span>
              <span className="rounded-full bg-rose-500 text-white font-mono px-2 py-0.2 text-[9px] uppercase tracking-wider font-bold">
                GOVT SURVEILLANCE
              </span>
            </div>
            <p className="text-[11px] text-rose-300 mt-0.5">
              {language === 'ta'
                ? 'தொண்டாமுத்தூர் மற்றும் கிணத்துக்கடவு ஊரக பால் மண்டலத்தில் மடிநோய் பரவல் தடுப்பு நடவடிக்கைகள் தீவிரப்படுத்தப்பட்டுள்ளன.'
                : 'Thondamuthur and Kinathukadavu village dairy sectors marked for high somatic cell count isolation.'}
            </p>
          </div>
        </div>

        {/* Google Map Layer Selector */}
        <div className="hidden md:flex items-center gap-1 rounded-xl bg-slate-900/90 border border-slate-700 p-1">
          <button
            onClick={() => handleToggleMapLayer('GOOGLE_HYBRID')}
            className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              mapLayerType === 'GOOGLE_HYBRID'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🛰️ {t('map.google_satellite')}
          </button>
          <button
            onClick={() => handleToggleMapLayer('GOOGLE_ROADMAP')}
            className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              mapLayerType === 'GOOGLE_ROADMAP'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🗺️ {t('map.google_roadmap')}
          </button>
        </div>
      </div>

      {/* Title & Filter Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <MapPin className="h-6 w-6 text-rose-500" />
              <span>{t('map.title')}</span>
            </h1>
            <span className="rounded-full bg-rose-950 border border-rose-500/50 px-2.5 py-0.5 text-xs text-rose-300 font-mono font-bold">
              {language === 'ta' ? 'அசல் கூகிள் மேப்ஸ்' : 'ORIGINAL GOOGLE MAPS'}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            {t('map.subtitle')} —{' '}
            <strong className="text-slate-200">
              {language === 'ta' && mapData?.farm.locationTa ? mapData.farm.locationTa : mapData?.farm.location}
            </strong>
          </p>
        </div>

        {/* View Toggle: Danger Only vs All */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1 rounded-xl bg-slate-900 border border-slate-700 p-1">
            <button
              onClick={() => setFilterMode('DANGER_ONLY')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                filterMode === 'DANGER_ONLY'
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <AlertTriangle className="h-3.5 w-3.5 text-white" />
              <span>{t('map.danger_only')}</span>
            </button>

            <button
              onClick={() => setFilterMode('ALL')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                filterMode === 'ALL'
                  ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>{t('map.all_places')}</span>
            </button>
          </div>

          <button
            onClick={handleResetView}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-all cursor-pointer"
            title="Center Map"
          >
            <Compass className="h-3.5 w-3.5 text-rose-400" />
            <span>Center</span>
          </button>

          <button
            onClick={fetchMapData}
            className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 transition-all cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Danger & Risk Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl p-4 border bg-rose-950/40 border-rose-500/60 shadow-lg shadow-rose-950/20">
          <div className="flex items-center justify-between text-xs text-rose-300 font-bold">
            <span>{t('map.critical_risk')}</span>
            <AlertTriangle className="h-4 w-4 text-rose-400 animate-pulse" />
          </div>
          <div className="mt-2 text-3xl font-black text-rose-400">{mapData?.farm.criticalCows ?? 5}</div>
          <div className="mt-1 text-[11px] text-rose-300 font-semibold">
            {language === 'ta' ? 'அவசர தனிமைப்படுத்தல்' : 'Acute Quarantine Active'}
          </div>
        </div>

        <div className="rounded-2xl p-4 border bg-amber-950/40 border-amber-500/50">
          <div className="flex items-center justify-between text-xs text-amber-300 font-bold">
            <span>{t('map.moderate_risk')}</span>
            <Activity className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 text-3xl font-black text-amber-400">{mapData?.farm.moderateCows ?? 6}</div>
          <div className="mt-1 text-[11px] text-amber-300 font-semibold">
            {language === 'ta' ? 'அவதானிப்பு மண்டலம்' : 'Subclinical Watchlist'}
          </div>
        </div>

        <div className="rounded-2xl p-4 border glass-panel">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{t('map.village_cluster')}</span>
            <Building2 className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-3xl font-black text-white">4 Sectors</div>
          <div className="mt-1 text-[11px] text-cyan-400 font-semibold">Thondamuthur Belt</div>
        </div>

        <div className="rounded-2xl p-4 border bg-emerald-950/30 border-emerald-500/40">
          <div className="flex items-center justify-between text-xs text-emerald-300 font-bold">
            <span>{t('map.healthy_herd')}</span>
            <CheckCircle className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-3xl font-black text-emerald-400">{mapData?.farm.healthyCows ?? 20}</div>
          <div className="mt-1 text-[11px] text-emerald-300 font-semibold">
            {language === 'ta' ? 'ஆரோக்கியமான மாடுகள்' : 'Safe Green Pastures'}
          </div>
        </div>
      </div>

      {/* Main Map & Danger Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Leaflet DOM Container rendering Google Maps */}
        <div className="lg:col-span-3 glass-panel rounded-2xl p-3 flex flex-col relative overflow-hidden shadow-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-3 px-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder={language === 'ta' ? 'ஆபத்தான மாட்டை தேடு (எ.கா: COW-004)...' : 'Search danger cow or village...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl bg-slate-900/90 border border-slate-700 pl-9 pr-4 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="text-xs text-slate-400 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-ping" />
              <span className="font-semibold text-rose-300">
                {filterMode === 'DANGER_ONLY'
                  ? language === 'ta'
                    ? 'தீவிர மடிநோய் பரவல் மண்டலங்கள் மட்டும் காண்பிக்கப்படுகின்றன'
                    : 'Showing Severe Outbreak & Danger Hotspots'
                  : language === 'ta'
                  ? 'அனைத்து கிராம பகுதிகள்'
                  : 'All Village Sectors Active'}
              </span>
            </div>
          </div>

          {/* Real Google Maps Layer Container */}
          <div
            ref={mapContainerRef}
            className="w-full h-[550px] rounded-xl overflow-hidden z-10 border border-slate-700/80 bg-slate-950 shadow-inner"
          />

          {/* Map Footer Indicator */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 px-2 text-[11px] text-slate-400">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-1.5 font-bold text-rose-400">
                <span className="h-3 w-3 rounded-full bg-rose-600 border border-white animate-pulse" />
                <span>{language === 'ta' ? 'சிவப்பு ஆபத்து பகுதி (தனிமைப்படுத்தல்)' : 'Red Danger Zone (Acute Outbreak)'}</span>
              </div>
              <div className="flex items-center gap-1.5 font-semibold text-amber-400">
                <span className="h-3 w-3 rounded-full bg-amber-500 border border-white" />
                <span>{language === 'ta' ? 'மஞ்சள் எச்சரிக்கை பகுதி' : 'Amber Observation Chute'}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-slate-400 font-mono text-[10px]">
              <span>🏥 {language === 'ta' ? 'அரசு கால்நடை பரிசோதனை மையம்' : 'Govt Diagnostic Center'}</span>
              <span>🚧 {language === 'ta' ? 'பாதுகாப்பு சோதனைச் சாவடி' : 'Bio-Security Checkpost'}</span>
            </div>
          </div>
        </div>

        {/* Danger Animal / Village Inspector Sidebar */}
        <div className="space-y-4">
          {/* Selected Cow or Zone Panel */}
          {selectedCow ? (
            <div className="glass-panel rounded-2xl p-5 border border-rose-500/60 shadow-2xl relative overflow-hidden bg-gradient-to-b from-rose-950/30 to-slate-900/90">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-400">
                    🚨 {selectedCow.cowCode}
                  </span>
                  <h3 className="text-lg font-black text-white">{selectedCow.name}</h3>
                </div>
                <span className="rounded-full px-2.5 py-0.5 text-[10px] font-black bg-rose-950 text-rose-300 border border-rose-600 animate-pulse">
                  CRITICAL RISK
                </span>
              </div>

              <div className="mt-4 space-y-2 text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400">{t('map.rfid_tag')}</span>
                  <span className="font-mono text-slate-200">{selectedCow.rfidTag}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400">{language === 'ta' ? 'இனம்' : 'Breed'}</span>
                  <span className="text-slate-200">{selectedCow.breed}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400">{language === 'ta' ? 'ஆபத்து மண்டலம்' : 'Danger Zone'}</span>
                  <span className="text-rose-400 font-bold">{selectedCow.zoneName}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400">{t('map.risk_score')}</span>
                  <span className="font-black text-rose-400 text-sm">{selectedCow.riskScore} / 100</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400">{t('map.last_yield')}</span>
                  <span className="text-white font-bold">{selectedCow.lastYield} L</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">GPS</span>
                  <span className="font-mono text-[10px] text-slate-400">
                    {selectedCow.lat.toFixed(5)}, {selectedCow.lng.toFixed(5)}
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-5 space-y-2">
                <button
                  onClick={() => onNavigate && onNavigate('cow-detail', { cowId: selectedCow.id })}
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold py-2 text-xs transition-all shadow-lg shadow-rose-600/30 cursor-pointer"
                >
                  <Stethoscope className="h-3.5 w-3.5" />
                  <span>{t('map.view_cow')}</span>
                </button>
                <button
                  onClick={() => onNavigate && onNavigate('live-milking', { cowCode: selectedCow.cowCode })}
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-2 text-xs border border-slate-700 transition-all cursor-pointer"
                >
                  <Milk className="h-3.5 w-3.5 text-cyan-400" />
                  <span>{t('map.simulate_milking')}</span>
                </button>
              </div>
            </div>
          ) : selectedZone ? (
            <div className="glass-panel rounded-2xl p-5 border border-red-500/60 shadow-2xl relative overflow-hidden bg-gradient-to-b from-red-950/40 to-slate-900">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">
                🚨 {language === 'ta' ? 'கிராம ஆபத்து மண்டலம்' : 'VILLAGE DANGER CLUSTER'}
              </span>
              <h3 className="text-base font-black text-white mt-1">
                {language === 'ta' && selectedZone.nameTa ? selectedZone.nameTa : selectedZone.name}
              </h3>
              <p className="mt-1 text-[11px] text-slate-300">
                📍 {language === 'ta' && selectedZone.villageTa ? selectedZone.villageTa : selectedZone.village}
              </p>
              <div className="mt-3 p-3 rounded-xl bg-slate-900/80 border border-red-800/60 text-xs text-rose-200">
                {selectedZone.details}
              </div>
            </div>
          ) : (
            <div className="glass-panel rounded-2xl p-5 text-center text-slate-400 text-xs border border-slate-800">
              <AlertTriangle className="h-8 w-8 text-rose-500 mx-auto mb-2 animate-bounce" />
              <p className="font-bold text-slate-200">
                {language === 'ta' ? 'வரைபடத்தில் ஆபத்தான மாடு அல்லது பகுதியை தேர்வு செய்க' : 'Select a Danger Pin or Village Zone'}
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                {language === 'ta'
                  ? 'சிவப்பு எச்சரிக்கை புள்ளிகளை கிளிக் செய்து நேரலை தொற்றுநோய் விவரங்களை பார்வையிடலாம்.'
                  : 'Click on any red danger pin to inspect acute mastitis infection risk.'}
              </p>
            </div>
          )}

          {/* High Risk Hotspots List */}
          <div className="glass-panel rounded-2xl p-4 border border-rose-900/40">
            <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 mb-3 flex items-center justify-between">
              <span>{language === 'ta' ? 'தீவிர ஆபத்து மாடுகள்' : 'Critical Risk Cattle'}</span>
              <span className="rounded-full bg-rose-950 px-2 py-0.5 text-[9px] text-rose-300 font-mono font-bold">
                {mapData?.cows.filter(c => c.riskLevel === 'CRITICAL' || c.riskLevel === 'HIGH').length || 0}
              </span>
            </h4>

            <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
              {mapData?.cows
                .filter((c) => c.riskLevel === 'CRITICAL' || c.riskLevel === 'HIGH')
                .map((cow) => (
                  <button
                    key={cow.id}
                    onClick={() => handleFocusCow(cow)}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-all cursor-pointer ${
                      selectedCow?.id === cow.id
                        ? 'bg-rose-950/80 border border-rose-500 text-white'
                        : 'bg-slate-900/60 hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse" />
                      <div>
                        <div className="font-bold text-white">{cow.name}</div>
                        <div className="text-[10px] text-rose-300 font-mono">{cow.cowCode}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-xs font-black text-rose-400">{cow.riskScore}</div>
                      <div className="text-[9px] text-slate-500">Quarantine</div>
                    </div>
                  </button>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
