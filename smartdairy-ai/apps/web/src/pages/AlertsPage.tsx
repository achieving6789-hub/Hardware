import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { getSocket } from '../api/socket';
import {
  Bell,
  AlertTriangle,
  CheckCircle,
  Clock,
  Filter,
  ShieldAlert,
  Radio,
  Cpu,
  Sparkles
} from 'lucide-react';

export const AlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  const fetchAlerts = async () => {
    try {
      const res = await api.getAlerts({
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        severity: severityFilter !== 'ALL' ? severityFilter : undefined
      });
      if (res.success) {
        setAlerts(res.alerts || []);
      }
    } catch (err) {
      console.error('Failed to load alerts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();

    const socket = getSocket();
    const handleNewAlert = () => fetchAlerts();
    socket.on('alert:created', handleNewAlert);

    return () => {
      socket.off('alert:created', handleNewAlert);
    };
  }, [statusFilter, severityFilter]);

  const handleAcknowledge = async (alertId: string) => {
    try {
      await api.acknowledgeAlert(alertId, 'Verified and acknowledged by farm staff.');
      fetchAlerts();
    } catch (err) {
      console.error('Failed to acknowledge:', err);
    }
  };

  const handleResolve = async (alertId: string) => {
    try {
      await api.resolveAlert(alertId, 'Physical cow inspection completed. Treatment initiated.');
      fetchAlerts();
    } catch (err) {
      console.error('Failed to resolve:', err);
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'MASTITIS_RISK':
        return <ShieldAlert className="h-5 w-5 text-rose-400" />;
      case 'HIGH_SCC':
        return <Sparkles className="h-5 w-5 text-amber-400" />;
      case 'SENSOR_OFFLINE':
        return <Cpu className="h-5 w-5 text-orange-400" />;
      case 'UNKNOWN_COW':
      case 'RFID_ERROR':
        return <Radio className="h-5 w-5 text-purple-400" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-yellow-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel rounded-2xl p-6 border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Bell className="h-6 w-6 text-rose-400" />
            <span>Farm Alerts & Early-Warning Dispatch</span>
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Automated alerts triggered by multi-sensor deviations and hardware health checks.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-slate-200"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="ACKNOWLEDGED">Acknowledged</option>
            <option value="RESOLVED">Resolved</option>
          </select>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-slate-200"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* Alerts Feed */}
      <div className="space-y-3">
        {alerts.length === 0 ? (
          <div className="glass-panel rounded-2xl p-12 text-center text-slate-500">
            <CheckCircle className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-300">No active alerts matching filter criteria.</p>
            <p className="text-xs text-slate-500 mt-1">Farm sensing systems and animals are performing normally.</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className={`glass-panel rounded-2xl p-5 border transition-all ${
                alert.status === 'ACTIVE'
                  ? alert.severity === 'CRITICAL'
                    ? 'border-rose-500/50 bg-rose-950/20 shadow-lg shadow-rose-950/40'
                    : alert.severity === 'HIGH'
                    ? 'border-orange-500/40 bg-orange-950/10'
                    : 'border-slate-800'
                  : 'border-slate-800/60 opacity-70'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="mt-0.5 p-2 rounded-xl bg-slate-900 border border-slate-800 shrink-0">
                    {getAlertIcon(alert.alertType)}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-white">{alert.title}</span>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-extrabold uppercase ${
                          alert.severity === 'CRITICAL'
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : alert.severity === 'HIGH'
                            ? 'bg-orange-950 text-orange-300 border border-orange-800'
                            : 'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}
                      >
                        {alert.severity}
                      </span>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                          alert.status === 'ACTIVE'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {alert.status}
                      </span>
                    </div>

                    <p className="mt-1.5 text-xs text-slate-300 leading-relaxed">
                      {alert.message}
                    </p>

                    <div className="mt-2.5 flex items-center gap-4 text-[11px] text-slate-400">
                      <span>Cow: <strong className="text-cyan-400">{alert.cow?.cowCode || 'N/A'}</strong></span>
                      <span>Type: <strong className="text-slate-300">{alert.alertType}</strong></span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(alert.createdAt).toLocaleString()}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex sm:flex-col gap-2 shrink-0">
                  {alert.status === 'ACTIVE' && (
                    <>
                      <button
                        onClick={() => handleAcknowledge(alert.id)}
                        className="rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200"
                      >
                        Acknowledge
                      </button>
                      <button
                        onClick={() => handleResolve(alert.id)}
                        className="rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20"
                      >
                        Resolve Alert
                      </button>
                    </>
                  )}
                  {alert.status === 'ACKNOWLEDGED' && (
                    <button
                      onClick={() => handleResolve(alert.id)}
                      className="rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white"
                    >
                      Resolve Alert
                    </button>
                  )}
                  {alert.status === 'RESOLVED' && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                      <CheckCircle className="h-3.5 w-3.5" />
                      <span>Resolved</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
