import React, { useState } from 'react';
import {
  PackageCheck,
  CheckCircle2,
  RotateCcw,
  Pill,
  User,
  Clock,
  Loader2
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
      <div className="clean-card p-12 text-center text-slate-500">
        <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-600 mb-2" />
        <p className="text-sm font-bold text-slate-800">Pharmacy Queue is Clear!</p>
        <p className="text-xs text-slate-500 mt-1 font-medium">
          No pending prescriptions awaiting pharmaceutical dispatch.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {incomingPrescriptions.map((saga) => {
        const isProcessing = submittingId === saga.id;
        const medObj = resources.find(r => r.id === saga.medicineId);

        return (
          <div
            key={saga.id}
            className="clean-card p-5 border-purple-200 bg-white"
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-200">
                  <Pill className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900">{saga.id}</span>
                    <StatusBadge status="pending" size="xs" />
                  </div>
                  <h4 className="text-sm font-extrabold text-slate-900 mt-0.5">
                    {saga.quantity}x {saga.medicineName}
                  </h4>
                  <p className="text-xs text-purple-800 font-semibold">{saga.dosage}</p>
                </div>
              </div>

              <div className="text-right font-mono text-[11px]">
                <div className="text-slate-500 font-medium">Inventory Stock:</div>
                <div className="font-extrabold text-emerald-700">{medObj?.quantity || '--'} {medObj?.unit || 'units'}</div>
              </div>
            </div>

            {/* Patient & Prescribing Physician */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs mb-3.5 flex items-center justify-between font-medium">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-700" />
                <span className="text-slate-900 font-bold">{saga.patientName}</span>
                <span className="text-slate-500 font-mono">({saga.patientId})</span>
              </div>
              <div className="text-[11px] text-slate-600">
                Prescribed by: <span className="text-slate-900 font-bold">{saga.steps?.[0]?.actorName || 'Attending Doctor'}</span>
              </div>
            </div>

            {/* Visual 3-Step Saga Progress */}
            <div className="grid grid-cols-3 gap-2 text-[11px] font-mono mb-4 font-semibold">
              <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-center">
                1. Ordered ✓
              </div>
              <div className="p-2 rounded-xl bg-purple-50 border border-purple-200 text-purple-800 text-center font-bold animate-pulse">
                2. Dispense (You)
              </div>
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-center">
                3. Administer
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center gap-2.5 pt-3 border-t border-slate-100">
              <button
                onClick={() => handleDispense(saga)}
                disabled={isProcessing}
                className="flex-1 btn-purple text-xs py-2.5 flex items-center justify-center gap-2 font-bold"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <PackageCheck className="w-4 h-4" /> Verify Stock & Dispense
                  </>
                )}
              </button>

              <button
                onClick={() => setRejectModalSaga(saga)}
                disabled={isProcessing}
                className="btn-danger text-xs py-2.5 px-4 flex items-center gap-1.5 flex-shrink-0 font-bold"
                title="Reject and trigger automated saga compensation"
              >
                <RotateCcw className="w-4 h-4" /> Reject Order
              </button>
            </div>
          </div>
        );
      })}

      {/* Reject & Compensate Modal */}
      {rejectModalSaga && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white max-w-md w-full rounded-2xl p-6 border border-slate-200 shadow-xl">
            <div className="flex items-center gap-2.5 text-rose-700 mb-3">
              <RotateCcw className="w-5 h-5 animate-spin" />
              <h3 className="text-base font-bold text-slate-900">Reject & Compensate Prescription</h3>
            </div>

            <p className="text-xs text-slate-600 mb-3.5 leading-relaxed font-medium">
              Rejecting this prescription will trigger an automatic rollback: <strong>{rejectModalSaga.quantity} units of {rejectModalSaga.medicineName}</strong> will be refunded to inventory and the saga status marked as compensated.
            </p>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Pharmacy Rejection Reason</label>
              <textarea
                rows={2}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="clean-input w-full text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => setRejectModalSaga(null)}
                className="btn-secondary text-xs px-3.5 py-2"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(rejectModalSaga)}
                disabled={submittingId === rejectModalSaga.id}
                className="btn-danger text-xs px-4 py-2 font-bold"
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
