import React, { useState } from 'react';
import { Pill, ShieldCheck, AlertTriangle, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useHospital } from '../../context/HospitalContext.jsx';
import { startPrescriptionSaga } from '../../services/sagaService.js';
import StatusBadge from '../common/StatusBadge.jsx';

export default function PrescriptionForm({ preselectedPatient = null, onSuccess = null }) {
  const { currentUser } = useAuth();
  const { resources, patients, playAlertTone } = useHospital();

  const [patientId, setPatientId] = useState(preselectedPatient?.patientId || patients[0]?.patientId || '');
  const [medicineId, setMedicineId] = useState('med-amoxicillin');
  const [dosage, setDosage] = useState('1 capsule orally TDS for 5 days');
  const [quantity, setQuantity] = useState(10);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const medicines = resources.filter(r => r.type === 'medicine');
  const selectedMed = medicines.find(m => m.id === medicineId);
  const selectedPatient = patients.find(p => p.patientId === patientId);

  const isStockScarce = selectedMed && (Number(selectedMed.quantity) <= (selectedMed.minThreshold || 30));
  const isStockInsufficient = selectedMed && (Number(selectedMed.quantity) < Number(quantity));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!medicineId || !patientId) return;

    setSubmitting(true);
    setFeedback(null);

    try {
      const result = await startPrescriptionSaga({
        patientId,
        patientName: selectedPatient?.name || 'Assigned Patient',
        medicineId,
        medicineName: selectedMed?.name || medicineId,
        dosage,
        quantity: Number(quantity),
        doctorId: currentUser?.id || 'doc-1',
        doctorName: currentUser?.name || 'Dr. Ananya Sharma',
        notes
      });

      playAlertTone('success');
      setFeedback({
        type: 'success',
        message: `Prescription Saga initiated (#${result.sagaId})! Stock decremented to ${result.remainingStock}. Order routed to Pharmacy.`
      });

      if (onSuccess) onSuccess(result);
    } catch (err) {
      playAlertTone('conflict');
      setFeedback({
        type: 'error',
        message: `Prescription Failed: ${err.message}`
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-xs">
      {/* Patient Selector */}
      <div>
        <label className="block text-slate-300 font-medium mb-1">Target Patient</label>
        <select
          value={patientId}
          onChange={(e) => setPatientId(e.target.value)}
          className="glass-input w-full"
        >
          {patients.map((p) => (
            <option key={p.patientId} value={p.patientId}>
              {p.name} ({p.patientId}) • Bed: {p.currentBedId || 'N/A'} • {p.diagnosis}
            </option>
          ))}
        </select>
      </div>

      {/* Medicine Inventory Selector */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-slate-300 font-medium">Select Pharmaceutical</label>
          {selectedMed && (
            <span className="font-mono text-[11px] text-slate-400">
              Live Stock: <strong className={isStockScarce ? 'text-amber-400' : 'text-emerald-400'}>{selectedMed.quantity} {selectedMed.unit}</strong>
            </span>
          )}
        </div>

        <select
          value={medicineId}
          onChange={(e) => setMedicineId(e.target.value)}
          className="glass-input w-full font-mono"
        >
          {medicines.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} [Stock: {m.quantity} {m.unit}] {m.isScarce ? '⚠️ SCARCE DEMO' : ''}
            </option>
          ))}
        </select>

        {/* Scarce stock warning box */}
        {isStockScarce && (
          <div className="mt-2 p-2 rounded-xl bg-amber-950/30 border border-amber-500/40 text-amber-300 flex items-center gap-2 text-[11px]">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 text-amber-400" />
            <span>
              Low Stock Notice: Only {selectedMed.quantity} {selectedMed.unit} remaining. Perfect for demoing automated stock rollbacks!
            </span>
          </div>
        )}
      </div>

      {/* Quantity & Dosage */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-slate-300 font-medium mb-1">Quantity to Deduct</label>
          <input
            type="number"
            min="1"
            max="100"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="glass-input w-full font-mono"
          />
        </div>

        <div>
          <label className="block text-slate-300 font-medium mb-1">Dosage & Frequency</label>
          <input
            type="text"
            value={dosage}
            onChange={(e) => setDosage(e.target.value)}
            placeholder="e.g. 500mg IV stat, then Q8H"
            className="glass-input w-full"
          />
        </div>
      </div>

      {/* Clinical Notes */}
      <div>
        <label className="block text-slate-300 font-medium mb-1">Clinical Instructions & Notes</label>
        <textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Monitor blood pressure and telemetry 15 mins post-injection..."
          className="glass-input w-full"
        />
      </div>

      {/* Feedback */}
      {feedback && (
        <div
          className={`p-3 rounded-xl border flex items-center gap-2 text-xs ${
            feedback.type === 'success'
              ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={submitting || isStockInsufficient}
        className="btn-primary w-full py-2.5 text-xs font-semibold flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-purple-950/30"
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Starting 3-Step Saga...
          </>
        ) : (
          <>
            <Pill className="w-4 h-4" /> Start Prescription Saga (Step 1: Order)
          </>
        )}
      </button>
    </form>
  );
}
