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
  Play,
  MapPin
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

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
  const { t } = useLanguage();
  const activeRole = propRole || user?.role || 'ADMIN';

  const rolePersonas = [
    { id: 'ADMIN', label: 'Admin', fullTitle: 'System Admin', icon: ShieldCheck, color: 'text-cyan-400' },
    { id: 'FARM_MANAGER', label: 'Farmer', fullTitle: 'Farm Manager', icon: UserCheck, color: 'text-blue-400' },
    { id: 'VETERINARIAN', label: 'Vet', fullTitle: 'Veterinarian', icon: Stethoscope, color: 'text-emerald-400' },
    { id: 'OPERATOR', label: 'Operator', fullTitle: 'Parlor Operator', icon: Play, color: 'text-amber-400' }
  ];

  // Role-tailored navigation items with Farm Map included
  const getRoleNavSections = () => {
    switch (activeRole) {
      case 'FARM_MANAGER':
        return [
          {
            title: 'HERD & PRODUCTION',
            items: [
              { id: 'dashboard', label: t('nav.dashboard'), icon: LayoutDashboard, badge: null },
              { id: 'farm-map', label: t('nav.farm_map'), icon: MapPin, badge: 'GPS', badgeColor: 'bg-cyan-500 text-slate-950 font-bold' },
              { id: 'cows', label: t('nav.cattle_herd'), icon: Users, badge: '30' },
              { id: 'analytics', label: t('nav.analytics'), icon: BarChart3, badge: 'Trends' },
              { id: 'sessions', label: 'Milking Logs', icon: History, badge: null }
            ]
          },
          {
            title: 'PARLOR & QUALITY',
            items: [
              { id: 'live-milking', label: t('nav.live_milking'), icon: Activity, badge: 'STN-01' },
              { id: 'alerts', label: t('nav.alerts'), icon: Bell, badge: '!', badgeColor: 'bg-rose-500 text-white' },
              { id: 'cip', label: t('nav.cip_cleaning'), icon: Sparkles, badge: 'WASH' },
              { id: 'demo', label: t('nav.simulation'), icon: PlayCircle, badge: null }
            ]
          }
        ];

      case 'VETERINARIAN':
        return [
          {
            title: 'CLINICAL SURVEILLANCE',
            items: [
              { id: 'dashboard', label: t('nav.dashboard'), icon: LayoutDashboard, badge: null },
              { id: 'farm-map', label: t('nav.farm_map'), icon: MapPin, badge: 'Triage', badgeColor: 'bg-emerald-500 text-slate-950 font-bold' },
              { id: 'health', label: 'Udder Health Center', icon: ShieldAlert, badge: 'AI', badgeColor: 'bg-emerald-500 text-slate-950 font-bold' },
              { id: 'alerts', label: t('nav.alerts'), icon: Bell, badge: 'Urgent', badgeColor: 'bg-rose-500 text-white' },
              { id: 'cows', label: t('nav.cattle_herd'), icon: Users, badge: '30' }
            ]
          },
          {
            title: 'DATA & TELEMETRY',
            items: [
              { id: 'sessions', label: 'Historical Milk Data', icon: History, badge: null },
              { id: 'live-milking', label: t('nav.live_milking'), icon: Activity, badge: 'LIVE' },
              { id: 'demo', label: t('nav.simulation'), icon: PlayCircle, badge: '10' }
            ]
          }
        ];

      case 'OPERATOR':
        return [
          {
            title: 'PARLOR CONTROL',
            items: [
              { id: 'dashboard', label: t('nav.dashboard'), icon: LayoutDashboard, badge: null },
              { id: 'live-milking', label: t('nav.live_milking'), icon: Activity, badge: 'ACTIVE', badgeColor: 'bg-emerald-500 text-slate-950 font-bold' },
              { id: 'farm-map', label: t('nav.farm_map'), icon: MapPin, badge: 'GPS' },
              { id: 'cip', label: t('nav.cip_cleaning'), icon: Sparkles, badge: 'WASH' },
              { id: 'sessions', label: 'Milking Logs', icon: History, badge: null }
            ]
          },
          {
            title: 'EQUIPMENT & TAGS',
            items: [
              { id: 'cows', label: t('nav.cattle_herd'), icon: Users, badge: 'RFID' },
              { id: 'sensors', label: t('nav.sensor_line'), icon: Cpu, badge: 'Ready' },
              { id: 'demo', label: t('nav.simulation'), icon: PlayCircle, badge: null }
            ]
          }
        ];

      case 'ADMIN':
      default:
        return [
          {
            title: 'SYSTEM & HARDWARE',
            items: [
              { id: 'dashboard', label: t('nav.dashboard'), icon: LayoutDashboard, badge: null },
              { id: 'farm-map', label: t('nav.farm_map'), icon: MapPin, badge: 'LIVE GPS', badgeColor: 'bg-cyan-500 text-slate-950 font-bold' },
              { id: 'live-milking', label: t('nav.live_milking'), icon: Activity, badge: '1 Hz' },
              { id: 'sensors', label: t('nav.sensor_line'), icon: Cpu, badge: '4 Online' },
              { id: 'settings', label: t('nav.settings'), icon: Settings, badge: 'Config' }
            ]
          },
          {
            title: 'MANAGEMENT & DEMO',
            items: [
              { id: 'demo', label: t('nav.simulation'), icon: PlayCircle, badge: 'Presets', badgeColor: 'bg-cyan-500 text-slate-950 font-bold' },
              { id: 'cows', label: t('nav.cattle_herd'), icon: Users, badge: '30' },
              { id: 'sessions', label: 'Session History', icon: History, badge: null },
              { id: 'cip', label: t('nav.cip_cleaning'), icon: Sparkles, badge: 'ISOLATED' },
              { id: 'alerts', label: t('nav.alerts'), icon: Bell, badge: '!', badgeColor: 'bg-rose-500 text-white' },
              { id: 'analytics', label: t('nav.analytics'), icon: BarChart3, badge: null }
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
                  className={`flex flex-col items-center justify-center p-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
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
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/10 text-cyan-400 border border-cyan-500/30 font-bold'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`h-4 w-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
                        item.badgeColor || 'bg-slate-800 text-slate-400 border border-slate-700'
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

      {/* Footer Info */}
      <div className="px-4 pt-3 border-t border-slate-800/80 text-[10px] text-slate-500 flex items-center justify-between">
        <span>SmartDairy v1.0</span>
        <span className="font-mono text-cyan-500/80">SIH 2026</span>
      </div>
    </aside>
  );
};
