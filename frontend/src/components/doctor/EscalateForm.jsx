import React, { useState, useEffect } from 'react';
import { Sparkles, AlertOctagon, CheckCircle2, Loader2, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useHospital } from '../../context/HospitalContext.jsx';
import { allocateResourceTransaction } from '../../services/resourceService.js';
import { suggestEscalationPriorityAI } from '../../services/aiService.js';
import StatusBadge from '../common/StatusBadge.jsx';

export default function EscalateForm({ preselectedResource = null, onSuccess = null }) {
  const { currentUser } = useAuth();
  const { resources, patients, playAlertTone } = useHospital();

  const occupiedOrReserved = resources.filter(r => r.status === 'occupied' || r.status === 'reserved');

  const [resourceId, setResourceId] = useState(preselectedResource?.id || occupiedOrReserved[0]?.id || '');
  const [patientId, setPatientId] = useState(patients[1]?.patientId || '');
  const [escalationLevel, setEscalationLevel] = useState('critical');
  const [reason, setReason] = useState('Acute cardiovascular arrest, patient in VTach, urgent resuscitation OT/ICU bed required stat.');
  const [aiUrgency, setAiUrgency] = useState('Critical');
  const [isAnalyzingAi, setIsAnalyzingAi] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // 800ms Debounced AI Urgency Suggestion (Never auto-selects priority)
  useEffect(() => {
    if (!reason || reason.trim().length < 5) return;
    const timer = setTimeout(async () => {
      setIsAnalyzingAi(true);
      try {
        const res = await suggestEscalationPriorityAI(reason);
        if (res?.suggestedUrgency) {
          setAiUrgency(res.suggestedUrgency);
        }
      } catch (err) {
        console.warn('[EscalateForm] AI urgency error:', err);
      } finally {
        setIsAnalyzingAi(false);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [reason]);

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
        aiSuggestedPriority: aiUrgency?.suggestedPriority || 'critical'
      });

      playAlertTone('success');
      setFeedback({
        type: 'success',
        message: result.preemptionNotice
          ? `Priority Override Successful! ${result.preemptionNotice}`
          : `Resource ${resourceId} successfully escalated and allocated to ${selectedPatient?.name || 'Patient'}!`
      });

      if (onSuccess) onSuccess(result);
    } catch (err) {
      playAlertTone('conflict');
      setFeedback({
        type: 'error',
        message: `Override not completed: ${err.message}`
      });
    } finally {
      setSubmitting(false);
    }
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
          {occupiedOrReserved.map((r) => (
            <option key={r.id} value={r.id}>
              {r.id} ({r.name || r.type}) • Status: {r.status.toUpperCase()} • Held By: {r.currentAllocation?.patientName || 'Reserved'} ({r.currentAllocation?.priority || 'normal'})
            </option>
          ))}
        </select>
        {selectedRes?.currentAllocation && (
          <div className="mt-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-center justify-between font-medium">
            <span>Currently Assigned To: <strong className="text-slate-900 font-bold">{selectedRes.currentAllocation.patientName}</strong></span>
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
            onChange={(e) => setPatientId(e.target.value)}
            className="clean-input w-full font-medium"
          >
            {patients.map((p) => (
              <option key={p.patientId} value={p.patientId}>
                {p.name} ({p.patientId}) • {p.diagnosis}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-slate-700 font-semibold">Urgency Level</label>
            {aiUrgency && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-purple-600" />
                <span>AI suggestion: {aiUrgency}</span>
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
