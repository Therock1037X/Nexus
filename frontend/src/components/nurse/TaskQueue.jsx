import React, { useState } from 'react';
import {
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

export default function TaskQueue({ onActionComplete = null }) {
  const { currentUser } = useAuth();
  const { sagas, playAlertTone } = useHospital();
  const [submittingId, setSubmittingId] = useState(null);
  const [abortModalSaga, setAbortModalSaga] = useState(null);
  const [abortReason, setAbortReason] = useState('Patient developed allergic reaction or allergy noted; order cancelled.');

  // Find prescriptions ready for Nurse Bedside Administration (dispense step is done, administer step is pending)
  const pendingNurseTasks = sagas.filter((s) => {
    if (s.status !== 'in_progress') return false;
    const dispenseStep = s.steps?.find(st => st.stepName === 'dispense');
    const adminStep = s.steps?.find(st => st.stepName === 'administer');
    return dispenseStep?.status === 'done' && adminStep?.status === 'pending';
  });

  const handleAdminister = async (saga) => {
    setSubmittingId(saga.id);
    try {
      await advancePrescriptionStep({
        sagaId: saga.id,
        stepName: 'administer',
        actorId: currentUser?.id || 'nurse-1',
        actorName: currentUser?.name || 'Nurse Pooja Pawar',
        actorRole: 'nurse',
        details: `Dose administered to ${saga.patientName}. Vitals confirmed stable.`,
        clinicalVitals: { hr: 78, bp: '120/80', spo2: 98, temp: '98.6 F' }
      });
      playAlertTone('success');
      if (onActionComplete) onActionComplete();
    } catch (err) {
      alert(`Administration failed: ${err.message}`);
    } finally {
      setSubmittingId(null);
    }
  };

  const handleCompensate = async (saga) => {
    setSubmittingId(saga.id);
    try {
      await compensateSaga({
        sagaId: saga.id,
        actorId: currentUser?.id || 'nurse-1',
        actorName: currentUser?.name || 'Nurse Pooja Pawar',
        actorRole: 'nurse',
        reason: abortReason || 'Bedside allergy / clinical cancellation'
      });
      playAlertTone('conflict');
      setAbortModalSaga(null);
      if (onActionComplete) onActionComplete();
    } catch (err) {
      alert(`Cancel failed: ${err.message}`);
    } finally {
      setSubmittingId(null);
    }
  };

  if (pendingNurseTasks.length === 0) {
    return (
      <div className="clean-card p-12 text-center text-slate-500 bg-white">
        <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-600 mb-2" />
        <p className="text-sm font-bold text-slate-800">All Prescriptions Administered!</p>
        <p className="text-xs text-slate-500 mt-1 font-medium">
          No pending dispensed medications awaiting bedside delivery.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {pendingNurseTasks.map((saga) => {
        const isProcessing = submittingId === saga.id;

        return (
          <div
            key={saga.id}
            className="clean-card p-5 border-emerald-200 bg-white"
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
                    Give {saga.quantity}x {saga.medicineName}
                  </h4>
                  <p className="text-xs text-emerald-800 font-semibold">{saga.dosage}</p>
                </div>
              </div>

              <div className="text-right text-xs font-medium text-slate-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" /> Dispensed by Pharmacy
                </span>
              </div>
            </div>

            {/* Patient & Instructions */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs mb-3.5 flex items-center justify-between font-medium">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-700" />
                <span className="text-slate-900 font-bold">{saga.patientName}</span>
                <span className="text-slate-500 font-mono">({saga.patientId})</span>
              </div>
              {saga.notes && (
                <span className="text-[11px] text-slate-500 italic truncate max-w-[220px]">
                  "{saga.notes}"
                </span>
              )}
            </div>

            {/* 3-Step Pipeline */}
            <div className="grid grid-cols-3 gap-2 text-xs font-medium mb-4">
              <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-center font-bold">
                1. Ordered ✓
              </div>
              <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-center font-bold">
                2. Dispensed ✓
              </div>
              <div className="p-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-center font-bold animate-pulse">
                3. Give to Patient
              </div>
            </div>

            {/* Nurse Action Buttons */}
            <div className="flex items-center gap-2.5 pt-3 border-t border-slate-100">
              <button
                onClick={() => handleAdminister(saga)}
                disabled={isProcessing}
                className="flex-1 btn-primary text-xs py-2.5 flex items-center justify-center gap-2 font-bold"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Confirm Given & Vitals Stable
                  </>
                )}
              </button>

              <button
                onClick={() => setAbortModalSaga(saga)}
                disabled={isProcessing}
                className="btn-danger text-xs py-2.5 px-4 flex items-center gap-1.5 flex-shrink-0 font-bold"
                title="Cancel order and safely return medicine to pharmacy"
              >
                <RotateCcw className="w-4 h-4" /> Cancel / Reaction
              </button>
            </div>
          </div>
        );
      })}

      {/* Cancel Order Modal */}
      {abortModalSaga && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white max-w-md w-full rounded-2xl p-6 border border-slate-200 shadow-xl">
            <div className="flex items-center gap-2.5 text-rose-700 mb-3">
              <RotateCcw className="w-5 h-5" />
              <h3 className="text-base font-bold text-slate-900">Cancel Prescription & Return Stock</h3>
            </div>

            <p className="text-xs text-slate-600 mb-3.5 leading-relaxed font-medium">
              Cancelling this will safely return <strong>{abortModalSaga.quantity}x {abortModalSaga.medicineName}</strong> back to the pharmacy inventory without leaving orphan records.
            </p>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Cancellation</label>
              <textarea
                rows={2}
                value={abortReason}
                onChange={(e) => setAbortReason(e.target.value)}
                className="clean-input w-full text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => setAbortModalSaga(null)}
                className="btn-secondary text-xs px-3.5 py-2"
              >
                Go Back
              </button>
              <button
                onClick={() => handleCompensate(abortModalSaga)}
                disabled={submittingId === abortModalSaga.id}
                className="btn-danger text-xs px-4 py-2 font-bold"
              >
                Confirm Cancel & Return Medicine
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
