import React from 'react';
import { AlertTriangle } from 'lucide-react';
import FlagIssueForm from '../../components/nurse/FlagIssueForm.jsx';

export default function FlagIssuePage() {
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2 text-amber-400">
          <AlertTriangle className="w-5 h-5" />
          Flag Resource Sanitization / Maintenance
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Lock a bed, operating room, or biomedical equipment for cleaning or technical repair to protect clinical safety.
        </p>
      </div>

      <div className="glass-panel rounded-3xl p-6 border border-slate-800">
        <FlagIssueForm />
      </div>
    </div>
  );
}
