import React, { useState } from 'react';
import { Sparkles, Bot, ShieldCheck, Loader2 } from 'lucide-react';
import { explainAuditEvents } from '../../services/aiService.js';

export default function AIExplanationPanel({ events = [] }) {
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
    <div className="clean-card p-6 border-emerald-100 bg-white">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex-shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              AI Audit Trail Narrative Assistant
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                GEMINI AI
              </span>
            </h4>
            <p className="text-xs text-slate-500 font-medium">
              Summarizes raw event logs into plain-English medical operational narratives.
            </p>
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading || events.length === 0}
          className="btn-primary text-xs px-4 py-2 flex items-center gap-2 flex-shrink-0"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Generating...
            </>
          ) : (
            <>
              <Bot className="w-4 h-4" /> Explain Event Sequence
            </>
          )}
        </button>
      </div>

      {/* Output Display */}
      {explanation ? (
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 leading-relaxed font-sans mt-3 animate-in fade-in">
          <div className="flex items-center gap-1.5 text-emerald-800 text-[11px] font-mono mb-2 uppercase font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-700" /> Clinical Systems Auditor Summary:
          </div>
          <p className="text-slate-700 text-xs leading-relaxed font-medium">{explanation}</p>
        </div>
      ) : (
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 font-medium flex items-center justify-between mt-2">
          <span>{events.length} events loaded in current audit window.</span>
          <button
            onClick={handleGenerate}
            className="text-emerald-700 hover:text-emerald-800 font-bold hover:underline"
          >
            Click to analyze event trace →
          </button>
        </div>
      )}
    </div>
  );
}
