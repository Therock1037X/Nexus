import React, { useState } from 'react';
import {
  Heart,
  ClipboardList,
  HeartPulse,
  AlertTriangle,
  Pill,
  Bed,
  CheckCircle2,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useHospital } from '../../context/HospitalContext.jsx';
import TaskQueue from '../../components/nurse/TaskQueue.jsx';
import LogEventForm from '../../components/nurse/LogEventForm.jsx';
import FlagIssueForm from '../../components/nurse/FlagIssueForm.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';

export default function NurseDashboard() {
  const { currentUser } = useAuth();
  const { resources, sagas } = useHospital();

  const [activeModal, setActiveModal] = useState(null); // 'log' | 'flag'

  const inProgressSagas = sagas.filter(s => s.status === 'in_progress');
  const bedsNeedingCleaning = resources.filter(r => r.status === 'cleaning' || r.status === 'maintenance');

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Nurse Care & Task Command Station
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Ward: {currentUser?.wardAssigned || 'General Floor 1'} • Bedside medication administration, vitals recording, and bed turnover.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setActiveModal('log')}
            className="btn-primary text-xs px-3.5 py-2 flex items-center gap-1.5 font-bold"
          >
            <HeartPulse className="w-4 h-4" /> Log Vitals / Event
          </button>

          <button
            onClick={() => setActiveModal('flag')}
            className="btn-secondary text-xs px-3.5 py-2 flex items-center gap-1.5 font-bold"
          >
            <AlertTriangle className="w-4 h-4 text-amber-600" /> Flag Sanitization
          </button>
        </div>
      </div>

      {/* 3 Floating Stat Metric Cards (BhumiGIS Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="clean-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Prescriptions</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
              <Pill className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-purple-700">
              {inProgressSagas.length} <span className="text-sm font-semibold text-slate-500">Sagas</span>
            </div>
            <div className="text-xs text-slate-500 font-medium mt-1">
              • Awaiting bedside administration
            </div>
          </div>
        </div>

        <div className="clean-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Beds in Sanitization</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
              <Bed className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-blue-700">
              {bedsNeedingCleaning.length} <span className="text-sm font-semibold text-slate-500">Units</span>
            </div>
            <div className="text-xs text-slate-500 font-medium mt-1">
              • Cleaning & disinfection in progress
            </div>
          </div>
        </div>

        <div className="clean-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ward System Status</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-emerald-700">
              NOMINAL
            </div>
            <div className="text-xs text-slate-500 font-medium mt-1">
              • Real-time concurrency connected
            </div>
          </div>
        </div>
      </div>

      {/* Task Queue from Active Prescriptions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-emerald-700" />
            Bedside Administration Queue (Step 3 in Saga Loop)
          </h3>
          <span className="text-xs font-mono text-slate-500 font-bold">
            Real-Time Live Feed
          </span>
        </div>

        <TaskQueue />
      </div>

      {/* Action Modals */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white max-w-lg w-full rounded-2xl p-6 border border-slate-200 shadow-xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            {activeModal === 'log' && (
              <div>
                <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
                  <HeartPulse className="w-5 h-5 text-emerald-700" /> Log Clinical Event & Vitals
                </h3>
                <p className="text-xs text-slate-500 mb-4 font-medium">
                  Appends an immutable clinical observation to the patient's record and audit log.
                </p>
                <LogEventForm onSuccess={() => setTimeout(() => setActiveModal(null), 1000)} />
              </div>
            )}

            {activeModal === 'flag' && (
              <div>
                <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2 text-amber-700">
                  <AlertTriangle className="w-5 h-5" /> Flag Resource Maintenance or Sanitization
                </h3>
                <p className="text-xs text-slate-500 mb-4 font-medium">
                  Marks bed/equipment as cleaning or maintenance to prevent conflict allocations.
                </p>
                <FlagIssueForm onSuccess={() => setTimeout(() => setActiveModal(null), 1000)} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
