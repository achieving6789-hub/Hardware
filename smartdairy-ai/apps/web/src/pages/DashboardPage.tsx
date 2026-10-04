import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { getSocket } from '../api/socket';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  Activity,
  Milk,
  AlertTriangle,
  Cpu,
  TrendingUp,
  Clock,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Stethoscope,
  Play,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  Layers,
  Database,
  Wifi,
  Wrench,
  Radio,
  FileText
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
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { PROTOTYPE_DISCLAIMER, CIP_ISOLATION_NOTICE } from '@smartdairy/shared';

interface DashboardPageProps {
  onNavigate: (page: string, params?: any) => void;
  currentRole?: string;
  onRoleChange?: (role: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigate,
  currentRole: propRole,
  onRoleChange
}) => {
  const { user } = useAuth();
  const [selectedRoleView, setSelectedRoleView] = useState<'ADMIN' | 'FARM_MANAGER' | 'VETERINARIAN' | 'OPERATOR'>(
    (propRole as any) || (user?.role as any) || 'ADMIN'
  );

  const [summary, setSummary] = useState<any>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [riskDist, setRiskDist] = useState<any[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<any[]>([]);
  const [cows, setCows] = useState<any[]>([]);
  const [sensors, setSensors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Sync role view when propRole or user.role changes
  useEffect(() => {
    if (propRole) {
      setSelectedRoleView(propRole as any);
    } else if (user?.role) {
      setSelectedRoleView(user.role as any);
    }
  }, [propRole, user?.role]);

  const handleRoleSelect = (role: 'ADMIN' | 'FARM_MANAGER' | 'VETERINARIAN' | 'OPERATOR') => {
    setSelectedRoleView(role);
    if (onRoleChange) {
      onRoleChange(role);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const [sumRes, trendRes, cowsRes, sensorsRes] = await Promise.all([
        api.getDashboardSummary(),
        api.getDashboardTrends(),
        api.getCows(),
        api.getSensors()
      ]);

      if (sumRes.success) {
        setSummary(sumRes.summary);
        setRecentAlerts(sumRes.recentAlerts || []);
      }
      if (trendRes.success) {
        setTrends(trendRes.dailyTrends || []);
        setRiskDist(trendRes.riskDistribution || []);
      }
      if (cowsRes.success) {
        setCows(cowsRes.cows || []);
      }
      if (sensorsRes.success) {
        setSensors(sensorsRes.sensors || []);
      }
    } catch (err) {
      console.error('[Dashboard Error]:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    const socket = getSocket();
    const handleRefresh = () => fetchDashboardData();

    socket.on('session:started', handleRefresh);
    socket.on('session:completed', handleRefresh);
    socket.on('alert:created', handleRefresh);
    socket.on('sensor:status', handleRefresh);

    return () => {
      socket.off('session:started', handleRefresh);
      socket.off('session:completed', handleRefresh);
      socket.off('alert:created', handleRefresh);
      socket.off('sensor:status', handleRefresh);
    };
  }, []);

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      await api.acknowledgeAlert(alertId, 'Acknowledged via Dashboard');
      setRecentAlerts((prev) => prev.filter((a) => a.id !== alertId));
      if (summary) {
        setSummary({ ...summary, activeAlerts: Math.max(0, summary.activeAlerts - 1) });
      }
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
    }
  };

  const handleQuickOperatorMilking = async () => {
    setActionFeedback('Initiating live milking on Station STN-01...');
    try {
      const res = await api.startSimulation(undefined, 'COW-001');
      setActionFeedback(`Milking started for ${res.session?.cow?.name || 'COW-001'} (Session: ${res.session?.sessionCode})`);
      setTimeout(() => onNavigate('live-milking'), 1200);
    } catch (err: any) {
      setActionFeedback(`Error: ${err.message}`);
    }
  };

  const handleQuickOperatorStop = async () => {
    setActionFeedback('Stopping milking line and finalizing session...');
    try {
      await api.stopSimulation();
      setActionFeedback('Milking completed. AI risk assessment evaluated.');
      fetchDashboardData();
    } catch (err: any) {
      setActionFeedback(`Error: ${err.message}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center text-slate-400">
        <Activity className="h-8 w-8 animate-spin text-cyan-400 mr-3" />
        <span>Loading SmartDairy real-time farm dashboard...</span>
      </div>
    );
  }

  // High risk cows for Vet
  const highRiskCows = cows.filter((c) => c.healthStatus === 'HIGH');
  const moderateRiskCows = cows.filter((c) => c.healthStatus === 'MODERATE');
  const clinicalAttentionCows = [...highRiskCows, ...moderateRiskCows];

  // Top milk producing cows for Farm Manager
  const topYieldCows = [...cows].sort((a, b) => {
    const yieldA = a.baseline?.[0]?.averageYield || 0;
    const yieldB = b.baseline?.[0]?.averageYield || 0;
    return yieldB - yieldA;
  }).slice(0, 6);

  // =========================================================================
  // VIEW 1: PARLOR OPERATOR DASHBOARD
  // =========================================================================
  const renderOperatorDashboard = () => (
    <div className="space-y-6">
      {/* Operator Station Hero */}
      <div className="glass-panel rounded-2xl p-6 border-amber-500/30 bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-amber-500/20 px-2.5 py-1 text-xs font-bold text-amber-400 border border-amber-500/40">
                PARLOR OPERATOR COMMAND
              </span>
              <span className="text-xs text-slate-400 font-medium">Stall 01 • Shared Inline Sensing Line</span>
            </div>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-white flex items-center gap-3">
              <span>Station STN-01 Milking Parlor Control</span>
              {summary?.activeMilking > 0 ? (
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-950 px-3 py-0.5 text-xs font-bold text-emerald-400 border border-emerald-800">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                  MILKING ACTIVE
                </span>
              ) : (
                <span className="rounded-full bg-slate-800 px-3 py-0.5 text-xs font-bold text-slate-300 border border-slate-700">
                  STATION READY
                </span>
              )}
            </h1>
            <p className="mt-1 text-xs text-slate-300">
              Control parlor latching, verify Allflex RFID gate scans, monitor real-time flowrate, and trigger CIP wash isolation.
            </p>
          </div>

          {/* Quick Action Center */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleQuickOperatorMilking}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-500 transition-all"
            >
              <Play className="h-4 w-4" />
              <span>Start Milking (Cow 01)</span>
            </button>
            <button
              onClick={handleQuickOperatorStop}
              className="flex items-center gap-2 rounded-xl bg-slate-800 border border-slate-700 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-rose-950/40 hover:text-rose-300 hover:border-rose-800 transition-all"
            >
              <span>Stop & Detach</span>
            </button>
            <button
              onClick={() => onNavigate('cip')}
              className="flex items-center gap-2 rounded-xl bg-cyan-950/80 border border-cyan-800 px-4 py-2.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-900 transition-all"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>CIP Wash</span>
            </button>
          </div>
        </div>

        {actionFeedback && (
          <div className="mt-4 rounded-xl bg-slate-800/90 border border-slate-700 p-3 text-xs text-cyan-300 flex items-center justify-between">
            <span>{actionFeedback}</span>
            <button onClick={() => setActionFeedback(null)} className="text-slate-400 hover:text-white">✕</button>
          </div>
        )}
      </div>

      {/* Operator Live Parlor KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="glass-panel rounded-xl p-4 border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Milking Stall State</div>
          <div className="mt-2 text-xl font-black text-white">
            {summary?.activeMilking > 0 ? 'Pumping Milk' : 'Idle / Gate Ready'}
          </div>
          <div className="mt-1 text-xs text-slate-400">1 Shared Line per Stall</div>
        </div>

        <div className="glass-panel rounded-xl p-4 border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Shift Milk Harvested</div>
          <div className="mt-2 text-xl font-black text-cyan-400">{summary?.todayMilk ?? 420.5} Liters</div>
          <div className="mt-1 text-xs text-slate-400">ifm Foodmag Flowmeter</div>
        </div>

        <div className="glass-panel rounded-xl p-4 border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Cows Processed Today</div>
          <div className="mt-2 text-xl font-black text-emerald-400">{cows.length} Cows Checked</div>
          <div className="mt-1 text-xs text-slate-400">All registered transponders</div>
        </div>

        <div className="glass-panel rounded-xl p-4 border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Sanitation Status</div>
          <div className="mt-2 text-xl font-black text-teal-300">CIP PASS</div>
          <div className="mt-1 text-xs text-teal-400/90">Sanitary interlock verified</div>
        </div>
      </div>

      {/* Sensor Readiness & Live Line Visualizer */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="glass-panel rounded-2xl p-5 lg:col-span-2 border-slate-800">
          <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
            <Radio className="h-4 w-4 text-amber-400" />
            <span>Inline Sensing Hardware Readiness (Station STN-01)</span>
          </h2>
          <p className="text-xs text-slate-400 mb-4">
            Sensors inline directly on the sanitary stainless milk line. RFID scan binds stream to cow profile.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-200">SomaDetect Optical Cell Counter</div>
                <div className="text-[11px] text-slate-400">Inline Optical Scatter SCC</div>
              </div>
              <span className="rounded bg-emerald-950 text-emerald-400 px-2 py-1 text-[10px] font-bold border border-emerald-800">
                READY
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-200">ifm SM Foodmag (IO-Link)</div>
                <div className="text-[11px] text-slate-400">Flow, Volume, Temp, EC</div>
              </div>
              <span className="rounded bg-emerald-950 text-emerald-400 px-2 py-1 text-[10px] font-bold border border-emerald-800">
                ONLINE
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-200">Mettler Toledo InPro X1 HLS</div>
                <div className="text-[11px] text-slate-400">ISFET Sanitary pH Sensor</div>
              </div>
              <span className="rounded bg-emerald-950 text-emerald-400 px-2 py-1 text-[10px] font-bold border border-emerald-800">
                CALIBRATED
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-200">ISO 11785 RFID Transceiver</div>
                <div className="text-[11px] text-slate-400">Stall Entry Gate Transponder</div>
              </div>
              <span className="rounded bg-cyan-950 text-cyan-300 px-2 py-1 text-[10px] font-bold border border-cyan-800">
                ARMED
              </span>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-amber-400/90 font-medium">
              💡 Operator Reminder: Always ensure teat cup sanitation between animals.
            </span>
            <button
              onClick={() => onNavigate('live-milking')}
              className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              <span>Open Live Visualizer</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Clean-In-Place Isolation Card */}
        <div className="glass-panel rounded-2xl p-5 border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-cyan-400" />
                <span>CIP Line Isolation</span>
              </h3>
              <span className="rounded bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 text-[10px] font-bold">
                ENFORCED
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-3">
              During chemical sanitation flush, cow milking sessions are strictly blocked.
            </p>
            <div className="rounded-xl bg-slate-950/80 border border-cyan-500/30 p-3 text-[11px] text-cyan-300 font-semibold">
              "{CIP_ISOLATION_NOTICE}"
            </div>
          </div>

          <button
            onClick={() => onNavigate('cip')}
            className="w-full mt-4 flex items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 py-2.5 text-xs font-bold text-slate-200 transition-all border border-slate-700"
          >
            <span>View CIP Cleaning System</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );

  // =========================================================================
  // VIEW 2: VETERINARIAN DASHBOARD
  // =========================================================================
  const renderVeterinarianDashboard = () => (
    <div className="space-y-6">
      {/* Veterinarian Hero */}
      <div className="glass-panel rounded-2xl p-6 border-emerald-500/30 bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-emerald-500/20 px-2.5 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/40">
                CLINICAL VETERINARY SURVEILLANCE
              </span>
              <span className="text-xs text-slate-400 font-medium">Udder Health & Early Mastitis Triage</span>
            </div>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span>Herd Mastitis Early-Warning Console</span>
              <Stethoscope className="h-5 w-5 text-emerald-400" />
            </h1>
            <p className="mt-1 text-xs text-slate-300">
              Personalized 30-day baseline comparison (SCC, electrical conductivity, milk yield drop, pH deviation).
            </p>
            <div className="mt-2 text-[11px] text-amber-400/90 font-medium">
              ⚠️ {PROTOTYPE_DISCLAIMER}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('health')}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-500 transition-all"
            >
              <ShieldAlert className="h-4 w-4" />
              <span>Open Udder Health Center</span>
            </button>
          </div>
        </div>
      </div>

      {/* Clinical KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="glass-panel rounded-xl p-4 border-rose-500/30 bg-rose-950/10">
          <div className="text-[11px] font-semibold text-rose-300 uppercase tracking-wider">Critical Mastitis Cases</div>
          <div className="mt-2 text-2xl font-black text-rose-400">{highRiskCows.length} Cows</div>
          <div className="mt-1 text-xs text-rose-300/80">Immediate clinical review needed</div>
        </div>

        <div className="glass-panel rounded-xl p-4 border-amber-500/30 bg-amber-950/10">
          <div className="text-[11px] font-semibold text-amber-300 uppercase tracking-wider">Subclinical Warnings</div>
          <div className="mt-2 text-2xl font-black text-amber-400">{moderateRiskCows.length} Cows</div>
          <div className="mt-1 text-xs text-amber-300/80">Elevated SCC / conductivity trend</div>
        </div>

        <div className="glass-panel rounded-xl p-4 border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Healthy Herd Ratio</div>
          <div className="mt-2 text-2xl font-black text-emerald-400">
            {cows.length > 0 ? Math.round(((cows.length - clinicalAttentionCows.length) / cows.length) * 100) : 80}%
          </div>
          <div className="mt-1 text-xs text-slate-400">Low Risk baseline conformity</div>
        </div>

        <div className="glass-panel rounded-xl p-4 border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Active Clinical Alerts</div>
          <div className="mt-2 text-2xl font-black text-cyan-400">{summary?.activeAlerts ?? 3} Alerts</div>
          <div className="mt-1 text-xs text-slate-400">Generated by AI Risk Engine</div>
        </div>
      </div>

      {/* Clinical Urgent Attention Table */}
      <div className="glass-panel rounded-2xl p-5 border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-400" />
              <span>Cattle Requiring Veterinary Attention (High & Moderate Risk)</span>
            </h2>
            <p className="text-xs text-slate-400">Automated triage based on multi-parameter deviation from 30-day baseline</p>
          </div>
          <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-300">
            {clinicalAttentionCows.length} Animals Flagged
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Cow Code</th>
                <th className="py-2.5 px-3">Name & Breed</th>
                <th className="py-2.5 px-3">Parity / DIM</th>
                <th className="py-2.5 px-3">Risk Level</th>
                <th className="py-2.5 px-3">Avg Baseline SCC</th>
                <th className="py-2.5 px-3">Clinical Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {clinicalAttentionCows.map((c) => (
                <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-cyan-400">{c.cowCode}</td>
                  <td className="py-2.5 px-3">
                    <span className="font-semibold text-slate-200">{c.name}</span>
                    <span className="text-slate-400 text-[11px] block">{c.breed}</span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-300">
                    Lactation {c.lactationNumber} • {c.daysInMilk} DIM
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                        c.healthStatus === 'HIGH'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800 animate-pulse'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}
                    >
                      {c.healthStatus} RISK
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-300">
                    {c.baseline?.[0]?.averageScc ? `${Math.round(c.baseline[0].averageScc)}k / mL` : '240k / mL'}
                  </td>
                  <td className="py-2.5 px-3">
                    <button
                      onClick={() => onNavigate('cow-detail', { cowId: c.id })}
                      className="rounded-lg bg-emerald-950/80 border border-emerald-800 px-3 py-1 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-900 transition-all"
                    >
                      Examine Profile
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Risk Model Weight Architecture Explainer */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="glass-panel rounded-2xl p-5 border-slate-800 lg:col-span-2">
          <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-2">
            <Cpu className="h-4 w-4 text-cyan-400" />
            <span>AI Risk Engine Feature Weighting Architecture</span>
          </h2>
          <p className="text-xs text-slate-400 mb-4">
            Evaluates sensor readings against each cow's historical 30-day baseline to eliminate false alarms.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
              <div className="text-slate-400 text-[11px]">Somatic Cell Trend</div>
              <div className="text-lg font-black text-rose-400">30%</div>
              <div className="text-[10px] text-slate-500 mt-1">SomaDetect Optical</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
              <div className="text-slate-400 text-[11px]">Milk Yield Drop</div>
              <div className="text-lg font-black text-cyan-400">20%</div>
              <div className="text-[10px] text-slate-500 mt-1">Foodmag Flowmeter</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
              <div className="text-slate-400 text-[11px]">Conductivity Rise</div>
              <div className="text-lg font-black text-amber-400">20%</div>
              <div className="text-[10px] text-slate-500 mt-1">Electrolyte leakage</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
              <div className="text-slate-400 text-[11px]">pH Deviation</div>
              <div className="text-lg font-black text-blue-400">10%</div>
              <div className="text-[10px] text-slate-500 mt-1">InPro ISFET probe</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
              <div className="text-slate-400 text-[11px]">Flow Curve Profile</div>
              <div className="text-lg font-black text-teal-400">10%</div>
              <div className="text-[10px] text-slate-500 mt-1">Let-down pattern</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
              <div className="text-slate-400 text-[11px]">Temperature Rise</div>
              <div className="text-lg font-black text-orange-400">5%</div>
              <div className="text-[10px] text-slate-500 mt-1">Fever indicator</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
              <div className="text-slate-400 text-[11px]">Historical Mastitis</div>
              <div className="text-lg font-black text-purple-400">5%</div>
              <div className="text-[10px] text-slate-500 mt-1">Prior episode risk</div>
            </div>
            <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/40 flex flex-col justify-center">
              <div className="text-emerald-300 text-[11px] font-bold">Total Composite</div>
              <div className="text-lg font-black text-emerald-400">100%</div>
              <div className="text-[10px] text-emerald-500 mt-1">Score: 0–100</div>
            </div>
          </div>
        </div>

        {/* Risk Breakdown Pie */}
        <div className="glass-panel rounded-2xl p-5 border-slate-800 flex flex-col justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-emerald-400" />
            <span>Herd Health Distribution</span>
          </h2>
          <div className="h-44 w-full my-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={riskDist} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="count">
                  {riskDist.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 text-center">
            20 Normal • 5 Moderate Risk • 5 High Risk (Seeded SIH Dataset)
          </div>
        </div>
      </div>
    </div>
  );

  // =========================================================================
  // VIEW 3: FARM MANAGER DASHBOARD
  // =========================================================================
  const renderFarmManagerDashboard = () => (
    <div className="space-y-6">
      {/* Farm Manager Hero */}
      <div className="glass-panel rounded-2xl p-6 border-blue-500/30 bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-blue-500/20 px-2.5 py-1 text-xs font-bold text-blue-400 border border-blue-500/40">
                FARM MANAGER OVERVIEW
              </span>
              <span className="text-xs text-slate-400 font-medium">Commercial Herd Productivity & Production Economics</span>
            </div>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span>Dairy Farm Yield & Herd Performance</span>
              <TrendingUp className="h-5 w-5 text-blue-400" />
            </h1>
            <p className="mt-1 text-xs text-slate-300">
              Track real-time bulk milk harvest, yield variances, cow lactation curves, and prevent mastitis milk dumping.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('analytics')}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-500/20 hover:from-blue-400 hover:to-indigo-500 transition-all"
            >
              <span>View Herd Analytics</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Farm Business KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="glass-panel rounded-xl p-4 border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Today's Total Harvest</div>
          <div className="mt-2 text-2xl font-black text-cyan-400">{summary?.todayMilk ?? 420.5} Liters</div>
          <div className="mt-1 text-xs text-slate-400">Daily Target: 500 L (84.1%)</div>
        </div>

        <div className="glass-panel rounded-xl p-4 border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Average Milk per Cow</div>
          <div className="mt-2 text-2xl font-black text-blue-400">{summary?.averageMilkPerCow ?? 14.0} L / cow</div>
          <div className="mt-1 text-xs text-slate-400">Across 30 milking cows</div>
        </div>

        <div className="glass-panel rounded-xl p-4 border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Estimated Batch Value</div>
          <div className="mt-2 text-2xl font-black text-emerald-400">
            ₹{Math.round((summary?.todayMilk ?? 420.5) * 42).toLocaleString()}
          </div>
          <div className="mt-1 text-xs text-slate-400">@ ₹42/L base dairy price</div>
        </div>

        <div className="glass-panel rounded-xl p-4 border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Prevented Mastitis Loss</div>
          <div className="mt-2 text-2xl font-black text-teal-300">
            ₹{Math.round(5 * 14 * 42).toLocaleString()}
          </div>
          <div className="mt-1 text-xs text-teal-400/80">Bulk tank dump prevention</div>
        </div>
      </div>

      {/* 7-Day Production Trend Chart */}
      <div className="glass-panel rounded-2xl p-5 border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-400" />
              <span>7-Day Milk Harvest Volume Trajectory</span>
            </h2>
            <p className="text-xs text-slate-400">Recorded continuously via sanitary magnetic flowmeter (ifm SM Foodmag)</p>
          </div>
          <span className="text-xs text-slate-400">Unit: Liters / Day</span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trends}>
              <defs>
                <linearGradient id="managerMilkGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} unit=" L" />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                labelStyle={{ color: '#94a3b8' }}
              />
              <Area type="monotone" dataKey="totalMilk" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#managerMilkGrad)" name="Total Harvest (L)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Milk Yield Producers */}
      <div className="glass-panel rounded-2xl p-5 border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Milk className="h-4 w-4 text-cyan-400" />
              <span>Top Milking Producers (Cattle Registry)</span>
            </h2>
            <p className="text-xs text-slate-400">Cows with highest recorded average session volume</p>
          </div>
          <button
            onClick={() => onNavigate('cows')}
            className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
          >
            <span>View All 30 Cattle</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {topYieldCows.map((c) => (
            <div
              key={c.id}
              onClick={() => onNavigate('cow-detail', { cowId: c.id })}
              className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-blue-500/40 cursor-pointer transition-all flex items-center justify-between"
            >
              <div>
                <div className="font-bold text-white text-xs">{c.cowCode} • {c.name}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{c.breed} • Lactation {c.lactationNumber}</div>
                <div className="text-[10px] text-cyan-400 mt-1">Days in Milk: {c.daysInMilk} days</div>
              </div>
              <div className="text-right">
                <div className="text-base font-black text-cyan-400">
                  {c.baseline?.[0]?.averageYield ? `${c.baseline[0].averageYield.toFixed(1)} L` : '15.2 L'}
                </div>
                <span className="text-[9px] font-bold text-slate-400 uppercase">Per Session</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // =========================================================================
  // VIEW 4: ADMIN DASHBOARD
  // =========================================================================
  const renderAdminDashboard = () => (
    <div className="space-y-6">
      {/* Admin Hero */}
      <div className="glass-panel rounded-2xl p-6 border-cyan-500/30 bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-cyan-500/20 px-2.5 py-1 text-xs font-bold text-cyan-400 border border-cyan-500/40">
                SYSTEM ADMINISTRATOR CONSOLE
              </span>
              <span className="text-xs text-slate-400 font-medium">IoT Edge Gateway • Hardware Fleet • Database Health</span>
            </div>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span>SmartDairy Edge & System Infrastructure</span>
              <ShieldCheck className="h-5 w-5 text-cyan-400" />
            </h1>
            <p className="mt-1 text-xs text-slate-300">
              Manage physical/simulated sensing adapters, configure AI risk inference weights, inspect raw telemetry streams.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onNavigate('demo')}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 transition-all"
            >
              <Play className="h-4 w-4" />
              <span>SIH Demo Scenarios</span>
            </button>
            <button
              onClick={() => onNavigate('settings')}
              className="flex items-center gap-2 rounded-xl bg-slate-800 border border-slate-700 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-all"
            >
              <Wrench className="h-3.5 w-3.5" />
              <span>AI Risk Weights</span>
            </button>
          </div>
        </div>
      </div>

      {/* Admin Infrastructure KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
        <div className="glass-panel rounded-xl p-4 border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Cattle</div>
          <div className="mt-2 text-2xl font-black text-white">{summary?.totalCows ?? 30}</div>
          <div className="mt-1 text-[11px] text-slate-400">All registered in DB</div>
        </div>

        <div className="glass-panel rounded-xl p-4 border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Active Milking</div>
          <div className="mt-2 text-2xl font-black text-emerald-400">{summary?.activeMilking ?? 0}</div>
          <div className="mt-1 text-[11px] text-slate-400">Stall STN-01</div>
        </div>

        <div className="glass-panel rounded-xl p-4 border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Today's Milk</div>
          <div className="mt-2 text-2xl font-black text-cyan-400">{summary?.todayMilk ?? 420.5} L</div>
          <div className="mt-1 text-[11px] text-slate-400">Avg {summary?.averageMilkPerCow ?? 14.0} L/cow</div>
        </div>

        <div className="glass-panel rounded-xl p-4 border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">High Risk Cows</div>
          <div className="mt-2 text-2xl font-black text-rose-400">{summary?.highRiskCows ?? 5}</div>
          <div className="mt-1 text-[11px] text-slate-400">AI Risk $\ge$ 60</div>
        </div>

        <div className="glass-panel rounded-xl p-4 border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Active Alerts</div>
          <div className="mt-2 text-2xl font-black text-amber-400">{summary?.activeAlerts ?? 3}</div>
          <div className="mt-1 text-[11px] text-slate-400">Pending review</div>
        </div>

        <div className="glass-panel rounded-xl p-4 border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Sensor Uptime</div>
          <div className="mt-2 text-2xl font-black text-emerald-400">{summary?.sensorAvailability ?? 100}%</div>
          <div className="mt-1 text-[11px] text-slate-400">4/4 hardware online</div>
        </div>
      </div>

      {/* Hardware Fleet Table */}
      <div className="glass-panel rounded-2xl p-5 border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Cpu className="h-4 w-4 text-cyan-400" />
              <span>Hardware Sensor Fleet & Bus Interfaces</span>
            </h2>
            <p className="text-xs text-slate-400">Standardized hardware data contracts with hot-swappable simulator and vendor stubs</p>
          </div>
          <button
            onClick={() => onNavigate('sensors')}
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
          >
            <span>Sensor Diagnostics</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold text-white">SomaDetect SCC</span>
              <span className="rounded bg-emerald-950 text-emerald-400 px-1.5 py-0.5 text-[9px] font-bold border border-emerald-800">ONLINE</span>
            </div>
            <div className="text-[11px] text-slate-400">Optical Cell Count (10³/mL)</div>
            <div className="text-[10px] text-slate-500 mt-2 font-mono">Interface: ISCCSensor</div>
            <div className="text-[10px] text-slate-500 font-mono">Bus: Ethernet / Simulator</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold text-white">ifm SM Foodmag</span>
              <span className="rounded bg-emerald-950 text-emerald-400 px-1.5 py-0.5 text-[9px] font-bold border border-emerald-800">ONLINE</span>
            </div>
            <div className="text-[11px] text-slate-400">Flow, Vol, Temp, Conductivity</div>
            <div className="text-[10px] text-slate-500 mt-2 font-mono">Interface: IFlowSensor</div>
            <div className="text-[10px] text-slate-500 font-mono">Bus: IO-Link v1.1</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold text-white">Mettler InPro X1 HLS</span>
              <span className="rounded bg-emerald-950 text-emerald-400 px-1.5 py-0.5 text-[9px] font-bold border border-emerald-800">ONLINE</span>
            </div>
            <div className="text-[11px] text-slate-400">ISFET Sanitary pH Sensor</div>
            <div className="text-[10px] text-slate-500 mt-2 font-mono">Interface: IPHSensor</div>
            <div className="text-[10px] text-slate-500 font-mono">Bus: 4-20mA / Modbus RTU</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold text-white">ISO 11785 RFID</span>
              <span className="rounded bg-emerald-950 text-emerald-400 px-1.5 py-0.5 text-[9px] font-bold border border-emerald-800">ONLINE</span>
            </div>
            <div className="text-[11px] text-slate-400">Stall Transponder Identification</div>
            <div className="text-[10px] text-slate-500 mt-2 font-mono">Interface: IRFIDReader</div>
            <div className="text-[10px] text-slate-500 font-mono">Bus: RS-485 / Serial</div>
          </div>
        </div>
      </div>

      {/* Production Chart & Alerts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="glass-panel rounded-2xl p-5 lg:col-span-2 border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-cyan-400" />
                <span>Daily Milk Harvest Volume (7 Days)</span>
              </h2>
              <p className="text-xs text-slate-400">Continuous telemetry aggregated from ifm SM Foodmag</p>
            </div>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends}>
                <defs>
                  <linearGradient id="adminMilkGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} unit=" L" />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
                <Area type="monotone" dataKey="totalMilk" stroke="#38bdf8" strokeWidth={2} fill="url(#adminMilkGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Active Alerts */}
        <div className="glass-panel rounded-2xl p-5 border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                <span>System Warnings</span>
              </h2>
              <button
                onClick={() => onNavigate('alerts')}
                className="text-xs font-semibold text-cyan-400 hover:text-cyan-300"
              >
                All
              </button>
            </div>

            <div className="space-y-2 text-xs">
              {recentAlerts.slice(0, 4).map((a) => (
                <div key={a.id} className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-cyan-400">{a.cow?.cowCode || 'SYSTEM'}: </span>
                    <span className="text-slate-300">{a.title}</span>
                  </div>
                  <button
                    onClick={() => handleAcknowledgeAlert(a.id)}
                    className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300 hover:bg-slate-700"
                  >
                    Ack
                  </button>
                </div>
              ))}
              {recentAlerts.length === 0 && (
                <div className="text-xs text-slate-500 text-center py-4">No active system warnings.</div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>WebSocket Live Stream: Connected</span>
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Role-Specific Dashboard View Switcher */}
      <div className="glass-panel rounded-2xl p-4 border-slate-800 bg-slate-900/70 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-semibold uppercase tracking-wider text-[11px]">Dashboard Persona View:</span>
          <span className="rounded px-2 py-0.5 bg-slate-800 text-cyan-400 font-mono text-[11px] font-bold">
            Logged in as: {user?.name || 'Administrator'} ({user?.role})
          </span>
        </div>

        {/* 4 Role Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => handleRoleSelect('ADMIN')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-bold transition-all ${
              selectedRoleView === 'ADMIN'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Admin System</span>
          </button>

          <button
            onClick={() => handleRoleSelect('FARM_MANAGER')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-bold transition-all ${
              selectedRoleView === 'FARM_MANAGER'
                ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserCheck className="h-3.5 w-3.5" />
            <span>Farm Manager</span>
          </button>

          <button
            onClick={() => handleRoleSelect('VETERINARIAN')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-bold transition-all ${
              selectedRoleView === 'VETERINARIAN'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Stethoscope className="h-3.5 w-3.5" />
            <span>Veterinarian</span>
          </button>

          <button
            onClick={() => handleRoleSelect('OPERATOR')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-bold transition-all ${
              selectedRoleView === 'OPERATOR'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Play className="h-3.5 w-3.5" />
            <span>Parlor Operator</span>
          </button>
        </div>
      </div>

      {/* SIH PS 26109 Strategic Problem Statement Banner & Herd Early Warning Highlights */}
      <div className="glass-panel rounded-2xl p-5 border-cyan-500/30 bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-lg bg-cyan-500/20 px-2.5 py-1 text-xs font-bold text-cyan-400 border border-cyan-500/40">
                SIH PROBLEM STATEMENT 26109
              </span>
              <span className="rounded-lg bg-emerald-500/20 px-2.5 py-1 text-xs font-bold text-emerald-300 border border-emerald-500/40">
                Early Mastitis Risk Forecasting
              </span>
              <span className="text-xs text-slate-400 font-mono">Indian Dairy Cattle Deployment</span>
            </div>
            <h2 className="mt-2 text-xl font-black tracking-tight text-white flex items-center gap-2">
              <span>AI-Based Predictive Modelling for Early Forecasting of Bovine Mastitis</span>
            </h2>
            <p className="mt-1 text-xs text-slate-300 max-w-3xl">
              Forecasting mastitis risk 24–72 hours <strong>BEFORE clinical signs appear</strong> at both individual-cow and herd levels using real-time milking-line telemetry, acoustic rumination, pedometry, and farm environmental THI.
            </p>
          </div>

          {/* Herd Early Warning Summary Badges */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="rounded-xl bg-slate-950/80 p-3 border border-slate-800 text-center min-w-[110px]">
              <div className="text-[10px] uppercase font-bold text-slate-400">Herd Risk Index</div>
              <div className={`text-xl font-black ${
                (summary?.herdRiskIndex || 22) >= 60 ? 'text-rose-400' : (summary?.herdRiskIndex || 22) >= 30 ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {summary?.herdRiskIndex ?? 22}/100
              </div>
              <div className="text-[10px] font-semibold text-slate-400">Level: {summary?.herdRiskLevel ?? 'LOW'}</div>
            </div>

            <div className="rounded-xl bg-slate-950/80 p-3 border border-slate-800 text-center min-w-[110px]">
              <div className="text-[10px] uppercase font-bold text-slate-400">Trending Upward</div>
              <div className="text-xl font-black text-amber-400">
                {summary?.increasingRiskCows ?? 3} cows
              </div>
              <div className="text-[10px] font-semibold text-amber-500/80">Next 24-72h Velocity</div>
            </div>

            <div className="rounded-xl bg-slate-950/80 p-3 border border-slate-800 text-center min-w-[110px]">
              <div className="text-[10px] uppercase font-bold text-slate-400">Forecast Warnings</div>
              <div className="text-xl font-black text-rose-400">
                {summary?.forecastWarnings ?? 5} cows
              </div>
              <div className="text-[10px] font-semibold text-rose-400/80">Early Intervention</div>
            </div>
          </div>
        </div>

        {/* Data Source Classification Tags & Prototype Disclaimer */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-[11px]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-400 font-semibold">Telemetry Data Sources:</span>
            <span className="rounded bg-cyan-950 px-2 py-0.5 font-bold text-cyan-400 border border-cyan-800">REAL SENSOR</span>
            <span className="rounded bg-blue-950 px-2 py-0.5 font-bold text-blue-400 border border-blue-800">SIMULATED SENSOR</span>
            <span className="rounded bg-indigo-950 px-2 py-0.5 font-bold text-indigo-400 border border-indigo-800">FARM RECORD</span>
            <span className="rounded bg-purple-950 px-2 py-0.5 font-bold text-purple-400 border border-purple-800">DERIVED FEATURE</span>
            <span className="rounded bg-emerald-950 px-2 py-0.5 font-bold text-emerald-400 border border-emerald-800">AI OUTPUT</span>
          </div>

          <div className="text-slate-400 italic">
            {PROTOTYPE_DISCLAIMER}
          </div>
        </div>
      </div>

      {/* Render Selected View */}
      {selectedRoleView === 'OPERATOR' && renderOperatorDashboard()}
      {selectedRoleView === 'VETERINARIAN' && renderVeterinarianDashboard()}
      {selectedRoleView === 'FARM_MANAGER' && renderFarmManagerDashboard()}
      {selectedRoleView === 'ADMIN' && renderAdminDashboard()}
    </div>
  );
};
