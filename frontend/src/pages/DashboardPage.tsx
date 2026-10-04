import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { getSocket } from '../api/socket';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
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
  const { t, language } = useLanguage();
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
                {language === 'ta' ? 'பால் கறவை ஆபரேட்டர் கட்டளை' : 'PARLOR OPERATOR COMMAND'}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {language === 'ta' ? 'அரங்கம் 01 • இணைக்கப்பட்ட உணரி வரிசை' : 'Stall 01 • Shared Inline Sensing Line'}
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-white flex items-center gap-3">
              <span>{language === 'ta' ? 'நிலையம் STN-01 பால் கறவை அரங்கம் கட்டுப்பாடு' : 'Station STN-01 Milking Parlor Control'}</span>
              {summary?.activeMilking > 0 ? (
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-950 px-3 py-0.5 text-xs font-bold text-emerald-400 border border-emerald-800">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                  {language === 'ta' ? 'பால் கறவை நடக்கிறது' : 'MILKING ACTIVE'}
                </span>
              ) : (
                <span className="rounded-full bg-slate-800 px-3 py-0.5 text-xs font-bold text-slate-300 border border-slate-700">
                  {language === 'ta' ? 'நிலையம் தயார்' : 'STATION READY'}
                </span>
              )}
            </h1>
            <p className="mt-1 text-xs text-slate-300">
              {language === 'ta'
                ? 'கதவு பூட்டு கட்டுப்பாடு, RFID ஸ்கேன் சரிபார்ப்பு, நேரலை பாய்வு கண்காணிப்பு மற்றும் CIP சுத்திகரிப்பு.'
                : 'Control parlor latching, verify Allflex RFID gate scans, monitor real-time flowrate, and trigger CIP wash isolation.'}
            </p>
          </div>

          {/* Quick Action Center */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleQuickOperatorMilking}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-500 transition-all cursor-pointer"
            >
              <Play className="h-4 w-4" />
              <span>{language === 'ta' ? 'பால் கறவையை தொடங்கு (மாடு 01)' : 'Start Milking (Cow 01)'}</span>
            </button>
            <button
              onClick={handleQuickOperatorStop}
              className="flex items-center gap-2 rounded-xl bg-slate-800 border border-slate-700 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-rose-950/40 hover:text-rose-300 hover:border-rose-800 transition-all cursor-pointer"
            >
              <span>{language === 'ta' ? 'நிறுத்து & கழற்று' : 'Stop & Detach'}</span>
            </button>
            <button
              onClick={() => onNavigate('cip')}
              className="flex items-center gap-2 rounded-xl bg-cyan-950/80 border border-cyan-800 px-4 py-2.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-900 transition-all cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>{language === 'ta' ? 'CIP கழுவல்' : 'CIP Wash'}</span>
            </button>
          </div>
        </div>

        {actionFeedback && (
          <div className="mt-4 rounded-xl bg-slate-800/90 border border-slate-700 p-3 text-xs text-cyan-300 flex items-center justify-between">
            <span>{actionFeedback}</span>
            <button onClick={() => setActionFeedback(null)} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
          </div>
        )}
      </div>

      {/* Operator Live Parlor KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="glass-panel rounded-xl p-4 border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            {language === 'ta' ? 'கறவை அரங்கம் நிலை' : 'Milking Stall State'}
          </div>
          <div className="mt-2 text-xl font-black text-white">
            {summary?.activeMilking > 0
              ? (language === 'ta' ? 'பால் பாய்கிறது' : 'Pumping Milk')
              : (language === 'ta' ? 'காத்திருப்பு / தயார்' : 'Idle / Gate Ready')}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            {language === 'ta' ? 'அரங்கிற்கு ஒரு பொது வரிசை' : '1 Shared Line per Stall'}
          </div>
        </div>

        <div className="glass-panel rounded-xl p-4 border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            {language === 'ta' ? 'ஷிப்ட் பால் கறவை' : 'Shift Milk Harvested'}
          </div>
          <div className="mt-2 text-xl font-black text-cyan-400">
            {summary?.todayMilk ?? 420.5} {language === 'ta' ? 'லிட்டர்' : 'Liters'}
          </div>
          <div className="mt-1 text-xs text-slate-400">ifm Foodmag Flowmeter</div>
        </div>

        <div className="glass-panel rounded-xl p-4 border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            {language === 'ta' ? 'இன்று கறவை செய்யப்பட்டவை' : 'Cows Processed Today'}
          </div>
          <div className="mt-2 text-xl font-black text-emerald-400">
            {cows.length} {language === 'ta' ? 'மாடுகள்' : 'Cows Checked'}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            {language === 'ta' ? 'அனைத்து பதிவு செய்யப்பட்ட மாடுகள்' : 'All registered transponders'}
          </div>
        </div>

        <div className="glass-panel rounded-xl p-4 border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            {language === 'ta' ? 'சுத்திகரிப்பு நிலை' : 'Sanitation Status'}
          </div>
          <div className="mt-2 text-xl font-black text-teal-300">
            {language === 'ta' ? 'CIP தயார்' : 'CIP PASS'}
          </div>
          <div className="mt-1 text-xs text-teal-400/90">
            {language === 'ta' ? 'பாதுகாப்பு பூட்டு சரிபார்க்கப்பட்டது' : 'Sanitary interlock verified'}
          </div>
        </div>
      </div>

      {/* Sensor Readiness & Live Line Visualizer */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="glass-panel rounded-2xl p-5 lg:col-span-2 border-slate-800">
          <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
            <Radio className="h-4 w-4 text-amber-400" />
            <span>{language === 'ta' ? 'உணரி வன்பொருள் தயார் நிலை (STN-01)' : 'Inline Sensing Hardware Readiness (Station STN-01)'}</span>
          </h2>
          <p className="text-xs text-slate-400 mb-4">
            {language === 'ta'
              ? 'உணரிகள் பால் குழாயில் நேரடியாக இணைக்கப்பட்டுள்ளன. RFID ஸ்கேன் மூலம் மாட்டின் கணக்கோடு இணைகிறது.'
              : 'Sensors inline directly on the sanitary stainless milk line. RFID scan binds stream to cow profile.'}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-200">SomaDetect Optical Cell Counter</div>
                <div className="text-[11px] text-slate-400">Inline Optical Scatter SCC</div>
              </div>
              <span className="rounded bg-emerald-950 text-emerald-400 px-2 py-1 text-[10px] font-bold border border-emerald-800">
                {language === 'ta' ? 'தயார்' : 'READY'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-200">ifm SM Foodmag (IO-Link)</div>
                <div className="text-[11px] text-slate-400">Flow, Volume, Temp, EC</div>
              </div>
              <span className="rounded bg-emerald-950 text-emerald-400 px-2 py-1 text-[10px] font-bold border border-emerald-800">
                {language === 'ta' ? 'இணைப்பில்' : 'ONLINE'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-200">Mettler Toledo InPro X1 HLS</div>
                <div className="text-[11px] text-slate-400">ISFET Sanitary pH Sensor</div>
              </div>
              <span className="rounded bg-emerald-950 text-emerald-400 px-2 py-1 text-[10px] font-bold border border-emerald-800">
                {language === 'ta' ? 'அளவீடு' : 'CALIBRATED'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-200">ISO 11785 RFID Transceiver</div>
                <div className="text-[11px] text-slate-400">Stall Entry Gate Transponder</div>
              </div>
              <span className="rounded bg-cyan-950 text-cyan-300 px-2 py-1 text-[10px] font-bold border border-cyan-800">
                {language === 'ta' ? 'செயலில்' : 'ARMED'}
              </span>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-amber-400/90 font-medium">
              {language === 'ta'
                ? '💡 நினைவூட்டல்: ஒவ்வொரு மாட்டிற்கும் காம்பு கோப்பைகளை தவறாமல் சுத்தம் செய்யவும்.'
                : '💡 Operator Reminder: Always ensure teat cup sanitation between animals.'}
            </span>
            <button
              onClick={() => onNavigate('live-milking')}
              className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
            >
              <span>{language === 'ta' ? 'நேரலை காட்சி திறக்க' : 'Open Live Visualizer'}</span>
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
                <span>{language === 'ta' ? 'CIP வரிசை தனிமைப்படுத்தல்' : 'CIP Line Isolation'}</span>
              </h3>
              <span className="rounded bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 text-[10px] font-bold">
                {language === 'ta' ? 'செயலில்' : 'ENFORCED'}
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-3">
              {language === 'ta'
                ? 'ரசாயன சுத்திகரிப்பின் போது பால் கறவை முற்றிலும் முடக்கப்படுகிறது.'
                : 'During chemical sanitation flush, cow milking sessions are strictly blocked.'}
            </p>
            <div className="rounded-xl bg-slate-950/80 border border-cyan-500/30 p-3 text-[11px] text-cyan-300 font-semibold">
              "{CIP_ISOLATION_NOTICE}"
            </div>
          </div>

          <button
            onClick={() => onNavigate('cip')}
            className="w-full mt-4 flex items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 py-2.5 text-xs font-bold text-slate-200 transition-all border border-slate-700 cursor-pointer"
          >
            <span>{language === 'ta' ? 'CIP சுத்திகரிப்பு முறை காண்க' : 'View CIP Cleaning System'}</span>
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
                {language === 'ta' ? 'கால்நடை மருத்துவ கண்காணிப்பு' : 'CLINICAL VETERINARY SURVEILLANCE'}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {language === 'ta' ? 'மடி சுகாதாரம் & முன்கூட்டிய மடிநோய் கண்டறிதல்' : 'Udder Health & Early Mastitis Triage'}
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span>{language === 'ta' ? 'மந்தை மடிநோய் முன்கூட்டிய எச்சரிக்கை பலகை' : 'Herd Mastitis Early-Warning Console'}</span>
              <Stethoscope className="h-5 w-5 text-emerald-400" />
            </h1>
            <p className="mt-1 text-xs text-slate-300">
              {language === 'ta'
                ? '30-நாள் ஒப்பீட்டு தரவுகள் (SCC, மின் கடத்துதிறன், பால் சரிவு, pH மாறுபாடு).'
                : 'Personalized 30-day baseline comparison (SCC, electrical conductivity, milk yield drop, pH deviation).'}
            </p>
            <div className="mt-2 text-[11px] text-amber-400/90 font-medium">
              ⚠️ {language === 'ta' ? 'SIH மாதிரி முன்மாதிரி — மருத்துவ பரிசோதனைக்கு மாற்றானது அல்ல.' : PROTOTYPE_DISCLAIMER}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('health')}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-500 transition-all cursor-pointer"
            >
              <ShieldAlert className="h-4 w-4" />
              <span>{language === 'ta' ? 'மடிநோய் மையம் திறக்க' : 'Open Udder Health Center'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Clinical KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="glass-panel rounded-xl p-4 border-rose-500/30 bg-rose-950/10">
          <div className="text-[11px] font-semibold text-rose-300 uppercase tracking-wider">
            {language === 'ta' ? 'தீவிர மடிநோய் மாடுகள்' : 'Critical Mastitis Cases'}
          </div>
          <div className="mt-2 text-2xl font-black text-rose-400">
            {highRiskCows.length} {language === 'ta' ? 'மாடுகள்' : 'Cows'}
          </div>
          <div className="mt-1 text-xs text-rose-300/80">
            {language === 'ta' ? 'உடனடி மருத்துவ கவனிப்பு தேவை' : 'Immediate clinical review needed'}
          </div>
        </div>

        <div className="glass-panel rounded-xl p-4 border-amber-500/30 bg-amber-950/10">
          <div className="text-[11px] font-semibold text-amber-300 uppercase tracking-wider">
            {language === 'ta' ? 'அறிகுறிக்கு முந்தைய எச்சரிக்கைகள்' : 'Subclinical Warnings'}
          </div>
          <div className="mt-2 text-2xl font-black text-amber-400">
            {moderateRiskCows.length} {language === 'ta' ? 'மாடுகள்' : 'Cows'}
          </div>
          <div className="mt-1 text-xs text-amber-300/80">
            {language === 'ta' ? 'அதிகரிக்கும் SCC / மின்கடத்து திறன்' : 'Elevated SCC / conductivity trend'}
          </div>
        </div>

        <div className="glass-panel rounded-xl p-4 border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            {language === 'ta' ? 'ஆரோக்கியமான மாடுகள் விகிதம்' : 'Healthy Herd Ratio'}
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-400">
            {cows.length > 0 ? Math.round(((cows.length - clinicalAttentionCows.length) / cows.length) * 100) : 80}%
          </div>
          <div className="mt-1 text-xs text-slate-400">
            {language === 'ta' ? 'குறைந்த ஆபத்து நிலை' : 'Low Risk baseline conformity'}
          </div>
        </div>

        <div className="glass-panel rounded-xl p-4 border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            {language === 'ta' ? 'செயலில் உள்ள மருத்துவ எச்சரிக்கைகள்' : 'Active Clinical Alerts'}
          </div>
          <div className="mt-2 text-2xl font-black text-cyan-400">
            {summary?.activeAlerts ?? 3} {language === 'ta' ? 'எச்சரிக்கைகள்' : 'Alerts'}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            {language === 'ta' ? 'AI கணிப்பு அமைப்பால் உருவாக்கப்பட்டது' : 'Generated by AI Risk Engine'}
          </div>
        </div>
      </div>

      {/* Clinical Urgent Attention Table */}
      <div className="glass-panel rounded-2xl p-5 border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-400" />
              <span>{language === 'ta' ? 'மருத்துவ கவனிப்பு தேவைப்படும் மாடுகள் (அதிக & மிதமான ஆபத்து)' : 'Cattle Requiring Veterinary Attention (High & Moderate Risk)'}</span>
            </h2>
            <p className="text-xs text-slate-400">
              {language === 'ta'
                ? '30-நாள் பதிவுகளோடு ஒப்பிட்டு தானியங்கி முறையில் கண்டறியப்பட்டது'
                : 'Automated triage based on multi-parameter deviation from 30-day baseline'}
            </p>
          </div>
          <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-300">
            {clinicalAttentionCows.length} {language === 'ta' ? 'மாடுகள்' : 'Animals Flagged'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">{language === 'ta' ? 'மாடு குறியீடு' : 'Cow Code'}</th>
                <th className="py-2.5 px-3">{language === 'ta' ? 'பெயர் & இனம்' : 'Name & Breed'}</th>
                <th className="py-2.5 px-3">{language === 'ta' ? 'ஈற்று / கறவை நாட்கள்' : 'Parity / DIM'}</th>
                <th className="py-2.5 px-3">{language === 'ta' ? 'ஆபத்து நிலை' : 'Risk Level'}</th>
                <th className="py-2.5 px-3">{language === 'ta' ? 'சராசரி SCC' : 'Avg Baseline SCC'}</th>
                <th className="py-2.5 px-3">{language === 'ta' ? 'மருத்துவ நடவடிக்கை' : 'Clinical Action'}</th>
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
                    {language === 'ta' ? 'ஈற்றுமுறை' : 'Lactation'} {c.lactationNumber} • {c.daysInMilk} {language === 'ta' ? 'நாட்கள்' : 'DIM'}
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                        c.healthStatus === 'HIGH'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800 animate-pulse'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}
                    >
                      {c.healthStatus} {language === 'ta' ? 'அபாயம்' : 'RISK'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-300">
                    {c.baseline?.[0]?.averageScc ? `${Math.round(c.baseline[0].averageScc)}k / mL` : '240k / mL'}
                  </td>
                  <td className="py-2.5 px-3">
                    <button
                      onClick={() => onNavigate('cow-detail', { cowId: c.id })}
                      className="rounded-lg bg-emerald-950/80 border border-emerald-800 px-3 py-1 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-900 transition-all cursor-pointer"
                    >
                      {language === 'ta' ? 'விவரம் காண்க' : 'Examine Profile'}
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
            <span>{language === 'ta' ? 'AI மடிநோய் காரணிகளின் எடை கட்டமைப்பு' : 'AI Risk Engine Feature Weighting Architecture'}</span>
          </h2>
          <p className="text-xs text-slate-400 mb-4">
            {language === 'ta'
              ? 'தவறான எச்சரிக்கைகளை தவிர்க்க 30-நாள் வரலாற்று பதிவுகளோடு சென்சார் தகவல்களை ஒப்பிடுகிறது.'
              : "Evaluates sensor readings against each cow's historical 30-day baseline to eliminate false alarms."}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
              <div className="text-slate-400 text-[11px]">{language === 'ta' ? 'SCC உயிரணு போக்கு' : 'Somatic Cell Trend'}</div>
              <div className="text-lg font-black text-rose-400">30%</div>
              <div className="text-[10px] text-slate-500 mt-1">SomaDetect Optical</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
              <div className="text-slate-400 text-[11px]">{language === 'ta' ? 'பால் அளவு சரிவு' : 'Milk Yield Drop'}</div>
              <div className="text-lg font-black text-cyan-400">20%</div>
              <div className="text-[10px] text-slate-500 mt-1">Foodmag Flowmeter</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
              <div className="text-slate-400 text-[11px]">{language === 'ta' ? 'மின்கடத்து திறன் உயர்வு' : 'Conductivity Rise'}</div>
              <div className="text-lg font-black text-amber-400">20%</div>
              <div className="text-[10px] text-slate-500 mt-1">Electrolyte leakage</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
              <div className="text-slate-400 text-[11px]">{language === 'ta' ? 'pH மாறுபாடு' : 'pH Deviation'}</div>
              <div className="text-lg font-black text-blue-400">10%</div>
              <div className="text-[10px] text-slate-500 mt-1">InPro ISFET probe</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
              <div className="text-slate-400 text-[11px]">{language === 'ta' ? 'பால் பாயும் விதம்' : 'Flow Curve Profile'}</div>
              <div className="text-lg font-black text-teal-400">10%</div>
              <div className="text-[10px] text-slate-500 mt-1">Let-down pattern</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
              <div className="text-slate-400 text-[11px]">{language === 'ta' ? 'வெப்பநிலை உயர்வு' : 'Temperature Rise'}</div>
              <div className="text-lg font-black text-orange-400">5%</div>
              <div className="text-[10px] text-slate-500 mt-1">Fever indicator</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
              <div className="text-slate-400 text-[11px]">{language === 'ta' ? 'முந்தைய மடிநோய் வரலாறு' : 'Historical Mastitis'}</div>
              <div className="text-lg font-black text-purple-400">5%</div>
              <div className="text-[10px] text-slate-500 mt-1">Prior episode risk</div>
            </div>
            <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/40 flex flex-col justify-center">
              <div className="text-emerald-300 text-[11px] font-bold">{language === 'ta' ? 'மொத்த கூட்டு மதிப்பீடு' : 'Total Composite'}</div>
              <div className="text-lg font-black text-emerald-400">100%</div>
              <div className="text-[10px] text-emerald-500 mt-1">Score: 0–100</div>
            </div>
          </div>
        </div>

        {/* Risk Breakdown Pie */}
        <div className="glass-panel rounded-2xl p-5 border-slate-800 flex flex-col justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-emerald-400" />
            <span>{language === 'ta' ? 'மந்தை ஆரோக்கிய பரவல்' : 'Herd Health Distribution'}</span>
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
                {language === 'ta' ? 'விவசாயி பண்ணை மேலோட்டம்' : language === 'hi' ? 'किसान फार्म अवलोकन' : 'FARM MANAGER OVERVIEW'}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {language === 'ta' ? 'பால் பண்ணை உற்பத்தி & பொருளாதார மேலாண்மை' : 'Commercial Herd Productivity & Production Economics'}
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span>{language === 'ta' ? 'பால் பண்ணை உற்பத்தி & மாடுகள் செயல்திறன்' : 'Dairy Farm Yield & Herd Performance'}</span>
              <TrendingUp className="h-5 w-5 text-blue-400" />
            </h1>
            <p className="mt-1 text-xs text-slate-300">
              {language === 'ta'
                ? 'நேரலை மொத்த பால் கறவை, உற்பத்தி மாறுபாடுகள், கறவை போக்கு மற்றும் மடிநோயால் பால் விரயமாவதை முன்கூட்டியே தடுத்தல்.'
                : 'Track real-time bulk milk harvest, yield variances, cow lactation curves, and prevent mastitis milk dumping.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('analytics')}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-500/20 hover:from-blue-400 hover:to-indigo-500 transition-all cursor-pointer"
            >
              <span>{language === 'ta' ? 'மந்தை பகுப்பாய்வு காண்க' : 'View Herd Analytics'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Farm Business KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="glass-panel rounded-xl p-4 border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            {language === 'ta' ? 'இன்றைய மொத்த பால் கறவை' : "Today's Total Harvest"}
          </div>
          <div className="mt-2 text-2xl font-black text-cyan-400">
            {summary?.todayMilk ?? 420.5} {language === 'ta' ? 'லிட்டர்' : 'Liters'}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            {language === 'ta' ? 'தினசரி இலக்கு: 500 லி (84.1%)' : 'Daily Target: 500 L (84.1%)'}
          </div>
        </div>

        <div className="glass-panel rounded-xl p-4 border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            {language === 'ta' ? 'மாடு ஒன்றுக்கு சராசரி பால்' : 'Average Milk per Cow'}
          </div>
          <div className="mt-2 text-2xl font-black text-blue-400">
            {summary?.averageMilkPerCow ?? 14.0} {language === 'ta' ? 'லி / மாடு' : 'L / cow'}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            {language === 'ta' ? '30 பால் கறக்கும் மாடுகள்' : 'Across 30 milking cows'}
          </div>
        </div>

        <div className="glass-panel rounded-xl p-4 border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            {language === 'ta' ? 'மதிப்பிடப்பட்ட பால் மதிப்பு' : 'Estimated Batch Value'}
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-400">
            ₹{Math.round((summary?.todayMilk ?? 420.5) * 42).toLocaleString()}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            {language === 'ta' ? 'அடிப்படை விலை ₹42/லிட்டர்' : '@ ₹42/L base dairy price'}
          </div>
        </div>

        <div className="glass-panel rounded-xl p-4 border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            {language === 'ta' ? 'தடுக்கப்பட்ட மடிநோய் இழப்பு' : 'Prevented Mastitis Loss'}
          </div>
          <div className="mt-2 text-2xl font-black text-teal-300">
            ₹{Math.round(5 * 14 * 42).toLocaleString()}
          </div>
          <div className="mt-1 text-xs text-teal-400/80">
            {language === 'ta' ? 'பால் தொட்டி வீணடிப்பு தவிர்ப்பு' : 'Bulk tank dump prevention'}
          </div>
        </div>
      </div>

      {/* 7-Day Production Trend Chart */}
      <div className="glass-panel rounded-2xl p-5 border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-400" />
              <span>{language === 'ta' ? '7-நாள் பால் உற்பத்தி வரைபடம்' : '7-Day Milk Harvest Volume Trajectory'}</span>
            </h2>
            <p className="text-xs text-slate-400">
              {language === 'ta'
                ? 'துல்லியமான காந்தப் பாய்வுமானி (ifm SM Foodmag) மூலம் தொடர்ந்து பதிவு செய்யப்பட்டது'
                : 'Recorded continuously via sanitary magnetic flowmeter (ifm SM Foodmag)'}
            </p>
          </div>
          <span className="text-xs text-slate-400">
            {language === 'ta' ? 'அலகு: லிட்டர் / நாள்' : 'Unit: Liters / Day'}
          </span>
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
              <Area
                type="monotone"
                dataKey="totalMilk"
                stroke="#3b82f6"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#managerMilkGrad)"
                name={language === 'ta' ? 'மொத்த கறவை (லி)' : 'Total Harvest (L)'}
              />
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
              <span>{language === 'ta' ? 'அதிக பால் தரும் சிறந்த மாடுகள் (மந்தை பதிவேடு)' : 'Top Milking Producers (Cattle Registry)'}</span>
            </h2>
            <p className="text-xs text-slate-400">
              {language === 'ta' ? 'அதிக சராசரி கறவை அளவு கொண்ட மாடுகள்' : 'Cows with highest recorded average session volume'}
            </p>
          </div>
          <button
            onClick={() => onNavigate('cows')}
            className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
          >
            <span>{language === 'ta' ? 'அனைத்து 30 மாடுகளையும் காண்க' : 'View All 30 Cattle'}</span>
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
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {c.breed} • {language === 'ta' ? 'ஈற்றுமுறை' : 'Lactation'} {c.lactationNumber}
                </div>
                <div className="text-[10px] text-cyan-400 mt-1">
                  {language === 'ta' ? 'கறவை நாட்கள்:' : 'Days in Milk:'} {c.daysInMilk} {language === 'ta' ? 'நாட்கள்' : 'days'}
                </div>
              </div>
              <div className="text-right">
                <div className="text-base font-black text-cyan-400">
                  {c.baseline?.[0]?.averageYield ? `${c.baseline[0].averageYield.toFixed(1)} L` : '15.2 L'}
                </div>
                <span className="text-[9px] font-bold text-slate-400 uppercase">
                  {language === 'ta' ? 'ஒரு முறைக்கு' : 'Per Session'}
                </span>
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
                {t('dash.admin_console')}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {language === 'ta' ? 'IoT எட்ஜ் கேட்வே • சென்சார் கட்டமைப்பு' : 'IoT Edge Gateway • Hardware Fleet • Database Health'}
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span>{language === 'ta' ? 'ஸ்மார்ட் டெய்ரி கட்டுப்பாட்டு கட்டமைப்பு' : 'SmartDairy Edge & System Infrastructure'}</span>
              <ShieldCheck className="h-5 w-5 text-cyan-400" />
            </h1>
            <p className="mt-1 text-xs text-slate-300">
              {t('dash.admin_desc')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onNavigate('demo')}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 transition-all cursor-pointer"
            >
              <Play className="h-4 w-4" />
              <span>{t('dash.sih_scenarios')}</span>
            </button>
            <button
              onClick={() => onNavigate('settings')}
              className="flex items-center gap-2 rounded-xl bg-slate-800 border border-slate-700 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-all cursor-pointer"
            >
              <Wrench className="h-3.5 w-3.5" />
              <span>{t('dash.ai_weights')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Admin Infrastructure KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
        <div className="glass-panel rounded-xl p-4 border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t('dash.total_cattle')}</div>
          <div className="mt-2 text-2xl font-black text-white">{summary?.totalCows ?? 31}</div>
          <div className="mt-1 text-[11px] text-slate-400">{t('dash.all_registered')}</div>
        </div>

        <div className="glass-panel rounded-xl p-4 border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t('dash.active_milking')}</div>
          <div className="mt-2 text-2xl font-black text-emerald-400">{summary?.activeMilking ?? 0}</div>
          <div className="mt-1 text-[11px] text-slate-400">{language === 'ta' ? 'அரங்கம் STN-01' : 'Stall STN-01'}</div>
        </div>

        <div className="glass-panel rounded-xl p-4 border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t('dash.todays_milk')}</div>
          <div className="mt-2 text-2xl font-black text-cyan-400">{summary?.todayMilk ?? 420.5} L</div>
          <div className="mt-1 text-[11px] text-slate-400">
            {language === 'ta' ? 'சராசரி' : 'Avg'} {summary?.averageMilkPerCow ?? 14.0} L/cow
          </div>
        </div>

        <div className="glass-panel rounded-xl p-4 border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t('dash.high_risk_cows')}</div>
          <div className="mt-2 text-2xl font-black text-rose-400">{summary?.highRiskCows ?? 5}</div>
          <div className="mt-1 text-[11px] text-rose-300/80">AI Risk &ge; 60</div>
        </div>

        <div className="glass-panel rounded-xl p-4 border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t('dash.active_alerts')}</div>
          <div className="mt-2 text-2xl font-black text-amber-400">{summary?.activeAlerts ?? 3}</div>
          <div className="mt-1 text-[11px] text-slate-400">
            {language === 'ta' ? 'மதிப்பாய்வு தேவை' : 'Pending review'}
          </div>
        </div>

        <div className="glass-panel rounded-xl p-4 border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t('dash.sensor_uptime')}</div>
          <div className="mt-2 text-2xl font-black text-emerald-400">{summary?.sensorAvailability ?? 100}%</div>
          <div className="mt-1 text-[11px] text-slate-400">
            {language === 'ta' ? '4/4 உணரிகள் தயார்' : '4/4 hardware online'}
          </div>
        </div>
      </div>

      {/* Hardware Fleet Table */}
      <div className="glass-panel rounded-2xl p-5 border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Cpu className="h-4 w-4 text-cyan-400" />
              <span>{language === 'ta' ? 'சென்சார் தொகுப்பு & இணைப்பு அமைப்புகள்' : 'Hardware Sensor Fleet & Bus Interfaces'}</span>
            </h2>
            <p className="text-xs text-slate-400">
              {language === 'ta'
                ? 'நிலையான வன்பொருள் தரவு இடைமுகம் மற்றும் சிமுலேட்டர் தொகுதிகள்'
                : 'Standardized hardware data contracts with hot-swappable simulator and vendor stubs'}
            </p>
          </div>
          <button
            onClick={() => onNavigate('sensors')}
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
          >
            <span>{language === 'ta' ? 'சென்சார் கண்டறிதல்' : 'Sensor Diagnostics'}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold text-white">SomaDetect SCC</span>
              <span className="rounded bg-emerald-950 text-emerald-400 px-1.5 py-0.5 text-[9px] font-bold border border-emerald-800">
                {language === 'ta' ? 'இணைப்பில்' : 'ONLINE'}
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              {language === 'ta' ? 'ஒளியியல் உயிரணு எண்ணிக்கை (10³/mL)' : 'Optical Cell Count (10³/mL)'}
            </div>
            <div className="text-[10px] text-slate-500 mt-2 font-mono">Interface: ISCCSensor</div>
            <div className="text-[10px] text-slate-500 font-mono">Bus: Ethernet / Simulator</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold text-white">ifm SM Foodmag</span>
              <span className="rounded bg-emerald-950 text-emerald-400 px-1.5 py-0.5 text-[9px] font-bold border border-emerald-800">
                {language === 'ta' ? 'இணைப்பில்' : 'ONLINE'}
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              {language === 'ta' ? 'பாய்வு, அளவு, வெப்பநிலை, கடத்து திறன்' : 'Flow, Vol, Temp, Conductivity'}
            </div>
            <div className="text-[10px] text-slate-500 mt-2 font-mono">Interface: IFlowSensor</div>
            <div className="text-[10px] text-slate-500 font-mono">Bus: IO-Link v1.1</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold text-white">Mettler InPro X1 HLS</span>
              <span className="rounded bg-emerald-950 text-emerald-400 px-1.5 py-0.5 text-[9px] font-bold border border-emerald-800">
                {language === 'ta' ? 'இணைப்பில்' : 'ONLINE'}
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              {language === 'ta' ? 'சுகாதார pH சென்சார்' : 'ISFET Sanitary pH Sensor'}
            </div>
            <div className="text-[10px] text-slate-500 mt-2 font-mono">Interface: IPHSensor</div>
            <div className="text-[10px] text-slate-500 font-mono">Bus: 4-20mA / Modbus RTU</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold text-white">ISO 11785 RFID</span>
              <span className="rounded bg-emerald-950 text-emerald-400 px-1.5 py-0.5 text-[9px] font-bold border border-emerald-800">
                {language === 'ta' ? 'இணைப்பில்' : 'ONLINE'}
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              {language === 'ta' ? 'மாடு அடையாள குறிப்பான் ரீடர்' : 'Stall Transponder Identification'}
            </div>
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
                <span>{language === 'ta' ? 'தினசரி பால் உற்பத்தி அளவு (7 நாட்கள்)' : 'Daily Milk Harvest Volume (7 Days)'}</span>
              </h2>
              <p className="text-xs text-slate-400">
                {language === 'ta'
                  ? 'ifm SM Foodmag சென்சாரில் இருந்து பெறப்பட்ட தொடர் தரவு'
                  : 'Continuous telemetry aggregated from ifm SM Foodmag'}
              </p>
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
                <span>{language === 'ta' ? 'கணினி எச்சரிக்கைகள்' : 'System Warnings'}</span>
              </h2>
              <button
                onClick={() => onNavigate('alerts')}
                className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 cursor-pointer"
              >
                {language === 'ta' ? 'அனைத்தும்' : 'All'}
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
                    className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300 hover:bg-slate-700 cursor-pointer"
                  >
                    {language === 'ta' ? 'சரி' : 'Ack'}
                  </button>
                </div>
              ))}
              {recentAlerts.length === 0 && (
                <div className="text-xs text-slate-500 text-center py-4">
                  {language === 'ta' ? 'செயலில் உள்ள கணினி எச்சரிக்கைகள் இல்லை.' : 'No active system warnings.'}
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>{language === 'ta' ? 'நேரலை இணைப்பு: இயக்கத்தில் உள்ளது' : 'WebSocket Live Stream: Connected'}</span>
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
          <span className="text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
            {language === 'ta' ? 'பயனர் பார்வை:' : 'Dashboard Persona View:'}
          </span>
          <span className="rounded px-2 py-0.5 bg-slate-800 text-cyan-400 font-mono text-[11px] font-bold">
            {language === 'ta' ? 'உள்நுழைந்துள்ளவர்:' : 'Logged in as:'} {user?.name || (language === 'ta' ? 'நிர்வாகி' : 'Administrator')} ({user?.role === 'ADMIN' ? (language === 'ta' ? 'அரசு / நிர்வாகி' : 'ADMIN') : user?.role === 'FARM_MANAGER' ? (language === 'ta' ? 'விவசாயி' : 'FARM_MANAGER') : user?.role === 'VETERINARIAN' ? (language === 'ta' ? 'மருத்துவர்' : 'VET') : (language === 'ta' ? 'ஆபரேட்டர்' : 'OPERATOR')})
          </span>
        </div>

        {/* 4 Role Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => handleRoleSelect('ADMIN')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-bold transition-all cursor-pointer ${
              selectedRoleView === 'ADMIN'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>{language === 'ta' ? 'அரசு / நிர்வாகம்' : language === 'hi' ? 'एडमिन सिस्टम' : 'Admin System'}</span>
          </button>

          <button
            onClick={() => handleRoleSelect('FARM_MANAGER')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-bold transition-all cursor-pointer ${
              selectedRoleView === 'FARM_MANAGER'
                ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserCheck className="h-3.5 w-3.5" />
            <span>{language === 'ta' ? 'விவசாயி' : language === 'hi' ? 'किसान' : 'Farm Manager'}</span>
          </button>

          <button
            onClick={() => handleRoleSelect('VETERINARIAN')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-bold transition-all cursor-pointer ${
              selectedRoleView === 'VETERINARIAN'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Stethoscope className="h-3.5 w-3.5" />
            <span>{language === 'ta' ? 'கால்நடை மருத்துவர்' : language === 'hi' ? 'पशु चिकित्सक' : 'Veterinarian'}</span>
          </button>

          <button
            onClick={() => handleRoleSelect('OPERATOR')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-bold transition-all cursor-pointer ${
              selectedRoleView === 'OPERATOR'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Play className="h-3.5 w-3.5" />
            <span>{language === 'ta' ? 'பால் கறவை ஆபரேட்டர்' : language === 'hi' ? 'ऑपरेटर' : 'Parlor Operator'}</span>
          </button>
        </div>
      </div>

      {/* SIH PS 26109 Strategic Problem Statement Banner & Herd Early Warning Highlights */}
      <div className="glass-panel rounded-2xl p-5 border-cyan-500/30 bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-lg bg-cyan-500/20 px-2.5 py-1 text-xs font-bold text-cyan-400 border border-cyan-500/40">
                {t('dash.problem_statement')}
              </span>
              <span className="rounded-lg bg-emerald-500/20 px-2.5 py-1 text-xs font-bold text-emerald-300 border border-emerald-500/40">
                {language === 'ta' ? 'முன்கூட்டிய மடிநோய் கண்டறிதல்' : 'Early Mastitis Risk Forecasting'}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {language === 'ta' ? 'இந்திய பால் பண்ணை பயன்பாடு' : 'Indian Dairy Cattle Deployment'}
              </span>
            </div>
            <h2 className="mt-2 text-xl font-black tracking-tight text-white flex items-center gap-2">
              <span>{t('dash.mastitis_title')}</span>
            </h2>
            <p className="mt-1 text-xs text-slate-300 max-w-3xl">
              {t('dash.mastitis_desc')}
            </p>
          </div>

          {/* Herd Early Warning Summary Badges */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="rounded-xl bg-slate-950/80 p-3 border border-slate-800 text-center min-w-[110px]">
              <div className="text-[10px] uppercase font-bold text-slate-400">{t('dash.herd_risk_index')}</div>
              <div className={`text-xl font-black ${
                (summary?.herdRiskIndex || 22) >= 60 ? 'text-rose-400' : (summary?.herdRiskIndex || 22) >= 30 ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {summary?.herdRiskIndex ?? 22}/100
              </div>
              <div className="text-[10px] font-semibold text-slate-400">
                {language === 'ta' ? 'நிலை:' : 'Level:'} {summary?.herdRiskLevel ?? 'LOW'}
              </div>
            </div>

            <div className="rounded-xl bg-slate-950/80 p-3 border border-slate-800 text-center min-w-[110px]">
              <div className="text-[10px] uppercase font-bold text-slate-400">{t('dash.trending_upward')}</div>
              <div className="text-xl font-black text-amber-400">
                {summary?.increasingRiskCows ?? 3} {language === 'ta' ? 'மாடுகள்' : 'cows'}
              </div>
              <div className="text-[10px] font-semibold text-amber-500/80">
                {language === 'ta' ? 'அடுத்த 24-72 மணி' : 'Next 24-72h Velocity'}
              </div>
            </div>

            <div className="rounded-xl bg-slate-950/80 p-3 border border-slate-800 text-center min-w-[110px]">
              <div className="text-[10px] uppercase font-bold text-slate-400">{t('dash.forecast_warnings')}</div>
              <div className="text-xl font-black text-rose-400">
                {summary?.forecastWarnings ?? 5} {language === 'ta' ? 'மாடுகள்' : 'cows'}
              </div>
              <div className="text-[10px] font-semibold text-rose-400/80">{t('dash.early_intervention')}</div>
            </div>
          </div>
        </div>

        {/* Data Source Classification Tags & Prototype Disclaimer */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-[11px]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-400 font-semibold">
              {language === 'ta' ? 'உணரி தரவு ஆதாரங்கள்:' : 'Telemetry Data Sources:'}
            </span>
            <span className="rounded bg-cyan-950 px-2 py-0.5 font-bold text-cyan-400 border border-cyan-800">{t('dash.sources_real')}</span>
            <span className="rounded bg-blue-950 px-2 py-0.5 font-bold text-blue-400 border border-blue-800">{t('dash.sources_sim')}</span>
            <span className="rounded bg-indigo-950 px-2 py-0.5 font-bold text-indigo-400 border border-indigo-800">{t('dash.sources_rec')}</span>
            <span className="rounded bg-purple-950 px-2 py-0.5 font-bold text-purple-400 border border-purple-800">{language === 'ta' ? 'வழித்தோன்றல் காரணி' : 'DERIVED FEATURE'}</span>
            <span className="rounded bg-emerald-950 px-2 py-0.5 font-bold text-emerald-400 border border-emerald-800">{t('dash.sources_ai')}</span>
          </div>

          <div className="text-slate-400 italic">
            {language === 'ta'
              ? 'SIH மாதிரி முன்மாதிரி — மருத்துவ பரிசோதனைக்கு மாற்றானது அல்ல.'
              : PROTOTYPE_DISCLAIMER}
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
