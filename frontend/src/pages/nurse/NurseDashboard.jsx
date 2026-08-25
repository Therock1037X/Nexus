import React, { useState } from 'react';
import {
  Heart,
  ClipboardList,
  HeartPulse,
  AlertTriangle,
  CheckCircle2,
  X,
  Bed,
  Plus
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
      {/* Welcome & Ward Telemetry Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel rounded-3xl p-6 border border-slate-800">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-emerald-950/40">
            {currentUser?.avatar || 'NR'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-100">{currentUser?.name || 'Charge Nurse'}</h2>
              <StatusBadge status="done" size="xs" />
            </div>
            <p className="text-xs text-slate-400">
              Ward: {currentUser?.wardAssigned || 'General Floor 1'} • Bedside Care & Saga Execution Station
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveModal('log')}
            className="btn-primary text-xs px-3.5 py-2 flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500"
          >
            <HeartPulse className="w-4 h-4" /> Log Clinical Event / Vitals
          </button>

          <button
            onClick={() => setActiveModal('flag')}
            className="btn-secondary text-xs px-3.5 py-2 flex items-center gap-1.5 border-slate-700"
          >
            <AlertTriangle className="w-4 h-4 text-amber-400" /> Flag Sanitization
          </button>
        </div>
      </div>

      {/* Quick Ward Status Telemetry */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
          <div className="text-[10px] text-slate-400 uppercase">Active Prescriptions Queued</div>
          <div className="text-xl font-bold text-purple-400 mt-0.5">{inProgressSagas.length} Sagas</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
          <div className="text-[10px] text-slate-400 uppercase">Beds Undergoing Sanitization</div>
          <div className="text-xl font-bold text-cyan-400 mt-0.5">{bedsNeedingCleaning.length} Units</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
          <div className="text-[10px] text-slate-400 uppercase">Ward Occupancy Health</div>
          <div className="text-xl font-bold text-emerald-400 mt-0.5">NOMINAL (RTS SYNCED)</div>
        </div>
      </div>

      {/* Task Queue from Active Prescriptions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-emerald-400" />
            Bedside Administration Queue (Step 3 in Saga Loop)
          </h3>
          <span className="text-xs font-mono text-slate-400">
            Real-Time Firestore Subscription
          </span>
        </div>

        <TaskQueue />
      </div>

      {/* Action Modals */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in">
          <div className="glass-panel max-w-lg w-full rounded-3xl p-6 border border-slate-700/80 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            {activeModal === 'log' && (
              <div>
                <h3 className="text-base font-bold text-slate-100 mb-1 flex items-center gap-2">
                  <HeartPulse className="w-5 h-5 text-emerald-400" /> Log Clinical Event & Vitals
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  Appends an immutable clinical observation to the patient's record and event stream.
                </p>
                <LogEventForm onSuccess={() => setTimeout(() => setActiveModal(null), 1000)} />
              </div>
            )}

            {activeModal === 'flag' && (
              <div>
                <h3 className="text-base font-bold text-slate-100 mb-1 flex items-center gap-2 text-amber-400">
                  <AlertTriangle className="w-5 h-5" /> Flag Resource Maintenance or Sanitization
                </h3>
                <p className="text-xs text-slate-400 mb-4">
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
