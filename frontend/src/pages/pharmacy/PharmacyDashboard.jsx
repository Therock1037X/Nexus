import React from 'react';
import {
  Pill,
  PackageCheck,
  AlertTriangle,
  Layers,
  Building2,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useHospital } from '../../context/HospitalContext.jsx';
import PrescriptionQueue from '../../components/pharmacy/PrescriptionQueue.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';

export default function PharmacyDashboard() {
  const { currentUser } = useAuth();
  const { resources, sagas } = useHospital();

  const medicines = resources.filter(r => r.type === 'medicine');
  const incomingPrescriptions = sagas.filter(s => s.status === 'in_progress' && s.steps?.[1]?.status === 'pending');
  const scarceMeds = medicines.filter(m => Number(m.quantity) <= (m.minThreshold || 30));

  return (
    <div className="space-y-6">
      {/* Welcome & Pharmacy Status Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel rounded-3xl p-6 border border-slate-800">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-purple-950/40">
            {currentUser?.avatar || 'PH'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-100">{currentUser?.name || 'Chief Pharmacist'}</h2>
              <StatusBadge status="normal" size="xs" />
            </div>
            <p className="text-xs text-slate-400">
              Central Pharmacy Command • Prescription Verification & Inventory Management
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 uppercase block">Pending Orders</span>
            <span className="text-lg font-bold text-purple-300">{incomingPrescriptions.length}</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 uppercase block">Scarce Drugs</span>
            <span className="text-lg font-bold text-amber-400">{scarceMeds.length}</span>
          </div>
        </div>
      </div>

      {/* Live Pharmaceutical Stock Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono flex items-center gap-2">
            <Pill className="w-4 h-4 text-purple-400" />
            Live Hospital Pharmaceutical Inventory ({medicines.length} Formularies)
          </h3>
          <span className="text-xs font-mono text-slate-400">Real-Time Sync</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {medicines.map((med) => {
            const isLow = Number(med.quantity) <= (med.minThreshold || 30);
            return (
              <div
                key={med.id}
                className={`glass-card rounded-2xl p-3.5 border transition-all ${
                  isLow ? 'border-amber-500/40 bg-amber-950/15' : 'border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-1 mb-1">
                  <span className="font-mono text-[10px] text-slate-400 uppercase truncate">{med.category || 'Drug'}</span>
                  {med.isScarce && (
                    <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      SCARCE
                    </span>
                  )}
                </div>
                <h4 className="font-semibold text-slate-100 truncate">{med.name}</h4>
                <div className="flex items-baseline justify-between mt-2 pt-2 border-t border-slate-800/80 font-mono">
                  <span className="text-xs text-slate-400">Available:</span>
                  <span className={`text-sm font-bold ${isLow ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {med.quantity} <span className="text-[10px] font-normal text-slate-400">{med.unit}</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Incoming Prescriptions Queue */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-purple-400" />
            Incoming Prescription Fulfillment Queue (Step 2 in Saga Loop)
          </h3>
          <span className="text-xs font-mono text-slate-400">
            {incomingPrescriptions.length} Orders Awaiting Verification
          </span>
        </div>

        <PrescriptionQueue />
      </div>
    </div>
  );
}
