import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import {
  History,
  Search,
  Filter,
  Eye,
  X,
  Droplet,
  Sparkles,
  Zap,
  Activity,
  ShieldAlert,
  ChevronLeft,
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

export const SessionsPage: React.FC = () => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [selectedSession, setSelectedSession] = useState<any | null>(null);
  const [sessionReadings, setSessionReadings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSessions = async () => {
    setIsLoading(true);
    try {
      const res = await api.getSessions({
        page,
        limit: 20,
        riskLevel: riskFilter !== 'ALL' ? riskFilter : undefined
      });
      if (res.success) {
        setSessions(res.sessions || []);
        setTotal(res.total || 0);
      }
    } catch (err) {
      console.error('Failed to load sessions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [page, riskFilter]);

  const handleOpenDetail = async (sessionId: string) => {
    try {
      const res = await api.getSession(sessionId);
      if (res.success) {
        setSelectedSession(res.session);
        setSessionReadings(res.session.readings || []);
      }
    } catch (err) {
      console.error('Failed to load session details:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel rounded-2xl p-6 border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <History className="h-6 w-6 text-cyan-400" />
            <span>Milking Sessions History</span>
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Log of shared-line sensor sessions, milk yields, and AI mastitis risk predictions ({total} total).
          </p>
        </div>

        <div className="flex gap-2">
          <select
            value={riskFilter}
            onChange={(e) => {
              setRiskFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-slate-200"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="LOW">Low Risk</option>
            <option value="MODERATE">Moderate Risk</option>
            <option value="HIGH">High Risk</option>
            <option value="VERY_HIGH">Very High</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel rounded-2xl border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold text-[10px]">
              <tr>
                <th className="py-3 px-4">Session Code</th>
                <th className="py-3 px-4">Cow</th>
                <th className="py-3 px-4">Station</th>
                <th className="py-3 px-4">Start Time</th>
                <th className="py-3 px-4">Harvest Volume</th>
                <th className="py-3 px-4">Avg Flow</th>
                <th className="py-3 px-4">Avg SCC</th>
                <th className="py-3 px-4">Avg EC</th>
                <th className="py-3 px-4">AI Risk</th>
                <th className="py-3 px-4 text-right">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {sessions.map((s) => (
                <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-cyan-400">{s.sessionCode}</td>
                  <td className="py-3 px-4 font-semibold text-slate-200">
                    {s.cow ? `${s.cow.cowCode} (${s.cow.name})` : <span className="text-amber-400">UNIDENTIFIED</span>}
                  </td>
                  <td className="py-3 px-4 text-slate-400">{s.station?.stationCode || 'STN-01'}</td>
                  <td className="py-3 px-4 text-slate-400">
                    {new Date(s.startTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-100">{s.totalVolume} L</td>
                  <td className="py-3 px-4 text-slate-300">{s.averageFlow} L/m</td>
                  <td className="py-3 px-4 text-amber-300">{s.averageScc} k/mL</td>
                  <td className="py-3 px-4 text-emerald-300">{s.averageConductivity} mS</td>
                  <td className="py-3 px-4">
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                        s.riskLevel === 'HIGH' || s.riskLevel === 'VERY_HIGH'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : s.riskLevel === 'MODERATE'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}
                    >
                      {s.riskLevel} ({s.riskScore?.toFixed(0)})
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleOpenDetail(s.id)}
                      className="rounded-lg bg-slate-800 p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-700"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between p-4 border-t border-slate-800 text-xs text-slate-400">
          <div>Showing Page {page} of {Math.ceil(total / 20) || 1}</div>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="rounded-lg bg-slate-800 px-3 py-1.5 text-slate-300 disabled:opacity-30"
            >
              Previous
            </button>
            <button
              disabled={page >= Math.ceil(total / 20)}
              onClick={() => setPage(page + 1)}
              className="rounded-lg bg-slate-800 px-3 py-1.5 text-slate-300 disabled:opacity-30"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Session Detail Drawer / Modal */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-3xl rounded-2xl p-6 border-slate-700 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>Session: {selectedSession.sessionCode}</span>
                  <span className="rounded-full bg-cyan-950 border border-cyan-800 px-2 py-0.5 text-xs text-cyan-400 font-mono">
                    {selectedSession.station?.stationCode}
                  </span>
                </h2>
                <div className="text-xs text-slate-400 mt-1">
                  Cow: <strong className="text-slate-200">{selectedSession.cow?.cowCode || 'UNIDENTIFIED'}</strong> ({selectedSession.cow?.name}) · Breed: {selectedSession.cow?.breed}
                </div>
              </div>
              <button
                onClick={() => setSelectedSession(null)}
                className="rounded-lg bg-slate-800 p-2 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-4 text-xs">
              <div className="rounded-xl bg-slate-900 p-3 border border-slate-800">
                <span className="text-slate-400">Total Yield:</span>
                <div className="text-base font-bold text-white mt-0.5">{selectedSession.totalVolume} L</div>
              </div>
              <div className="rounded-xl bg-slate-900 p-3 border border-slate-800">
                <span className="text-slate-400">Average SCC:</span>
                <div className="text-base font-bold text-amber-300 mt-0.5">{selectedSession.averageScc} k/mL</div>
              </div>
              <div className="rounded-xl bg-slate-900 p-3 border border-slate-800">
                <span className="text-slate-400">Conductivity:</span>
                <div className="text-base font-bold text-emerald-300 mt-0.5">{selectedSession.averageConductivity} mS/cm</div>
              </div>
              <div className="rounded-xl bg-slate-900 p-3 border border-slate-800">
                <span className="text-slate-400">Milk pH:</span>
                <div className="text-base font-bold text-slate-200 mt-0.5">{selectedSession.averagePh}</div>
              </div>
            </div>

            {/* AI Prediction Explanation */}
            {selectedSession.predictions?.[0] && (
              <div className="rounded-xl bg-slate-900 p-4 border border-cyan-500/30 mb-4">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                    <ShieldAlert className="h-4 w-4" />
                    <span>AI Risk Assessment & Contributing Factors</span>
                  </div>
                  <span className="text-xs font-extrabold text-white">
                    Score: {selectedSession.predictions[0].riskScore} ({selectedSession.predictions[0].riskLevel})
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {selectedSession.predictions[0].explanation}
                </p>
              </div>
            )}

            {/* Time-series chart if readings exist */}
            {sessionReadings.length > 0 && (
              <div>
                <div className="text-xs font-bold text-slate-300 mb-2">Session Inline Flow Curve</div>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sessionReadings}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="timestamp" stroke="#64748b" tick={false} />
                      <YAxis stroke="#64748b" fontSize={10} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                      <Line type="monotone" dataKey="flowRate" stroke="#38bdf8" strokeWidth={2} dot={false} name="Flow Rate (L/min)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
