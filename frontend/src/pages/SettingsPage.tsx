import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import {
  Settings as SettingsIcon,
  Sliders,
  CheckCircle,
  RotateCcw,
  Cpu,
  Layers,
  Save
} from 'lucide-react';
import { DEFAULT_RISK_WEIGHTS, PROTOTYPE_DISCLAIMER } from '@smartdairy/shared';

export const SettingsPage: React.FC = () => {
  const [weights, setWeights] = useState({ ...DEFAULT_RISK_WEIGHTS });
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadWeights() {
      try {
        const res = await api.getAiWeights();
        if (res.success && res.weights) {
          setWeights(res.weights);
        }
      } catch (err) {
        console.error('Failed to load weights:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadWeights();
  }, []);

  const handleWeightChange = (key: keyof typeof DEFAULT_RISK_WEIGHTS, value: number) => {
    setWeights((prev) => ({ ...prev, [key]: value }));
    setIsSaved(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateAiWeights(weights);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save weights:', err);
    }
  };

  const handleReset = () => {
    setWeights({ ...DEFAULT_RISK_WEIGHTS });
    setIsSaved(false);
  };

  const totalSum = Math.round(
    (weights.sccTrendWeight +
      weights.milkYieldWeight +
      weights.conductivityWeight +
      weights.phDeviationWeight +
      weights.temperatureWeight +
      weights.flowPatternWeight +
      weights.historicalRiskWeight) *
      100
  );

  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-2xl p-6 border-slate-800">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <SettingsIcon className="h-6 w-6 text-cyan-400" />
          <span>System Settings & Configurable AI Risk Engine Weights</span>
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          Tune the multi-factor weighted mastitis detection engine without touching code. Weights are stored in configuration.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Form */}
        <form onSubmit={handleSave} className="glass-panel rounded-2xl p-6 border-slate-800 lg:col-span-2 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Sliders className="h-4 w-4 text-cyan-400" />
                <span>AI Feature Weights Tuning</span>
              </h2>
              <span className="text-xs text-slate-400">Total Weight Sum: <strong className={totalSum === 100 ? 'text-emerald-400' : 'text-amber-400'}>{totalSum}%</strong> (Ideal: 100%)</span>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1 text-xs font-semibold text-slate-300"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset Defaults</span>
            </button>
          </div>

          <div className="space-y-4">
            {/* SCC Weight */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-semibold">1. Somatic Cell Count (SCC) Trend</span>
                <span className="font-mono text-cyan-400 font-bold">{Math.round(weights.sccTrendWeight * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.6"
                step="0.05"
                value={weights.sccTrendWeight}
                onChange={(e) => handleWeightChange('sccTrendWeight', parseFloat(e.target.value))}
                className="w-full accent-cyan-500"
              />
              <span className="text-[11px] text-slate-500">Optical Somatic Cell Count shift vs moving baseline</span>
            </div>

            {/* Milk Yield Weight */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-semibold">2. Milk Yield Drop</span>
                <span className="font-mono text-cyan-400 font-bold">{Math.round(weights.milkYieldWeight * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.5"
                step="0.05"
                value={weights.milkYieldWeight}
                onChange={(e) => handleWeightChange('milkYieldWeight', parseFloat(e.target.value))}
                className="w-full accent-cyan-500"
              />
              <span className="text-[11px] text-slate-500">Yield percentage decrease vs cow's 7-day personal average</span>
            </div>

            {/* Conductivity Weight */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-semibold">3. Electrical Conductivity Shift</span>
                <span className="font-mono text-cyan-400 font-bold">{Math.round(weights.conductivityWeight * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.5"
                step="0.05"
                value={weights.conductivityWeight}
                onChange={(e) => handleWeightChange('conductivityWeight', parseFloat(e.target.value))}
                className="w-full accent-cyan-500"
              />
              <span className="text-[11px] text-slate-500">Electrolyte leakage measured via ifm SM Foodmag</span>
            </div>

            {/* pH Weight */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-semibold">4. pH Deviation</span>
                <span className="font-mono text-cyan-400 font-bold">{Math.round(weights.phDeviationWeight * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.3"
                step="0.05"
                value={weights.phDeviationWeight}
                onChange={(e) => handleWeightChange('phDeviationWeight', parseFloat(e.target.value))}
                className="w-full accent-cyan-500"
              />
              <span className="text-[11px] text-slate-500">Mettler Toledo InPro ISFET pH shift towards blood pH</span>
            </div>

            {/* Temperature */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-semibold">5. Milk Line Temperature</span>
                <span className="font-mono text-cyan-400 font-bold">{Math.round(weights.temperatureWeight * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.2"
                step="0.01"
                value={weights.temperatureWeight}
                onChange={(e) => handleWeightChange('temperatureWeight', parseFloat(e.target.value))}
                className="w-full accent-cyan-500"
              />
              <span className="text-[11px] text-slate-500">Thermal RTD indication of localized udder inflammation</span>
            </div>

            {/* Flow Pattern */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-semibold">6. Flow Pattern Dynamics</span>
                <span className="font-mono text-cyan-400 font-bold">{Math.round(weights.flowPatternWeight * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.2"
                step="0.05"
                value={weights.flowPatternWeight}
                onChange={(e) => handleWeightChange('flowPatternWeight', parseFloat(e.target.value))}
                className="w-full accent-cyan-500"
              />
              <span className="text-[11px] text-slate-500">Altered letdown curve or delayed peak flow</span>
            </div>

            {/* Historical Risk */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-semibold">7. Historical Risk Momentum</span>
                <span className="font-mono text-cyan-400 font-bold">{Math.round(weights.historicalRiskWeight * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.2"
                step="0.01"
                value={weights.historicalRiskWeight}
                onChange={(e) => handleWeightChange('historicalRiskWeight', parseFloat(e.target.value))}
                className="w-full accent-cyan-500"
              />
              <span className="text-[11px] text-slate-500">Prior session risk score persistence</span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <button
              type="submit"
              className="flex items-center gap-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-600/20"
            >
              <Save className="h-4 w-4" />
              <span>Apply & Save AI Weights</span>
            </button>

            {isSaved && (
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                <CheckCircle className="h-4 w-4" />
                <span>Weights successfully saved to live engine!</span>
              </span>
            )}
          </div>
        </form>

        {/* Info Column */}
        <div className="space-y-4">
          <div className="glass-panel rounded-2xl p-5 border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Model Architecture
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              SmartDairy AI uses an extensible interface <code className="text-cyan-400 font-mono">IRiskModel</code> with the current implementation running <code className="text-cyan-400 font-mono">RuleBasedRiskModel</code>. Serialized Random Forest or Gradient Boosting ONNX models can be slotted in with zero disruption.
            </p>
          </div>

          <div className="glass-panel rounded-2xl p-5 border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Hardware Abstraction
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Inline sensors communicate through <code className="text-cyan-400 font-mono">IFlowSensor</code>, <code className="text-cyan-400 font-mono">ISCCSensor</code>, <code className="text-cyan-400 font-mono">IPHSensor</code>, and <code className="text-cyan-400 font-mono">IRFIDReader</code>. Switching from simulation to physical Modbus / IO-Link requires only changing <code className="text-cyan-400 font-mono">SENSOR_MODE=REAL_VENDOR_API</code>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
