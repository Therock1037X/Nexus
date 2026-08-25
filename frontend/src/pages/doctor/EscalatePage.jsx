import React from 'react';
import { Sparkles, AlertOctagon } from 'lucide-react';
import EscalateForm from '../../components/doctor/EscalateForm.jsx';

export default function EscalatePage() {
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2 text-rose-400">
          <Sparkles className="w-5 h-5" />
          Emergency Priority Escalation & Preemption
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Applies deterministic priority overrides (Tier 4 CRITICAL) to reallocate occupied or reserved hospital resources for acute emergency patients.
        </p>
      </div>

      <div className="glass-panel rounded-3xl p-6 border border-slate-800">
        <EscalateForm />
      </div>
    </div>
  );
}
