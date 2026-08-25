import React, { useState } from 'react';
import {
  PackageCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Pill,
  User,
  Clock,
  Loader2,
  Building2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useHospital } from '../../context/HospitalContext.jsx';
import { advancePrescriptionStep, compensateSaga } from '../../services/sagaService.js';
import StatusBadge from '../common/StatusBadge.jsx';

export default function PrescriptionQueue({ onActionComplete = null }) {
  const { currentUser } = useAuth();
  const { sagas, resources, playAlertTone } = useHospital();
  const [submittingId, setSubmittingId] = useState(null);
  const [rejectModalSaga, setRejectModalSaga] = useState(null);
  const [rejectReason, setRejectReason] = useState('Stock damaged / batch expired during verification; order cancelled.');

  // Find incoming prescriptions awaiting pharmacy dispense (step 'dispense' is pending)
  const incomingPrescriptions = sagas.filter((s) => {
    if (s.status !== 'in_progress') return false;
    const dispenseStep = s.steps?.find(st => st.stepName === 'dispense');
    return dispenseStep?.status === 'pending';
  });

  const handleDispense = async (saga) => {
    setSubmittingId(saga.id);
    try {
      await advancePrescriptionStep({
        sagaId: saga.id,
        stepName: 'dispense',
        actorId: currentUser?.id || 'pharm-1',
        actorName: currentUser?.name || 'Pharmacist Amit Chawla',
        actorRole: 'pharmacy',
        details: `Batch verified & packaged. Dispatched to patient ward.`
      });
      playAlertTone('success');
      if (onActionComplete) onActionComplete();
    } catch (err) {
      alert(`Dispense failed: ${err.message}`);
    } finally {
      setSubmittingId(null);
    }
  };

  const handleReject = async (saga) => {
    setSubmittingId(saga.id);
    try {
      await compensateSaga({
        sagaId: saga.id,
        actorId: currentUser?.id || 'pharm-1',
        actorName: currentUser?.name || 'Pharmacist Amit Chawla',
        actorRole: 'pharmacy',
        reason: rejectReason || 'Pharmacy stock rejection'
      });
      playAlertTone('conflict');
      setRejectModalSaga(null);
      if (onActionComplete) onActionComplete();
    } catch (err) {
      alert(`Rejection failed: ${err.message}`);
    } finally {
      setSubmittingId(null);
    }
  };

  if (incomingPrescriptions.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-8 text-center text-slate-400">
        <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
        <p className="text-sm font-medium text-slate-200">Pharmacy Queue is Clear!</p>
        <p className="text-xs text-slate-500 mt-1">
          No pending prescriptions awaiting pharmaceutical dispatch.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {incomingPrescriptions.map((saga) => {
        const isProcessing = submittingId === saga.id;
        const medObj = resources.find(r => r.id === saga.medicineId);

        return (
          <div
            key={saga.id}
            className="glass-card rounded-2xl p-4 border border-purple-500/30 hover:border-purple-500/50 transition-all"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-start gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/15 text-purple-300 border border-purple-500/30">
                  <Pill className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-slate-300">{saga.id}</span>
                    <StatusBadge status="pending" size="xs" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-100 mt-0.5">
                    {saga.quantity}x {saga.medicineName}
                  </h4>
                  <p className="text-xs text-purple-300 font-medium">{saga.dosage}</p>
                </div>
              </div>

              <div className="text-right font-mono text-[11px]">
                <div className="text-slate-400">Inventory Stock:</div>
                <div className="font-bold text-emerald-400">{medObj?.quantity || '--'} {medObj?.unit || 'units'}</div>
              </div>
            </div>

            {/* Patient & Prescribing Physician */}
            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-slate-200 font-medium">{saga.patientName}</span>
                <span className="text-slate-500 font-mono">({saga.patientId})</span>
              </div>
              <div className="text-[11px] text-slate-400">
                Prescribed by: <span className="text-slate-300 font-medium">{saga.steps?.[0]?.actorName || 'Attending Doctor'}</span>
              </div>
            </div>

            {/* Visual 3-Step Saga Progress */}
            <div className="grid grid-cols-3 gap-1.5 text-[11px] font-mono mb-3">
              <div className="p-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-center">
                1. Ordered ✓
              </div>
              <div className="p-1.5 rounded-lg bg-purple-950/60 border border-purple-500/50 text-purple-300 text-center font-bold animate-pulse">
                2. Dispense (You)
              </div>
              <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-500 text-center">
                3. Administer
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => handleDispense(saga)}
                disabled={isProcessing}
                className="flex-1 btn-primary text-xs py-2 flex items-center justify-center gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-purple-950/40"
              >
                {isProcessing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <PackageCheck className="w-4 h-4" /> Verify Stock & Dispense
                  </>
                )}
              </button>

              <button
                onClick={() => setRejectModalSaga(saga)}
                disabled={isProcessing}
                className="btn-danger text-xs py-2 px-3 flex items-center gap-1.5 flex-shrink-0"
                title="Reject and trigger automated saga compensation"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reject Order
              </button>
            </div>
          </div>
        );
      })}

      {/* Reject & Compensate Modal */}
      {rejectModalSaga && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="glass-panel max-w-md w-full rounded-2xl p-6 border border-rose-700/80 shadow-2xl">
            <div className="flex items-center gap-2.5 text-rose-400 mb-3">
              <RotateCcw className="w-5 h-5 animate-spin" />
              <h3 className="text-base font-bold text-slate-100">Reject & Compensate Prescription</h3>
            </div>

            <p className="text-xs text-slate-300 mb-3">
              Rejecting this prescription will trigger an automatic rollback: <strong>{rejectModalSaga.quantity} units of {rejectModalSaga.medicineName}</strong> will be refunded to inventory and the saga status marked as compensated.
            </p>

            <div className="mb-4">
              <label className="block text-xs font-medium text-slate-300 mb-1">Pharmacy Rejection Reason</label>
              <textarea
                rows={2}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="glass-input w-full text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setRejectModalSaga(null)}
                className="btn-secondary text-xs px-3 py-1.5"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(rejectModalSaga)}
                disabled={submittingId === rejectModalSaga.id}
                className="btn-danger text-xs px-4 py-1.5 font-bold"
              >
                Confirm Rejection & Rollback
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
