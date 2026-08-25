import React from 'react';
import {
  Pill,
  PackageCheck,
  AlertTriangle,
  Layers,
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
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Central Pharmacy & Dispensing Command
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Prescription verification, batch packaging, live drug formulary stock, and automated saga step transitions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-semibold">
            Logged in as: <strong className="text-slate-800">{currentUser?.name || 'Chief Pharmacist'}</strong>
          </span>
          <StatusBadge status="normal" size="xs" />
        </div>
      </div>

      {/* 3 Floating Stat Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="clean-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Awaiting Dispense</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
              <PackageCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-purple-700">
              {incomingPrescriptions.length} <span className="text-sm font-semibold text-slate-500">Orders</span>
            </div>
            <div className="text-xs text-slate-500 font-medium mt-1">
              • Step 2 verification queue
            </div>
          </div>
        </div>

        <div className="clean-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Scarce Pharmaceuticals</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-2xl font-extrabold ${scarceMeds.length > 0 ? 'text-amber-700' : 'text-slate-900'}`}>
              {scarceMeds.length} <span className="text-sm font-semibold text-slate-500">Items</span>
            </div>
            <div className="text-xs text-slate-500 font-medium mt-1">
              • Below threshold demo inventory
            </div>
          </div>
        </div>

        <div className="clean-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Formularies</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <Pill className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-emerald-700">
              {medicines.length} <span className="text-sm font-semibold text-slate-500">Formularies</span>
            </div>
            <div className="text-xs text-slate-500 font-medium mt-1">
              • Real-time stock telemetry
            </div>
          </div>
        </div>
      </div>

      {/* Live Pharmaceutical Stock Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Pill className="w-4 h-4 text-purple-700" />
            Live Hospital Pharmaceutical Inventory ({medicines.length} Formularies)
          </h3>
          <span className="text-xs font-mono text-slate-500 font-bold">Real-Time Sync</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {medicines.map((med) => {
            const isLow = Number(med.quantity) <= (med.minThreshold || 30);
            return (
              <div
                key={med.id}
                className={`clean-card p-4 transition-all ${
                  isLow ? 'border-amber-300 bg-amber-50/40' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-1 mb-1.5">
                  <span className="font-mono text-[10px] text-slate-500 font-bold uppercase truncate">{med.category || 'Drug'}</span>
                  {med.isScarce && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                      SCARCE
                    </span>
                  )}
                </div>
                <h4 className="font-bold text-slate-900 truncate">{med.name}</h4>
                <div className="flex items-baseline justify-between mt-2 pt-2 border-t border-slate-100 font-mono">
                  <span className="text-xs text-slate-500 font-medium">Available:</span>
                  <span className={`text-sm font-extrabold ${isLow ? 'text-amber-800' : 'text-emerald-700'}`}>
                    {med.quantity} <span className="text-[10px] font-normal text-slate-500">{med.unit}</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Incoming Prescriptions Queue */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-purple-700" />
            Incoming Prescription Fulfillment Queue (Step 2 in Saga Loop)
          </h3>
          <span className="text-xs font-mono text-slate-500 font-bold">
            {incomingPrescriptions.length} Orders Awaiting Verification
          </span>
        </div>

        <PrescriptionQueue />
      </div>
    </div>
  );
}
