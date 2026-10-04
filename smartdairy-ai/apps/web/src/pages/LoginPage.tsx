import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  ShieldCheck,
  UserCheck,
  Stethoscope,
  Play,
  LogIn,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  Database,
  Building2,
  Languages
} from 'lucide-react';
import { PROTOTYPE_DISCLAIMER, UserRole } from '@smartdairy/shared';

export const LoginPage: React.FC = () => {
  const { login, register, quickLogin, isLoading } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Login form state
  const [email, setEmail] = useState('admin@smartdairy.local');
  const [password, setPassword] = useState('Admin@123');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regRole, setRegRole] = useState<UserRole>(UserRole.OPERATOR);
  const [regFarmName, setRegFarmName] = useState('SmartDairy Demo Farm');

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (regPassword !== regConfirmPassword) {
      setError('Passwords do not match. Please verify your password.');
      return;
    }

    if (regPassword.length < 4) {
      setError('Password must be at least 4 characters long.');
      return;
    }

    try {
      await register({
        name: regName,
        email: regEmail,
        password: regPassword,
        role: regRole,
        farmName: regFarmName
      });
      setSuccessMsg('Registration successful! Your account is saved in demo.db.');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    }
  };

  const handleRoleQuickLogin = async (role: 'ADMIN' | 'FARM_MANAGER' | 'VETERINARIAN' | 'OPERATOR') => {
    setError(null);
    setSuccessMsg(null);
    try {
      await quickLogin(role);
    } catch (err: any) {
      setError(err.message || 'Quick login failed.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Language Switcher */}
      <div className="absolute top-6 right-6 z-20 flex items-center gap-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80 p-1.5 shadow-xl">
        <Languages className="h-4 w-4 text-cyan-400 ml-1" />
        <button
          onClick={() => setLanguage('en')}
          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            language === 'en' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          English
        </button>
        <button
          onClick={() => setLanguage('ta')}
          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            language === 'ta' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          தமிழ்
        </button>
        <button
          onClick={() => setLanguage('hi')}
          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            language === 'hi' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          हिंदी
        </button>
      </div>

      <div className="w-full max-w-xl z-10">
        {/* Brand header */}
        <div className="text-center mb-6">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-500 text-3xl shadow-xl shadow-cyan-500/20 mb-3 border border-cyan-400/30">
            🥛
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            SmartDairy <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">AI</span>
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            {t('brand.subtitle')}
          </p>
          <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-slate-900 border border-slate-800 px-3.5 py-1 text-xs text-cyan-400 shadow-inner">
            <span>{t('brand.prototype')}</span>
          </div>
        </div>

        {/* Database Status Pill Banner */}
        <div className="mb-4 flex items-center justify-between rounded-xl bg-cyan-950/50 border border-cyan-500/30 px-4 py-2.5 text-xs text-cyan-200">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-cyan-400 shrink-0" />
            <span>
              <strong>{t('badge.demo_db')}:</strong> <code className="bg-slate-900/80 px-1.5 py-0.5 rounded text-cyan-300 font-mono">demo.db</code>
            </span>
          </div>
          <span className="hidden sm:inline-block rounded-full bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 text-[10px] text-emerald-300 font-medium">
            dev.db untouched
          </span>
        </div>

        {/* Main Card */}
        <div className="glass-panel rounded-2xl p-6 sm:p-8 shadow-2xl">
          {/* Navigation Tabs: Login vs Register */}
          <div className="flex items-center justify-center p-1 mb-6 rounded-xl bg-slate-900/90 border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>{t('auth.signin')}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                mode === 'register'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>{t('auth.register')}</span>
            </button>
          </div>

          {/* Feedback messages */}
          {error && (
            <div className="mb-5 flex items-center gap-2 rounded-xl bg-rose-950/60 border border-rose-800/80 p-3.5 text-xs text-rose-200 animate-fadeIn">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 flex items-center gap-2 rounded-xl bg-emerald-950/60 border border-emerald-800/80 p-3.5 text-xs text-emerald-200 animate-fadeIn">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* LOGIN FORM */}
          {mode === 'login' ? (
            <>
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    {t('auth.email')}
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl bg-slate-900/90 border border-slate-700/80 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    placeholder="name@smartdairy.local"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    {t('auth.password')}
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl bg-slate-900/90 border border-slate-700/80 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    placeholder="••••••••"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:to-blue-500 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <LogIn className="h-4 w-4" />
                  <span>{isLoading ? 'Signing In...' : t('auth.signin_btn')}</span>
                </button>
              </form>

              {/* Quick Demo Access Buttons */}
              <div className="mt-8 border-t border-slate-800 pt-6">
                <div className="text-center text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  {t('auth.quick_login')}
                </div>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  <button
                    type="button"
                    onClick={() => handleRoleQuickLogin('ADMIN')}
                    className="flex flex-col items-center justify-center rounded-xl border border-slate-700/80 bg-slate-900/60 p-2.5 hover:border-cyan-500 hover:bg-cyan-950/20 transition-all text-center cursor-pointer"
                  >
                    <ShieldCheck className="h-5 w-5 text-cyan-400 mb-1" />
                    <span className="text-xs font-bold text-slate-200">Admin</span>
                    <span className="text-[10px] text-slate-400">Full System</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRoleQuickLogin('FARM_MANAGER')}
                    className="flex flex-col items-center justify-center rounded-xl border border-slate-700/80 bg-slate-900/60 p-2.5 hover:border-blue-500 hover:bg-blue-950/20 transition-all text-center cursor-pointer"
                  >
                    <UserCheck className="h-5 w-5 text-blue-400 mb-1" />
                    <span className="text-xs font-bold text-slate-200">Manager</span>
                    <span className="text-[10px] text-slate-400">Cows & Analytics</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRoleQuickLogin('VETERINARIAN')}
                    className="flex flex-col items-center justify-center rounded-xl border border-slate-700/80 bg-slate-900/60 p-2.5 hover:border-emerald-500 hover:bg-emerald-950/20 transition-all text-center cursor-pointer"
                  >
                    <Stethoscope className="h-5 w-5 text-emerald-400 mb-1" />
                    <span className="text-xs font-bold text-slate-200">Veterinarian</span>
                    <span className="text-[10px] text-slate-400">Health & Risk</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRoleQuickLogin('OPERATOR')}
                    className="flex flex-col items-center justify-center rounded-xl border border-slate-700/80 bg-slate-900/60 p-2.5 hover:border-amber-500 hover:bg-amber-950/20 transition-all text-center cursor-pointer"
                  >
                    <Play className="h-5 w-5 text-amber-400 mb-1" />
                    <span className="text-xs font-bold text-slate-200">Operator</span>
                    <span className="text-[10px] text-slate-400">Live Milking</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* REGISTER FORM */
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="rounded-lg bg-cyan-950/40 border border-cyan-800/40 p-3 text-xs text-cyan-300">
                {t('auth.demo_notice')}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  {t('auth.full_name')}
                </label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full rounded-xl bg-slate-900/90 border border-slate-700/80 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  placeholder="e.g. Ramesh Kumar / ரமேஷ் குமார்"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  {t('auth.email')}
                </label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full rounded-xl bg-slate-900/90 border border-slate-700/80 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  placeholder="ramesh@dairydemo.local"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    {t('auth.password')}
                  </label>
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full rounded-xl bg-slate-900/90 border border-slate-700/80 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    {t('auth.confirm_password')}
                  </label>
                  <input
                    type="password"
                    required
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    className="w-full rounded-xl bg-slate-900/90 border border-slate-700/80 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  {t('auth.role')}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { role: UserRole.OPERATOR, label: 'Operator', desc: 'Milking & RFID Scan' },
                    { role: UserRole.FARM_MANAGER, label: 'Manager', desc: 'Herd & Analytics' },
                    { role: UserRole.VETERINARIAN, label: 'Veterinarian', desc: 'Health & Risk' },
                    { role: UserRole.ADMIN, label: 'Admin', desc: 'Full System Control' }
                  ].map((item) => (
                    <button
                      key={item.role}
                      type="button"
                      onClick={() => setRegRole(item.role)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        regRole === item.role
                          ? 'border-cyan-500 bg-cyan-950/40 ring-1 ring-cyan-500'
                          : 'border-slate-800 bg-slate-900/70 hover:border-slate-700 text-slate-400'
                      }`}
                    >
                      <div className={`text-xs font-bold ${regRole === item.role ? 'text-cyan-300' : 'text-slate-300'}`}>
                        {item.label}
                      </div>
                      <div className="text-[10px] text-slate-500">{item.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  {t('auth.farm_name')} (Optional)
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    value={regFarmName}
                    onChange={(e) => setRegFarmName(e.target.value)}
                    className="w-full rounded-xl bg-slate-900/90 border border-slate-700/80 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    placeholder="SmartDairy Demo Farm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-cyan-500 transition-all disabled:opacity-50 cursor-pointer"
              >
                <UserPlus className="h-4 w-4" />
                <span>{isLoading ? 'Creating Demo Account...' : t('auth.register_btn')}</span>
              </button>
            </form>
          )}
        </div>

        {/* Disclaimer */}
        <p className="mt-4 text-center text-xs text-slate-400">
          {PROTOTYPE_DISCLAIMER}
        </p>
      </div>
    </div>
  );
};
