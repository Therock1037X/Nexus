import React from 'react';
import { PackageCheck } from 'lucide-react';
import PrescriptionQueue from '../../components/pharmacy/PrescriptionQueue.jsx';

export default function DispensePage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <PackageCheck className="w-5 h-5 text-purple-400" />
          Pharmaceutical Dispense & Verification Station
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Review incoming prescription sagas, confirm batch serials, and advance orders to Step 2 (Dispensed).
        </p>
      </div>

      <PrescriptionQueue />
    </div>
  );
}
