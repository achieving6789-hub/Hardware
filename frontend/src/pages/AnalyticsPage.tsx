import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import {
  BarChart3,
  TrendingUp,
  Droplet,
  Sparkles,
  Zap,
  Flame,
  Thermometer,
  PieChart as PieIcon
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter
} from 'recharts';

export const AnalyticsPage: React.FC = () => {
  const [trends, setTrends] = useState<any[]>([]);
  const [riskDist, setRiskDist] = useState<any[]>([]);
  const [cows, setCows] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const [trendRes, cowsRes] = await Promise.all([
          api.getDashboardTrends(),
          api.getCows()
        ]);

        if (trendRes.success) {
          setTrends(trendRes.dailyTrends || []);
          setRiskDist(trendRes.riskDistribution || []);
        }
        if (cowsRes.success) {
          setCows(cowsRes.cows || []);
        }
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadAnalytics();
  }, []);

  const scatterData = cows.map((c) => ({
    name: c.cowCode,
    yield: c.healthProfile?.currentMilkYield || 14.0,
    conductivity: c.healthProfile?.currentConductivity || 5.6,
    scc: c.healthProfile?.currentScc || 120,
    risk: c.healthProfile?.currentRiskScore || 15
  }));

  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-2xl p-6 border-slate-800">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-cyan-400" />
          <span>Farm Herd Analytics & Population Trends</span>
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          Aggregated milk volume trends, electrical conductivity correlations, and Somatic Cell Count population curves.
        </p>
      </div>

      {/* Aggregate Herd Metrics */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
        <div className="glass-panel rounded-xl p-4 border-slate-800">
          <span className="text-[11px] text-slate-400 uppercase font-semibold">Total Herd</span>
          <div className="text-2xl font-bold text-white mt-1">30 Cows</div>
          <span className="text-[10px] text-slate-500">Registered</span>
        </div>

        <div className="glass-panel rounded-xl p-4 border-slate-800">
          <span className="text-[11px] text-slate-400 uppercase font-semibold">Avg Yield / Session</span>
          <div className="text-2xl font-bold text-cyan-300 mt-1">14.1 L</div>
          <span className="text-[10px] text-slate-500">Per animal</span>
        </div>

        <div className="glass-panel rounded-xl p-4 border-slate-800">
          <span className="text-[11px] text-slate-400 uppercase font-semibold">Mean Herd SCC</span>
          <div className="text-2xl font-bold text-amber-300 mt-1">148 k/mL</div>
          <span className="text-[10px] text-slate-500">Optical composite</span>
        </div>

        <div className="glass-panel rounded-xl p-4 border-slate-800">
          <span className="text-[11px] text-slate-400 uppercase font-semibold">Mean Conductivity</span>
          <div className="text-2xl font-bold text-emerald-300 mt-1">5.64 mS</div>
          <span className="text-[10px] text-slate-500">Foodmag inline</span>
        </div>

        <div className="glass-panel rounded-xl p-4 border-slate-800">
          <span className="text-[11px] text-slate-400 uppercase font-semibold">Mean Milk pH</span>
          <div className="text-2xl font-bold text-slate-200 mt-1">6.66</div>
          <span className="text-[10px] text-slate-500">Normal range</span>
        </div>

        <div className="glass-panel rounded-xl p-4 border-slate-800">
          <span className="text-[11px] text-slate-400 uppercase font-semibold">Line Temperature</span>
          <div className="text-2xl font-bold text-rose-300 mt-1">38.5 °C</div>
          <span className="text-[10px] text-slate-500">Physiological avg</span>
        </div>
      </div>

      {/* Production & SCC Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="glass-panel rounded-2xl p-5 border-slate-800">
          <h2 className="text-sm font-bold text-white mb-3">Daily Herd Milk Volume (7 Days)</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} unit=" L" />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                <Bar dataKey="totalMilk" fill="#0ea5e9" radius={[4, 4, 0, 0]} name="Milk Harvest (L)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5 border-slate-800">
          <h2 className="text-sm font-bold text-white mb-3">Conductivity vs Milk Yield Scatter Correlation</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="conductivity" stroke="#64748b" fontSize={11} name="Conductivity (mS/cm)" domain={[5.2, 7.5]} unit=" mS" />
                <YAxis dataKey="yield" stroke="#64748b" fontSize={11} name="Yield (L)" domain={[5, 20]} unit=" L" />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} cursor={{ strokeDasharray: '3 3' }} />
                <Scatter name="Cows" data={scatterData} fill="#38bdf8" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
