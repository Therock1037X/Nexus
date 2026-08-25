import React, { useState } from 'react';
import {
  UserPlus,
  X,
  FileText,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Stethoscope,
  Phone,
  User,
  Calendar,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useHospital } from '../../context/HospitalContext.jsx';
import { admitNewPatient } from '../../services/patientService.js';
import { SEED_DATA } from '../../services/seedService.js';

export default function AdmitPatientModal({ isOpen, onClose, defaultDoctorId = null }) {
  const { currentUser } = useAuth();
  const { staff, playAlertTone } = useHospital();

  const doctors = staff?.filter(s => s.role === 'doctor') || SEED_DATA.doctors;

  const [name, setName] = useState('');
  const [age, setAge] = useState('42');
  const [gender, setGender] = useState('Male');
  const [phone, setPhone] = useState('+91 98200 ');
  const [reason, setReason] = useState('');
  const [priority, setPriority] = useState('normal');
  const [assignedDoctorId, setAssignedDoctorId] = useState(defaultDoctorId || doctors[0]?.id || 'doc-1');
  const [documents, setDocuments] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    const newDocs = files.map((file) => ({
      id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: file.name,
      type: file.type || 'application/pdf',
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      uploadedAt: new Date().toISOString(),
      uploadedBy: currentUser?.name || 'Reception Staff',
      notes: 'Uploaded at OPD Reception'
    }));
    setDocuments([...documents, ...newDocs]);
  };

  const removeDoc = (index) => {
    setDocuments(documents.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    setFeedback(null);

    const docObj = doctors.find(d => d.id === assignedDoctorId) || doctors[0];

    try {
      const newPat = await admitNewPatient({
        name: name.trim(),
        age,
        gender,
        phone,
        reason: reason.trim() || 'General OPD Consultation',
        diagnosis: reason.trim() || 'Preliminary OPD Evaluation',
        assignedDoctorId: docObj?.id || 'doc-1',
        assignedDoctorName: docObj?.name || 'Dr. Ananya Sharma',
        priority,
        documents,
        admittedBy: currentUser?.name || 'OPD Reception Staff'
      });

      playAlertTone('success');
      setFeedback({
        type: 'success',
        message: `Patient ${newPat.name} admitted successfully and assigned to ${docObj?.name}!`
      });

      setTimeout(() => {
        onClose();
        setName('');
        setReason('');
        setDocuments([]);
        setFeedback(null);
      }, 1200);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to admit patient.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white max-w-xl w-full rounded-2xl p-6 sm:p-7 border border-slate-200 shadow-xl relative max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">Admit New Patient (OPD / Reception)</h3>
              <p className="text-xs text-slate-500 font-medium">Record patient intake and assign directly to attending doctor</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
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
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Patient Name */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Full Patient Name</label>
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Anand Kulkarni"
                className="clean-input w-full pl-9"
                required
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          {/* Age, Gender & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Age</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                min="1"
                max="120"
                className="clean-input w-full font-mono text-center font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="clean-input w-full font-medium"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Contact Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98..."
                className="clean-input w-full font-mono text-xs"
              />
            </div>
          </div>

          {/* Assign Attending Doctor */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1 flex items-center justify-between">
              <span>Assign Attending Doctor</span>
              <span className="text-[11px] text-emerald-700 font-bold">Appears in their dashboard</span>
            </label>
            <select
              value={assignedDoctorId}
              onChange={(e) => setAssignedDoctorId(e.target.value)}
              className="clean-input w-full font-medium"
            >
              {doctors.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.name} • {doc.specialty || 'General Care'}
                </option>
              ))}
            </select>
          </div>

          {/* Reason for Visit / Chief Complaint */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Reason for Visit / Chief Complaint</label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Acute chest discomfort radiating to left arm for 2 hours, shortness of breath..."
              className="clean-input w-full text-xs"
              required
            />
          </div>

          {/* Urgency Level */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Initial Urgency Level</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'normal', label: 'Normal OPD', desc: 'Standard consult', color: 'border-emerald-300 bg-emerald-50/60 text-emerald-900' },
                { id: 'urgent', label: 'Urgent', desc: 'Priority attention', color: 'border-blue-300 bg-blue-50/60 text-blue-900' },
                { id: 'critical', label: 'Critical', desc: 'Immediate ER/ICU', color: 'border-rose-300 bg-rose-50/60 text-rose-900' }
              ].map((lvl) => (
                <button
                  key={lvl.id}
                  type="button"
                  onClick={() => setPriority(lvl.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    priority === lvl.id ? `${lvl.color} ring-2 ring-emerald-600/20 font-bold shadow-xs` : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <div className="font-bold text-xs">{lvl.label}</div>
                  <div className="text-[10px] text-slate-500 font-normal">{lvl.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* PDF Report Upload */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Attach Prior Reports / Scans (PDF)</label>
            <div className="border-2 border-dashed border-slate-200 hover:border-emerald-400 rounded-xl p-3.5 text-center transition-colors bg-slate-50/50">
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                multiple
                id="report-file-input"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="report-file-input" className="cursor-pointer flex flex-col items-center">
                <Upload className="w-5 h-5 text-slate-400 mb-1" />
                <span className="text-xs font-semibold text-emerald-800">Click to upload lab reports or scans (PDF)</span>
                <span className="text-[10px] text-slate-400">PDF, PNG, JPG up to 10MB</span>
              </label>
            </div>

            {documents.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {documents.map((doc, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-slate-100 border border-slate-200 text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                      <span className="truncate font-semibold text-slate-800">{doc.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">({doc.size})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeDoc(idx)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded-lg"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="btn-primary w-full py-3 text-xs font-bold flex items-center justify-center gap-2 shadow-sm"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Admitting Patient...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" /> Admit Patient & Assign to Doctor
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
