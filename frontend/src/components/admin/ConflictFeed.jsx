import React, { useState } from 'react';
import {
  GitMerge,
  AlertOctagon,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  User,
  Clock,
  CheckCircle2,
  Filter
} from 'lucide-react';
import { useHospital } from '../../context/HospitalContext.jsx';
import StatusBadge from '../common/StatusBadge.jsx';
import LiveFeedItem from '../common/LiveFeedItem.jsx';
import AIExplanationPanel from './AIExplanationPanel.jsx';

export default function ConflictFeed() {
  const { events } = useHospital();
  const [filterType, setFilterType] = useState('all'); // 'all' | 'conflicts_only' | 'preemptions'
  const [selectedTrace, setSelectedTrace] = useState(null);

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
    <div className="space-y-4">
      {/* Top Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <GitMerge className="w-5 h-5 text-rose-400" />
            Live Conflict & Deterministic Resolution Feed
          </h3>
          <p className="text-xs text-slate-400">
            Real-time feed showing incoming conflicting requests, winning allocations, and explicit deterministic rejection rationales.
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1 rounded-lg transition-colors ${
              filterType === 'all' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Conflicts ({conflictEvents.length})
          </button>
          <button
            onClick={() => setFilterType('conflicts_only')}
            className={`px-3 py-1 rounded-lg transition-colors ${
              filterType === 'conflicts_only' ? 'bg-rose-500/20 text-rose-300 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Rejections
          </button>
          <button
            onClick={() => setFilterType('preemptions')}
            className={`px-3 py-1 rounded-lg transition-colors ${
              filterType === 'preemptions' ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-slate-400 hover:text-slate-200'
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
        <div className="glass-panel rounded-2xl p-8 text-center text-slate-400">
          <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
          <p className="text-sm font-medium text-slate-200">Zero Active Conflicts in Current Window</p>
          <p className="text-xs text-slate-500 mt-1">
            All resource transactions are executing cleanly with optimistic concurrency.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {conflictEvents.map((evt) => {
            const isRejection = evt.type === 'conflict_rejected';
            const isPreemption = evt.type === 'escalation_preemption' || evt.payload?.wasPreemption;

            return (
              <div
                key={evt.id}
                className={`glass-card rounded-2xl p-4 border transition-all ${
                  isRejection
                    ? 'border-rose-900/50 bg-rose-950/10'
                    : 'border-amber-900/50 bg-amber-950/10'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`p-1.5 rounded-lg border ${
                        isRejection
                          ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                          : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                      }`}
                    >
                      {isRejection ? <AlertOctagon className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-200">
                          {isRejection ? 'DETERMINISTIC REJECTION' : 'EMERGENCY PREEMPTION OVERRIDE'}
                        </span>
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                          {evt.resourceId}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        Initiated by: {evt.actorName} ({evt.actorRole})
                      </span>
                    </div>
                  </div>

                  <span className="font-mono text-xs text-slate-400">
                    {new Date(evt.timestamp || Date.now()).toLocaleTimeString()}
                  </span>
                </div>

                {/* Conflict Rationale Banner */}
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs mb-3 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-rose-300">
                    <span>Resolution Outcome:</span>
                  </div>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    {evt.payload.rejectionReason || evt.payload.reason || 'Deterministic tiebreaker applied.'}
                  </p>
                </div>

                {/* AI-Suggested vs System Final Decision Side-by-Side (Requirement 2) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono p-2.5 rounded-xl bg-slate-950/90 border border-slate-800">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/80 border border-cyan-950">
                    <span className="text-cyan-400 text-[11px] flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> AI Advisory Urgency:
                    </span>
                    <StatusBadge
                      status={evt.payload.aiSuggestedPriority || 'HIGH'}
                      size="xs"
                    />
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/80 border border-emerald-950">
                    <span className="text-emerald-400 text-[11px] flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5" /> Deterministic Rule Decision:
                    </span>
                    <span className="font-bold text-slate-200">
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
