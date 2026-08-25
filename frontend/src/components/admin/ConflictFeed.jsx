import React, { useState } from 'react';
import {
  GitMerge,
  AlertOctagon,
  Sparkles,
  ShieldAlert,
  CheckCircle2
} from 'lucide-react';
import { useHospital } from '../../context/HospitalContext.jsx';
import StatusBadge from '../common/StatusBadge.jsx';
import AIExplanationPanel from './AIExplanationPanel.jsx';

export default function ConflictFeed() {
  const { events } = useHospital();
  const [filterType, setFilterType] = useState('all'); // 'all' | 'conflicts_only' | 'preemptions'

  // Filter conflict-related events
  const conflictEvents = events.filter(e => {
    if (filterType === 'conflicts_only') return e.type === 'conflict_rejected';
    if (filterType === 'preemptions') return e.type === 'escalation_preemption';
    return (
      e.type === 'conflict_rejected' ||
      e.type === 'escalation_preemption' ||
      e.type === 'escalate' ||
      e.payload?.wasPreemption
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <GitMerge className="w-5 h-5 text-rose-600" />
            Live Conflict & Deterministic Resolution Feed
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            Real-time feed showing incoming conflicting requests, winning allocations, and explicit deterministic rejection rationales.
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 text-xs font-semibold">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterType === 'all' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Conflicts ({conflictEvents.length})
          </button>
          <button
            onClick={() => setFilterType('conflicts_only')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterType === 'conflicts_only' ? 'bg-rose-600 text-white shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Rejections
          </button>
          <button
            onClick={() => setFilterType('preemptions')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterType === 'preemptions' ? 'bg-amber-600 text-white shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Preemptions
          </button>
        </div>
      </div>

      {/* AI Explanation Bar */}
      <AIExplanationPanel events={conflictEvents.slice(0, 10)} />

      {/* Conflict Log Cards */}
      {conflictEvents.length === 0 ? (
        <div className="clean-card p-12 text-center text-slate-500">
          <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-600 mb-2" />
          <p className="text-sm font-bold text-slate-800">Zero Active Conflicts in Current Window</p>
          <p className="text-xs text-slate-500 mt-1">
            All resource transactions are executing cleanly with optimistic concurrency.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {conflictEvents.map((evt) => {
            const isRejection = evt.type === 'conflict_rejected';

            return (
              <div
                key={evt.id}
                className={`clean-card p-5 border transition-all ${
                  isRejection
                    ? 'border-rose-200 bg-rose-50/20'
                    : 'border-amber-200 bg-amber-50/20'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2.5 rounded-xl border ${
                        isRejection
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {isRejection ? <AlertOctagon className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900">
                          {isRejection ? 'DETERMINISTIC REJECTION' : 'EMERGENCY PREEMPTION OVERRIDE'}
                        </span>
                        <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200 font-bold">
                          {evt.resourceId}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-medium">
                        Initiated by: <strong className="text-slate-800">{evt.actorName}</strong> ({evt.actorRole})
                      </span>
                    </div>
                  </div>

                  <span className="font-mono text-xs text-slate-500 font-medium">
                    {new Date(evt.timestamp || Date.now()).toLocaleTimeString()}
                  </span>
                </div>

                {/* Conflict Rationale Banner */}
                <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-xs mb-3 space-y-1">
                  <div className="font-bold text-slate-800">
                    Resolution Outcome:
                  </div>
                  <p className="text-slate-700 text-xs leading-relaxed font-medium">
                    {evt.payload.rejectionReason || evt.payload.reason || 'Deterministic tiebreaker applied.'}
                  </p>
                </div>

                {/* AI-Suggested vs System Final Decision Side-by-Side (Requirement 2) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-200">
                    <span className="text-slate-700 text-[11px] font-sans font-semibold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> AI Advisory Urgency:
                    </span>
                    <StatusBadge
                      status={evt.payload.aiSuggestedPriority || 'HIGH'}
                      size="xs"
                    />
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-200">
                    <span className="text-slate-700 text-[11px] font-sans font-semibold flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-emerald-700" /> Deterministic Rule Decision:
                    </span>
                    <span className="font-bold text-slate-900">
                      {isRejection ? 'REJECTED (LOWER PRIORITY)' : 'APPROVED (CRITICAL PREEMPTION)'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
