import React from 'react';
import { HeartPulse } from 'lucide-react';
import LogEventForm from '../../components/nurse/LogEventForm.jsx';

export default function LogEventPage() {
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <HeartPulse className="w-5 h-5 text-emerald-400" />
          Log Clinical Event & Bedside Telemetry
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Record vitals, medicine administration, catheter changes, wound care, and nursing interventions into the immutable audit stream.
        </p>
      </div>

      <div className="glass-panel rounded-3xl p-6 border border-slate-800">
        <LogEventForm />
      </div>
    </div>
  );
}
