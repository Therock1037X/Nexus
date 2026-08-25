import React, { useState } from 'react';
import {
  Activity,
  CheckCircle2,
  AlertOctagon,
  ArrowRightLeft,
  RotateCcw,
  Sparkles,
  User,
  ChevronDown,
  ChevronUp,
  Clock,
  ShieldCheck
} from 'lucide-react';
import StatusBadge from './StatusBadge.jsx';

export default function LiveFeedItem({ event, onExplain = null }) {
  const [expanded, setExpanded] = useState(false);

  const {
    id,
    type,
    resourceId,
    actorName,
    actorRole = 'doctor',
    timestamp,
    resultingVersion,
    idempotencyKey,
    payload = {}
  } = event;

  const getEventIcon = () => {
    switch (type) {
      case 'allocate':
      case 'reserve':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'conflict_rejected':
        return <AlertOctagon className="w-4 h-4 text-rose-400" />;
      case 'escalation_preemption':
      case 'escalate':
        return <Sparkles className="w-4 h-4 text-amber-400" />;
      case 'transfer':
        return <ArrowRightLeft className="w-4 h-4 text-cyan-400" />;
      case 'saga_compensate':
        return <RotateCcw className="w-4 h-4 text-purple-400" />;
      default:
        return <Activity className="w-4 h-4 text-slate-400" />;
    }
  };

  const formatTime = (ts) => {
    if (!ts) return 'Just now';
    try {
      const d = ts.toDate ? ts.toDate() : new Date(ts);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return 'Just now';
    }
  };

  const isConflict = type === 'conflict_rejected' || type === 'escalation_preemption';
  const isCompensation = type === 'saga_compensate';

  return (
    <div
      className={`p-3.5 rounded-xl border transition-all duration-150 ${
        isConflict
          ? 'bg-rose-950/20 border-rose-900/40 hover:border-rose-700/60'
          : isCompensation
          ? 'bg-purple-950/20 border-purple-900/40 hover:border-purple-700/60'
          : 'bg-slate-900/50 border-slate-800/70 hover:border-slate-700/70'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left: Icon & Core Details */}
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="p-1.5 rounded-lg bg-slate-800/80 border border-slate-700/50 mt-0.5">
            {getEventIcon()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-semibold text-slate-200 uppercase tracking-wide">
                {type.replace('_', ' ')}
              </span>
              <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                {resourceId}
              </span>
              {resultingVersion && (
                <span className="font-mono text-[10px] px-1 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  v{resultingVersion}
                </span>
              )}
            </div>

            {/* Actor & Action Description */}
            <p className="text-xs text-slate-300 mt-1 line-clamp-2">
              <span className="font-medium text-slate-100">{actorName || 'Staff'}</span> ({actorRole}):{' '}
              {payload.rejectionReason || payload.reason || payload.action || payload.description || `Updated ${resourceId}`}
            </p>
          </div>
        </div>

        {/* Right: Timestamp & Expand Action */}
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
            <Clock className="w-3 h-3" />
            {formatTime(timestamp)}
          </span>
          <div className="flex items-center gap-1">
            {onExplain && (
              <button
                onClick={() => onExplain(event)}
                title="Explain with AI"
                className="p-1 rounded text-cyan-400 hover:bg-cyan-950/40 hover:text-cyan-300 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Payload & Idempotency Inspector */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-slate-800/80 text-xs font-mono space-y-2">
          {idempotencyKey && (
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1 text-slate-500">
                <ShieldCheck className="w-3 h-3 text-emerald-400" /> Idempotency Key:
              </span>
              <span className="truncate max-w-[200px] text-slate-300">{idempotencyKey}</span>
            </div>
          )}

          <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 overflow-x-auto text-[11px] text-slate-300">
            <pre>{JSON.stringify(payload, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
