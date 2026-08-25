import React, { useState } from 'react';
import { Pill, AlertTriangle, CheckCircle2, Loader2, Send } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useHospital } from '../../context/HospitalContext.jsx';
import { startPrescriptionSaga } from '../../services/sagaService.js';

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
        message: `Prescription sent successfully! Stock updated. Order dispatched to Central Pharmacy.`
      });

      if (onSuccess) onSuccess(result);
    } catch (err) {
      playAlertTone('conflict');
      setFeedback({
        type: 'error',
        message: `Could not send prescription: ${err.message}`
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-xs">
      {/* Patient Selector */}
      <div>
        <label className="block text-slate-700 font-semibold mb-1">Target Patient</label>
        <select
          value={patientId}
          onChange={(e) => setPatientId(e.target.value)}
          className="clean-input w-full font-medium"
        >
          {patients.map((p) => (
            <option key={p.patientId} value={p.patientId}>
              {p.name} ({p.patientId}) • Bed: {p.currentBedId || 'Awaiting Bed'} • {p.diagnosis}
            </option>
          ))}
        </select>
      </div>

      {/* Medicine Inventory Selector */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-slate-700 font-semibold">Select Medication</label>
          {selectedMed && (
            <span className="font-mono text-[11px] text-slate-500 font-medium">
              In Stock: <strong className={isStockScarce ? 'text-amber-700' : 'text-emerald-700'}>{selectedMed.quantity} {selectedMed.unit}</strong>
            </span>
          )}
        </div>

        <select
          value={medicineId}
          onChange={(e) => setMedicineId(e.target.value)}
          className="clean-input w-full font-mono font-medium"
        >
          {medicines.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} [Available: {m.quantity} {m.unit}] {m.isScarce ? '⚠️ Low Reserve' : ''}
            </option>
          ))}
        </select>

        {/* Scarce stock warning box */}
        {isStockScarce && (
          <div className="mt-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center gap-2 text-[11px] font-medium">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-600" />
            <span>
              Low Stock Notice: Only {selectedMed.quantity} {selectedMed.unit} remaining in pharmacy.
            </span>
          </div>
        )}
      </div>

      {/* Quantity & Dosage */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label className="block text-slate-700 font-semibold mb-1">Quantity</label>
          <input
            type="number"
            min="1"
            max="100"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="clean-input w-full font-mono font-bold"
          />
        </div>

        <div>
          <label className="block text-slate-700 font-semibold mb-1">Dosage & Schedule</label>
          <input
            type="text"
            value={dosage}
            onChange={(e) => setDosage(e.target.value)}
            placeholder="e.g. 500mg IV stat, then Q8H"
            className="clean-input w-full"
          />
        </div>
      </div>

      {/* Clinical Notes */}
      <div>
        <label className="block text-slate-700 font-semibold mb-1">Special Instructions for Nurse & Pharmacy</label>
        <textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Monitor blood pressure and vitals 15 mins post-dose..."
          className="clean-input w-full"
        />
      </div>

      {/* Feedback */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={submitting || isStockInsufficient}
        className="btn-purple w-full py-3 text-xs font-bold flex items-center justify-center gap-2"
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Sending to Pharmacy...
          </>
        ) : (
          <>
            <Send className="w-4 h-4" /> Send Prescription
          </>
        )}
      </button>
    </form>
  );
}
