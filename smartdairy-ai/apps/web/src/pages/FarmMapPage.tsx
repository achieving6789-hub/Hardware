import React, { useEffect, useState, useRef } from 'react';
import { api } from '../api/client';
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
  Maximize2,
  Stethoscope,
  Radio,
  Milk,
  Building2,
  Navigation
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
  type: string;
  color: string;
  polygon: [number, number][];
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
  details: string;
}

interface FarmMapData {
  farm: {
    id: string;
    name: string;
    location: string;
    center: [number, number];
    zoom: number;
    totalCows: number;
    criticalCows: number;
    moderateCows: number;
    healthyCows: number;
  };
  zones: GeoZone[];
  facilities: GeoFacility[];
  cows: GeoCow[];
}

export const FarmMapPage: React.FC<{ onNavigate?: (page: string, params?: any) => void }> = ({ onNavigate }) => {
  const { language, t } = useLanguage();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const zonesLayerRef = useRef<L.LayerGroup | null>(null);

  const [mapData, setMapData] = useState<FarmMapData | null>(null);
  const [selectedCow, setSelectedCow] = useState<GeoCow | null>(null);
  const [riskFilter, setRiskFilter] = useState<'ALL' | 'CRITICAL' | 'MODERATE' | 'LOW'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLiveGps, setIsLiveGps] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

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

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current || !mapData) return;

    const center = mapData.farm.center;
    const map = L.map(mapContainerRef.current, {
      center: center,
      zoom: 18,
      maxZoom: 20,
      minZoom: 16,
      zoomControl: false
    });

    // Dark styled tile layer for high contrast UI
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors | SmartDairy AI SIH',
      maxZoom: 20
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Create layer groups
    const zonesGroup = L.layerGroup().addTo(map);
    const markersGroup = L.layerGroup().addTo(map);

    zonesLayerRef.current = zonesGroup;
    markersLayerRef.current = markersGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [mapData]);

  // Render Zones & Facilities
  useEffect(() => {
    const map = mapInstanceRef.current;
    const zonesGroup = zonesLayerRef.current;
    if (!map || !zonesGroup || !mapData) return;

    zonesGroup.clearLayers();

    // Render Farm Zones (Polygons)
    mapData.zones.forEach((zone) => {
      const zoneName = language === 'ta' && zone.nameTa ? zone.nameTa : language === 'hi' && zone.nameHi ? zone.nameHi : zone.name;
      const polygon = L.polygon(zone.polygon, {
        color: zone.color,
        fillColor: zone.color,
        fillOpacity: 0.15,
        weight: 2,
        dashArray: '4, 4'
      });

      polygon.bindTooltip(`<b>${zoneName}</b>`, {
        permanent: false,
        direction: 'center',
        className: 'bg-slate-900/90 text-cyan-300 text-xs px-2 py-1 rounded border border-cyan-500/40 shadow-lg'
      });

      polygon.addTo(zonesGroup);
    });

    // Render Facilities (Milking Station STN-01, Bulk Tank, CIP, Clinic)
    mapData.facilities.forEach((fac) => {
      const facName = language === 'ta' && fac.nameTa ? fac.nameTa : language === 'hi' && fac.nameHi ? fac.nameHi : fac.name;
      const getIconHtml = () => {
        if (fac.type === 'MILKING_STATION') return `<div class="flex items-center justify-center h-8 w-8 rounded-full bg-cyan-500 border-2 border-white shadow-lg text-white font-bold text-sm shadow-cyan-500/50">🥛</div>`;
        if (fac.type === 'BULK_TANK') return `<div class="flex items-center justify-center h-8 w-8 rounded-full bg-indigo-600 border-2 border-white shadow-lg text-white font-bold text-sm shadow-indigo-600/50">🛢️</div>`;
        if (fac.type === 'CIP_STATION') return `<div class="flex items-center justify-center h-8 w-8 rounded-full bg-blue-500 border-2 border-white shadow-lg text-white font-bold text-sm shadow-blue-500/50">🚿</div>`;
        return `<div class="flex items-center justify-center h-8 w-8 rounded-full bg-rose-600 border-2 border-white shadow-lg text-white font-bold text-sm shadow-rose-600/50">🏥</div>`;
      };

      const icon = L.divIcon({
        className: 'custom-facility-pin',
        html: getIconHtml(),
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const marker = L.marker([fac.lat, fac.lng], { icon });
      marker.bindPopup(`
        <div style="font-family: inherit; min-width: 180px; color: #0f172a; padding: 4px;">
          <h4 style="font-weight: bold; margin: 0 0 4px 0; color: #0284c7; font-size: 13px;">${facName}</h4>
          <div style="font-size: 11px; margin-bottom: 4px; color: #475569;">${fac.details}</div>
          <span style="font-size: 10px; background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 9999px; font-weight: bold;">
            STATUS: ${fac.status}
          </span>
        </div>
      `);
      marker.addTo(zonesGroup);
    });
  }, [mapData, language]);

  // Render Cattle Pins with Risk Color Coding
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    if (!map || !markersGroup || !mapData) return;

    markersGroup.clearLayers();

    // Filter cows based on UI state
    const filteredCows = mapData.cows.filter((cow) => {
      const matchesSearch =
        cow.cowCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cow.rfidTag.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (riskFilter === 'ALL') return true;
      if (riskFilter === 'CRITICAL') return cow.riskLevel === 'CRITICAL' || cow.riskLevel === 'HIGH';
      if (riskFilter === 'MODERATE') return cow.riskLevel === 'MODERATE';
      if (riskFilter === 'LOW') return cow.riskLevel === 'LOW';
      return true;
    });

    filteredCows.forEach((cow) => {
      const isCritical = cow.riskLevel === 'CRITICAL' || cow.riskLevel === 'HIGH';
      const isModerate = cow.riskLevel === 'MODERATE';

      const pinBg = isCritical
        ? 'bg-rose-500 border-rose-200 ring-4 ring-rose-500/40 animate-pulse'
        : isModerate
        ? 'bg-amber-500 border-amber-200 ring-2 ring-amber-500/30'
        : 'bg-emerald-500 border-emerald-100 ring-1 ring-emerald-500/30';

      const iconHtml = `
        <div class="relative flex items-center justify-center cursor-pointer group">
          <div class="h-7 w-7 rounded-full ${pinBg} border-2 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-125">
            <span class="text-xs font-bold">${isCritical ? '⚠️' : '🐄'}</span>
          </div>
          <div class="absolute -bottom-5 whitespace-nowrap bg-slate-900/90 text-[10px] text-white font-semibold px-1.5 py-0.5 rounded shadow pointer-events-none border border-slate-700">
            ${cow.cowCode}
          </div>
        </div>
      `;

      const icon = L.divIcon({
        className: 'custom-cow-pin',
        html: iconHtml,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const marker = L.marker([cow.lat, cow.lng], { icon });

      marker.on('click', () => {
        setSelectedCow(cow);
        map.panTo([cow.lat, cow.lng], { animate: true });
      });

      marker.addTo(markersGroup);
    });
  }, [mapData, riskFilter, searchQuery]);

  // Live GPS movement simulation
  useEffect(() => {
    if (!isLiveGps || !mapData) return;

    const interval = setInterval(() => {
      setMapData((prev) => {
        if (!prev) return null;
        const updatedCows = prev.cows.map((cow) => {
          // Subtle drifting movement to reflect live GPS grazing / moving in stall
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
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([cow.lat, cow.lng], 19, { animate: true });
    }
  };

  const handleResetView = () => {
    if (mapInstanceRef.current && mapData) {
      mapInstanceRef.current.setView(mapData.farm.center, 18, { animate: true });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <MapPin className="h-6 w-6 text-cyan-400" />
              <span>{t('map.title')}</span>
            </h1>
            <span className="rounded-full bg-cyan-950 border border-cyan-500/40 px-2.5 py-0.5 text-xs text-cyan-300 font-mono">
              GPS 11.0168° N, 76.9558° E
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            {t('map.subtitle')}
          </p>
        </div>

        {/* Live GPS controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsLiveGps(!isLiveGps)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
              isLiveGps
                ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            <Radio className={`h-3.5 w-3.5 ${isLiveGps ? 'text-emerald-400 animate-pulse' : ''}`} />
            <span>{isLiveGps ? 'Live GPS Active' : 'Live GPS Paused'}</span>
          </button>

          <button
            onClick={handleResetView}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-all"
            title="Reset Map Center"
          >
            <Compass className="h-3.5 w-3.5 text-cyan-400" />
            <span>Center Farm</span>
          </button>

          <button
            onClick={fetchMapData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-all"
            title="Refresh GPS Locations"
          >
            <RefreshCw className="h-3.5 w-3.5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Overview Stat Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          onClick={() => setRiskFilter('ALL')}
          className={`cursor-pointer rounded-2xl p-4 border transition-all ${
            riskFilter === 'ALL'
              ? 'bg-cyan-950/40 border-cyan-500 ring-1 ring-cyan-500'
              : 'glass-panel hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{t('map.total_herd')}</span>
            <Building2 className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-white">{mapData?.farm.totalCows ?? 30}</div>
          <div className="mt-1 text-[11px] text-cyan-400 font-medium">Full Monitored Herd</div>
        </div>

        <div
          onClick={() => setRiskFilter('CRITICAL')}
          className={`cursor-pointer rounded-2xl p-4 border transition-all ${
            riskFilter === 'CRITICAL'
              ? 'bg-rose-950/40 border-rose-500 ring-1 ring-rose-500'
              : 'glass-panel hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-rose-300">
            <span>{t('map.critical_risk')}</span>
            <AlertTriangle className="h-4 w-4 text-rose-400 animate-pulse" />
          </div>
          <div className="mt-2 text-2xl font-black text-rose-400">{mapData?.farm.criticalCows ?? 4}</div>
          <div className="mt-1 text-[11px] text-rose-300 font-medium">In Isolation / Alert</div>
        </div>

        <div
          onClick={() => setRiskFilter('MODERATE')}
          className={`cursor-pointer rounded-2xl p-4 border transition-all ${
            riskFilter === 'MODERATE'
              ? 'bg-amber-950/40 border-amber-500 ring-1 ring-amber-500'
              : 'glass-panel hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-amber-300">
            <span>{t('map.moderate_risk')}</span>
            <Activity className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-amber-400">{mapData?.farm.moderateCows ?? 6}</div>
          <div className="mt-1 text-[11px] text-amber-300 font-medium">Watchlist at Milking</div>
        </div>

        <div
          onClick={() => setRiskFilter('LOW')}
          className={`cursor-pointer rounded-2xl p-4 border transition-all ${
            riskFilter === 'LOW'
              ? 'bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500'
              : 'glass-panel hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-emerald-300">
            <span>{t('map.healthy_herd')}</span>
            <CheckCircle className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-400">{mapData?.farm.healthyCows ?? 20}</div>
          <div className="mt-1 text-[11px] text-emerald-300 font-medium">Grazing & Stall Pens</div>
        </div>
      </div>

      {/* Main Map & Cattle Drawer Container */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Real Interactive Leaflet Map */}
        <div className="lg:col-span-3 glass-panel rounded-2xl p-3 flex flex-col relative overflow-hidden shadow-2xl border border-slate-800">
          {/* Map filter & search overlay bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3 px-2">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search cow (e.g. Ganga, COW-004)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl bg-slate-900/90 border border-slate-700 pl-9 pr-4 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                <Filter className="h-3 w-3" /> Filter:
              </span>
              {(['ALL', 'CRITICAL', 'MODERATE', 'LOW'] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setRiskFilter(lvl)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                    riskFilter === lvl
                      ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Leaflet DOM container */}
          <div
            ref={mapContainerRef}
            className="w-full h-[540px] rounded-xl overflow-hidden z-10 border border-slate-700/80 bg-slate-900"
          />

          {/* Map legend bottom overlay */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-2 text-[11px] text-slate-400">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-rose-500 border border-white animate-pulse" />
                <span>Critical / Mastitis Risk (Quarantine)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-amber-500 border border-white" />
                <span>Moderate Risk (Observation)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-emerald-500 border border-white" />
                <span>Low Risk / Healthy (Grazing)</span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-slate-500">
              <span>🥛 STN-01 Parlor</span>
              <span>🛢️ Bulk Tank</span>
              <span>🚿 CIP Unit</span>
              <span>🏥 Vet Clinic</span>
            </div>
          </div>
        </div>

        {/* Selected Cow Telemetry & Cattle List Sidebar */}
        <div className="space-y-4">
          {/* Selected Cow Card */}
          {selectedCow ? (
            <div className="glass-panel rounded-2xl p-5 border border-cyan-500/50 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400">
                    {selectedCow.cowCode}
                  </span>
                  <h3 className="text-lg font-black text-white">{selectedCow.name}</h3>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                    selectedCow.riskLevel === 'CRITICAL' || selectedCow.riskLevel === 'HIGH'
                      ? 'bg-rose-950 text-rose-300 border border-rose-600'
                      : selectedCow.riskLevel === 'MODERATE'
                      ? 'bg-amber-950 text-amber-300 border border-amber-600'
                      : 'bg-emerald-950 text-emerald-300 border border-emerald-600'
                  }`}
                >
                  {selectedCow.riskLevel}
                </span>
              </div>

              <div className="mt-4 space-y-2.5 text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400">{t('map.rfid_tag')}</span>
                  <span className="font-mono text-slate-200">{selectedCow.rfidTag}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400">Breed</span>
                  <span className="text-slate-200">{selectedCow.breed}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400">Current Zone</span>
                  <span className="text-cyan-400 font-semibold">{selectedCow.zoneName}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400">{t('map.risk_score')}</span>
                  <span
                    className={`font-black ${
                      selectedCow.riskScore > 60
                        ? 'text-rose-400'
                        : selectedCow.riskScore > 35
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {selectedCow.riskScore} / 100
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400">{t('map.last_yield')}</span>
                  <span className="text-white font-bold">{selectedCow.lastYield} L</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">GPS Coordinates</span>
                  <span className="font-mono text-[11px] text-slate-400">
                    {selectedCow.lat.toFixed(5)}, {selectedCow.lng.toFixed(5)}
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-5 space-y-2">
                <button
                  onClick={() => onNavigate && onNavigate('cow-detail', { cowId: selectedCow.id })}
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-2 text-xs transition-all shadow-md shadow-cyan-600/30"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>{t('map.view_cow')}</span>
                </button>

                <button
                  onClick={() => onNavigate && onNavigate('live-milking', { cowCode: selectedCow.cowCode })}
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-2 text-xs border border-slate-700 transition-all"
                >
                  <Milk className="h-3.5 w-3.5 text-cyan-400" />
                  <span>{t('map.simulate_milking')}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="glass-panel rounded-2xl p-5 text-center text-slate-400 text-xs">
              <Navigation className="h-8 w-8 text-cyan-400 mx-auto mb-2 animate-bounce" />
              <p className="font-semibold text-slate-200">Select any Cattle Pin on the Map</p>
              <p className="mt-1 text-[11px] text-slate-500">
                Click any cattle pin or select from the list below to view live telemetry and risk status.
              </p>
            </div>
          )}

          {/* Quick Cattle Picker List */}
          <div className="glass-panel rounded-2xl p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
              <span>Herd Quick Locator</span>
              <span className="text-[10px] text-cyan-400 font-mono">
                {mapData?.cows.length || 0} Cows
              </span>
            </h4>

            <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
              {mapData?.cows.slice(0, 15).map((cow) => (
                <button
                  key={cow.id}
                  onClick={() => handleFocusCow(cow)}
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-all ${
                    selectedCow?.id === cow.id
                      ? 'bg-cyan-950/60 border border-cyan-500/60 text-white'
                      : 'bg-slate-900/60 hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        cow.riskLevel === 'CRITICAL' || cow.riskLevel === 'HIGH'
                          ? 'bg-rose-500 animate-pulse'
                          : cow.riskLevel === 'MODERATE'
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                    />
                    <div>
                      <div className="font-semibold text-white">{cow.name}</div>
                      <div className="text-[10px] text-slate-400">{cow.cowCode}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`font-mono text-[11px] font-bold ${
                        cow.riskScore > 60
                          ? 'text-rose-400'
                          : cow.riskScore > 35
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {cow.riskScore}
                    </div>
                    <div className="text-[9px] text-slate-500">{cow.zoneName.split(' ')[0]}</div>
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
