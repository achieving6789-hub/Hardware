import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { getSocket } from '../api/socket';
import {
  Bell,
  Wifi,
  WifiOff,
  LogOut,
  Activity,
  Database,
  Languages
} from 'lucide-react';

interface HeaderProps {
  onNavigate: (page: string) => void;
  activePage: string;
}

export const Header: React.FC<HeaderProps> = ({ onNavigate }) => {
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [activeAlertCount, setActiveAlertCount] = useState(3);

  useEffect(() => {
    const socket = getSocket();
    setIsSocketConnected(socket.connected);

    socket.on('connect', () => setIsSocketConnected(true));
    socket.on('disconnect', () => setIsSocketConnected(false));
    socket.on('alert:created', () => setActiveAlertCount((prev) => prev + 1));

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('alert:created');
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-800 bg-slate-900/90 px-4 sm:px-6 backdrop-blur-md">
      {/* Brand & Tagline */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 font-bold text-white shadow-lg shadow-cyan-500/20">
          🥛
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-black tracking-tight text-white">
              {t('brand.title')}
            </span>
            <span className="rounded-full bg-cyan-950/80 px-2 py-0.5 text-[10px] font-bold tracking-wider text-cyan-400 border border-cyan-700/80">
              SIH PS 26109
            </span>
            <span className="hidden xl:inline-block rounded-full bg-emerald-950/80 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-800">
              Early Mastitis Risk Forecasting
            </span>
          </div>
          <p className="text-xs text-slate-400 hidden sm:block truncate max-w-xl">
            {t('brand.subtitle')}
          </p>
        </div>
      </div>

      {/* Real-time telemetry indicators & Profile */}
      <div className="flex items-center gap-2 sm:gap-3.5">
        {/* Hardware Line Status */}
        <div className="hidden lg:flex items-center gap-2 rounded-lg bg-slate-800/80 px-3 py-1.5 border border-slate-700/60 text-xs">
          <Activity className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
          <span className="text-slate-400">Line:</span>
          <span className="font-semibold text-slate-200">STN-01 (Shared Inline)</span>
        </div>

        {/* Demo Database Mode Badge */}
        <div
          className="hidden md:flex items-center gap-1.5 rounded-full bg-cyan-950/60 border border-cyan-500/40 px-2.5 py-1 text-xs text-cyan-300 font-medium"
          title="Operating on isolated demo database (demo.db). The original dev.db is untouched."
        >
          <Database className="h-3.5 w-3.5 text-cyan-400" />
          <span>{t('badge.demo_db')}</span>
        </div>

        {/* Multi-Language Selector Dropdown / Pills */}
        <div className="flex items-center gap-1 rounded-xl bg-slate-800/90 border border-slate-700/80 p-1 text-xs">
          <Languages className="h-3.5 w-3.5 text-slate-400 ml-1 hidden sm:inline" />
          <button
            onClick={() => setLanguage('en')}
            className={`px-2 py-0.5 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
              language === 'en' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
            title="English"
          >
            EN
          </button>
          <button
            onClick={() => setLanguage('ta')}
            className={`px-2 py-0.5 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
              language === 'ta' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
            title="தமிழ் (Tamil)"
          >
            தமிழ்
          </button>
          <button
            onClick={() => setLanguage('hi')}
            className={`px-2 py-0.5 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
              language === 'hi' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
            title="हिंदी (Hindi)"
          >
            हिंदी
          </button>
        </div>

        {/* Live Socket status */}
        <div className="flex items-center gap-1.5 rounded-full bg-slate-800 px-2.5 py-1 text-xs text-slate-300 border border-slate-700">
          {isSocketConnected ? (
            <>
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <Wifi className="h-3.5 w-3.5 text-emerald-400" />
              <span className="hidden xl:inline text-[11px] font-medium text-emerald-400">
                {t('badge.telemetry_live')}
              </span>
            </>
          ) : (
            <>
              <WifiOff className="h-3.5 w-3.5 text-rose-400" />
              <span className="hidden xl:inline text-[11px] font-medium text-rose-400">
                {t('badge.connecting')}
              </span>
            </>
          )}
        </div>

        {/* Alerts Pill */}
        <button
          onClick={() => onNavigate('alerts')}
          className="relative flex items-center justify-center rounded-lg bg-slate-800 p-2 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
          title={t('header.alerts')}
        >
          <Bell className="h-4 w-4" />
          {activeAlertCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-md">
              {activeAlertCount}
            </span>
          )}
        </button>

        {/* User Role & Logout */}
        <div className="flex items-center gap-2 border-l border-slate-800 pl-2 sm:pl-3">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-semibold text-slate-200">{user?.name}</div>
            <div className="text-[10px] uppercase tracking-wider font-bold text-cyan-400">
              {user?.role}
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center justify-center rounded-lg bg-slate-800 p-2 text-slate-400 hover:bg-rose-950/50 hover:text-rose-400 transition-colors cursor-pointer"
            title={t('header.logout')}
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
