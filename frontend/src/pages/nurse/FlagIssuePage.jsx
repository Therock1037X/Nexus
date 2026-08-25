import React from 'react';
import { AlertTriangle } from 'lucide-react';
import FlagIssueForm from '../../components/nurse/FlagIssueForm.jsx';

export default function FlagIssuePage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
          <AlertTriangle className="w-6 h-6 text-amber-600" />
          Flag Resource Maintenance & Sanitization
        </h2>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Mark beds, operating suites, or biomedical equipment as undergoing cleaning or calibration to block conflict requests.
        </p>
      </div>

      <div className="clean-card p-6">
        <FlagIssueForm />
      </div>
    </div>
  );
}
