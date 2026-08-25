import React from 'react';
import {
  Shield,
  Building2,
  GitMerge,
  GitPullRequest,
  History,
  Activity,
  Bed,
  Users,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useHospital } from '../../context/HospitalContext.jsx';
import LiveResourceGrid from '../../components/admin/LiveResourceGrid.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';

export default function AdminDashboard() {
  const { currentUser } = useAuth();
  const { stats, isSeeding, handleResetSeed } = useHospital();

  return (
    <div className="space-y-6">
      {/* Top Welcome & Operations Command Telemetry */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 glass-panel rounded-3xl p-6 border border-slate-800">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-amber-950/40">
            {currentUser?.avatar || 'AD'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-100">{currentUser?.name || 'Hospital Operations Director'}</h2>
              <StatusBadge status="normal" size="xs" />
            </div>
            <p className="text-xs text-slate-400">
              Operations Center • Real-Time Concurrency Governance & Audit Command
            </p>
          </div>
        </div>

        {/* Global Live Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
          <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 uppercase block">Bed Occupancy</span>
            <span className={`text-base font-bold ${stats.occupancyRate > 80 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {stats.occupancyRate}% ({stats.occupiedBeds + stats.reservedBeds}/{stats.totalBeds})
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 uppercase block">ICU Available</span>
            <span className={`text-base font-bold ${stats.freeIcuBeds <= 2 ? 'text-amber-400' : 'text-cyan-400'}`}>
              {stats.freeIcuBeds} / {stats.icuBedsCount} Beds
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 uppercase block">Active Sagas</span>
            <span className="text-base font-bold text-purple-400">
              {stats.inProgressSagasCount} Running
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 uppercase block">Conflicts Handled</span>
            <span className="text-base font-bold text-rose-400">
              {stats.conflictsCount} Events
            </span>
          </div>
        </div>
      </div>

      {/* Main Live Resource Grid (4 Floors, Beds, OTs, Equipment, Medicines) */}
      <LiveResourceGrid />
    </div>
  );
}
