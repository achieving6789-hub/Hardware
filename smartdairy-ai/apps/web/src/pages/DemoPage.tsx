import React, { useState } from 'react';
import { api } from '../api/client';
import {
  PlayCircle,
  ShieldAlert,
  Radio,
  Zap,
  Sparkles,
  WifiOff,
  AlertTriangle,
  Layers,
  CheckCircle,
  ArrowRight,
  RefreshCw,
  Activity
} from 'lucide-react';
import { PROTOTYPE_DISCLAIMER } from '@smartdairy/shared';

interface DemoPageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const DemoPage: React.FC<DemoPageProps> = ({ onNavigate }) => {
  const [runningScenario, setRunningScenario] = useState<string | null>(null);
  const [scenarioResult, setScenarioResult] = useState<any>(null);
  const [activeStep, setActiveStep] = useState(1);

  const handleRun = async (scenario: string) => {
    setRunningScenario(scenario);
    setScenarioResult(null);
    try {
      const res = await api.runScenario(scenario);
      setScenarioResult(res.result);
    } catch (err: any) {
      setScenarioResult({ error: err.message });
    } finally {
      setRunningScenario(null);
    }
  };

  const scenarios = [
    {
      id: 'NORMAL_COW',
      title: 'Scenario 1: Normal Cow (COW-001)',
      desc: 'Animal with stable historical personal baseline. Parameters remain within tolerance (Low Risk).',
      badge: 'LOW RISK',
      badgeColor: 'bg-emerald-950 text-emerald-400 border border-emerald-800',
      icon: CheckCircle
    },
    {
      id: 'EARLY_WARNING',
      title: 'Scenario 2: Early Warning (COW-021)',
      desc: 'Subtle gradual increase in Somatic Cell Count and conductivity. Flagged as Moderate Risk for monitoring.',
      badge: 'MODERATE RISK',
      badgeColor: 'bg-amber-950 text-amber-400 border border-amber-800',
      icon: AlertTriangle
    },
    {
      id: 'HIGH_RISK',
      title: 'Scenario 3: High Risk Demonstration (COW-026)',
      desc: 'Significant correlated surge in SCC (+400%), conductivity (+28%), and milk yield drop (-28%). Critical alert generated.',
      badge: 'HIGH RISK ALERT',
      badgeColor: 'bg-rose-950 text-rose-300 border border-rose-800 animate-pulse',
      icon: ShieldAlert
    },
    {
      id: 'RFID_MISSED',
      title: 'Scenario 4: RFID Missed (Cluster Attached First)',
      desc: 'Teat cup cluster attached without RFID transceiver scan. Creates UNIDENTIFIED session. Operator can assign later.',
      badge: 'STATE MACHINE',
      badgeColor: 'bg-yellow-950 text-yellow-300 border border-yellow-800',
      icon: Radio
    },
    {
      id: 'UNKNOWN_RFID',
      title: 'Scenario 5: Unknown RFID Tag Read',
      desc: 'Unregistered transponder enters gate. System does not randomly guess animal. Flags UNKNOWN alert.',
      badge: 'SECURITY',
      badgeColor: 'bg-purple-950 text-purple-300 border border-purple-800',
      icon: Radio
    },
    {
      id: 'SENSOR_FAILURE',
      title: 'Scenario 6: Hardware Sensor Fault Injection',
      desc: 'Simulates SomaDetect or pH sensor dropping offline. Data quality marked WARNING/OFFLINE. No fake data emitted.',
      badge: 'HARDWARE FAULT',
      badgeColor: 'bg-orange-950 text-orange-300 border border-orange-800',
      icon: Zap
    },
    {
      id: 'NETWORK_FAILURE',
      title: 'Scenario 7: Edge Network Interruption & Buffer',
      desc: 'Simulates edge connectivity outage. Telemetry is queued into memory and synchronized without duplicate inserts.',
      badge: 'OFFLINE QUEUE',
      badgeColor: 'bg-slate-800 text-slate-300 border border-slate-700',
      icon: WifiOff
    },
    {
      id: 'CIP_CYCLE',
      title: 'Scenario 8: Clean-In-Place Chemical Wash',
      desc: 'Station locks into automated sanitation mode. Proves CIP wash data is strictly isolated from cow sessions.',
      badge: 'CIP ISOLATION',
      badgeColor: 'bg-cyan-950 text-cyan-300 border border-cyan-800',
      icon: Sparkles
    },
    {
      id: 'MULTIPLE_COWS',
      title: 'Scenario 9: Sequential Multi-Cow Pipeline',
      desc: 'Cow 1 -> Milking -> Complete -> Cow 2 -> Milking -> Complete. Demonstrates shared line session separation.',
      badge: 'PIPELINE INTEGRITY',
      badgeColor: 'bg-blue-950 text-blue-300 border border-blue-800',
      icon: Layers
    },
    {
      id: 'HERD_RISK_INCREASE',
      title: 'Scenario 11: Herd Risk Surge (6 Cows Trending Up)',
      desc: 'Simulates multi-cow prodromal momentum across the milking herd. Herd Risk Index elevates and herd alert fires.',
      badge: 'HERD LEVEL FORECAST',
      badgeColor: 'bg-rose-950 text-rose-300 border border-rose-800 animate-pulse',
      icon: ShieldAlert
    },
    {
      id: 'ENVIRONMENTAL_STRESS',
      title: 'Scenario 12: Environmental Heat & THI Stress',
      desc: 'Ambient temp 36.2°C, 84% RH (THI 85.4 - Severe). Udder immunity suppressed; triggers environmental warning.',
      badge: 'CLIMATE TELEMETRY',
      badgeColor: 'bg-orange-950 text-orange-300 border border-orange-800',
      icon: Zap
    },
    {
      id: 'RUMINATION_DROP',
      title: 'Scenario 13: Acoustic Collar Rumination Drop',
      desc: 'Rumination falls to 240 min/day (-50% vs baseline). Early prodromal pain symptom 48h before mastitis signs.',
      badge: 'COLLAR TELEMETRY',
      badgeColor: 'bg-purple-950 text-purple-300 border border-purple-800',
      icon: Activity
    },
    {
      id: 'ACTIVITY_DROP',
      title: 'Scenario 14: Pedometer Lethargy Drop (-58% Steps)',
      desc: 'Daily steps drop from 3,200 to 1,350. Behavioral indicator of udder discomfort and systemic malaise.',
      badge: 'PEDOMETER TELEMETRY',
      badgeColor: 'bg-blue-950 text-blue-300 border border-blue-800',
      icon: Activity
    },
    {
      id: 'FEED_INTAKE_DROP',
      title: 'Scenario 15: Automated Feed Scale Appetite Drop',
      desc: 'Feed intake drops from 44 kg to 22.5 kg. Multi-modal validation of impending mastitis episode.',
      badge: 'FEED SCALE',
      badgeColor: 'bg-teal-950 text-teal-300 border border-teal-800',
      icon: Sparkles
    },
    {
      id: 'RESET',
      title: 'Scenario 16: System & Hardware Reset',
      desc: 'Stops active simulations, resets all hardware sensors to ONLINE, and returns stations to IDLE/READY.',
      badge: 'STATION RESET',
      badgeColor: 'bg-emerald-950 text-emerald-300 border border-emerald-800',
      icon: RefreshCw
    }
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="glass-panel rounded-2xl p-6 border-cyan-500/20 bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-lg bg-cyan-500/20 px-2.5 py-1 text-xs font-bold text-cyan-400 border border-cyan-500/40">
            SIH PS 26109
          </span>
          <span className="rounded-lg bg-emerald-500/20 px-2.5 py-1 text-xs font-bold text-emerald-300 border border-emerald-500/40">
            Judge Presentation Demo Suite
          </span>
        </div>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-white flex items-center gap-2">
          <PlayCircle className="h-6 w-6 text-cyan-400" />
          <span>SIH PS 26109 Interactive Demonstration Control Center</span>
        </h1>
        <p className="mt-1 text-xs text-slate-300 max-w-3xl">
          One-click simulation scenarios engineered to validate early mastitis risk forecasting at both individual-cow and herd levels before clinical signs appear.
        </p>
        <div className="mt-2 text-[11px] text-amber-400/90 font-medium">
          ⚠️ {PROTOTYPE_DISCLAIMER}
        </div>
      </div>

      {/* 9-Step SIH Demo Walkthrough Narrative Guide */}
      <div className="glass-panel rounded-2xl p-5 border-slate-800 bg-slate-900/80">
        <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-2">
          <Sparkles className="h-4 w-4 text-cyan-400" />
          <span>Recommended 9-Step Judge Presentation Flow</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs mt-3">
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="font-bold text-cyan-400">Step 1–3: Individual Milking</span>
            <p className="text-[11px] text-slate-400 mt-1">
              Run Scenario 1 (Normal Cow), Scenario 2 (Early Warning), and Scenario 3 (High Risk) to show personal baseline deviation detection.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="font-bold text-emerald-400">Step 4–6: Multi-Modal Forecasting</span>
            <p className="text-[11px] text-slate-400 mt-1">
              Trigger Scenario 11 (Herd Risk Surge), Scenario 12 (THI Stress), and Scenario 13 (Rumination Drop) to demonstrate 24–72h early warning before clinical signs.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="font-bold text-amber-400">Step 7–9: Industrial Resilience</span>
            <p className="text-[11px] text-slate-400 mt-1">
              Demonstrate Scenario 4 (RFID Missed & Reassign), Scenario 6 (Hardware Fault Tolerance), and Scenario 8 (CIP Wash Chemical Isolation).
            </p>
          </div>
        </div>
      </div>

      {scenarioResult && (
        <div className="glass-panel rounded-2xl p-5 border-cyan-500/40 bg-cyan-950/20">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-cyan-300">Scenario Output:</div>
            <button
              onClick={() => onNavigate('live-milking')}
              className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              <span>View Live Line</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="mt-1 text-xs text-slate-200">
            {scenarioResult.message || JSON.stringify(scenarioResult)}
          </p>
        </div>
      )}

      {/* Grid of Scenarios */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {scenarios.map((s) => {
          const Icon = s.icon;
          const isRunning = runningScenario === s.id;

          return (
            <div
              key={s.id}
              className="glass-panel rounded-2xl p-5 border-slate-800 flex flex-col justify-between hover:border-cyan-500/40 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-cyan-400 shrink-0" />
                    <h3 className="text-sm font-bold text-white">{s.title}</h3>
                  </div>
                  <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase shrink-0 ${s.badgeColor}`}>
                    {s.badge}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  {s.desc}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <button
                  disabled={isRunning}
                  onClick={() => handleRun(s.id)}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-cyan-600 hover:text-white border border-slate-700 py-2 text-xs font-bold text-cyan-300 transition-all disabled:opacity-50"
                >
                  <PlayCircle className="h-3.5 w-3.5" />
                  <span>{isRunning ? 'Running Scenario...' : 'Execute Scenario'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
