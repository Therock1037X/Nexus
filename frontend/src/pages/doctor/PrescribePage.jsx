import React from 'react';
import { Pill, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import PrescriptionForm from '../../components/doctor/PrescriptionForm.jsx';

export default function PrescribePage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
          <Pill className="w-6 h-6 text-purple-700" />
          Clinical Prescription Order (Saga Protocol)
        </h2>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Initiates a 3-step distributed clinical saga (Step 1: Order → Step 2: Pharmacy Dispense → Step 3: Bedside Administration) with automatic inventory reservation and rollback compensation.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 clean-card p-6">
          <PrescriptionForm />
        </div>

        <div className="space-y-4">
          <div className="clean-card p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-700" />
              Saga Architecture (3-Step)
            </h3>
            <div className="space-y-2 text-xs text-slate-600 font-medium">
              <div className="p-3 rounded-xl bg-purple-50 border border-purple-200">
                <span className="font-bold text-purple-900">Step 1: Doctor Prescribes</span>
                <p className="text-[11px] text-purple-800 mt-0.5">Stock decremented atomically in inventory.</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-800">Step 2: Pharmacy Dispenses</span>
                <p className="text-[11px] text-slate-600 mt-0.5">Batch verified & packaged for ward delivery.</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-800">Step 3: Nurse Administers</span>
                <p className="text-[11px] text-slate-600 mt-0.5">Dose given to patient & post-dose vitals logged.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
