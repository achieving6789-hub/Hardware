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
  MapPin,
  AlertOctagon
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
  const { t, language } = useLanguage();
  const activeRole = propRole || user?.role || 'ADMIN';

  const rolePersonas = [
    {
      id: 'ADMIN',
      label: language === 'ta' ? 'அரசு/நிர்வாகி' : language === 'hi' ? 'एडमिन' : 'Admin',
      fullTitle: 'Govt / System Admin',
      icon: ShieldCheck,
      color: 'text-cyan-400'
    },
    {
      id: 'FARM_MANAGER',
      label: language === 'ta' ? 'விவசாயி' : language === 'hi' ? 'किसान' : 'Farmer',
      fullTitle: 'Farm Manager / Farmer',
      icon: UserCheck,
      color: 'text-blue-400'
    },
    {
      id: 'VETERINARIAN',
      label: language === 'ta' ? 'மருத்துவர்' : language === 'hi' ? 'पशु चिकित्सक' : 'Vet',
      fullTitle: 'Veterinarian',
      icon: Stethoscope,
      color: 'text-emerald-400'
    },
    {
      id: 'OPERATOR',
      label: language === 'ta' ? 'ஆபரேட்டர்' : language === 'hi' ? 'ऑपरेटर' : 'Operator',
      fullTitle: 'Parlor Operator',
      icon: Play,
      color: 'text-amber-400'
    }
  ];

  // Role-tailored navigation items:
  // Strict rule: DO NOT show map for Farmer (FARM_MANAGER) or Operator.
  // ONLY ADMIN (Govt) and VET have access to the Danger/Outbreak Risk Map!
  const getRoleNavSections = () => {
    switch (activeRole) {
      case 'FARM_MANAGER':
        // FARMER / FARM MANAGER - NO MAP
        return [
          {
            title: language === 'ta' ? 'மந்தை & உற்பத்தி' : language === 'hi' ? 'झुंड एवं उत्पादन' : 'HERD & PRODUCTION',
            items: [
              { id: 'dashboard', label: t('nav.dashboard'), icon: LayoutDashboard, badge: null },
              { id: 'cows', label: t('nav.cattle_herd'), icon: Users, badge: '31' },
              { id: 'analytics', label: t('nav.analytics'), icon: BarChart3, badge: language === 'ta' ? 'போக்கு' : 'Trends' },
              { id: 'sessions', label: t('nav.sessions'), icon: History, badge: null }
            ]
          },
          {
            title: language === 'ta' ? 'பால் கறவை & தரம்' : language === 'hi' ? 'दुग्ध दोहन एवं गुणवत्ता' : 'PARLOR & QUALITY',
            items: [
              { id: 'live-milking', label: t('nav.live_milking'), icon: Activity, badge: 'STN-01' },
              { id: 'alerts', label: t('nav.alerts'), icon: Bell, badge: '!', badgeColor: 'bg-rose-500 text-white' },
              { id: 'cip', label: t('nav.cip_cleaning'), icon: Sparkles, badge: language === 'ta' ? 'கழுவல்' : 'WASH' },
              { id: 'demo', label: t('nav.simulation'), icon: PlayCircle, badge: null }
            ]
          }
        ];

      case 'VETERINARIAN':
        // VETERINARIAN - HAS DANGER & EPIDEMIC MAP
        return [
          {
            title: language === 'ta' ? 'மருத்துவ கண்காணிப்பு' : language === 'hi' ? 'चिकित्सा निगरानी' : 'CLINICAL SURVEILLANCE',
            items: [
              { id: 'dashboard', label: t('nav.dashboard'), icon: LayoutDashboard, badge: null },
              {
                id: 'farm-map',
                label: t('nav.vet_danger_map'),
                icon: AlertOctagon,
                badge: language === 'ta' ? 'அபாயம்' : 'DANGER',
                badgeColor: 'bg-rose-600 text-white font-bold animate-pulse'
              },
              { id: 'health', label: language === 'ta' ? 'மடிநோய் மையம்' : language === 'hi' ? 'थनैला केंद्र' : 'Udder Health Center', icon: ShieldAlert, badge: 'AI', badgeColor: 'bg-emerald-500 text-slate-950 font-bold' },
              { id: 'alerts', label: t('nav.alerts'), icon: Bell, badge: language === 'ta' ? 'அவசரம்' : 'Urgent', badgeColor: 'bg-rose-500 text-white' },
              { id: 'cows', label: t('nav.cattle_herd'), icon: Users, badge: '31' }
            ]
          },
          {
            title: language === 'ta' ? 'தொற்று தரவுகள்' : language === 'hi' ? 'महामारी डेटा' : 'DATA & TELEMETRY',
            items: [
              { id: 'sessions', label: t('nav.sessions'), icon: History, badge: null },
              { id: 'live-milking', label: t('nav.live_milking'), icon: Activity, badge: language === 'ta' ? 'நேரலை' : 'LIVE' },
              { id: 'demo', label: t('nav.simulation'), icon: PlayCircle, badge: '10' }
            ]
          }
        ];

      case 'OPERATOR':
        // PARLOR OPERATOR - NO MAP
        return [
          {
            title: language === 'ta' ? 'பால் கறவை கட்டுப்பாடு' : language === 'hi' ? 'दोहन नियंत्रण' : 'PARLOR CONTROL',
            items: [
              { id: 'dashboard', label: t('nav.dashboard'), icon: LayoutDashboard, badge: null },
              { id: 'live-milking', label: t('nav.live_milking'), icon: Activity, badge: language === 'ta' ? 'செயலில்' : 'ACTIVE', badgeColor: 'bg-emerald-500 text-slate-950 font-bold' },
              { id: 'cip', label: t('nav.cip_cleaning'), icon: Sparkles, badge: language === 'ta' ? 'கழுவல்' : 'WASH' },
              { id: 'sessions', label: t('nav.sessions'), icon: History, badge: null }
            ]
          },
          {
            title: language === 'ta' ? 'உணரிகள் & குறிப்பான்கள்' : language === 'hi' ? 'सेंसर एवं टैग्स' : 'EQUIPMENT & TAGS',
            items: [
              { id: 'cows', label: t('nav.cattle_herd'), icon: Users, badge: 'RFID' },
              { id: 'sensors', label: t('nav.sensor_line'), icon: Cpu, badge: language === 'ta' ? 'தயார்' : 'Ready' },
              { id: 'demo', label: t('nav.simulation'), icon: PlayCircle, badge: null }
            ]
          }
        ];

      case 'ADMIN':
      default:
        // ADMIN / GOVT - HAS OUTBREAK & DANGER RISK MAP
        return [
          {
            title: language === 'ta' ? 'அரசு & சென்சார் மேலாண்மை' : language === 'hi' ? 'सरकारी एवं सेंसर प्रबंधन' : 'GOVT & SENSOR SYSTEM',
            items: [
              { id: 'dashboard', label: t('nav.dashboard'), icon: LayoutDashboard, badge: null },
              {
                id: 'farm-map',
                label: t('nav.danger_map'),
                icon: AlertOctagon,
                badge: language === 'ta' ? 'அபாயம்' : 'DANGER',
                badgeColor: 'bg-rose-600 text-white font-bold animate-pulse'
              },
              { id: 'live-milking', label: t('nav.live_milking'), icon: Activity, badge: '1 Hz' },
              { id: 'sensors', label: t('nav.sensor_line'), icon: Cpu, badge: language === 'ta' ? '4 தயார்' : '4 Online' },
              { id: 'settings', label: t('nav.settings'), icon: Settings, badge: language === 'ta' ? 'அமைப்பு' : 'Config' }
            ]
          },
          {
            title: language === 'ta' ? 'கண்காணிப்பு & சோதனைகள்' : language === 'hi' ? 'निगरानी एवं सिमुलेशन' : 'MANAGEMENT & DEMO',
            items: [
              { id: 'demo', label: t('nav.simulation'), icon: PlayCircle, badge: language === 'ta' ? 'மாதிரி' : 'Presets', badgeColor: 'bg-cyan-500 text-slate-950 font-bold' },
              { id: 'cows', label: t('nav.cattle_herd'), icon: Users, badge: '31' },
              { id: 'sessions', label: t('nav.sessions'), icon: History, badge: null },
              { id: 'cip', label: t('nav.cip_cleaning'), icon: Sparkles, badge: language === 'ta' ? 'தனிமை' : 'ISOLATED' },
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
            <span>{language === 'ta' ? 'பயனர் பொறுப்பு' : language === 'hi' ? 'भूमिका' : 'Sidebar Persona'}</span>
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
