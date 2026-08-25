import React from 'react';
import {
  Bed,
  Activity,
  GitPullRequest,
  GitMerge,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useHospital } from '../../context/HospitalContext.jsx';
import LiveResourceGrid from '../../components/admin/LiveResourceGrid.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';

export default function AdminDashboard() {
  const { currentUser } = useAuth();
  const { stats } = useHospital();

  return (
    <div className="space-y-6">
      {/* Top Welcome Header (Matching BhumiGIS Heading Pattern) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Live Resource Grid & Operations Hub
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Real-time multi-floor hospital capacity, optimistic concurrency control (OCC), and transactional state management.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-semibold">
            Logged in as: <strong className="text-slate-800">{currentUser?.name || 'Operations Director'}</strong>
          </span>
          <StatusBadge status="normal" size="xs" />
        </div>
      </div>

      {/* Top 4 Floating Metric & Stat Cards (Exact BhumiGIS Pattern) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Bed Occupancy */}
        <div className="clean-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Bed Occupancy</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <Bed className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900">
              {stats.occupancyRate}%
            </div>
            <div className="text-xs text-slate-500 font-medium mt-1">
              • {stats.occupiedBeds + stats.reservedBeds} of {stats.totalBeds} beds allocated
            </div>
          </div>
        </div>

        {/* Card 2: ICU Availability */}
        <div className="clean-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">ICU Beds Free</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-blue-700">
              {stats.freeIcuBeds} <span className="text-sm font-semibold text-slate-500">/ {stats.icuBedsCount}</span>
            </div>
            <div className="text-xs text-slate-500 font-medium mt-1">
              • {stats.freeIcuBeds <= 2 ? '⚠️ High Critical Demand' : 'Normal Reserve Capacity'}
            </div>
          </div>
        </div>

        {/* Card 3: Active Sagas */}
        <div className="clean-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Sagas</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
              <GitPullRequest className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-purple-700">
              {stats.inProgressSagasCount}
            </div>
            <div className="text-xs text-slate-500 font-medium mt-1">
              • Multi-step distributed transactions
            </div>
          </div>
        </div>

        {/* Card 4: OCC Conflicts Handled */}
        <div className="clean-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Conflicts Logged</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-700">
              <GitMerge className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900">
              {stats.conflictsCount}
            </div>
            <div className="text-xs text-slate-500 font-medium mt-1">
              • Deterministic resolution applied
            </div>
          </div>
        </div>
      </div>

      {/* Main Live Resource Grid */}
      <LiveResourceGrid />
    </div>
  );
}
