import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import {
  Cpu,
  Radio,
  CheckCircle,
  AlertTriangle,
  Flame,
  Droplet,
  Sparkles,
  RefreshCw,
  Power
} from 'lucide-react';
import { SensorStatus } from '@smartdairy/shared';

export const SensorsPage: React.FC = () => {
  const [sensors, setSensors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSensors = async () => {
    try {
      const res = await api.getSensors();
      if (res.success) {
        setSensors(res.sensors || []);
      }
    } catch (err) {
      console.error('Failed to load sensors:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSensors();
  }, []);

  const handleToggleStatus = async (sensorId: string, currentStatus: string) => {
    const nextStatus = currentStatus === SensorStatus.ONLINE ? SensorStatus.OFFLINE : SensorStatus.ONLINE;
    try {
      await api.setSensorStatus(sensorId, nextStatus, `Operator toggled status to ${nextStatus}`);
      fetchSensors();
    } catch (err) {
      console.error('Failed to update sensor status:', err);
    }
  };

  const handleInjectError = async (sensorId: string) => {
    try {
      await api.setSensorStatus(sensorId, SensorStatus.ERROR, 'Hardware drift & calibration fault injected for SIH demo');
      fetchSensors();
    } catch (err) {
      console.error('Failed to inject error:', err);
    }
  };

  const getSensorIcon = (type: string) => {
    switch (type) {
      case 'SOMADETECT':
        return <Sparkles className="h-6 w-6 text-amber-400" />;
      case 'FLOWMAG':
        return <Droplet className="h-6 w-6 text-cyan-400" />;
      case 'PH':
        return <Flame className="h-6 w-6 text-emerald-400" />;
      case 'RFID':
        return <Radio className="h-6 w-6 text-purple-400" />;
      default:
        return <Cpu className="h-6 w-6 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel rounded-2xl p-6 border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Cpu className="h-6 w-6 text-cyan-400" />
            <span>Shared Inline Sensing Hardware & Diagnostics</span>
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Physical instrumentation suite mounted on Milking Line Alpha (STN-01). Real-time telemetry health and failure injection.
          </p>
        </div>

        <button
          onClick={fetchSensors}
          className="flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 px-3 py-2 text-xs font-semibold text-slate-200"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh Hardware Status</span>
        </button>
      </div>

      {/* Sensor Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {sensors.map((sensor) => {
          const isOnline = sensor.status === SensorStatus.ONLINE;
          const isError = sensor.status === SensorStatus.ERROR;

          return (
            <div
              key={sensor.id}
              className={`glass-panel rounded-2xl p-6 border transition-all ${
                isOnline
                  ? 'border-slate-800'
                  : isError
                  ? 'border-rose-500/50 bg-rose-950/20'
                  : 'border-amber-500/40 bg-amber-950/10'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3.5">
                  <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
                    {getSensorIcon(sensor.type)}
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">{sensor.name}</h2>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {sensor.manufacturer} · {sensor.model}
                    </div>
                  </div>
                </div>

                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${
                    isOnline
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : isError
                      ? 'bg-rose-950 text-rose-400 border border-rose-800 animate-pulse'
                      : 'bg-amber-950 text-amber-400 border border-amber-800'
                  }`}
                >
                  {sensor.status}
                </span>
              </div>

              {/* Sensor Specs & Diagnostics */}
              <div className="grid grid-cols-2 gap-3 text-xs mb-5">
                <div className="rounded-xl bg-slate-900/80 p-2.5 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">Firmware</span>
                  <span className="font-mono text-slate-200 font-semibold">{sensor.firmwareVersion}</span>
                </div>
                <div className="rounded-xl bg-slate-900/80 p-2.5 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">Calibration Status</span>
                  <span className="font-semibold text-emerald-400">{sensor.calibrationStatus}</span>
                </div>
                <div className="rounded-xl bg-slate-900/80 p-2.5 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">Error Count</span>
                  <span className="font-bold text-slate-200">{sensor.errorCount} events</span>
                </div>
                <div className="rounded-xl bg-slate-900/80 p-2.5 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">Maintenance Due</span>
                  <span className="text-slate-200">
                    {sensor.maintenanceDue ? new Date(sensor.maintenanceDue).toLocaleDateString() : '2027'}
                  </span>
                </div>
              </div>

              {/* Simulation Controls for Demo */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <div className="text-[11px] text-slate-400 font-medium">
                  Failure Injection (SIH Demo):
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggleStatus(sensor.id, sensor.status)}
                    className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                      isOnline
                        ? 'bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800 text-rose-300'
                        : 'bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-800 text-emerald-300'
                    }`}
                  >
                    <Power className="h-3.5 w-3.5" />
                    <span>{isOnline ? 'Simulate Offline' : 'Restore Online'}</span>
                  </button>

                  {isOnline && (
                    <button
                      onClick={() => handleInjectError(sensor.id)}
                      className="rounded-xl bg-amber-950/60 hover:bg-amber-900/80 border border-amber-800 px-3 py-1.5 text-xs font-semibold text-amber-300"
                    >
                      Trigger Error
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
