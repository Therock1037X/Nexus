import React, { useState } from 'react';
import {
  User,
  X,
  Bed,
  Pill,
  Sparkles,
  FileText,
  Download,
  Eye,
  Upload,
  Calendar,
  Phone,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRightLeft,
  Loader2,
  HeartPulse,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useHospital } from '../../context/HospitalContext.jsx';
import { reassignPatientDoctor, attachPatientDocument } from '../../services/patientService.js';
import StatusBadge from '../common/StatusBadge.jsx';
import { SEED_DATA } from '../../services/seedService.js';

export default function PatientProfileModal({
  patient,
  isOpen,
  onClose,
  onPrescribe = null,
  onTransfer = null,
  onEscalate = null
}) {
  const { currentUser } = useAuth();
  const { staff, events, sagas, playAlertTone } = useHospital();

  const [selectedDoctorId, setSelectedDoctorId] = useState(patient?.assignedDoctorId || 'doc-1');
  const [isReassigning, setIsReassigning] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [feedback, setFeedback] = useState(null);

  if (!isOpen || !patient) return null;

  const doctors = staff?.filter(s => s.role === 'doctor') || SEED_DATA.doctors;

  // Filter events relating to this patient for plain-language clinical history
  const patientEvents = events.filter((e) => {
    return (
      e.payload?.patientId === patient.patientId ||
      e.resourceId === patient.patientId ||
      e.payload?.patientName === patient.name
    );
  });

  // Filter sagas relating to this patient
  const patientSagas = sagas.filter(s => s.patientId === patient.patientId);

  // Combine events into a human-readable timeline
  const timelineItems = [
    {
      title: 'Admitted through OPD',
      desc: `Patient admitted with: "${patient.reason || patient.diagnosis || 'Clinical Consult'}"`,
      time: patient.admittedAt ? new Date(patient.admittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Admission',
      date: patient.admittedAt ? new Date(patient.admittedAt).toLocaleDateString() : 'Today',
      icon: User,
      color: 'bg-emerald-100 text-emerald-800'
    },
    ...patientEvents.map(e => ({
      title: e.type === 'patient_admitted'
        ? 'Patient Admitted'
        : e.type === 'patient_reassigned'
        ? 'Doctor Reassigned'
        : e.type === 'clinical_event'
        ? `Clinical Observation: ${e.payload?.eventType || 'Vitals'}`
        : e.type === 'escalation_preemption'
        ? 'Emergency Priority Override Applied'
        : e.type === 'document_uploaded'
        ? 'Lab Document Uploaded'
        : e.payload?.action || 'Hospital Care Action',
      desc: e.payload?.description || e.payload?.notes || `Recorded by ${e.actorName || 'Staff'} (${e.actorRole || 'Clinician'})`,
      time: new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: new Date(e.timestamp).toLocaleDateString(),
      icon: e.type === 'clinical_event' ? HeartPulse : CheckCircle2,
      color: e.type === 'escalation_preemption' ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'
    })),
    ...patientSagas.map(s => ({
      title: `Prescription: ${s.medicineName} (${s.quantity}x)`,
      desc: `Status: ${s.status === 'completed' ? 'Administered to Patient' : s.status === 'in_progress' ? 'Dispensing / In Progress' : s.status}`,
      time: new Date(s.updatedAt || s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: new Date(s.updatedAt || s.createdAt).toLocaleDateString(),
      icon: Pill,
      color: 'bg-purple-100 text-purple-800'
    }))
  ];

  const handleReassign = async () => {
    const docObj = doctors.find(d => d.id === selectedDoctorId);
    if (!docObj || docObj.id === patient.assignedDoctorId) return;

    setIsReassigning(true);
    try {
      await reassignPatientDoctor({
        patientId: patient.patientId,
        newDoctorId: docObj.id,
        newDoctorName: docObj.name,
        reassignedBy: currentUser?.name || 'Attending Physician'
      });
      playAlertTone('success');
      setFeedback({ type: 'success', message: `Patient reassigned to ${docObj.name}!` });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setIsReassigning(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      await attachPatientDocument({
        patientId: patient.patientId,
        document: {
          name: file.name,
          type: file.type || 'application/pdf',
          size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
          notes: 'Uploaded by Doctor'
        },
        uploadedBy: currentUser?.name || 'Doctor'
      });
      playAlertTone('success');
      setFeedback({ type: 'success', message: `Report "${file.name}" attached successfully!` });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadDoc = (doc) => {
    // Generate a simple client-side printable/downloadable medical report preview
    const blob = new Blob([
      `========================================================================\n` +
      `                     APEX CITY HOSPITAL & RESEARCH CENTER              \n` +
      `                   DEPARTMENT OF CLINICAL INVESTIGATIONS                \n` +
      `========================================================================\n\n` +
      `PATIENT NAME:      ${patient.name.toUpperCase()}\n` +
      `PATIENT ID:        ${patient.patientId}\n` +
      `AGE / GENDER:      ${patient.age} Yrs / ${patient.gender}\n` +
      `ATTENDING DOCTOR:  ${patient.assignedDoctorName}\n` +
      `CURRENT BED/WARD:  ${patient.currentBedId || 'Awaiting Ward Bed'}\n` +
      `DOCUMENT NAME:     ${doc.name}\n` +
      `DATE OF REPORT:    ${doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleString() : new Date().toLocaleString()}\n` +
      `UPLOADED BY:       ${doc.uploadedBy || 'Clinical Staff'}\n\n` +
      `------------------------------------------------------------------------\n` +
      `CLINICAL OBSERVATION & FINDINGS:\n` +
      `------------------------------------------------------------------------\n` +
      `Diagnosis:         ${patient.diagnosis || patient.reason}\n` +
      `Report Notes:      ${doc.notes || 'Routine Diagnostic Evaluation'}\n` +
      `Vitals Recorded:   HR: ${patient.vitals?.hr || 76} bpm | BP: ${patient.vitals?.bp || '120/80'} | SpO2: ${patient.vitals?.spo2 || 98}%\n\n` +
      `Verified by Attending Clinician.\n` +
      `========================================================================\n`
    ], { type: 'text/plain' });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.name.endsWith('.pdf') ? doc.name.replace('.pdf', '.txt') : `${doc.name}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white max-w-3xl w-full rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xl relative max-h-[92vh] overflow-y-auto flex flex-col justify-between">
        <div>
          {/* Top Bar */}
          <div className="flex items-start justify-between pb-4 mb-5 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-700 text-white font-extrabold flex items-center justify-center text-lg shadow-sm">
                {patient.name?.charAt(0) || 'P'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-extrabold text-slate-900">{patient.name}</h3>
                  <StatusBadge status={patient.status} size="xs" />
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  ID: <span className="font-mono font-bold text-slate-700">{patient.patientId}</span> • {patient.age} yrs, {patient.gender} • Phone: {patient.phone || '+91 98200 12345'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {feedback && (
            <div
              className={`mb-4 p-3 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Key Info Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Current Bed / Ward</span>
              <span className="text-sm font-extrabold text-emerald-800 mt-0.5 flex items-center gap-1.5">
                <Bed className="w-4 h-4 text-emerald-700" />
                {patient.currentBedId || 'Awaiting Bed Allocation'}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Attending Doctor</span>
              <span className="text-sm font-extrabold text-slate-900 mt-0.5 block truncate">
                {patient.assignedDoctorName || 'Dr. Ananya Sharma'}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Reason for Visit / Diagnosis</span>
              <span className="text-xs font-semibold text-slate-800 mt-0.5 block line-clamp-1">
                {patient.diagnosis || patient.reason || 'OPD Consult'}
              </span>
            </div>
          </div>

          {/* Doctor Reassignment Section */}
          <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="font-bold text-xs text-slate-900 block flex items-center gap-1.5">
                <ArrowRightLeft className="w-4 h-4 text-emerald-700" />
                Reassign Patient to Another Doctor
              </span>
              <span className="text-[11px] text-slate-600 font-medium">
                Immediately transfers patient into selected doctor's "My Patients" list.
              </span>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <select
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                className="clean-input text-xs font-medium py-1.5"
              >
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.specialty || 'General'})
                  </option>
                ))}
              </select>

              <button
                onClick={handleReassign}
                disabled={isReassigning || selectedDoctorId === patient.assignedDoctorId}
                className="btn-primary text-xs py-1.5 px-3 whitespace-nowrap font-bold"
              >
                {isReassigning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Reassign'}
              </button>
            </div>
          </div>

          {/* Two-Column Details: Reports (Left) & Clinical Timeline (Right) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Attached PDF Reports & Documents */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-emerald-700" />
                  Medical Reports ({patient.documents?.length || 0})
                </h4>

                <div>
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    id="attach-doc-input"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="attach-doc-input"
                    className="cursor-pointer text-[11px] text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200"
                  >
                    <Upload className="w-3 h-3" />
                    {isUploading ? 'Uploading...' : 'Attach PDF'}
                  </label>
                </div>
              </div>

              {(!patient.documents || patient.documents.length === 0) ? (
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500 font-medium">
                  No medical reports attached yet.
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {patient.documents.map((doc, idx) => (
                    <div
                      key={doc.id || idx}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-emerald-300 transition-colors flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-2 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 flex-shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 truncate">{doc.name}</div>
                          <div className="text-[10px] text-slate-500 font-medium">
                            {doc.size || '1.5 MB'} • {doc.uploadedBy || 'Hospital Lab'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                        <button
                          onClick={() => setPreviewDoc(doc)}
                          title="Preview Report"
                          className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-slate-100"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDownloadDoc(doc)}
                          title="Download Report"
                          className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-slate-100"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Plain-Language Clinical Timeline */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-700" />
                Patient Care History
              </h4>

              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {timelineItems.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div key={idx} className="flex items-start gap-2.5 text-xs">
                      <div className={`p-1.5 rounded-lg ${item.color} flex-shrink-0 mt-0.5`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{item.title}</span>
                          <span className="text-[10px] font-mono text-slate-400">{item.time}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 font-medium mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Quick Action CTAs for Doctor */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5 flex-wrap">
          {onPrescribe && (
            <button
              onClick={() => {
                onClose();
                onPrescribe(patient);
              }}
              className="btn-purple text-xs py-2 px-3.5 flex items-center gap-1.5 font-bold"
            >
              <Pill className="w-4 h-4" /> Prescribe Medication
            </button>
          )}

          {onTransfer && (
            <button
              onClick={() => {
                onClose();
                onTransfer(patient);
              }}
              className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 font-bold"
            >
              <Bed className="w-4 h-4" /> Request Bed / OT
            </button>
          )}

          {onEscalate && (
            <button
              onClick={() => {
                onClose();
                onEscalate(patient);
              }}
              className="btn-danger text-xs py-2 px-3.5 flex items-center gap-1.5 font-bold"
            >
              <Sparkles className="w-4 h-4" /> Priority Override
            </button>
          )}
        </div>
      </div>

      {/* PDF Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white max-w-lg w-full rounded-2xl p-6 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-700" />
                <h4 className="font-bold text-sm text-slate-900 truncate">{previewDoc.name}</h4>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2 text-slate-700 font-mono">
              <div className="text-center font-bold text-slate-900 text-sm border-b pb-2 border-slate-200">
                APEX HOSPITAL DIAGNOSTIC REPORT
              </div>
              <div><strong>Patient:</strong> {patient.name} ({patient.patientId})</div>
              <div><strong>Attending Doctor:</strong> {patient.assignedDoctorName}</div>
              <div><strong>Document:</strong> {previewDoc.name}</div>
              <div><strong>Uploaded:</strong> {previewDoc.uploadedAt ? new Date(previewDoc.uploadedAt).toLocaleString() : 'Today'}</div>
              <div><strong>Verified By:</strong> {previewDoc.uploadedBy || 'Clinical Laboratory'}</div>
              <div className="pt-2 border-t border-slate-200 text-slate-600 font-sans">
                <strong>Findings:</strong> {previewDoc.notes || 'Normal anatomical limits and stable physiological markers.'}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-4">
              <button
                onClick={() => setPreviewDoc(null)}
                className="btn-secondary text-xs px-3 py-1.5"
              >
                Close
              </button>
              <button
                onClick={() => handleDownloadDoc(previewDoc)}
                className="btn-primary text-xs px-4 py-1.5 font-bold flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> Download Document
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
