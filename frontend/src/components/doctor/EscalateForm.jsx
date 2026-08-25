import React, { useState, useEffect } from 'react';
import { Sparkles, AlertOctagon, CheckCircle2, Loader2, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useHospital } from '../../context/HospitalContext.jsx';
import { allocateResourceTransaction } from '../../services/resourceService.js';
import { suggestEscalationPriorityAI } from '../../services/aiService.js';
import StatusBadge from '../common/StatusBadge.jsx';

export default function EscalateForm({ preselectedResource = null, onSuccess = null }) {
  const { currentUser } = useAuth();
  const { resources = [], patients = [], playAlertTone } = useHospital();

  const occupiedOrReserved = (resources || []).filter(r => r.status === 'occupied' || r.status === 'reserved');
  const targetResources = occupiedOrReserved.length > 0
    ? occupiedOrReserved
    : (resources || []).filter(r => r.type === 'bed' || r.type === 'ot' || r.type === 'equipment');

  const [resourceId, setResourceId] = useState(preselectedResource?.id || targetResources[0]?.id || '');
  const [patientId, setPatientId] = useState(patients[0]?.patientId || patients[0]?.id || '');
  const [escalationLevel, setEscalationLevel] = useState('critical');
  const [reason, setReason] = useState('Acute cardiovascular arrest, patient in VTach, urgent resuscitation OT/ICU bed required stat.');
  const [aiUrgency, setAiUrgency] = useState('Critical');
  const [isAnalyzingAi, setIsAnalyzingAi] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const selectedRes = (resources || []).find(r => r.id === resourceId);
  const selectedPatient = (patients || []).find(p => (p.patientId && p.patientId === patientId) || (p.id && p.id === patientId));

  // Sync selected resource if empty or preselected changes
  useEffect(() => {
    if (preselectedResource?.id) {
      setResourceId(preselectedResource.id);
    } else if (!resourceId && targetResources.length > 0) {
      setResourceId(targetResources[0].id);
    }
  }, [preselectedResource?.id, targetResources.length]);

  // Sync selected patient if empty
  useEffect(() => {
    if (!patientId && patients.length > 0) {
      const firstId = patients[0].patientId || patients[0].id || '';
      setPatientId(firstId);
    }
  }, [patients.length]);

  // When patient selection changes, dynamically adjust emergency notes template to match patient's real medical diagnosis
  const handlePatientChange = (newPatientId) => {
    setPatientId(newPatientId);
    const p = patients.find(pat => (pat.patientId === newPatientId) || (pat.id === newPatientId));
    if (p) {
      const diag = (p.diagnosis || p.reason || '').toLowerCase();
      if (diag.includes('cardiac') || diag.includes('post-mi') || diag.includes('coronary') || diag.includes('arrhythmia')) {
        setReason(`Acute cardiovascular instability and refractory ventricular arrhythmia; urgent cardiac ICU resuscitation bed required stat. (${p.name})`);
      } else if (diag.includes('ards') || diag.includes('respiratory') || diag.includes('pneumonia') || diag.includes('hypox')) {
        setReason(`Acute respiratory failure with severe hypoxemia requiring immediate ventilator-assisted ICU bed stat. (${p.name})`);
      } else if (diag.includes('sepsis') || diag.includes('cholecystectomy')) {
        setReason(`Post-operative septic shock with worsening arterial blood pressure; emergency ICU bed required. (${p.name})`);
      } else if (diag.includes('trauma') || diag.includes('fracture')) {
        setReason(`Polytrauma with unstable hemodynamics requiring emergency resuscitation bay and surgical evaluation stat. (${p.name})`);
      } else if (diag.includes('height') || diag.includes('growth') || diag.includes('routine') || diag.includes('checkup')) {
        setReason(`Routine outpatient consultation. No acute life threat. (${p.name})`);
      } else {
        setReason(`Urgent priority bed allocation requested for ${p.name} (${p.diagnosis || 'Clinical evaluation'}).`);
      }
    }
  };

  // 600ms Debounced AI Urgency Suggestion analyzing both notes and patient diagnosis
  useEffect(() => {
    if (!reason || reason.trim().length < 3) return;
    const timer = setTimeout(async () => {
      setIsAnalyzingAi(true);
      try {
        const res = await suggestEscalationPriorityAI(reason, selectedPatient?.diagnosis);
        if (res?.suggestedUrgency) {
          setAiUrgency(res.suggestedUrgency);
        }
      } catch (err) {
        console.warn('[EscalateForm] AI urgency error:', err);
      } finally {
        setIsAnalyzingAi(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [reason, selectedPatient?.diagnosis]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!resourceId) return;

    setSubmitting(true);
    setFeedback(null);

    try {
      const result = await allocateResourceTransaction({
        resourceId,
        actorId: currentUser?.id || 'doc-1',
        actorName: currentUser?.name || 'Dr. Ananya Sharma',
        actorRole: 'doctor',
        patientId: patientId || `pat-emergency-${Date.now()}`,
        patientName: selectedPatient?.name || 'Critical Trauma Patient',
        allocationType: 'occupied',
        priority: escalationLevel,
        reason: `[EMERGENCY OVERRIDE] ${reason}`,
        aiSuggestedPriority: (typeof aiUrgency === 'string' ? aiUrgency.toLowerCase() : 'critical')
      });

      if (playAlertTone) playAlertTone('success');
      setFeedback({
        type: 'success',
        message: result.preemptionNotice
          ? `Priority Override Successful! ${result.preemptionNotice}`
          : `Resource ${resourceId} successfully escalated and allocated to ${selectedPatient?.name || 'Patient'}!`
      });

      if (onSuccess) onSuccess(result);
    } catch (err) {
      if (playAlertTone) playAlertTone('conflict');
      setFeedback({
        type: 'error',
        message: `Override not completed: ${err.message || err}`
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getUrgencyBadgeStyle = (urgency) => {
    const u = String(urgency || 'moderate').toLowerCase();
    if (u === 'critical') return 'bg-rose-100 text-rose-900 border-rose-300';
    if (u === 'high') return 'bg-orange-100 text-orange-900 border-orange-300';
    if (u === 'low') return 'bg-emerald-100 text-emerald-900 border-emerald-300';
    return 'bg-blue-100 text-blue-900 border-blue-300';
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-xs">
      <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-2.5">
        <AlertOctagon className="w-4 h-4 flex-shrink-0 text-rose-600 mt-0.5" />
        <div>
          <span className="font-bold block text-rose-950">Priority Override</span>
          <span className="text-[11px] text-rose-800 font-medium">
            Selecting CRITICAL urgency will reassign this resource to an emergency patient and notify the previous holder to choose an alternate bed.
          </span>
        </div>
      </div>

      {/* Target Held Resource Selector */}
      <div>
        <label className="block text-slate-700 font-semibold mb-1">Target Resource to Override</label>
        <select
          value={resourceId}
          onChange={(e) => setResourceId(e.target.value)}
          className="clean-input w-full font-mono font-medium"
        >
          {targetResources.length === 0 ? (
            <option value="">No resources available</option>
          ) : (
            targetResources.map((r) => {
              const statusStr = String(r.status || 'occupied').toUpperCase();
              const holderName = r.currentAllocation?.patientName || (r.status === 'reserved' ? 'Reserved' : 'Occupied');
              const currentPrio = r.currentAllocation?.priority || 'normal';
              return (
                <option key={r.id} value={r.id}>
                  {r.id} ({r.name || r.type}) • Status: {statusStr} • Held By: {holderName} ({currentPrio})
                </option>
              );
            })
          )}
        </select>
        {selectedRes?.currentAllocation && (
          <div className="mt-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-center justify-between font-medium">
            <span>Currently Assigned To: <strong className="text-slate-900 font-bold">{selectedRes.currentAllocation.patientName || 'Patient'}</strong></span>
            <span>Current Urgency: <StatusBadge status={selectedRes.currentAllocation.priority || 'normal'} size="xs" /></span>
          </div>
        )}
      </div>

      {/* Patient Requiring Escalation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label className="block text-slate-700 font-semibold mb-1">Emergency Patient</label>
          <select
            value={patientId}
            onChange={(e) => handlePatientChange(e.target.value)}
            className="clean-input w-full font-medium"
          >
            {patients.length === 0 ? (
              <option value="pat-emergency">Emergency Patient (New Admission)</option>
            ) : (
              patients.map((p) => {
                const pid = p.patientId || p.id || 'pat-id';
                const pname = p.name || 'Patient';
                const pdiag = p.diagnosis || p.reason || 'Observation';
                return (
                  <option key={pid} value={pid}>
                    {pname} ({pid}) • {pdiag}
                  </option>
                );
              })
            )}
          </select>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-slate-700 font-semibold">Urgency Level</label>
            {aiUrgency && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 transition-all ${getUrgencyBadgeStyle(aiUrgency)}`}>
                <Sparkles className="w-3 h-3" />
                <span>AI suggestion: {typeof aiUrgency === 'string' ? aiUrgency : 'Critical'}</span>
              </span>
            )}
          </div>
          <select
            value={escalationLevel}
            onChange={(e) => setEscalationLevel(e.target.value)}
            className="clean-input w-full font-mono font-bold text-rose-800 bg-rose-50/60 border-rose-200"
          >
            <option value="critical">CRITICAL (Immediate Emergency Override)</option>
            <option value="urgent">URGENT (Accelerated Review)</option>
          </select>
        </div>
      </div>

      {/* Clinical Reason */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-slate-700 font-semibold">Clinical Emergency Notes</label>
          {isAnalyzingAi && (
            <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin text-purple-600" /> Analyzing urgency...
            </span>
          )}
        </div>

        <textarea
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Describe patient emergency and reason for priority override..."
          className="clean-input w-full text-xs font-medium"
        />
        <p className="text-[11px] text-slate-500 mt-1 font-medium">
          The AI urgency assistant dynamically evaluates both the patient diagnosis and notes to classify clinical severity.
        </p>
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
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertOctagon className="w-4 h-4 text-rose-600 flex-shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={submitting || !resourceId}
        className="btn-danger w-full py-3 text-xs font-bold flex items-center justify-center gap-2"
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Applying Priority Override...
          </>
        ) : (
          <>
            <ShieldAlert className="w-4 h-4" /> Request Priority Override
          </>
        )}
      </button>
    </form>
  );
}
