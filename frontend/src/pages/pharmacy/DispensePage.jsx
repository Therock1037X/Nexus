import React from 'react';
import { PackageCheck } from 'lucide-react';
import PrescriptionQueue from '../../components/pharmacy/PrescriptionQueue.jsx';

export default function DispensePage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
          <PackageCheck className="w-6 h-6 text-purple-700" />
          Pharmaceutical Dispense & Verification Station
        </h2>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Review incoming prescription sagas, confirm batch serials, and advance orders to Step 2 (Dispensed).
        </p>
      </div>

      <PrescriptionQueue />
    </div>
  );
}
