import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useHospital } from '../../context/HospitalContext.jsx';
import { flagIssueTransaction } from '../../services/resourceService.js';

export default function FlagIssueForm({ preselectedResource = null, onSuccess = null }) {
  const { currentUser } = useAuth();
  const { resources, playAlertTone } = useHospital();

  const [resourceId, setResourceId] = useState(preselectedResource?.id || resources[0]?.id || '');
  const [issueType, setIssueType] = useState('cleaning');
  const [notes, setNotes] = useState('Terminal post-discharge disinfection required.');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!resourceId) return;

    setSubmitting(true);
    setFeedback(null);

    try {
      const result = await flagIssueTransaction({
        resourceId,
        actorId: currentUser?.id || 'nurse-1',
        actorName: currentUser?.name || 'Nurse Pooja Pawar',
        actorRole: 'nurse',
        issueType,
        notes
      });

      playAlertTone('success');
      setFeedback({
        type: 'success',
        message: `Resource ${resourceId} status updated to ${issueType.toUpperCase()} (v${result.version}).`
      });

      if (onSuccess) onSuccess(result);
    } catch (err) {
      setFeedback({ type: 'error', message: `Failed to flag issue: ${err.message}` });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-xs">
      <div>
        <label className="block text-slate-300 font-medium mb-1">Target Hospital Resource</label>
        <select
          value={resourceId}
          onChange={(e) => setResourceId(e.target.value)}
          className="glass-input w-full font-mono"
        >
          {resources.map((r) => (
            <option key={r.id} value={r.id}>
              {r.id} ({r.name || r.type}) • Status: {r.status.toUpperCase()} (v{r.version || 1})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-slate-300 font-medium mb-1">Issue Classification</label>
        <select
          value={issueType}
          onChange={(e) => setIssueType(e.target.value)}
          className="glass-input w-full font-mono"
        >
          <option value="cleaning">Sanitization / Cleaning Protocol Required</option>
          <option value="maintenance">Biomedical Maintenance / Calibration Required</option>
        </select>
      </div>

      <div>
        <label className="block text-slate-300 font-medium mb-1">Clinical / Engineering Notes</label>
        <textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Spillage cleaned; deep disinfection required before next admission..."
          className="glass-input w-full"
        />
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-xl border flex items-center gap-2 text-xs ${
            feedback.type === 'success'
              ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{feedback.message}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={submitting || !resourceId}
        className="btn-primary w-full py-2.5 text-xs font-semibold flex items-center justify-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-amber-950/30"
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Updating Resource Status...
          </>
        ) : (
          <>
            <AlertTriangle className="w-4 h-4" /> Flag Resource Status
          </>
        )}
      </button>
    </form>
  );
}
