import React from 'react';
import { Sparkles, AlertOctagon, ShieldAlert, CheckCircle2 } from 'lucide-react';
import EscalateForm from '../../components/doctor/EscalateForm.jsx';

export default function EscalatePage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5 text-rose-700">
          <Sparkles className="w-6 h-6" />
          Emergency Priority Escalation & Preemption
        </h2>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Applies deterministic priority overrides (Tier 4 CRITICAL) to reallocate occupied or reserved hospital resources for acute emergency patients.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 clean-card p-6">
          <EscalateForm />
        </div>

        <div className="space-y-4">
          <div className="clean-card p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-700" />
              Preemption Policy & Safety
            </h3>
            <ul className="text-xs text-slate-600 space-y-2.5 leading-relaxed font-medium">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span><strong>Explicit Tiebreaker:</strong> When multiple requests contest a resource, the system deterministically awards to highest priority tier.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span><strong>Preempted Patient Notification:</strong> The previous holder's doctor receives an immediate notification to select alternate capacity.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span><strong>Immutable Audit Lineage:</strong> Escalation reasons and AI urgency scores are permanently recorded in the ledger.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
