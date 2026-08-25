import React from 'react';
import { Sparkles, ShieldAlert, CheckCircle2 } from 'lucide-react';
import EscalateForm from '../../components/doctor/EscalateForm.jsx';

export default function EscalatePage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5 text-rose-700">
          <Sparkles className="w-6 h-6" />
          Emergency Priority Override
        </h2>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Request immediate priority allocation of scarce beds or equipment for life-threatening emergency cases.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 clean-card p-6 bg-white">
          <EscalateForm />
        </div>

        <div className="space-y-4">
          <div className="clean-card p-5 space-y-3 bg-white">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-700" />
              Emergency Safety Rules
            </h3>
            <ul className="text-xs text-slate-600 space-y-2.5 leading-relaxed font-medium">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span><strong>Clear Priority Rules:</strong> When multiple requests clash, the most critical medical emergency receives the bed.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span><strong>Staff Notification:</strong> If a bed is reassigned, attending staff are notified immediately to select an alternate unit.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span><strong>Permanent Record:</strong> The clinical reason and timestamp of every override are permanently recorded.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
