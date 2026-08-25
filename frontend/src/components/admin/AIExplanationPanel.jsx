import React, { useState } from 'react';
import { Sparkles, FileText, Loader2, Bot, ShieldCheck, RefreshCw } from 'lucide-react';
import { explainAuditEvents } from '../../services/aiService.js';

export default function AIExplanationPanel({ events = [], activeResourceId = null }) {
  const [explanation, setExplanation] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!events || events.length === 0) return;
    setLoading(true);
    try {
      const summary = await explainAuditEvents(events);
      setExplanation(summary);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card rounded-2xl p-4 border border-cyan-500/40 bg-gradient-to-r from-cyan-950/30 via-slate-900/60 to-blue-950/30 relative overflow-hidden">
      <div className="flex items-center justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-300 font-mono">
              AI Audit Trail Narrative Assistant (Feature 1)
            </h4>
            <p className="text-[11px] text-slate-400">
              Summarizes raw event logs into plain-English medical operational narratives.
            </p>
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading || events.length === 0}
          className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5 flex-shrink-0"
        >
          {loading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating...
            </>
          ) : (
            <>
              <Bot className="w-3.5 h-3.5" /> Explain Event Sequence
            </>
          )}
        </button>
      </div>

      {/* Output Display */}
      {explanation ? (
        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 leading-relaxed font-sans mt-2 animate-in fade-in">
          <div className="flex items-center gap-1.5 text-cyan-400 text-[11px] font-mono mb-1.5 uppercase font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" /> Clinical Systems Auditor Summary:
          </div>
          <p className="text-slate-300 text-xs leading-relaxed">{explanation}</p>
        </div>
      ) : (
        <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
          <span>{events.length} events loaded in current audit window.</span>
          <button
            onClick={handleGenerate}
            className="text-cyan-400 hover:underline flex items-center gap-1"
          >
            Click to analyze event trace
          </button>
        </div>
      )}
    </div>
  );
}
