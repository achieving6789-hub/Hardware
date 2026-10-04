import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import {
  Users,
  Search,
  Plus,
  ShieldAlert,
  ChevronRight,
  Activity,
  CheckCircle2,
  RefreshCw,
  X
} from 'lucide-react';
import { RiskLevel, PROTOTYPE_DISCLAIMER } from '@smartdairy/shared';

interface CowsPageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const CowsPage: React.FC<CowsPageProps> = ({ onNavigate }) => {
  const [cows, setCows] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [breedFilter, setBreedFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form for adding a cow
  const [newCow, setNewCow] = useState({
    cowCode: '',
    rfidId: '',
    name: '',
    breed: 'Holstein Friesian',
    age: 4,
    lactationNumber: 2,
    parity: 1,
    daysInMilk: 60,
    bodyWeight: 580
  });

  const fetchCows = async () => {
    setIsLoading(true);
    try {
      const params: any = {};
      if (search && search.trim() !== '') params.search = search.trim();
      if (riskFilter && riskFilter !== 'ALL') params.riskLevel = riskFilter;
      const res = await api.getCows(params);
      if (res.success) {
        let list = res.cows || [];
        if (breedFilter !== 'ALL') {
          list = list.filter((c: any) => c.breed === breedFilter);
        }
        setCows(list);
      }
    } catch (err: any) {
      console.error('Failed to load cows:', err);
      setErrorMsg(err.message || 'Failed to load cattle records.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCows();
  }, [search, riskFilter, breedFilter]);

  const handleCreateCow = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      const payload = {
        cowCode: newCow.cowCode.trim(),
        rfidId: newCow.rfidId.trim(),
        name: newCow.name.trim(),
        breed: newCow.breed,
        age: Number(newCow.age) || 4,
        lactationNumber: Number(newCow.lactationNumber) || 1,
        parity: Number(newCow.parity) || 1,
        daysInMilk: Number(newCow.daysInMilk) || 60,
        bodyWeight: Number(newCow.bodyWeight) || 580
      };

      await api.createCow(payload);
      setIsAddModalOpen(false);
      setSuccessMsg(`Animal ${payload.cowCode} (${payload.name}) registered successfully with RFID ${payload.rfidId}!`);
      setTimeout(() => setSuccessMsg(null), 5000);
      setNewCow({
        cowCode: '',
        rfidId: '',
        name: '',
        breed: 'Holstein Friesian',
        age: 4,
        lactationNumber: 2,
        parity: 1,
        daysInMilk: 60,
        bodyWeight: 580
      });
      await fetchCows();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to register cow.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel rounded-2xl p-6 border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Users className="h-6 w-6 text-cyan-400" />
            <span>Cattle Registry & Udder Health Profiles</span>
            <span className="rounded-full bg-cyan-950/80 px-2.5 py-0.5 text-xs font-bold text-cyan-400 border border-cyan-800">
              {cows.length} Cattle
            </span>
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Registered dairy animals with individual 30-day moving historical baselines and ISO 11785 RFID transponders.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchCows()}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-all"
            title="Refresh Cattle List"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 transition-all self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Register New Cow</span>
          </button>
        </div>
      </div>

      {/* Success / Error Feedback Banners */}
      {successMsg && (
        <div className="flex items-center justify-between rounded-xl bg-emerald-950/80 border border-emerald-800/80 p-3.5 text-xs text-emerald-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-400 hover:text-white">✕</button>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center justify-between rounded-xl bg-rose-950/80 border border-rose-800/80 p-3.5 text-xs text-rose-200">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-rose-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-3 glass-panel rounded-2xl p-4 border-slate-800">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by Cow Code, Name, or RFID UID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl bg-slate-900 border border-slate-700/80 pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="rounded-xl bg-slate-900 border border-slate-700/80 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="LOW">Low Risk</option>
            <option value="MODERATE">Moderate Risk</option>
            <option value="HIGH">High Risk</option>
          </select>

          <select
            value={breedFilter}
            onChange={(e) => setBreedFilter(e.target.value)}
            className="rounded-xl bg-slate-900 border border-slate-700/80 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Breeds</option>
            <option value="Holstein Friesian">Holstein Friesian</option>
            <option value="Jersey">Jersey</option>
            <option value="Gir">Gir</option>
            <option value="Sahiwal">Sahiwal</option>
            <option value="Crossbred HF-Gir">Crossbred HF-Gir</option>
          </select>

          {(search || riskFilter !== 'ALL' || breedFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearch('');
                setRiskFilter('ALL');
                setBreedFilter('ALL');
              }}
              className="rounded-xl bg-slate-800 hover:bg-slate-700 px-3 py-2 text-xs text-slate-400 hover:text-white flex items-center gap-1"
            >
              <X className="h-3.5 w-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Cattle Table / Loading / Empty State */}
      <div className="glass-panel rounded-2xl border-slate-800 overflow-hidden">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center text-slate-400">
            <Activity className="h-8 w-8 animate-spin text-cyan-400 mr-3" />
            <span>Loading cattle records from database...</span>
          </div>
        ) : cows.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400">
            <Users className="h-12 w-12 text-slate-600 mb-3" />
            <h3 className="text-base font-bold text-white mb-1">No Cattle Found</h3>
            <p className="text-xs max-w-sm mb-4">
              {search || riskFilter !== 'ALL' || breedFilter !== 'ALL'
                ? 'No animals match the active filter criteria. Try clearing search or filters.'
                : 'No dairy cattle are currently registered in the system.'}
            </p>
            <div className="flex gap-2">
              {(search || riskFilter !== 'ALL' || breedFilter !== 'ALL') ? (
                <button
                  onClick={() => {
                    setSearch('');
                    setRiskFilter('ALL');
                    setBreedFilter('ALL');
                  }}
                  className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700"
                >
                  Clear Filters
                </button>
              ) : (
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="rounded-xl bg-cyan-600 px-4 py-2 text-xs font-semibold text-white hover:bg-cyan-500"
                >
                  Register First Cow
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold text-[10px]">
                <tr>
                  <th className="py-3 px-4">Cow Code</th>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Breed</th>
                  <th className="py-3 px-4">Lactation / DIM</th>
                  <th className="py-3 px-4">Personal Baseline Yield</th>
                  <th className="py-3 px-4">Current Risk</th>
                  <th className="py-3 px-4">Active Alert</th>
                  <th className="py-3 px-4 text-right">Profile</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {cows.map((cow) => {
                  const riskLevel = cow.healthProfile?.currentRiskLevel || cow.healthStatus || 'LOW';
                  const hasAlert = cow.alerts && cow.alerts.length > 0;
                  const baselineYield = cow.baseline?.baselineMilkYield ?? 14.0;
                  const riskScore = cow.healthProfile?.currentRiskScore !== undefined
                    ? cow.healthProfile.currentRiskScore.toFixed(0)
                    : (riskLevel === 'HIGH' ? '78' : riskLevel === 'MODERATE' ? '45' : '15');

                  return (
                    <tr
                      key={cow.id}
                      onClick={() => onNavigate('cow-detail', { cowId: cow.id })}
                      className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-4 font-bold text-cyan-400">
                        {cow.cowCode}
                        <span className="block font-mono text-[10px] text-slate-500 font-normal">
                          {cow.rfidId}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-200">
                        {cow.name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        {cow.breed}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        Lact {cow.lactationNumber} · {cow.daysInMilk} DIM
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-200">
                        {typeof baselineYield === 'number' ? baselineYield.toFixed(1) : baselineYield} L
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            riskLevel === 'HIGH' || riskLevel === 'VERY_HIGH'
                              ? 'bg-rose-950 text-rose-300 border border-rose-800'
                              : riskLevel === 'MODERATE'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          }`}
                        >
                          {riskLevel} ({riskScore})
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {hasAlert ? (
                          <span className="inline-flex items-center gap-1 rounded bg-rose-950/80 px-2 py-0.5 text-[10px] font-bold text-rose-400 border border-rose-800">
                            <ShieldAlert className="h-3 w-3" />
                            <span>WARNING</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-500">Normal</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button className="rounded-lg bg-slate-800 p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-700">
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Cow Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 border-slate-700 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-4">Register Animal</h2>
            <form onSubmit={handleCreateCow} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Cow Code (Ear Tag)</label>
                <input
                  required
                  value={newCow.cowCode}
                  onChange={(e) => setNewCow({ ...newCow, cowCode: e.target.value })}
                  placeholder="e.g. COW-035"
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">RFID Transponder UID</label>
                <input
                  required
                  value={newCow.rfidId}
                  onChange={(e) => setNewCow({ ...newCow, rfidId: e.target.value })}
                  placeholder="e.g. RFID-982735"
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Animal Name</label>
                <input
                  required
                  value={newCow.name}
                  onChange={(e) => setNewCow({ ...newCow, name: e.target.value })}
                  placeholder="e.g. Ganga"
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Breed</label>
                  <select
                    value={newCow.breed}
                    onChange={(e) => setNewCow({ ...newCow, breed: e.target.value })}
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-white"
                  >
                    <option value="Holstein Friesian">Holstein Friesian</option>
                    <option value="Jersey">Jersey</option>
                    <option value="Gir">Gir</option>
                    <option value="Sahiwal">Sahiwal</option>
                    <option value="Crossbred HF-Gir">Crossbred HF-Gir</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Age (Years)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    value={newCow.age}
                    onChange={(e) => setNewCow({ ...newCow, age: Number(e.target.value) })}
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Lactation No</label>
                  <input
                    type="number"
                    min="1"
                    value={newCow.lactationNumber}
                    onChange={(e) => setNewCow({ ...newCow, lactationNumber: Number(e.target.value) })}
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 px-2 py-2 text-white text-center"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Days in Milk</label>
                  <input
                    type="number"
                    min="0"
                    value={newCow.daysInMilk}
                    onChange={(e) => setNewCow({ ...newCow, daysInMilk: Number(e.target.value) })}
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 px-2 py-2 text-white text-center"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    min="200"
                    value={newCow.bodyWeight}
                    onChange={(e) => setNewCow({ ...newCow, bodyWeight: Number(e.target.value) })}
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 px-2 py-2 text-white text-center"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl border border-slate-700 py-2 font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-cyan-600 py-2 font-semibold text-white hover:bg-cyan-500 shadow-lg shadow-cyan-600/30"
                >
                  Save Registration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
