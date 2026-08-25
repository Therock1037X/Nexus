import React, { useState } from 'react';
import { Bed, ShieldCheck, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';
import NaturalLanguageRequestInput from '../../components/doctor/NaturalLanguageRequestInput.jsx';
import RequestResourceForm from '../../components/doctor/RequestResourceForm.jsx';

export default function RequestResourcePage() {
  const [parsedData, setParsedData] = useState(null);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
          <Bed className="w-6 h-6 text-emerald-700" />
          Request & Allocate Hospital Resource
        </h2>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Reserve or occupy beds, operating suites, and ventilators with optimistic concurrency control (OCC) and AI urgency assistance.
        </p>
      </div>

      {/* Feature 3: Natural Language Input */}
      <NaturalLanguageRequestInput onParsed={(data) => setParsedData(data)} />

      {/* Two-Column Split Layout (Matching BhumiGIS Reference) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Interactive Request Form (2/3 width) */}
        <div className="lg:col-span-2 clean-card p-6">
          <h3 className="text-sm font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100">
            Resource Allocation Parameters
          </h3>
          <RequestResourceForm initialParsedData={parsedData} />
        </div>

        {/* Right Column: Transaction Rules & OCC Protocol (1/3 width) */}
        <div className="space-y-4">
          <div className="clean-card p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              Concurrency Rules (OCC)
            </h3>
            <ul className="text-xs text-slate-600 space-y-2.5 leading-relaxed font-medium">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span><strong>Optimistic Locking:</strong> Reads resource version before write. Rejects stale writes deterministically.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span><strong>Atomic Firestore:</strong> State updates and immutable audit events write simultaneously in a single transaction.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span><strong>Deterministic Preemption:</strong> Tier-4 CRITICAL requests automatically preempt lower-tier holds with rollback logs.</span>
              </li>
            </ul>
          </div>

          <div className="clean-card p-5 bg-emerald-50/50 border-emerald-200">
            <h4 className="text-xs font-bold text-emerald-900 flex items-center gap-1.5 mb-1.5 uppercase font-mono">
              <Sparkles className="w-3.5 h-3.5 text-emerald-700" /> AI Advisory Support
            </h4>
            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              Free-text medical notes are scored by Gemini AI into priority tiers (Tier 1 Normal → Tier 4 Critical). Clinicians maintain full manual override control.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
