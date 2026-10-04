import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { getSocket } from '../api/socket';
import {
  Sparkles,
  Droplet,
  Thermometer,
  Zap,
  Play,
  Square,
  CheckCircle,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import {
  CIPPhase,
  CIP_ISOLATION_NOTICE
} from '@smartdairy/shared';

export const CipPage: React.FC = () => {
  const [cipState, setCipState] = useState<any>({
    activeSessionId: null,
    isCleaningActive: false,
    latestCip: null,
    phase: CIPPhase.PRE_RINSE,
    readings: { flow: 14.5, temperature: 45.0, conductivity: 2.1 }
  });

  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fetchCip = async () => {
    try {
      const res = await api.getCipStatus();
      if (res.success) {
        setCipState((prev: any) => ({
          ...prev,
          activeSessionId: res.activeSessionId,
          isCleaningActive: res.isCleaningActive,
          latestCip: res.latestCip,
          phase: res.latestCip?.phase || CIPPhase.COMPLETE
        }));
      }
    } catch (err) {
      console.error('Failed to load CIP status:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCip();

    const socket = getSocket();
    const onCipUpdate = (data: any) => {
      setCipState((prev: any) => ({
        ...prev,
        activeSessionId: data.cipSessionId,
        isCleaningActive: data.status === 'IN_PROGRESS',
        phase: data.phase,
        readings: data.readings || prev.readings
      }));
      setStatusMessage(`CIP Phase: ${data.phase} (${data.status})`);
    };

    socket.on('cip:updated', onCipUpdate);
    return () => {
      socket.off('cip:updated', onCipUpdate);
    };
  }, []);

  const handleStartCip = async () => {
    setStatusMessage('Starting automatic hygienic Clean-In-Place sequence...');
    try {
      await api.startCip();
      fetchCip();
    } catch (err: any) {
      setStatusMessage(err.message);
    }
  };

  const handleStopCip = async () => {
    try {
      await api.stopCip();
      setStatusMessage('CIP sequence terminated. Line returned to IDLE.');
      fetchCip();
    } catch (err: any) {
      setStatusMessage(err.message);
    }
  };

  const phases = [
    { key: CIPPhase.PRE_RINSE, label: 'Pre-Rinse', temp: '40–45 °C', desc: 'Lukewarm water flush' },
    { key: CIPPhase.CAUSTIC, label: 'Caustic Wash', temp: '70–75 °C', desc: 'Alkaline detergent & fat removal' },
    { key: CIPPhase.RINSE, label: 'Intermediate Rinse', temp: '40–45 °C', desc: 'Clean water flush' },
    { key: CIPPhase.ACID, label: 'Acid Wash', temp: '65–70 °C', desc: 'Mineral & milk-stone descaling' },
    { key: CIPPhase.FINAL_RINSE, label: 'Final Rinse', temp: '20 °C', desc: 'Cold sanitizing rinse' },
    { key: CIPPhase.COMPLETE, label: 'Complete', temp: 'Ambient', desc: 'Line sanitized & ready' }
  ];

  const currentPhaseIndex = phases.findIndex((p) => p.key === cipState.phase);

  return (
    <div className="space-y-6">
      {/* Title & Mandatory Isolation Banner */}
      <div className="glass-panel rounded-2xl p-6 border-cyan-500/30 bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <Sparkles className="h-6 w-6 text-cyan-400" />
              <h1 className="text-2xl font-black tracking-tight text-white">
                Clean-In-Place (CIP) Line Sanitation Monitor
              </h1>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Automated chemical wash sequence for the shared inline milking line.
            </p>
          </div>

          <div className="flex gap-2">
            {!cipState.isCleaningActive ? (
              <button
                onClick={handleStartCip}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500"
              >
                <Play className="h-4 w-4 fill-current" />
                <span>Start CIP Sanitation</span>
              </button>
            ) : (
              <button
                onClick={handleStopCip}
                className="flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-rose-600/20 hover:bg-rose-500"
              >
                <Square className="h-4 w-4 fill-current" />
                <span>Stop CIP Sequence</span>
              </button>
            )}
          </div>
        </div>

        {/* Mandatory Isolation Statement */}
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-cyan-950/80 border border-cyan-700/80 p-3 text-xs font-bold text-cyan-300">
          <ShieldCheck className="h-4 w-4 text-cyan-400 shrink-0" />
          <span>{CIP_ISOLATION_NOTICE}</span>
        </div>
      </div>

      {statusMessage && (
        <div className="flex items-center gap-2 rounded-xl bg-slate-900 border border-slate-800 p-3 text-xs text-slate-300">
          <Sparkles className="h-4 w-4 text-cyan-400" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* 6-Phase Interactive Timeline */}
      <div className="glass-panel rounded-2xl p-6 border-slate-800">
        <h2 className="text-sm font-bold text-white mb-4">Sanitation Cycle Timeline</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
          {phases.map((phase, idx) => {
            const isPassed = currentPhaseIndex > idx;
            const isCurrent = currentPhaseIndex === idx && cipState.isCleaningActive;

            return (
              <div
                key={phase.key}
                className={`rounded-2xl p-4 border transition-all text-center ${
                  isCurrent
                    ? 'border-cyan-400 bg-cyan-950/40 shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400 animate-pulse'
                    : isPassed
                    ? 'border-emerald-500/40 bg-emerald-950/10'
                    : 'border-slate-800 bg-slate-900/60 opacity-60'
                }`}
              >
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Step 0{idx + 1}
                </div>
                <div className="text-xs font-extrabold text-white mt-1">
                  {phase.label}
                </div>
                <div className="text-[10px] text-cyan-400 mt-1">
                  {phase.temp}
                </div>
                <div className="text-[10px] text-slate-400 mt-2">
                  {phase.desc}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live CIP Fluid Telemetry */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="glass-panel rounded-xl p-5 border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase">Wash Flow Rate</span>
            <Droplet className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-black text-white">
            {cipState.readings?.flow || 14.5} <span className="text-xs text-slate-400 font-normal">L/min</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">High velocity turbulent wash</span>
        </div>

        <div className="glass-panel rounded-xl p-5 border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase">Wash Temperature</span>
            <Thermometer className="h-4 w-4 text-rose-400" />
          </div>
          <div className="text-3xl font-black text-rose-300">
            {cipState.readings?.temperature || 45.0} <span className="text-xs text-slate-400 font-normal">°C</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Thermal sanitation threshold</span>
        </div>

        <div className="glass-panel rounded-xl p-5 border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase">Wash Conductivity</span>
            <Zap className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-amber-300">
            {cipState.readings?.conductivity || 2.1} <span className="text-xs text-slate-400 font-normal">mS/cm</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Chemical concentration index</span>
        </div>
      </div>
    </div>
  );
};
