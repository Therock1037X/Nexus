import React from 'react';
import { HeartPulse } from 'lucide-react';
import LogEventForm from '../../components/nurse/LogEventForm.jsx';

export default function LogEventPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
          <HeartPulse className="w-6 h-6 text-emerald-700" />
          Log Clinical Bedside Event & Vitals
        </h2>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Record nursing observations, vital telemetry checks, and patient bed rotations directly into the immutable audit ledger.
        </p>
      </div>

      <div className="clean-card p-6">
        <LogEventForm />
      </div>
    </div>
  );
}
