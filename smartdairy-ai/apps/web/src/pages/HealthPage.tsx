import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import {
  ShieldAlert,
  ArrowUpDown,
  Filter,
  Search,
  ChevronRight,
  Sparkles,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Thermometer,
  Wind,
  Droplets,
  Activity,
  Calendar,
  Layers,
  CheckCircle2,
  Stethoscope,
  Info
} from 'lucide-react';
import { PROTOTYPE_DISCLAIMER } from '@smartdairy/shared';

interface HealthPageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const HealthPage: React.FC<HealthPageProps> = ({ onNavigate }) => {
  const [cows, setCows] = useState<any[]>([]);
  const [herdData, setHerdData] = useState<any>(null);
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('risk');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchHealthData = async () => {
    try {
      const [healthRes, herdRes] = await Promise.all([
        api.getHealthSummary({
          riskLevel: riskFilter !== 'ALL' ? riskFilter : undefined,
          sortBy
        }),
        api.getHerdForecast().catch(() => null)
      ]);

      if (healthRes.success) {
        setCows(healthRes.cows || []);
      }
      if (herdRes?.success) {
        setHerdData(herdRes);
      }
    } catch (err) {
      console.error('Failed to load health data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthData();
  }, [riskFilter, sortBy, sortOrder]);

  const filteredCows = cows.filter((c) => {
    if (!search) return true;
    return (
      c.cowCode.toLowerCase().includes(search.toLowerCase()) ||
      c.name.toLowerCase().includes(search.toLowerCase())
    );
  });

  const herdRisk = herdData?.herdRisk;
  const envTelemetry = herdData?.environmentTelemetry;

  return (
    <div className="space-y-6">
      {/* SIH PS 26109 Strategic Headline Banner */}
      <div className="glass-panel rounded-2xl p-6 border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-rose-950/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-lg bg-rose-500/20 px-2.5 py-1 text-xs font-bold text-rose-400 border border-rose-500/40">
                SIH PS 26109
              </span>
              <span className="rounded-lg bg-emerald-500/20 px-2.5 py-1 text-xs font-bold text-emerald-300 border border-emerald-500/40">
                Early Mastitis Risk Forecasting
              </span>
              <span className="text-xs text-slate-400 font-mono">Individual & Herd Level</span>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <ShieldAlert className="h-6 w-6 text-rose-400" />
              <span>Bovine Mastitis Predictive Forecasting Center</span>
            </h1>
            <p className="mt-1 text-xs text-slate-400 max-w-3xl">
              Forecasting subclinical and prodromal mastitis 24–72 hours <strong>BEFORE visible clinical symptoms appear</strong> using in-line milk analysis, acoustic rumination, pedometry activity, and barn climate THI.
            </p>
            <div className="mt-2 text-[11px] font-semibold text-amber-400/90 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>{PROTOTYPE_DISCLAIMER}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Herd-Level Mastitis Risk Forecast (SIH PS 26109 Core Objective) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Herd Risk Index Card */}
        <div className="glass-panel rounded-2xl p-5 border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Herd Risk Index</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${
              (herdRisk?.herdRiskLevel || 'LOW') === 'VERY_HIGH'
                ? 'bg-rose-950 text-rose-400 border-rose-800'
                : (herdRisk?.herdRiskLevel || 'LOW') === 'HIGH'
                ? 'bg-orange-950 text-orange-400 border-orange-800'
                : (herdRisk?.herdRiskLevel || 'LOW') === 'MODERATE'
                ? 'bg-amber-950 text-amber-400 border-amber-800'
                : 'bg-emerald-950 text-emerald-400 border-emerald-800'
            }`}>
              {herdRisk?.herdRiskLevel || 'LOW'} RISK
            </span>
          </div>

          <div className="my-4 text-center">
            <div className={`text-4xl font-black ${
              (herdRisk?.overallHerdScore || herdRisk?.herdRiskIndex || 22) >= 60 ? 'text-rose-400' : 'text-emerald-400'
            }`}>
              {herdRisk?.overallHerdScore || herdRisk?.herdRiskIndex || 22}
              <span className="text-xl text-slate-500 font-normal"> / 100</span>
            </div>
            <div className="mt-1 text-xs text-slate-400 flex items-center justify-center gap-1">
              <span>Trajectory:</span>
              <span className="font-bold text-amber-400">{herdRisk?.herdRiskTrend || 'STABLE'}</span>
            </div>
          </div>

          <div className="text-[10px] text-slate-500 text-center border-t border-slate-800 pt-2">
            Horizon: Next 24–72 hours • Indian Herd
          </div>
        </div>

        {/* Upward Velocity Cows */}
        <div className="glass-panel rounded-2xl p-5 border-slate-800 flex flex-col justify-between">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Upward Prodromal Risk</div>
          <div className="my-3">
            <div className="text-3xl font-black text-amber-400">
              {herdRisk?.increasingRiskCount ?? 3}
              <span className="text-sm font-normal text-slate-400"> cows</span>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Biometric velocity indicates rising somatic/conductivity trends before udder swelling occurs.
            </p>
          </div>
          <div className="text-[11px] font-semibold text-amber-500/90 flex items-center gap-1">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Early watch list prioritized</span>
          </div>
        </div>

        {/* Environmental Stress (THI) */}
        <div className="glass-panel rounded-2xl p-5 border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Barn Climate & THI</span>
            <Thermometer className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="my-3 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Ambient Temp:</span>
              <span className="font-bold text-white">{envTelemetry?.temperature ?? 26.5} °C</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Relative Humidity:</span>
              <span className="font-bold text-white">{envTelemetry?.humidity ?? 65.0} %</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">THI Index:</span>
              <span className="font-bold text-amber-400">
                {Math.round((1.8 * (envTelemetry?.temperature || 26.5) + 32) - (0.55 - 0.0055 * (envTelemetry?.humidity || 65)) * (1.8 * (envTelemetry?.temperature || 26.5) - 26))} (Comfort)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Bedding Hygiene:</span>
              <span className="font-bold text-emerald-400">{envTelemetry?.hygieneStatus || 'GOOD'}</span>
            </div>
          </div>
          <div className="text-[10px] text-slate-500 border-t border-slate-800 pt-2">
            Sensor: Barn Environment Telemetry
          </div>
        </div>

        {/* Herd Recommendation */}
        <div className="glass-panel rounded-2xl p-5 border-slate-800 flex flex-col justify-between bg-slate-900/90">
          <div className="flex items-center gap-2 text-xs font-bold text-white">
            <Stethoscope className="h-4 w-4 text-emerald-400" />
            <span>Herd Action Protocol</span>
          </div>
          <p className="my-2 text-xs text-slate-300 leading-relaxed">
            {herdRisk?.recommendedAction || herdRisk?.recommendations?.[0] || 'Maintain post-milking teat barrier dip and routine vacuum level verification.'}
          </p>
          <div className="text-[10px] font-semibold text-emerald-400/90 flex items-center gap-1 border-t border-slate-800 pt-2">
            <CheckCircle2 className="h-3 w-3" />
            <span>Automated AI Veterinary Directive</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col md:flex-row gap-3 glass-panel rounded-2xl p-4 border-slate-800">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search cow code or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl bg-slate-900 border border-slate-700/80 pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex gap-2">
          {/* Risk Filter */}
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="rounded-xl bg-slate-900 border border-slate-700/80 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Risk Groups</option>
            <option value="LOW">Low (0-29)</option>
            <option value="MODERATE">Moderate (30-59)</option>
            <option value="HIGH">High (60-79)</option>
            <option value="VERY_HIGH">Very High (80-100)</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-xl bg-slate-900 border border-slate-700/80 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="risk">Sort by: Current Risk</option>
            <option value="forecast">Sort by: Forecast Risk (24-72h)</option>
            <option value="scc">Sort by: SCC</option>
            <option value="yield">Sort by: Milk Yield</option>
            <option value="conductivity">Sort by: Conductivity</option>
          </select>
        </div>
      </div>

      {/* Individual Cow Table with Early Forecasting Columns */}
      <div className="glass-panel rounded-2xl border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold text-[10px]">
              <tr>
                <th className="py-3 px-4">Cow Code & Stage</th>
                <th className="py-3 px-4">Current Risk</th>
                <th className="py-3 px-4">Forecast (24–72h)</th>
                <th className="py-3 px-4">Trajectory</th>
                <th className="py-3 px-4">In-Line SCC (k/mL)</th>
                <th className="py-3 px-4">Conductivity</th>
                <th className="py-3 px-4">Rumination</th>
                <th className="py-3 px-4">Recommended Early Action</th>
                <th className="py-3 px-4 text-right">Dossier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredCows.map((c) => {
                const isHigh = c.currentRiskLevel === 'HIGH' || c.currentRiskLevel === 'VERY_HIGH';
                const isMod = c.currentRiskLevel === 'MODERATE';
                const isForecastHigh = c.forecastRiskLevel === 'HIGH' || c.forecastRiskLevel === 'VERY_HIGH';
                const isIncreasing = c.riskDirection === 'INCREASING';

                return (
                  <tr key={c.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-white">{c.cowCode}</div>
                      <div className="text-[11px] text-slate-400">{c.name} • <span className="text-cyan-400">{c.lactationStage || 'MID'}</span></div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className={`font-black text-sm ${
                          isHigh ? 'text-rose-400' : isMod ? 'text-amber-400' : 'text-emerald-400'
                        }`}>
                          {c.currentRiskScore}
                        </span>
                        <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold border ${
                          isHigh
                            ? 'bg-rose-950 text-rose-400 border-rose-800'
                            : isMod
                            ? 'bg-amber-950 text-amber-400 border-amber-800'
                            : 'bg-emerald-950 text-emerald-400 border-emerald-800'
                        }`}>
                          {c.currentRiskLevel}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className={`font-black text-sm ${
                          isForecastHigh ? 'text-rose-400' : 'text-slate-300'
                        }`}>
                          {c.forecastRiskScore || c.currentRiskScore}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">/100</span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      {isIncreasing ? (
                        <span className="flex items-center gap-1 font-bold text-amber-400 text-xs">
                          <TrendingUp className="h-3.5 w-3.5" />
                          <span>INCREASING</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 font-medium text-slate-400 text-xs">
                          <span>→ STABLE</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-200">{Math.round(c.currentScc)}k</div>
                      <div className={`text-[10px] ${c.sccDeviationPercent > 20 ? 'text-rose-400' : 'text-slate-500'}`}>
                        {c.sccDeviationPercent > 0 ? `+${c.sccDeviationPercent}%` : `${c.sccDeviationPercent}%`}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-200">{c.currentConductivity} mS/cm</div>
                      <div className="text-[10px] text-slate-500">
                        {c.conductivityDeviationPercent > 0 ? `+${c.conductivityDeviationPercent}%` : 'Normal'}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-300">
                      <div>{c.ruminationMinutes || 480} min/day</div>
                      <div className="text-[10px] text-slate-500">{c.activitySteps || 3200} steps</div>
                    </td>

                    <td className="py-3 px-4 text-slate-300 max-w-xs">
                      <p className="text-[11px] leading-tight line-clamp-2">
                        {c.recommendedAction || 'Routine milking & sanitization.'}
                      </p>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onNavigate('cow-detail', { cowId: c.cowId })}
                        className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-1 text-xs font-semibold text-cyan-400 hover:bg-slate-700 hover:text-cyan-300 transition-colors"
                      >
                        Examine
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};


