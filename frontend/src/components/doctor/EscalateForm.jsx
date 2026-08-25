import React, { useState } from 'react';
import { Sparkles, AlertOctagon, CheckCircle2, Loader2, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useHospital } from '../../context/HospitalContext.jsx';
import { allocateResourceTransaction } from '../../services/resourceService.js';
import { suggestPriorityFromNotes } from '../../services/aiService.js';
import StatusBadge from '../common/StatusBadge.jsx';

export default function EscalateForm({ preselectedResource = null, onSuccess = null }) {
  const { currentUser } = useAuth();
  const { resources, patients, playAlertTone } = useHospital();

  const occupiedOrReserved = resources.filter(r => r.status === 'occupied' || r.status === 'reserved');

  const [resourceId, setResourceId] = useState(preselectedResource?.id || occupiedOrReserved[0]?.id || '');
  const [patientId, setPatientId] = useState(patients[1]?.patientId || '');
  const [escalationLevel, setEscalationLevel] = useState('critical');
  const [reason, setReason] = useState('Acute cardiovascular arrest, patient in VTach, urgent resuscitation OT/ICU bed required stat.');
  const [aiUrgency, setAiUrgency] = useState(null);
  const [isAnalyzingAi, setIsAnalyzingAi] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const selectedRes = resources.find(r => r.id === resourceId);
  const selectedPatient = patients.find(p => p.patientId === patientId);

  const handleAiCheck = async () => {
    if (!reason) return;
    setIsAnalyzingAi(true);
    try {
      const res = await suggestPriorityFromNotes(reason);
      setAiUrgency(res);
      if (res.suggestedPriority) setEscalationLevel(res.suggestedPriority);
    } finally {
      setIsAnalyzingAi(false);
    }
  };

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
        reason: `[EMERGENCY ESCALATION OVERRIDE] ${reason}`,
        aiSuggestedPriority: aiUrgency?.suggestedPriority || 'critical'
      });

      playAlertTone('success');
      setFeedback({
        type: 'success',
        message: result.preemptionNotice
          ? `Preemption Successful! ${result.preemptionNotice}`
          : `Resource ${resourceId} successfully escalated and allocated at tier ${escalationLevel.toUpperCase()}!`
      });

      if (onSuccess) onSuccess(result);
    } catch (err) {
      playAlertTone('conflict');
      setFeedback({
        type: 'error',
        message: `Escalation Conflict: ${err.message}`
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-xs">
      <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-900/50 text-rose-300 flex items-start gap-2">
        <AlertOctagon className="w-4 h-4 flex-shrink-0 text-rose-400 mt-0.5" />
        <div>
          <span className="font-semibold block text-rose-200">Deterministic Priority Preemption</span>
          <span className="text-[11px] text-rose-300/80">
            Escalating to CRITICAL will deterministically override any lower-priority holds on the selected resource, log an immutable escalation event, and notify prior holders.
          </span>
        </div>
      </div>

      {/* Target Held Resource Selector */}
      <div>
        <label className="block text-slate-300 font-medium mb-1">Target Resource to Override / Preempt</label>
        <select
          value={resourceId}
          onChange={(e) => setResourceId(e.target.value)}
          className="glass-input w-full font-mono"
        >
          {occupiedOrReserved.map((r) => (
            <option key={r.id} value={r.id}>
              {r.id} ({r.name || r.type}) • Status: {r.status.toUpperCase()} • Held By: {r.currentAllocation?.patientName || 'Reserved'} ({r.currentAllocation?.priority || 'normal'})
            </option>
          ))}
        </select>
        {selectedRes?.currentAllocation && (
          <div className="mt-1.5 p-2 rounded-lg bg-slate-950/70 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Currently Held By: <strong className="text-slate-200">{selectedRes.currentAllocation.patientName}</strong></span>
            <span>Current Hold Priority: <StatusBadge status={selectedRes.currentAllocation.priority || 'normal'} size="xs" /></span>
          </div>
        )}
      </div>

      {/* Patient Requiring Escalation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-slate-300 font-medium mb-1">Urgent Patient</label>
          <select
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            className="glass-input w-full"
          >
            {patients.map((p) => (
              <option key={p.patientId} value={p.patientId}>
                {p.name} ({p.patientId}) • {p.diagnosis}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-slate-300 font-medium mb-1">Escalation Override Level</label>
          <select
            value={escalationLevel}
            onChange={(e) => setEscalationLevel(e.target.value)}
            className="glass-input w-full font-mono font-bold text-rose-300 bg-rose-950/20"
          >
            <option value="critical">CRITICAL (Tier 4 - Immediate Preemption)</option>
            <option value="urgent">URGENT (Tier 3 - Accelerated Review)</option>
          </select>
        </div>
      </div>

      {/* Clinical Reason & AI Urgency Assistant */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-slate-300 font-medium">Free-Text Emergency Indication</label>
          <button
            type="button"
            onClick={handleAiCheck}
            disabled={isAnalyzingAi}
            className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3" />
            {isAnalyzingAi ? 'Analyzing Urgency...' : 'AI Urgency Score'}
          </button>
        </div>

        <textarea
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="glass-input w-full text-xs"
        />

        {aiUrgency && (
          <div className="mt-2 p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 flex items-start gap-2 text-[11px]">
            <Sparkles className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-200">AI Suggested Priority:</span>
                <StatusBadge status={aiUrgency.suggestedPriority} size="xs" />
                <span className="font-mono text-slate-400">({Math.round(aiUrgency.confidence * 100)}% match)</span>
              </div>
              <p className="text-slate-400 mt-0.5">{aiUrgency.clinicalRationale}</p>
            </div>
          </div>
        )}
      </div>

      {/* Feedback Banner */}
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
            <AlertOctagon className="w-4 h-4 text-rose-400 flex-shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={submitting || !resourceId}
        className="btn-danger w-full py-2.5 text-xs font-bold flex items-center justify-center gap-2"
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Evaluating Preemption Tiebreaker...
          </>
        ) : (
          <>
            <ShieldAlert className="w-4 h-4" /> Trigger Emergency Preemption Override
          </>
        )}
      </button>
    </form>
  );
}
