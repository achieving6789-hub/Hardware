import React, { useEffect, useState, useRef } from 'react';
import { api } from '../api/client';
import { getSocket } from '../api/socket';
import {
  Activity,
  Play,
  Square,
  Pause,
  RotateCcw,
  Radio,
  AlertTriangle,
  Zap,
  CheckCircle,
  HelpCircle,
  Flame,
  Thermometer,
  Droplet,
  Layers,
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import {
  SessionStatus,
  PROTOTYPE_DISCLAIMER,
  DEMO_DATA_NOTICE
} from '@smartdairy/shared';

interface LiveMilkingPageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const LiveMilkingPage: React.FC<LiveMilkingPageProps> = ({ onNavigate }) => {
  const [stationState, setStationState] = useState<any>({
    status: SessionStatus.IDLE,
    scannedTagUid: null,
    identifiedCowId: null,
    identifiedCowCode: null,
    identifiedCowName: null,
    elapsedSeconds: 0
  });

  const [activeSession, setActiveSession] = useState<any>(null);
  const [liveTelemetry, setLiveTelemetry] = useState({
    flowRate: 0,
    totalVolume: 0,
    temperature: 38.5,
    conductivity: 5.58,
    ph: 6.65,
    scc: 110,
    quality: 'GOOD',
    riskScore: 12,
    riskLevel: 'LOW'
  });

  const [chartData, setChartData] = useState<any[]>([]);
  const [sensorHealth, setSensorHealth] = useState({
    somaDetect: 'ONLINE',
    foodmag: 'ONLINE',
    phSensor: 'ONLINE',
    rfid: 'ONLINE'
  });

  const [cowsList, setCowsList] = useState<any[]>([]);
  const [selectedCowCode, setSelectedCowCode] = useState('COW-001');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [lastFinishedPrediction, setLastFinishedPrediction] = useState<any>(null);

  // Fetch initial state & cattle list
  useEffect(() => {
    async function init() {
      try {
        const [liveRes, cowsRes] = await Promise.all([
          api.getLiveSession(),
          api.getCows()
        ]);

        if (liveRes.success) {
          setStationState(liveRes.stationState || {});
          if (liveRes.activeSession) {
            setActiveSession(liveRes.activeSession);
          }
          if (liveRes.latestReadings && liveRes.latestReadings.length > 0) {
            const formatted = liveRes.latestReadings.map((r: any, idx: number) => ({
              time: idx * 2,
              flowRate: r.flowRate,
              scc: r.scc,
              conductivity: r.conductivity,
              ph: r.ph,
              totalVolume: r.totalVolume
            }));
            setChartData(formatted);
            const last = liveRes.latestReadings[liveRes.latestReadings.length - 1];
            setLiveTelemetry({
              flowRate: last.flowRate,
              totalVolume: last.totalVolume,
              temperature: last.temperature,
              conductivity: last.conductivity,
              ph: last.ph,
              scc: last.scc,
              quality: last.dataQuality || 'GOOD',
              riskScore: 15,
              riskLevel: 'LOW'
            });
          }
        }

        if (cowsRes.success) {
          setCowsList(cowsRes.cows || []);
        }
      } catch (err) {
        console.error('Error fetching live milking data:', err);
      }
    }
    init();
  }, []);

  // Listen to live WebSocket telemetry
  useEffect(() => {
    const socket = getSocket();

    const onSensorReading = (data: any) => {
      const r = data.reading;
      if (!r) return;

      // Update live gauges
      setLiveTelemetry({
        flowRate: r.flowRate,
        totalVolume: r.totalVolume,
        temperature: r.temperature,
        conductivity: r.conductivity,
        ph: r.ph,
        scc: r.scc,
        quality: r.overallQuality || 'GOOD',
        riskScore: r.scc > 400 || r.conductivity > 6.5 ? 78 : r.scc > 200 ? 45 : 12,
        riskLevel: r.scc > 400 || r.conductivity > 6.5 ? 'HIGH' : r.scc > 200 ? 'MODERATE' : 'LOW'
      });

      // Update chart buffer (keep last 40 ticks)
      setChartData((prev) => {
        const next = [
          ...prev,
          {
            time: r.elapsedSeconds,
            flowRate: r.flowRate,
            scc: r.scc,
            conductivity: r.conductivity,
            ph: r.ph,
            totalVolume: r.totalVolume
          }
        ];
        if (next.length > 50) return next.slice(next.length - 50);
        return next;
      });

      setStationState((prev: any) => ({
        ...prev,
        status: SessionStatus.MILKING,
        elapsedSeconds: r.elapsedSeconds
      }));
    };

    const onRfidDetected = (data: any) => {
      setStatusMessage(`RFID Read: ${data.tagUid} -> ${data.cow ? data.cow.cowCode : 'UNKNOWN'}`);
      setStationState((prev: any) => ({
        ...prev,
        scannedTagUid: data.tagUid,
        identifiedCowId: data.cow?.id || null,
        identifiedCowCode: data.cow?.cowCode || null,
        identifiedCowName: data.cow?.name || null,
        status: data.cow ? SessionStatus.READY : SessionStatus.UNIDENTIFIED
      }));
    };

    const onSessionStarted = (data: any) => {
      setActiveSession(data);
      setLastFinishedPrediction(null);
      setChartData([]);
      setStationState((prev: any) => ({
        ...prev,
        activeSessionId: data.id,
        status: data.status,
        identifiedCowCode: data.cow?.cowCode,
        identifiedCowName: data.cow?.name
      }));
      setStatusMessage(`Milking session started for ${data.cow?.cowCode || 'Animal'}`);
    };

    const onSessionCompleted = (data: any) => {
      setStationState((prev: any) => ({
        ...prev,
        status: SessionStatus.IDLE,
        activeSessionId: null,
        elapsedSeconds: 0
      }));
      setActiveSession(null);
      if (data.predictions && data.predictions.length > 0) {
        setLastFinishedPrediction(data.predictions[0]);
      }
      setStatusMessage(`Session completed! Harvested: ${data.totalVolume} L. AI Risk: ${data.riskLevel}`);
    };

    const onSensorStatus = (data: any) => {
      if (data.sensors) {
        setSensorHealth((prev) => ({ ...prev, ...data.sensors }));
      }
    };

    socket.on('sensor:reading', onSensorReading);
    socket.on('rfid:detected', onRfidDetected);
    socket.on('session:started', onSessionStarted);
    socket.on('session:completed', onSessionCompleted);
    socket.on('sensor:status', onSensorStatus);

    return () => {
      socket.off('sensor:reading', onSensorReading);
      socket.off('rfid:detected', onRfidDetected);
      socket.off('session:started', onSessionStarted);
      socket.off('session:completed', onSessionCompleted);
      socket.off('sensor:status', onSensorStatus);
    };
  }, []);

  // Format Elapsed Time MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Actions
  const handleScanRfid = async (cowCode: string) => {
    setStatusMessage(`Scanning RFID for ${cowCode}...`);
    try {
      const cow = cowsList.find((c) => c.cowCode === cowCode);
      const tagUid = cow ? cow.rfidId : 'RFID-982701';
      await api.scanRfid({
        tagUid,
        readerId: 'RFID-RDR-01'
      });
    } catch (err: any) {
      setStatusMessage(err.message);
    }
  };

  const handleStartMilking = async () => {
    setStatusMessage('Starting shared inline sensors...');
    try {
      await api.startSimulation(undefined, selectedCowCode);
    } catch (err: any) {
      setStatusMessage(err.message);
    }
  };

  const handlePauseMilking = async () => {
    try {
      await api.pauseSimulation();
      setStatusMessage('Milking cluster flow paused.');
    } catch (err: any) {
      setStatusMessage(err.message);
    }
  };

  const handleResumeMilking = async () => {
    try {
      await api.resumeSimulation();
      setStatusMessage('Milking resumed.');
    } catch (err: any) {
      setStatusMessage(err.message);
    }
  };

  const handleEndMilking = async () => {
    setStatusMessage('Stopping milking and running AI mastitis-risk engine...');
    try {
      const res = await api.stopSimulation();
      if (res.result?.riskResult) {
        setLastFinishedPrediction(res.result.riskResult);
      }
    } catch (err: any) {
      setStatusMessage(err.message);
    }
  };

  const handleRunDemoScenario = async (scenario: string) => {
    setStatusMessage(`Triggering SIH scenario: ${scenario}...`);
    try {
      const res = await api.runScenario(scenario);
      if (res.result?.message) {
        setStatusMessage(res.result.message);
      }
    } catch (err: any) {
      setStatusMessage(err.message);
    }
  };

  const handleAssignCow = async (cowId: string) => {
    if (!stationState.activeSessionId) return;
    try {
      await api.assignCowToSession(stationState.activeSessionId, cowId);
      setStatusMessage('Cow assigned successfully to session.');
    } catch (err: any) {
      setStatusMessage(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Simulator Notice */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel rounded-2xl p-6 border-cyan-500/20 bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span>Live Shared Milking Sensor Line</span>
            </h1>
            <span className="rounded-full bg-cyan-950 border border-cyan-700/80 px-2.5 py-0.5 text-[10px] font-bold text-cyan-300">
              STN-01 (Line Alpha)
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time inline telemetry: SomaDetect optical SCC + ifm Foodmag flow & EC + Mettler Toledo InPro pH.
          </p>
          <div className="mt-2 flex items-center gap-2 text-[11px] text-cyan-400 font-medium">
            <Sparkles className="h-3.5 w-3.5" />
            <span>{DEMO_DATA_NOTICE}</span>
          </div>
        </div>

        {/* State Machine Status & Session Timer */}
        <div className="flex items-center gap-4">
          <div className="rounded-xl bg-slate-950 border border-slate-800 p-3 text-center min-w-[120px]">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Line State</div>
            <div
              className={`text-sm font-black mt-0.5 ${
                stationState.status === SessionStatus.MILKING
                  ? 'text-emerald-400 animate-pulse'
                  : stationState.status === SessionStatus.READY
                  ? 'text-cyan-400'
                  : stationState.status === SessionStatus.UNIDENTIFIED
                  ? 'text-amber-400'
                  : 'text-slate-300'
              }`}
            >
              {stationState.status}
            </div>
          </div>

          <div className="rounded-xl bg-slate-950 border border-slate-800 p-3 text-center min-w-[110px]">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Session Clock</div>
            <div className="text-sm font-mono font-black text-cyan-300 mt-0.5">
              {formatTime(stationState.elapsedSeconds || 0)}
            </div>
          </div>
        </div>
      </div>

      {statusMessage && (
        <div className="flex items-center gap-2 rounded-xl bg-cyan-950/40 border border-cyan-800/80 p-3 text-xs text-cyan-200">
          <Activity className="h-4 w-4 shrink-0 text-cyan-400 animate-spin" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Row 1: Identification & Milking Controls */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* RFID & Cow Identification Box */}
        <div className="glass-panel rounded-2xl p-5 border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Radio className="h-4 w-4 text-cyan-400" />
              <span>RFID Stall Identification</span>
            </h2>
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                stationState.identifiedCowCode ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {stationState.identifiedCowCode ? 'IDENTIFIED' : 'WAITING'}
            </span>
          </div>

          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
              <div className="text-[11px] text-slate-400">Transponder UID:</div>
              <div className="font-mono text-xs font-bold text-cyan-400">
                {stationState.scannedTagUid || 'No tag in field'}
              </div>
              <div className="mt-2 text-[11px] text-slate-400">Identified Cattle:</div>
              <div className="text-sm font-bold text-slate-100">
                {stationState.identifiedCowCode ? (
                  <span>
                    {stationState.identifiedCowCode} — {stationState.identifiedCowName}
                  </span>
                ) : stationState.status === SessionStatus.UNIDENTIFIED ? (
                  <span className="text-amber-400 font-bold">⚠️ UNIDENTIFIED ANIMAL</span>
                ) : (
                  <span className="text-slate-500 font-normal">Awaiting entry scan</span>
                )}
              </div>
            </div>

            {/* If Unidentified Session, show manual assignment dropdown */}
            {stationState.status === SessionStatus.UNIDENTIFIED && (
              <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/80">
                <div className="text-xs font-bold text-amber-300 mb-1">
                  Operator Action: Assign Cow
                </div>
                <div className="flex gap-2">
                  <select
                    className="w-full rounded-lg bg-slate-900 border border-slate-700 px-2.5 py-1.5 text-xs text-white"
                    onChange={(e) => handleAssignCow(e.target.value)}
                  >
                    <option value="">Select Cow...</option>
                    {cowsList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.cowCode} ({c.name})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Quick Virtual RFID Scan Controls */}
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Simulate Animal Entrance Scan
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleScanRfid('COW-001')}
                  className="rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 px-2 py-1.5 text-[11px] font-semibold text-emerald-400 text-center"
                >
                  COW-001 (Normal)
                </button>
                <button
                  onClick={() => handleScanRfid('COW-021')}
                  className="rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 px-2 py-1.5 text-[11px] font-semibold text-amber-400 text-center"
                >
                  COW-021 (Mod)
                </button>
                <button
                  onClick={() => handleScanRfid('COW-026')}
                  className="rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 px-2 py-1.5 text-[11px] font-semibold text-rose-400 text-center"
                >
                  COW-026 (High)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Milking Cluster Workflow Controls */}
        <div className="glass-panel rounded-2xl p-5 border-slate-800">
          <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
            <Zap className="h-4 w-4 text-cyan-400" />
            <span>Milking Cluster Controls</span>
          </h2>
          <p className="text-xs text-slate-400 mb-4">
            Operator commands to engage teat-cup cluster, start pump, and trigger inline sensing suite.
          </p>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              onClick={handleStartMilking}
              disabled={stationState.status === SessionStatus.MILKING}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-500 hover:to-teal-400 transition-all disabled:opacity-40"
            >
              <Play className="h-4 w-4 fill-current" />
              <span>START MILKING</span>
            </button>

            <button
              onClick={handleEndMilking}
              disabled={stationState.status !== SessionStatus.MILKING && stationState.status !== SessionStatus.PAUSED}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 py-3 text-xs font-bold text-white shadow-lg shadow-rose-500/20 hover:from-rose-500 hover:to-red-500 transition-all disabled:opacity-40"
            >
              <Square className="h-4 w-4 fill-current" />
              <span>END MILKING</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handlePauseMilking}
              disabled={stationState.status !== SessionStatus.MILKING}
              className="flex items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 py-2 text-xs font-semibold text-slate-200 disabled:opacity-40"
            >
              <Pause className="h-3.5 w-3.5" />
              <span>PAUSE FLOW</span>
            </button>

            <button
              onClick={handleResumeMilking}
              disabled={stationState.status !== SessionStatus.PAUSED}
              className="flex items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 py-2 text-xs font-semibold text-slate-200 disabled:opacity-40"
            >
              <Play className="h-3.5 w-3.5" />
              <span>RESUME</span>
            </button>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Auto-Detach Sensor:</span>
            <span className="font-semibold text-emerald-400">ENABLED (At Flow &lt; 0.15 L/min)</span>
          </div>
        </div>

        {/* Live Multi-Factor AI Risk Gauge */}
        <div className="glass-panel rounded-2xl p-5 border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-cyan-400" />
                <span>AI Mastitis Early-Warning Risk</span>
              </h2>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                  liveTelemetry.riskLevel === 'HIGH' || liveTelemetry.riskLevel === 'VERY_HIGH'
                    ? 'bg-rose-950 text-rose-300 border border-rose-800 animate-pulse'
                    : liveTelemetry.riskLevel === 'MODERATE'
                    ? 'bg-amber-950 text-amber-300 border border-amber-800'
                    : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                }`}
              >
                {liveTelemetry.riskLevel}
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Multi-parameter weighted model comparing against individual cow historical baseline.
            </p>

            <div className="text-center py-2">
              <div className="text-4xl font-black tracking-tight text-white">
                {liveTelemetry.riskScore}
                <span className="text-xs text-slate-400 font-normal"> / 100</span>
              </div>
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden mt-3">
                <div
                  className={`h-full transition-all duration-500 ${
                    liveTelemetry.riskScore >= 60
                      ? 'bg-rose-500'
                      : liveTelemetry.riskScore >= 30
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${liveTelemetry.riskScore}%` }}
                />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 text-[10px] text-slate-400">
            {PROTOTYPE_DISCLAIMER}
          </div>
        </div>
      </div>

      {/* Row 2: Live Hardware Sensor Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
        {/* Flow Rate */}
        <div className="glass-panel rounded-xl p-4 border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-semibold uppercase">Milk Flow Rate</span>
            <Droplet className="h-3.5 w-3.5 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {liveTelemetry.flowRate} <span className="text-xs font-normal text-slate-400">L/min</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            ifm SM Foodmag (Magnetic)
          </div>
        </div>

        {/* Total Volume */}
        <div className="glass-panel rounded-xl p-4 border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-semibold uppercase">Cumulative Volume</span>
            <Layers className="h-3.5 w-3.5 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-cyan-300">
            {liveTelemetry.totalVolume} <span className="text-xs font-normal text-slate-400">L</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Integral (flow × dt)
          </div>
        </div>

        {/* Optical SCC */}
        <div className="glass-panel rounded-xl p-4 border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-semibold uppercase">Somatic Cell Count</span>
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
          </div>
          <div className={`text-2xl font-black ${liveTelemetry.scc > 350 ? 'text-rose-400' : 'text-white'}`}>
            {liveTelemetry.scc} <span className="text-xs font-normal text-slate-400">k/mL</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            SomaDetect Optical Analyzer
          </div>
        </div>

        {/* Electrical Conductivity */}
        <div className="glass-panel rounded-xl p-4 border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-semibold uppercase">Conductivity (EC)</span>
            <Zap className="h-3.5 w-3.5 text-amber-400" />
          </div>
          <div className={`text-2xl font-black ${liveTelemetry.conductivity > 6.4 ? 'text-rose-400' : 'text-white'}`}>
            {liveTelemetry.conductivity} <span className="text-xs font-normal text-slate-400">mS/cm</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Foodmag Inline Conductance
          </div>
        </div>

        {/* pH Sensor */}
        <div className="glass-panel rounded-xl p-4 border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-semibold uppercase">Milk Line pH</span>
            <Flame className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <div className={`text-2xl font-black ${liveTelemetry.ph > 6.9 ? 'text-rose-400' : 'text-white'}`}>
            {liveTelemetry.ph} <span className="text-xs font-normal text-slate-400">pH</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Mettler Toledo InPro X1
          </div>
        </div>

        {/* Milk Temperature */}
        <div className="glass-panel rounded-xl p-4 border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-semibold uppercase">Temperature</span>
            <Thermometer className="h-3.5 w-3.5 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {liveTelemetry.temperature} <span className="text-xs font-normal text-slate-400">°C</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Pt1000 RTD Sensor
          </div>
        </div>
      </div>

      {/* Row 3: Real-Time Animated Telemetry Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Milking Flow Curve */}
        <div className="glass-panel rounded-2xl p-5 border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="h-4 w-4 text-cyan-400" />
                <span>Real-Time Milk Flow Curve (L/min)</span>
              </h2>
              <p className="text-xs text-slate-400">Dynamic ramp-up, peak plateau, and auto-detach decline</p>
            </div>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} unit="s" />
                <YAxis stroke="#64748b" fontSize={11} domain={[0, 5]} unit=" L/m" />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                <Line type="monotone" dataKey="flowRate" stroke="#38bdf8" strokeWidth={2} dot={false} isAnimationActive={false} name="Flow Rate (L/min)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SCC & Conductivity Dual Trend */}
        <div className="glass-panel rounded-2xl p-5 border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-400" />
                <span>Inline SCC & Electrical Conductivity Stream</span>
              </h2>
              <p className="text-xs text-slate-400">Correlation indicating tight junction disruption or subclinical mastitis</p>
            </div>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} unit="s" />
                <YAxis yAxisId="left" stroke="#f59e0b" fontSize={11} domain={[0, 800]} unit=" k" />
                <YAxis yAxisId="right" orientation="right" stroke="#10b981" fontSize={11} domain={[4.5, 8.0]} unit=" mS" />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                <Line yAxisId="left" type="monotone" dataKey="scc" stroke="#f59e0b" strokeWidth={2} dot={false} isAnimationActive={false} name="SCC (k/mL)" />
                <Line yAxisId="right" type="monotone" dataKey="conductivity" stroke="#10b981" strokeWidth={2} dot={false} isAnimationActive={false} name="Conductivity (mS/cm)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 4: AI Decision Summary (If session just finished) */}
      {lastFinishedPrediction && (
        <div className="glass-panel rounded-2xl p-5 border-cyan-500/40 bg-cyan-950/20">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-cyan-300 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-cyan-400" />
              <span>AI Prediction Summary & Clinical Explanation</span>
            </h3>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                lastFinishedPrediction.riskLevel === 'HIGH' || lastFinishedPrediction.riskLevel === 'VERY_HIGH'
                  ? 'bg-rose-950 text-rose-300 border border-rose-800'
                  : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
              }`}
            >
              Risk: {lastFinishedPrediction.riskScore} ({lastFinishedPrediction.riskLevel})
            </span>
          </div>
          <p className="text-xs text-slate-200 leading-relaxed">
            {lastFinishedPrediction.explanation}
          </p>
        </div>
      )}

      {/* Row 5: Demo Quick Controls Tray */}
      <div className="glass-panel rounded-2xl p-5 border-slate-800">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          SIH Presentation Scenario Triggers
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          <button
            onClick={() => handleRunDemoScenario('NORMAL_COW')}
            className="rounded-xl border border-slate-700 bg-slate-900/80 p-2.5 text-xs font-semibold text-emerald-400 hover:border-emerald-500 hover:bg-emerald-950/20"
          >
            1. Normal Cow
          </button>
          <button
            onClick={() => handleRunDemoScenario('EARLY_WARNING')}
            className="rounded-xl border border-slate-700 bg-slate-900/80 p-2.5 text-xs font-semibold text-amber-400 hover:border-amber-500 hover:bg-amber-950/20"
          >
            2. Early Warning
          </button>
          <button
            onClick={() => handleRunDemoScenario('HIGH_RISK')}
            className="rounded-xl border border-slate-700 bg-slate-900/80 p-2.5 text-xs font-semibold text-rose-400 hover:border-rose-500 hover:bg-rose-950/20"
          >
            3. High Risk Cow
          </button>
          <button
            onClick={() => handleRunDemoScenario('RFID_MISSED')}
            className="rounded-xl border border-slate-700 bg-slate-900/80 p-2.5 text-xs font-semibold text-yellow-400 hover:border-yellow-500 hover:bg-yellow-950/20"
          >
            4. RFID Missed
          </button>
          <button
            onClick={() => handleRunDemoScenario('UNKNOWN_RFID')}
            className="rounded-xl border border-slate-700 bg-slate-900/80 p-2.5 text-xs font-semibold text-purple-400 hover:border-purple-500 hover:bg-purple-950/20"
          >
            5. Unknown Tag
          </button>
          <button
            onClick={() => handleRunDemoScenario('SENSOR_FAILURE')}
            className="rounded-xl border border-slate-700 bg-slate-900/80 p-2.5 text-xs font-semibold text-orange-400 hover:border-orange-500 hover:bg-orange-950/20"
          >
            6. Sensor Failure
          </button>
          <button
            onClick={() => onNavigate('cip')}
            className="rounded-xl border border-cyan-800 bg-cyan-950/30 p-2.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-900/40"
          >
            7. CIP Wash Line
          </button>
        </div>
      </div>
    </div>
  );
};
