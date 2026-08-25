import React, { useState } from 'react';
import { HeartPulse, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useHospital } from '../../context/HospitalContext.jsx';
import { db, doc, setDoc, DEFAULT_HOSPITAL_ID } from '../../firebase/firestore.js';

export default function LogEventForm({ onSuccess = null }) {
  const { currentUser } = useAuth();
  const { patients, playAlertTone } = useHospital();

  const [patientId, setPatientId] = useState(patients[0]?.patientId || '');
  const [eventType, setEventType] = useState('vitals_recorded');
  const [notes, setNotes] = useState('Routine vitals logged; patient alert and oriented.');
  const [hr, setHr] = useState(76);
  const [bp, setBp] = useState('120/80');
  const [spo2, setSpo2] = useState(98);
  const [temp, setTemp] = useState('98.6 F');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const selectedPatient = patients.find(p => p.patientId === patientId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);

    const eventId = `evt-clin-${Date.now()}`;
    const newEvent = {
      id: eventId,
      type: 'clinical_event',
      resourceId: selectedPatient?.currentBedId || 'PATIENT_BEDSIDE',
      actorId: currentUser?.id || 'nurse-1',
      actorName: currentUser?.name || 'Nurse Pooja Pawar',
      actorRole: 'nurse',
      timestamp: new Date().toISOString(),
      idempotencyKey: `clin-${Date.now()}`,
      resultingVersion: 1,
      payload: {
        eventType,
        patientId,
        patientName: selectedPatient?.name || 'Patient',
        notes,
        vitals: { hr, bp, spo2, temp }
      }
    };

    try {
      // Write event doc to Firestore
      await setDoc(doc(db, 'hospitals', DEFAULT_HOSPITAL_ID, 'events', eventId), newEvent).catch(() => {});

      // Sync with local store
      const raw = localStorage.getItem('nexus_local_events');
      const events = raw ? JSON.parse(raw) : [];
      events.unshift(newEvent);
      localStorage.setItem('nexus_local_events', JSON.stringify(events));
      window.dispatchEvent(new CustomEvent('nexus_store_updated', { detail: { key: 'nexus_local_events' } }));

      playAlertTone('success');
      setFeedback({ type: 'success', message: 'Clinical event successfully appended to immutable audit log!' });
      if (onSuccess) onSuccess(newEvent);
    } catch (err) {
      setFeedback({ type: 'error', message: `Failed to log event: ${err.message}` });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-xs">
      {/* Patient Selector */}
      <div>
        <label className="block text-slate-700 font-semibold mb-1">Select Patient</label>
        <select
          value={patientId}
          onChange={(e) => setPatientId(e.target.value)}
          className="clean-input w-full font-medium"
        >
          {patients.map((p) => (
            <option key={p.patientId} value={p.patientId}>
              {p.name} ({p.patientId}) • Bed: {p.currentBedId || 'N/A'} • {p.diagnosis}
            </option>
          ))}
        </select>
      </div>

      {/* Event Category */}
      <div>
        <label className="block text-slate-700 font-semibold mb-1">Clinical Action Type</label>
        <select
          value={eventType}
          onChange={(e) => setEventType(e.target.value)}
          className="clean-input w-full font-medium"
        >
          <option value="vitals_recorded">Vitals & Hemodynamic Check</option>
          <option value="medicine_administered">Bedside Medication Administered</option>
          <option value="urine_bag_changed">Urine Bag / Catheter Changed</option>
          <option value="wound_dressing">Wound Dressing / Inspection</option>
          <option value="iv_line_flushed">IV Line Flushed & Patency Verified</option>
          <option value="patient_turned">Patient Turned / Repositioned</option>
        </select>
      </div>

      {/* Vitals Telemetry Inputs */}
      <div>
        <label className="block text-slate-700 font-semibold mb-1.5">Bedside Vitals</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase">HR (bpm)</span>
            <input
              type="number"
              value={hr}
              onChange={(e) => setHr(e.target.value)}
              className="clean-input w-full font-mono text-center font-bold"
            />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase">BP (mmHg)</span>
            <input
              type="text"
              value={bp}
              onChange={(e) => setBp(e.target.value)}
              className="clean-input w-full font-mono text-center font-bold"
            />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase">SpO2 (%)</span>
            <input
              type="number"
              value={spo2}
              onChange={(e) => setSpo2(e.target.value)}
              className="clean-input w-full font-mono text-center font-bold"
            />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase">Temp</span>
            <input
              type="text"
              value={temp}
              onChange={(e) => setTemp(e.target.value)}
              className="clean-input w-full font-mono text-center font-bold"
            />
          </div>
        </div>
      </div>

      {/* Clinical Notes */}
      <div>
        <label className="block text-slate-700 font-semibold mb-1">Clinical Observation Notes</label>
        <textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="clean-input w-full text-xs"
        />
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={submitting}
        className="btn-primary w-full py-3 text-xs font-bold flex items-center justify-center gap-2"
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Appending to Event Stream...
          </>
        ) : (
          <>
            <HeartPulse className="w-4 h-4" /> Commit Clinical Event to Audit Log
          </>
        )}
      </button>
    </form>
  );
}
