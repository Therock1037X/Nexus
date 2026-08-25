import React, { useState } from 'react';
import { Bed, Sparkles } from 'lucide-react';
import NaturalLanguageRequestInput from '../../components/doctor/NaturalLanguageRequestInput.jsx';
import RequestResourceForm from '../../components/doctor/RequestResourceForm.jsx';

export default function RequestResourcePage() {
  const [parsedData, setParsedData] = useState(null);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Bed className="w-5 h-5 text-cyan-400" />
          Request & Allocate Hospital Resource
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Reserve or occupy beds, operating theatres, and diagnostic equipment via atomic Firestore transactions.
        </p>
      </div>

      {/* Feature 3: Natural Language Input */}
      <NaturalLanguageRequestInput onParsed={(data) => setParsedData(data)} />

      {/* Main Request Form */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-800">
        <RequestResourceForm initialParsedData={parsedData} />
      </div>
    </div>
  );
}
