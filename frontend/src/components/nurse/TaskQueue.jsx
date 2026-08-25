import React, { useState } from 'react';
import {
  ClipboardList,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Pill,
  HeartPulse,
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
  const [abortReason, setAbortReason] = useState('Patient developed rash and severe tachycardia; order aborted.');

  // Find sagas ready for Nurse Bedside Administration (dispense step is done, administer step is pending)
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
        details: `Bedside dose administered to ${saga.patientName}. Vitals confirmed stable.`,
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
        reason: abortReason || 'Bedside contraindication / allergic reaction'
      });
      playAlertTone('conflict');
      setAbortModalSaga(null);
      if (onActionComplete) onActionComplete();
    } catch (err) {
      alert(`Rollback failed: ${err.message}`);
    } finally {
      setSubmittingId(null);
    }
  };

  if (pendingNurseTasks.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-8 text-center text-slate-400">
        <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
        <p className="text-sm font-medium text-slate-200">Nurse Task Queue is Clean!</p>
        <p className="text-xs text-slate-500 mt-1">
          No pending dispensed prescriptions awaiting bedside administration.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {pendingNurseTasks.map((saga) => {
        const isProcessing = submittingId === saga.id;

        return (
          <div
            key={saga.id}
            className="glass-card rounded-2xl p-4 border border-cyan-500/30 hover:border-cyan-500/50 transition-all"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-start gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/30">
                  <Pill className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-slate-400">{saga.id}</span>
                    <StatusBadge status="pending" size="xs" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-100 mt-0.5">
                    Administer {saga.quantity}x {saga.medicineName}
                  </h4>
                  <p className="text-xs text-cyan-300 font-medium">{saga.dosage}</p>
                </div>
              </div>

              <div className="text-right font-mono text-[11px] text-slate-400">
                <span className="flex items-center gap-1 text-slate-500">
                  <Clock className="w-3 h-3" /> Dispensed by Pharmacy
                </span>
              </div>
            </div>

            {/* Patient & Instructions */}
            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-slate-200 font-medium">{saga.patientName}</span>
                <span className="text-slate-500 font-mono">({saga.patientId})</span>
              </div>
              {saga.notes && (
                <span className="text-[11px] text-slate-400 italic truncate max-w-[200px]">
                  "{saga.notes}"
                </span>
              )}
            </div>

            {/* Step Progress Visualizer */}
            <div className="grid grid-cols-3 gap-1.5 text-[11px] font-mono mb-3">
              <div className="p-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-center">
                1. Order ✓
              </div>
              <div className="p-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-center">
                2. Dispensed ✓
              </div>
              <div className="p-1.5 rounded-lg bg-cyan-950/60 border border-cyan-500/50 text-cyan-300 text-center font-bold animate-pulse">
                3. Administer (You)
              </div>
            </div>

            {/* Nurse Action Buttons */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => handleAdminister(saga)}
                disabled={isProcessing}
                className="flex-1 btn-primary text-xs py-2 flex items-center justify-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-950/40"
              >
                {isProcessing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Confirm Administered & Log Vitals
                  </>
                )}
              </button>

              <button
                onClick={() => setAbortModalSaga(saga)}
                disabled={isProcessing}
                className="btn-danger text-xs py-2 px-3 flex items-center gap-1.5 flex-shrink-0"
                title="Trigger automated compensation & stock rollback"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Abort / Allergic Reaction
              </button>
            </div>
          </div>
        );
      })}

      {/* Compensation / Abort Modal */}
      {abortModalSaga && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="glass-panel max-w-md w-full rounded-2xl p-6 border border-rose-700/80 shadow-2xl">
            <div className="flex items-center gap-2.5 text-rose-400 mb-3">
              <RotateCcw className="w-5 h-5 animate-spin" />
              <h3 className="text-base font-bold text-slate-100">Trigger Saga Compensation (Rollback)</h3>
            </div>

            <p className="text-xs text-slate-300 mb-3">
              Aborting this saga will automatically execute the defined compensating action: <strong>{abortModalSaga.quantity}x {abortModalSaga.medicineName}</strong> will be refunded to pharmacy inventory via an atomic Firestore transaction.
            </p>

            <div className="mb-4">
              <label className="block text-xs font-medium text-slate-300 mb-1">Clinical Abort Reason</label>
              <textarea
                rows={2}
                value={abortReason}
                onChange={(e) => setAbortReason(e.target.value)}
                className="glass-input w-full text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setAbortModalSaga(null)}
                className="btn-secondary text-xs px-3 py-1.5"
              >
                Cancel
              </button>
              <button
                onClick={() => handleCompensate(abortModalSaga)}
                disabled={submittingId === abortModalSaga.id}
                className="btn-danger text-xs px-4 py-1.5 font-bold"
              >
                Confirm Compensation Rollback
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
