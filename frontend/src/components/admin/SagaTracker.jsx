import React, { useState } from 'react';
import {
  GitPullRequest,
  CheckCircle2,
  Clock,
  RotateCcw,
  Pill,
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

  const filterLabels = {
    all: 'All Orders',
    in_progress: 'In Progress',
    completed: 'Delivered',
    compensated: 'Cancelled & Returned'
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <GitPullRequest className="w-5 h-5 text-purple-700" />
            Prescription Progress Tracker
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            Tracks each prescription from doctor's order, to pharmacy, to the nurse giving it — and safely undoes it if a step fails.
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 text-xs font-semibold">
          {['all', 'in_progress', 'completed', 'compensated'].map((st) => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filter === st
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {filterLabels[st]} ({sagas.filter(s => st === 'all' || s.status === st).length})
            </button>
          ))}
        </div>
      </div>

      {/* Sagas List */}
      {filtered.length === 0 ? (
        <div className="clean-card p-12 text-center text-slate-500 bg-white">
          <GitPullRequest className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <p className="text-sm font-bold text-slate-800">No prescriptions found in this view.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((saga) => {
            const isCompensated = saga.status === 'compensated';
            const isCompleted = saga.status === 'completed';

            return (
              <div
                key={saga.id}
                className={`clean-card p-5 border transition-all bg-white ${
                  isCompensated
                    ? 'border-purple-200'
                    : isCompleted
                    ? 'border-emerald-200'
                    : 'border-slate-200'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2.5 rounded-xl border ${
                        isCompensated
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : isCompleted
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}
                    >
                      {isCompensated ? <RotateCcw className="w-5 h-5" /> : <Pill className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900">{saga.id}</span>
                        <StatusBadge status={saga.status} size="xs" />
                      </div>
                      <h4 className="text-sm font-extrabold text-slate-900 mt-0.5">
                        {saga.quantity}x {saga.medicineName} ({saga.dosage})
                      </h4>
                    </div>
                  </div>

                  <div className="text-right text-xs">
                    <div className="text-slate-900 font-bold">{saga.patientName}</div>
                    <div className="text-slate-500 font-mono text-[10px] font-medium">{saga.patientId}</div>
                  </div>
                </div>

                {/* 3-Step Pipeline Visualizer */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 mb-3">
                  {saga.steps?.map((step, idx) => {
                    const isDone = step.status === 'done';
                    const isStepComp = step.status === 'compensated';

                    return (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border text-xs flex flex-col justify-between ${
                          isStepComp
                            ? 'bg-purple-50 border-purple-200 text-purple-900'
                            : isDone
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                            : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs mb-1 font-semibold">
                          <span className="font-bold text-slate-800">
                            {idx + 1}. {step.label || step.stepName}
                          </span>
                          <span>
                            {isStepComp ? (
                              <span className="text-purple-700 font-bold flex items-center gap-1">
                                <RotateCcw className="w-3 h-3" /> Returned
                              </span>
                            ) : isDone ? (
                              <span className="text-emerald-700 font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Done
                              </span>
                            ) : (
                              <span className="text-amber-700 font-bold flex items-center gap-1">
                                <Clock className="w-3 h-3" /> Waiting
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 truncate font-medium mt-1">
                          {step.details || (isDone ? `Completed by ${step.actorName}` : 'Waiting for next action')}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Compensation Details Drawer */}
                {isCompensated && saga.compensationDetails && (
                  <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200 text-xs text-purple-900 space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-purple-900">
                      <ShieldCheck className="w-4 h-4 text-purple-700" /> Prescription Safely Cancelled & Returned to Stock
                    </div>
                    <p className="text-[11px] text-purple-800 font-medium">
                      Reason: "{saga.compensationDetails.reason}"
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-purple-700 pt-1.5 border-t border-purple-200 font-semibold">
                      <span>Restored: +{saga.compensationDetails.stockRefunded} units back to pharmacy inventory</span>
                      <span>Handled by: {saga.compensationDetails.actorName} ({saga.compensationDetails.actorRole})</span>
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
