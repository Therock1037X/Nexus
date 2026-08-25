import React from 'react';
import { Pill } from 'lucide-react';
import PrescriptionForm from '../../components/doctor/PrescriptionForm.jsx';

export default function PrescribePage() {
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Pill className="w-5 h-5 text-purple-400" />
          Clinical Prescription Order (Saga Start)
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Initiates a multi-step clinical saga (Step 1: Order → Step 2: Pharmacy Dispense → Step 3: Bedside Administration) with automatic inventory reservation and rollback compensation.
        </p>
      </div>

      <div className="glass-panel rounded-3xl p-6 border border-slate-800">
        <PrescriptionForm />
      </div>
    </div>
  );
}
