import React, { useState } from 'react';
import {
  Activity,
  CheckCircle2,
  AlertOctagon,
  ArrowRightLeft,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Clock,
  ShieldCheck
} from 'lucide-react';

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
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'conflict_rejected':
        return <AlertOctagon className="w-4 h-4 text-rose-600" />;
      case 'escalation_preemption':
      case 'escalate':
        return <Sparkles className="w-4 h-4 text-amber-600" />;
      case 'transfer':
        return <ArrowRightLeft className="w-4 h-4 text-blue-600" />;
      case 'saga_compensate':
        return <RotateCcw className="w-4 h-4 text-purple-600" />;
      default:
        return <Activity className="w-4 h-4 text-slate-600" />;
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
      className={`p-4 rounded-2xl border transition-all duration-150 shadow-clean ${
        isConflict
          ? 'bg-rose-50/50 border-rose-200 hover:border-rose-300'
          : isCompensation
          ? 'bg-purple-50/50 border-purple-200 hover:border-purple-300'
          : 'bg-white border-slate-200/90 hover:border-slate-300'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left: Icon & Core Details */}
        <div className="flex items-start gap-3 min-w-0">
          <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80 mt-0.5 flex-shrink-0">
            {getEventIcon()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold text-slate-900 uppercase tracking-wide">
                {type.replace('_', ' ')}
              </span>
              <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                {resourceId}
              </span>
              {resultingVersion && (
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 font-medium">
                  v{resultingVersion}
                </span>
              )}
            </div>

            {/* Actor & Action Description */}
            <p className="text-xs text-slate-700 mt-1 line-clamp-2 font-medium">
              <span className="font-bold text-slate-900">{actorName || 'Staff'}</span> ({actorRole}):{' '}
              {payload.rejectionReason || payload.reason || payload.action || payload.description || `Updated ${resourceId}`}
            </p>
          </div>
        </div>

        {/* Right: Timestamp & Expand Action */}
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className="flex items-center gap-1 text-[11px] font-mono text-slate-500 font-medium">
            <Clock className="w-3 h-3" />
            {formatTime(timestamp)}
          </span>
          <div className="flex items-center gap-1">
            {onExplain && (
              <button
                onClick={() => onExplain(event)}
                title="Explain with AI"
                className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 transition-colors"
              >
                <Sparkles className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Payload & Idempotency Inspector */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-slate-200/80 text-xs font-mono space-y-2">
          {idempotencyKey && (
            <div className="flex items-center justify-between text-[11px] text-slate-600">
              <span className="flex items-center gap-1 text-slate-500 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Idempotency Key:
              </span>
              <span className="truncate max-w-[200px] text-slate-800 font-semibold">{idempotencyKey}</span>
            </div>
          )}

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 overflow-x-auto text-[11px] text-slate-800">
            <pre>{JSON.stringify(payload, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
