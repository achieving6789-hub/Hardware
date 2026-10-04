import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import {
  ArrowLeft,
  Calendar,
  Activity,
  Droplet,
  Sparkles,
  Zap,
  Flame,
  Thermometer,
  ShieldAlert,
  Clock,
  ChevronRight
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
import { PROTOTYPE_DISCLAIMER } from '@smartdairy/shared';

interface CowDetailPageProps {
  cowId: string;
  onNavigate: (page: string, params?: any) => void;
}

export const CowDetailPage: React.FC<CowDetailPageProps> = ({ cowId, onNavigate }) => {
  const [cow, setCow] = useState<any>(null);
  const [timeFilter, setTimeFilter] = useState<'7D' | '30D' | '60D'>('30D');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadCow() {
      try {
        const res = await api.getCow(cowId);
        if (res.success) {
          setCow(res.cow);
        }
      } catch (err) {
        console.error('Failed to load cow detail:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadCow();
  }, [cowId]);

  if (isLoading || !cow) {
    return (
      <div className="flex h-96 items-center justify-center text-slate-400">
        <Activity className="h-6 w-6 animate-spin text-cyan-400 mr-2" />
        <span>Loading cow health profile & historical trend data...</span>
      </div>
    );
  }

  // Filter historical sessions according to 7D / 30D / 60D
  const allSessions = cow.sessions || [];
  const limitCount = timeFilter === '7D' ? 14 : timeFilter === '30D' ? 60 : allSessions.length;
  const filteredSessions = allSessions.slice(0, limitCount).reverse();

  const chartSeries = filteredSessions.map((s: any, idx: number) => ({
    date: new Date(s.startTime).toLocaleDateString([], { month: 'short', day: 'numeric' }),
    yield: s.totalVolume,
    scc: s.averageScc,
    conductivity: s.averageConductivity,
    ph: s.averagePh,
    temperature: s.averageTemperature,
    risk: s.riskScore
  }));

  const base = cow.baseline;
  const profile = cow.healthProfile;

  return (
    <div className="space-y-6">
      {/* Top Navigation & Cow Hero */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate('cows')}
          className="flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Registry</span>
        </button>

        <div className="flex items-center gap-1 rounded-xl bg-slate-900 border border-slate-800 p-1">
          {(['7D', '30D', '60D'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTimeFilter(t)}
              className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                timeFilter === t
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Hero Card */}
      <div className="glass-panel rounded-2xl p-6 border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black text-white">{cow.cowCode}</h1>
            <span className="text-xl font-bold text-slate-300">({cow.name})</span>
            <span
              className={`rounded-full px-3 py-0.5 text-xs font-bold uppercase ${
                profile?.currentRiskLevel === 'HIGH' || profile?.currentRiskLevel === 'VERY_HIGH'
                  ? 'bg-rose-950 text-rose-300 border border-rose-800'
                  : profile?.currentRiskLevel === 'MODERATE'
                  ? 'bg-amber-950 text-amber-300 border border-amber-800'
                  : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
              }`}
            >
              Risk: {profile?.currentRiskLevel} ({profile?.currentRiskScore?.toFixed(0)})
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-400">
            <span>Breed: <strong className="text-slate-200">{cow.breed}</strong></span>
            <span>RFID: <strong className="text-cyan-400 font-mono">{cow.rfidId}</strong></span>
            <span>Age: <strong className="text-slate-200">{cow.age} yrs</strong></span>
            <span>Lactation: <strong className="text-slate-200">{cow.lactationNumber}</strong></span>
            <span>Days in Milk: <strong className="text-slate-200">{cow.daysInMilk} DIM</strong></span>
            <span>Weight: <strong className="text-slate-200">{cow.bodyWeight} kg</strong></span>
          </div>
        </div>

        <button
          onClick={() => onNavigate('live-milking')}
          className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500"
        >
          Send to Milking Line Alpha
        </button>
      </div>

      {/* Individual Cow Early Mastitis Risk Forecast (SIH PS 26109 Core Objective) */}
      <div className="glass-panel rounded-2xl p-6 border-cyan-500/40 bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/30">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-lg bg-cyan-500/20 px-2.5 py-1 text-xs font-bold text-cyan-400 border border-cyan-500/40">
                EARLY FORECASTING DOSSIER
              </span>
              <span className="rounded-lg bg-purple-500/20 px-2.5 py-1 text-xs font-bold text-purple-300 border border-purple-500/40">
                Horizon: Next 24–72 Hours
              </span>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                (profile?.riskDirection || 'STABLE') === 'INCREASING'
                  ? 'bg-rose-950 text-rose-400 border-rose-800 animate-pulse'
                  : 'bg-emerald-950 text-emerald-400 border-emerald-800'
              }`}>
                Trajectory: {profile?.riskDirection || 'STABLE'}
              </span>
            </div>

            <h2 className="text-xl font-black text-white">
              Prodromal Udder Health & Early Intervention Forecast
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Predictive AI evaluates multi-modal telemetry before clinical signs appear. Combined in-line optical somatic cells, electrolyte conductivity, rumination cycles, and historical disease episodes.
            </p>

            <div className="rounded-xl bg-slate-950/80 p-3 border border-slate-800 text-xs">
              <div className="font-bold text-emerald-400 flex items-center gap-1.5 mb-1">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Recommended Veterinary Action Directive</span>
              </div>
              <p className="text-slate-200">
                {profile?.recommendedAction || 'Continue routine milking parlor hygiene and post-dip barrier disinfection.'}
              </p>
            </div>
          </div>

          {/* Forecast vs Current Score Badges */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="rounded-2xl bg-slate-950/90 p-4 border border-slate-800 text-center min-w-[120px]">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current Risk</div>
              <div className={`text-3xl font-black ${
                (profile?.currentRiskScore || 0) >= 60 ? 'text-rose-400' : (profile?.currentRiskScore || 0) >= 30 ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {profile?.currentRiskScore?.toFixed(0) || 15}
              </div>
              <div className="text-[10px] text-slate-400 font-semibold">{profile?.currentRiskLevel || 'LOW'}</div>
            </div>

            <div className="text-xl font-black text-slate-500">→</div>

            <div className="rounded-2xl bg-slate-950/90 p-4 border border-cyan-800/60 text-center min-w-[130px] shadow-lg shadow-cyan-950/40">
              <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">Forecast (48h)</div>
              <div className={`text-3xl font-black ${
                (profile?.forecastRiskScore || profile?.currentRiskScore || 0) >= 60 ? 'text-rose-400' : (profile?.forecastRiskScore || 0) >= 30 ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {profile?.forecastRiskScore?.toFixed(0) || profile?.currentRiskScore?.toFixed(0) || 16}
              </div>
              <div className="text-[10px] text-cyan-400 font-semibold">{profile?.forecastRiskLevel || profile?.currentRiskLevel || 'LOW'}</div>
            </div>
          </div>
        </div>

        {/* Multi-Modal Auxiliary Sensor Biometrics */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="text-slate-400 text-[10px] uppercase font-semibold">Rumination Collar</div>
            <div className="text-base font-bold text-white mt-0.5">
              {cow.vitalsReadings?.[0]?.ruminationMinutes || (profile?.currentRiskLevel === 'HIGH' ? 290 : profile?.currentRiskLevel === 'MODERATE' ? 410 : 490)} min/day
            </div>
            <span className="text-[9px] text-slate-500 font-mono">SIMULATED SENSOR</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="text-slate-400 text-[10px] uppercase font-semibold">Pedometer Activity</div>
            <div className="text-base font-bold text-white mt-0.5">
              {cow.vitalsReadings?.[0]?.activitySteps || (profile?.currentRiskLevel === 'HIGH' ? 1850 : 3200)} steps/day
            </div>
            <span className="text-[9px] text-slate-500 font-mono">SIMULATED SENSOR</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="text-slate-400 text-[10px] uppercase font-semibold">Past Mastitis History</div>
            <div className="text-base font-bold text-amber-400 mt-0.5">
              {cow.numPreviousMastitisEpisodes || 0} Episode(s)
            </div>
            <span className="text-[9px] text-slate-500 font-mono">FARM RECORD</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="text-slate-400 text-[10px] uppercase font-semibold">Lactation Stage</div>
            <div className="text-base font-bold text-cyan-400 mt-0.5">
              {cow.lactationStage || 'MID_LACTATION'}
            </div>
            <span className="text-[9px] text-slate-500 font-mono">DERIVED FEATURE</span>
          </div>
        </div>
      </div>

      {/* Personal Baseline Cards */}
      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
          Personal Baseline Targets (Calculated over 30-day window)
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <div className="glass-panel rounded-xl p-3.5 border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Baseline Yield</span>
            <div className="text-lg font-bold text-white mt-1">{base?.baselineMilkYield || 14.0} L</div>
            <span className="text-[10px] text-slate-500">Per session</span>
          </div>

          <div className="glass-panel rounded-xl p-3.5 border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Baseline SCC</span>
            <div className="text-lg font-bold text-white mt-1">{base?.baselineScc || 110} k/mL</div>
            <span className="text-[10px] text-slate-500">Optical threshold</span>
          </div>

          <div className="glass-panel rounded-xl p-3.5 border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Baseline EC</span>
            <div className="text-lg font-bold text-white mt-1">{base?.baselineConductivity || 5.58} mS</div>
            <span className="text-[10px] text-slate-500">Foodmag baseline</span>
          </div>

          <div className="glass-panel rounded-xl p-3.5 border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Baseline pH</span>
            <div className="text-lg font-bold text-white mt-1">{base?.baselinePh || 6.65}</div>
            <span className="text-[10px] text-slate-500">Normal milk pH</span>
          </div>

          <div className="glass-panel rounded-xl p-3.5 border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Baseline Temp</span>
            <div className="text-lg font-bold text-white mt-1">{base?.baselineTemperature || 38.5} °C</div>
            <span className="text-[10px] text-slate-500">Milk line RTD</span>
          </div>

          <div className="glass-panel rounded-xl p-3.5 border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Peak Flow</span>
            <div className="text-lg font-bold text-white mt-1">{base?.baselineFlow || 3.8} L/m</div>
            <span className="text-[10px] text-slate-500">Cluster letdown</span>
          </div>
        </div>
      </div>

      {/* Historical Trend Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Milk Yield Trend */}
        <div className="glass-panel rounded-2xl p-5 border-slate-800">
          <h2 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
            <Droplet className="h-4 w-4 text-cyan-400" />
            <span>Milk Harvest Volume vs Personal Baseline ({timeFilter})</span>
          </h2>
          <p className="text-xs text-slate-400 mb-3">Notice drop when mastitis or udder inflammation begins</p>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} domain={[5, 20]} unit=" L" />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                <Line type="monotone" dataKey="yield" stroke="#38bdf8" strokeWidth={2.5} dot={{ r: 2 }} name="Milk Yield (L)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Somatic Cell Count (SCC) Trend */}
        <div className="glass-panel rounded-2xl p-5 border-slate-800">
          <h2 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-400" />
            <span>Somatic Cell Count (SCC) Trend ({timeFilter})</span>
          </h2>
          <p className="text-xs text-slate-400 mb-3">Optical cell count tracked by inline SomaDetect sensor</p>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} unit=" k" />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                <Line type="monotone" dataKey="scc" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 2 }} name="SCC (k cells/mL)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Electrical Conductivity & pH Trend */}
        <div className="glass-panel rounded-2xl p-5 border-slate-800">
          <h2 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
            <Zap className="h-4 w-4 text-emerald-400" />
            <span>Conductivity & pH Shifts ({timeFilter})</span>
          </h2>
          <p className="text-xs text-slate-400 mb-3">Electrolyte leakage from blood plasma into alveoli during mastitis</p>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                <YAxis yAxisId="ec" stroke="#10b981" fontSize={11} domain={[5.0, 7.5]} unit=" mS" />
                <YAxis yAxisId="ph" orientation="right" stroke="#ec4899" fontSize={11} domain={[6.4, 7.2]} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                <Line yAxisId="ec" type="monotone" dataKey="conductivity" stroke="#10b981" strokeWidth={2} name="Conductivity (mS/cm)" />
                <Line yAxisId="ph" type="monotone" dataKey="ph" stroke="#ec4899" strokeWidth={2} name="Milk pH" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Mastitis Risk Score Trend */}
        <div className="glass-panel rounded-2xl p-5 border-slate-800">
          <h2 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-rose-400" />
            <span>Composite AI Mastitis Risk Score Progression ({timeFilter})</span>
          </h2>
          <p className="text-xs text-slate-400 mb-3">Multi-feature weighted score 0–100</p>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                <Line type="monotone" dataKey="risk" stroke="#ef4444" strokeWidth={2.5} name="Risk Score (0-100)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Sessions Table */}
      <div className="glass-panel rounded-2xl p-5 border-slate-800">
        <h2 className="text-sm font-bold text-white mb-3">Recent Historical Milking Sessions</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Session Code</th>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Yield</th>
                <th className="py-2.5 px-3">SCC</th>
                <th className="py-2.5 px-3">EC</th>
                <th className="py-2.5 px-3">pH</th>
                <th className="py-2.5 px-3">Risk Level</th>
                <th className="py-2.5 px-3">AI Prediction Factor Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {cow.sessions?.slice(0, 10).map((s: any) => (
                <tr key={s.id} className="hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 font-mono font-bold text-cyan-400">{s.sessionCode}</td>
                  <td className="py-2.5 px-3 text-slate-400">
                    {new Date(s.startTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-200">{s.totalVolume} L</td>
                  <td className="py-2.5 px-3 text-amber-300">{s.averageScc} k/mL</td>
                  <td className="py-2.5 px-3 text-emerald-300">{s.averageConductivity} mS</td>
                  <td className="py-2.5 px-3 text-slate-300">{s.averagePh}</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                        s.riskLevel === 'HIGH' || s.riskLevel === 'VERY_HIGH'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : s.riskLevel === 'MODERATE'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}
                    >
                      {s.riskLevel} ({s.riskScore})
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-400 truncate max-w-xs text-[11px]">
                    {s.predictions?.[0]?.explanation || 'Within tolerance.'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
