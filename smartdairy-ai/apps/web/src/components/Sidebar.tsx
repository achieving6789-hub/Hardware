import React from 'react';
import {
  LayoutDashboard,
  Activity,
  Users,
  History,
  ShieldAlert,
  Bell,
  Cpu,
  Sparkles,
  BarChart3,
  PlayCircle,
  Settings,
  ShieldCheck,
  UserCheck,
  Stethoscope,
  Play
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
  currentRole?: string;
  onRoleChange?: (role: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  onNavigate,
  currentRole: propRole,
  onRoleChange
}) => {
  const { user } = useAuth();
  const activeRole = propRole || user?.role || 'ADMIN';

  const rolePersonas = [
    { id: 'ADMIN', label: 'Admin', fullTitle: 'System Admin', icon: ShieldCheck, color: 'text-cyan-400' },
    { id: 'FARM_MANAGER', label: 'Farmer', fullTitle: 'Farm Manager', icon: UserCheck, color: 'text-blue-400' },
    { id: 'VETERINARIAN', label: 'Vet', fullTitle: 'Veterinarian', icon: Stethoscope, color: 'text-emerald-400' },
    { id: 'OPERATOR', label: 'Operator', fullTitle: 'Parlor Operator', icon: Play, color: 'text-amber-400' }
  ];

  // Role-tailored navigation items
  const getRoleNavSections = () => {
    switch (activeRole) {
      case 'FARM_MANAGER':
        return [
          {
            title: 'HERD & PRODUCTION',
            items: [
              { id: 'dashboard', label: 'Farm Yield Overview', icon: LayoutDashboard, badge: null },
              { id: 'cows', label: 'Herd Registry & Parity', icon: Users, badge: '30 Cows' },
              { id: 'analytics', label: 'Milk Yield & Economics', icon: BarChart3, badge: 'Trends' },
              { id: 'sessions', label: 'Daily Milking Sessions', icon: History, badge: null }
            ]
          },
          {
            title: 'PARLOR & QUALITY',
            items: [
              { id: 'live-milking', label: 'Parlor Milking Line', icon: Activity, badge: 'STN-01' },
              { id: 'alerts', label: 'Herd Health Alerts', icon: Bell, badge: '!', badgeColor: 'bg-rose-500 text-white' },
              { id: 'cip', label: 'Bulk Line CIP Wash', icon: Sparkles, badge: 'WASH' },
              { id: 'demo', label: 'SIH Presentation Mode', icon: PlayCircle, badge: null }
            ]
          }
        ];

      case 'VETERINARIAN':
        return [
          {
            title: 'CLINICAL SURVEILLANCE',
            items: [
              { id: 'dashboard', label: 'Veterinary Surveillance', icon: LayoutDashboard, badge: null },
              { id: 'health', label: 'Udder Health Center', icon: ShieldAlert, badge: 'AI Triage', badgeColor: 'bg-emerald-500 text-slate-950 font-bold' },
              { id: 'alerts', label: 'Mastitis Early Warnings', icon: Bell, badge: 'Urgent', badgeColor: 'bg-rose-500 text-white' },
              { id: 'cows', label: 'Clinical Cow Dossiers', icon: Users, badge: '30' }
            ]
          },
          {
            title: 'DATA & TELEMETRY',
            items: [
              { id: 'sessions', label: 'Historical Milk Data', icon: History, badge: null },
              { id: 'live-milking', label: 'Live SCC & EC Stream', icon: Activity, badge: 'LIVE' },
              { id: 'demo', label: 'Clinical Demo Scenarios', icon: PlayCircle, badge: '10 Presets' }
            ]
          }
        ];

      case 'OPERATOR':
        return [
          {
            title: 'PARLOR CONTROL',
            items: [
              { id: 'dashboard', label: 'Parlor Command Center', icon: LayoutDashboard, badge: null },
              { id: 'live-milking', label: 'Milking Line Control', icon: Activity, badge: 'ACTIVE', badgeColor: 'bg-emerald-500 text-slate-950 font-bold' },
              { id: 'cip', label: 'CIP Cleaning & Wash', icon: Sparkles, badge: 'ISOLATION', badgeColor: 'bg-cyan-500 text-slate-950 font-bold' },
              { id: 'sessions', label: "Today's Milking Logs", icon: History, badge: null }
            ]
          },
          {
            title: 'EQUIPMENT & TAGS',
            items: [
              { id: 'cows', label: 'RFID Tag Lookup', icon: Users, badge: 'Allflex' },
              { id: 'sensors', label: 'Hardware Sensor Status', icon: Cpu, badge: 'Ready' },
              { id: 'demo', label: 'SIH Operator Presets', icon: PlayCircle, badge: null }
            ]
          }
        ];

      case 'ADMIN':
      default:
        return [
          {
            title: 'SYSTEM & HARDWARE',
            items: [
              { id: 'dashboard', label: 'System Admin Console', icon: LayoutDashboard, badge: null },
              { id: 'live-milking', label: 'Live Milking Telemetry', icon: Activity, badge: '1 Hz' },
              { id: 'sensors', label: 'Hardware Sensor Fleet', icon: Cpu, badge: '4 Online' },
              { id: 'settings', label: 'AI Risk Feature Weights', icon: Settings, badge: 'Config' }
            ]
          },
          {
            title: 'MANAGEMENT & DEMO',
            items: [
              { id: 'demo', label: 'SIH Demo Runner', icon: PlayCircle, badge: '10 Presets', badgeColor: 'bg-cyan-500 text-slate-950 font-bold' },
              { id: 'cows', label: 'Cattle Registry', icon: Users, badge: '30' },
              { id: 'sessions', label: 'Milking Session History', icon: History, badge: null },
              { id: 'cip', label: 'CIP Cleaning Cycle', icon: Sparkles, badge: 'ISOLATED' },
              { id: 'alerts', label: 'System Warnings & Alerts', icon: Bell, badge: '!', badgeColor: 'bg-rose-500 text-white' },
              { id: 'analytics', label: 'Farm Analytics', icon: BarChart3, badge: null }
            ]
          }
        ];
    }
  };

  const navSections = getRoleNavSections();

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-900/60 flex flex-col justify-between py-3 select-none shrink-0 overflow-y-auto">
      <div className="space-y-4 px-3">
        {/* Role Persona Switcher Pill */}
        <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
            <span>Sidebar Persona</span>
            <span className="font-mono text-cyan-400 text-[9px]">{activeRole}</span>
          </div>
          <div className="grid grid-cols-4 gap-1">
            {rolePersonas.map((r) => {
              const Icon = r.icon;
              const isSelected = activeRole === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => onRoleChange && onRoleChange(r.id)}
                  title={`Switch to ${r.fullTitle} navigation`}
                  className={`flex flex-col items-center justify-center p-1.5 rounded-lg text-[10px] font-bold transition-all ${
                    isSelected
                      ? 'bg-slate-800 text-white border border-cyan-500/50 shadow-sm'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 mb-0.5 ${isSelected ? r.color : 'text-slate-400'}`} />
                  <span className="truncate">{r.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Role-Specific Navigation Sections */}
        {navSections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1">
            <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {section.title}
            </div>
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`group flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-cyan-600/15 text-cyan-400 border border-cyan-500/30 font-semibold shadow-sm'
                      : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon
                      className={`h-4 w-4 shrink-0 transition-colors ${
                        isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider shrink-0 ${
                        item.badgeColor || 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Role-Specific Contextual Card at Bottom */}
      <div className="mx-3 mt-4 rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-xs">
        {activeRole === 'FARM_MANAGER' && (
          <div>
            <div className="flex items-center gap-1.5 font-bold text-blue-400 text-[11px]">
              <span>🌾 Commercial Herd Unit</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400 leading-relaxed">
              Target: 500 L/day. Bulk tank dump prevention active on shared line.
            </p>
          </div>
        )}

        {activeRole === 'VETERINARIAN' && (
          <div>
            <div className="flex items-center gap-1.5 font-bold text-emerald-400 text-[11px]">
              <span>🩺 Mastitis Surveillance</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400 leading-relaxed">
              30-Day baseline comparison. Early warning triggered for subclinical cases.
            </p>
          </div>
        )}

        {activeRole === 'OPERATOR' && (
          <div>
            <div className="flex items-center gap-1.5 font-bold text-amber-400 text-[11px]">
              <span>⚙️ Parlor Stall STN-01</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400 leading-relaxed">
              1 Shared line per stall. Cluster interlock armed. CIP wash isolated.
            </p>
          </div>
        )}

        {activeRole === 'ADMIN' && (
          <div>
            <div className="flex items-center gap-1.5 font-bold text-cyan-400 text-[11px]">
              <span>⚡ Edge Gateway Online</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400 leading-relaxed">
              WebSocket 1 Hz stream • SQLite/Postgres DB • Offline memory queue.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
};
