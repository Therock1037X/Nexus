import React, { useState } from 'react';
import { Bed, ShieldCheck, CheckCircle2, Sparkles } from 'lucide-react';
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
          Request Bed or Equipment
        </h2>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Request beds, operating suites, and equipment with instant confirmation and emergency priority support.
        </p>
      </div>

      {/* Natural Language Input */}
      <NaturalLanguageRequestInput onParsed={(data) => setParsedData(data)} />

      {/* Two-Column Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Interactive Request Form (2/3 width) */}
        <div className="lg:col-span-2 clean-card p-6 bg-white">
          <h3 className="text-sm font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100">
            Request Details
          </h3>
          <RequestResourceForm initialParsedData={parsedData} />
        </div>

        {/* Right Column: How Requests are Handled (1/3 width) */}
        <div className="space-y-4">
          <div className="clean-card p-5 space-y-3 bg-white">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              How Requests are Handled
            </h3>
            <ul className="text-xs text-slate-600 space-y-2.5 leading-relaxed font-medium">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span><strong>Instant Verification:</strong> Checks bed availability in real time so you never double-book.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span><strong>Permanent Record:</strong> Every booking and update is recorded immediately in hospital activity history.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span><strong>Emergency Priority:</strong> Life-threatening emergencies take priority if a critical unit is urgently needed.</span>
              </li>
            </ul>
          </div>

          <div className="clean-card p-5 bg-emerald-50/50 border-emerald-200">
            <h4 className="text-xs font-bold text-emerald-900 flex items-center gap-1.5 mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-700" /> AI Suggestions
            </h4>
            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              Gemini AI reads your clinical notes to suggest an urgency level. You always have full control to confirm or change the final selection.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
