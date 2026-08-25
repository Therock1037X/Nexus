import React, { useState } from 'react';
import {
  Building2,
  Bed,
  Activity,
  Cpu,
  Pill,
  Search,
  Filter,
  Layers,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  X,
  User,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { useHospital } from '../../context/HospitalContext.jsx';
import { cancelResourceTransaction } from '../../services/resourceService.js';
import ResourceCard from '../common/ResourceCard.jsx';
import StatusBadge from '../common/StatusBadge.jsx';
import PredictedAvailabilityWidget from './PredictedAvailabilityWidget.jsx';

export default function LiveResourceGrid() {
  const { resources, floors, stats, playAlertTone } = useHospital();

  const [activeFloor, setActiveFloor] = useState('all');
  const [activeCategory, setActiveCategory] = useState('all'); // 'all' | 'bed' | 'ot' | 'equipment' | 'medicine'
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [inspectModalRes, setInspectModalRes] = useState(null);
  const [releasing, setReleasing] = useState(false);

  // Filter resources
  const filtered = resources.filter((r) => {
    if (activeFloor !== 'all' && r.floorId !== activeFloor && r.type !== 'medicine') return false;
    if (activeCategory !== 'all' && r.type !== activeCategory) return false;
    if (statusFilter === 'scarce' && !r.isScarce) return false;
    if (statusFilter !== 'all' && statusFilter !== 'scarce' && r.status !== statusFilter) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchId = r.id?.toLowerCase().includes(q);
      const matchName = r.name?.toLowerCase().includes(q);
      const matchPatient = r.currentAllocation?.patientName?.toLowerCase().includes(q);
      const matchRoom = r.roomNo?.toLowerCase().includes(q);
      if (!matchId && !matchName && !matchPatient && !matchRoom) return false;
    }
    return true;
  });

  const handleReleaseResource = async (res) => {
    setReleasing(true);
    try {
      await cancelResourceTransaction({
        resourceId: res.id,
        actorId: 'admin-1',
        actorName: 'Hospital Admin Vinit',
        actorRole: 'admin',
        reason: 'Discharged & released via Admin Grid'
      });
      playAlertTone('success');
      setInspectModalRes(null);
    } catch (err) {
      alert(`Failed to release: ${err.message}`);
    } finally {
      setReleasing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Section: Predictive Availability AI Widget (Feature 4) */}
      <PredictedAvailabilityWidget />

      {/* Main Grid Header & Floor Tabs */}
      <div className="glass-panel rounded-2xl p-4 border border-slate-800 space-y-4">
        {/* Floor Selection Strip */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setActiveFloor('all')}
            className={`px-3 py-2 rounded-xl text-xs font-mono font-medium flex items-center gap-1.5 transition-all flex-shrink-0 ${
              activeFloor === 'all'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'bg-slate-900/80 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Floors ({resources.length})</span>
          </button>

          {floors.map((floor) => {
            const floorCount = resources.filter(r => r.floorId === floor.id).length;
            return (
              <button
                key={floor.id}
                onClick={() => setActiveFloor(floor.id)}
                className={`px-3 py-2 rounded-xl text-xs font-mono font-medium flex items-center gap-1.5 transition-all flex-shrink-0 ${
                  activeFloor === floor.id
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'bg-slate-900/80 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>{floor.name} ({floorCount})</span>
              </button>
            );
          })}
        </div>

        {/* Category & Status Filter Bar */}
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between pt-2 border-t border-slate-800">
          {/* Category Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950/80 border border-slate-800 text-xs w-full md:w-auto overflow-x-auto">
            {[
              { id: 'all', label: 'All Resources' },
              { id: 'bed', label: 'Beds (38)' },
              { id: 'ot', label: 'OTs (3)' },
              { id: 'equipment', label: 'Equipment (7)' },
              { id: 'medicine', label: 'Medicines (8)' }
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1 rounded-lg transition-colors whitespace-nowrap ${
                  activeCategory === cat.id
                    ? 'bg-cyan-600 text-white font-medium shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-64">
            <input
              type="text"
              placeholder="Search resource ID, patient, room..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="glass-input w-full pl-8 text-xs"
            />
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-3" />
          </div>
        </div>

        {/* Status Filter Chips */}
        <div className="flex items-center gap-1.5 flex-wrap text-xs font-mono">
          <span className="text-[10px] text-slate-500 uppercase mr-1">Status Filter:</span>
          {['all', 'free', 'reserved', 'occupied', 'in_use', 'cleaning', 'scarce'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-0.5 rounded-full border uppercase text-[10px] transition-all ${
                statusFilter === st
                  ? 'bg-slate-200 text-slate-900 border-white font-bold'
                  : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Display */}
      {filtered.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center text-slate-400">
          <Bed className="w-8 h-8 mx-auto text-slate-600 mb-2" />
          <p className="text-sm font-medium text-slate-300">No resources match your active filter criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {filtered.map((res) => (
            <ResourceCard
              key={res.id}
              resource={res}
              userRole="admin"
              onSelect={() => setInspectModalRes(res)}
              onRelease={() => handleReleaseResource(res)}
            />
          ))}
        </div>
      )}

      {/* Resource Detail & Concurrency Inspector Modal */}
      {inspectModalRes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="glass-panel max-w-lg w-full rounded-2xl p-6 border border-slate-700/80 shadow-2xl relative">
            <button
              onClick={() => setInspectModalRes(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-100">{inspectModalRes.name}</h3>
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                    {inspectModalRes.id}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <StatusBadge status={inspectModalRes.status} size="xs" />
                  <span className="text-xs font-mono text-slate-400">
                    Optimistic Version: <strong>v{inspectModalRes.version || 1}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Allocation Information */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-2 mb-4 font-mono">
              <div className="flex items-center justify-between text-slate-400">
                <span>Resource Type:</span>
                <span className="text-slate-200 uppercase">{inspectModalRes.type}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Floor Location:</span>
                <span className="text-slate-200">{inspectModalRes.floorId} • {inspectModalRes.roomNo || 'N/A'}</span>
              </div>

              {inspectModalRes.currentAllocation && (
                <>
                  <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-slate-400">
                    <span>Assigned Patient:</span>
                    <span className="text-cyan-300 font-bold">{inspectModalRes.currentAllocation.patientName}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Priority Tier:</span>
                    <StatusBadge status={inspectModalRes.currentAllocation.priority || 'normal'} size="xs" />
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Clinician in Charge:</span>
                    <span className="text-slate-200">Dr. {inspectModalRes.currentAllocation.assignedDoctorName}</span>
                  </div>
                </>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2">
              {inspectModalRes.status !== 'free' && (
                <button
                  onClick={() => handleReleaseResource(inspectModalRes)}
                  disabled={releasing}
                  className="btn-danger text-xs px-4 py-2"
                >
                  Release / Free Resource
                </button>
              )}
              <button
                onClick={() => setInspectModalRes(null)}
                className="btn-secondary text-xs px-4 py-2"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
