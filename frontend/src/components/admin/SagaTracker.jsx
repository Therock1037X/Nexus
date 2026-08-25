import React, { useState } from 'react';
import {
  GitPullRequest,
  CheckCircle2,
  Clock,
  RotateCcw,
  Pill,
  User,
  AlertTriangle,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { useHospital } from '../../context/HospitalContext.jsx';
import StatusBadge from '../common/StatusBadge.jsx';

export default function SagaTracker() {
  const { sagas } = useHospital();
  const [filter, setFilter] = useState('all'); // 'all' | 'in_progress' | 'completed' | 'compensated'

  const filtered = sagas.filter((s) => {
    if (filter === 'all') return true;
    return s.status === filter;
  });

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <GitPullRequest className="w-5 h-5 text-purple-400" />
            Multi-Step Clinical Saga Tracker
          </h3>
          <p className="text-xs text-slate-400">
            Monitors multi-step distributed workflows (Doctor Order → Pharmacy Dispense → Nurse Administer) with automated compensation rollbacks.
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono">
          {['all', 'in_progress', 'completed', 'compensated'].map((st) => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`px-3 py-1 rounded-lg capitalize transition-colors ${
                filter === st
                  ? 'bg-purple-500/20 text-purple-300 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {st.replace('_', ' ')} ({sagas.filter(s => st === 'all' || s.status === st).length})
            </button>
          ))}
        </div>
      </div>

      {/* Sagas List */}
      {filtered.length === 0 ? (
        <div className="glass-panel rounded-2xl p-8 text-center text-slate-400">
          <GitPullRequest className="w-8 h-8 mx-auto text-slate-600 mb-2" />
          <p className="text-sm font-medium text-slate-300">No sagas found for filter: {filter}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((saga) => {
            const isCompensated = saga.status === 'compensated';
            const isCompleted = saga.status === 'completed';

            return (
              <div
                key={saga.id}
                className={`glass-card rounded-2xl p-4 border transition-all ${
                  isCompensated
                    ? 'border-purple-900/50 bg-purple-950/10'
                    : isCompleted
                    ? 'border-emerald-900/40 bg-emerald-950/10'
                    : 'border-slate-800 bg-slate-900/40'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`p-2 rounded-xl border ${
                        isCompensated
                          ? 'bg-purple-500/20 text-purple-400 border-purple-500/40'
                          : isCompleted
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                          : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
                      }`}
                    >
                      {isCompensated ? <RotateCcw className="w-4 h-4" /> : <Pill className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-200">{saga.id}</span>
                        <StatusBadge status={saga.status} size="xs" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-100 mt-0.5">
                        {saga.quantity}x {saga.medicineName} ({saga.dosage})
                      </h4>
                    </div>
                  </div>

                  <div className="text-right text-xs">
                    <div className="text-slate-200 font-medium">{saga.patientName}</div>
                    <div className="text-slate-500 font-mono text-[10px]">{saga.patientId}</div>
                  </div>
                </div>

                {/* Interactive Multi-Step Pipeline Visualizer */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
                  {saga.steps?.map((step, idx) => {
                    const isDone = step.status === 'done';
                    const isStepComp = step.status === 'compensated';
                    const isPending = step.status === 'pending';

                    return (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-xl border text-xs flex flex-col justify-between ${
                          isStepComp
                            ? 'bg-purple-950/40 border-purple-800 text-purple-300'
                            : isDone
                            ? 'bg-emerald-950/30 border-emerald-900/60 text-emerald-300'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400'
                        }`}
                      >
                        <div className="flex items-center justify-between font-mono text-[11px] mb-1">
                          <span className="font-semibold">
                            {idx + 1}. {step.label || step.stepName}
                          </span>
                          <span>
                            {isStepComp ? (
                              <span className="text-purple-400 flex items-center gap-1">
                                <RotateCcw className="w-3 h-3" /> REVERTED
                              </span>
                            ) : isDone ? (
                              <span className="text-emerald-400 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> DONE
                              </span>
                            ) : (
                              <span className="text-amber-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> QUEUED
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {step.details || (isDone ? `Executed by ${step.actorName}` : 'Awaiting action')}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Compensation Details Drawer (if Compensated) */}
                {isCompensated && saga.compensationDetails && (
                  <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/40 text-xs text-purple-200 font-mono space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-purple-300">
                      <ShieldCheck className="w-4 h-4" /> Automated Compensation Rollback Executed
                    </div>
                    <p className="text-[11px] text-purple-300/80">
                      Reason: "{saga.compensationDetails.reason}"
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-purple-400 pt-1 border-t border-purple-900/60">
                      <span>Restored: +{saga.compensationDetails.stockRefunded} units to inventory</span>
                      <span>Actor: {saga.compensationDetails.actorName} ({saga.compensationDetails.actorRole})</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
