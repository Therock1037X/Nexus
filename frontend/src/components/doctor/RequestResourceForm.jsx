import React, { useState, useEffect } from 'react';
import {
  Bed,
  Activity,
  Cpu,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useHospital } from '../../context/HospitalContext.jsx';
import { allocateResourceTransaction } from '../../services/resourceService.js';
import { suggestPriorityFromNotes } from '../../services/aiService.js';
import StatusBadge from '../common/StatusBadge.jsx';

export default function RequestResourceForm({ initialParsedData = null, onSuccess = null }) {
  const { currentUser } = useAuth();
  const { resources, patients, playAlertTone } = useHospital();

  const [resourceType, setResourceType] = useState('bed');
  const [subType, setSubType] = useState('icu');
  const [selectedResourceId, setSelectedResourceId] = useState('');
  const [patientId, setPatientId] = useState('');
  const [customPatientName, setCustomPatientName] = useState('');
  const [priority, setPriority] = useState('normal');
  const [allocationType, setAllocationType] = useState('occupied'); // 'reserved' | 'occupied'
  const [reason, setReason] = useState('');
  const [aiUrgency, setAiUrgency] = useState(null);
  const [isAnalyzingAi, setIsAnalyzingAi] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Apply parsed NLP data if provided
  useEffect(() => {
    if (initialParsedData) {
      if (initialParsedData.resourceType) setResourceType(initialParsedData.resourceType);
      if (initialParsedData.subType) setSubType(initialParsedData.subType);
      if (initialParsedData.priority) setPriority(initialParsedData.priority);
      if (initialParsedData.reason) {
        setReason(initialParsedData.reason);
        handleAiUrgencyCheck(initialParsedData.reason);
      }
    }
  }, [initialParsedData]);

  // Filter available candidate resources
  const candidateResources = resources.filter((r) => {
    if (r.type !== resourceType) return false;
    if (resourceType === 'bed' && subType && r.bedType !== subType) return false;
    if (resourceType === 'ot' && subType && !r.otType?.toLowerCase().includes(subType.replace('_', ' '))) return false;
    if (resourceType === 'equipment' && subType && !r.equipmentType?.toLowerCase().includes(subType.toLowerCase())) return false;
    return true;
  });

  // Auto-select first matching resource if none selected
  useEffect(() => {
    if (candidateResources.length > 0 && (!selectedResourceId || !candidateResources.find(r => r.id === selectedResourceId))) {
      const freeOne = candidateResources.find(r => r.status === 'free') || candidateResources[0];
      setSelectedResourceId(freeOne.id);
    }
  }, [candidateResources, selectedResourceId]);

  const handleAiUrgencyCheck = async (textToCheck) => {
    const text = textToCheck || reason;
    if (!text || text.trim().length < 6) return;

    setIsAnalyzingAi(true);
    try {
      const suggestion = await suggestPriorityFromNotes(text);
      setAiUrgency(suggestion);
    } finally {
      setIsAnalyzingAi(false);
    }
  };

  const selectedResource = resources.find(r => r.id === selectedResourceId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedResourceId) {
      setFeedback({ type: 'error', message: 'Please select a resource.' });
      return;
    }

    const patientObj = patients.find(p => p.patientId === patientId);
    const finalPatientName = patientObj ? patientObj.name : (customPatientName || 'Emergency Admission');

    setSubmitting(true);
    setFeedback(null);

    try {
      const result = await allocateResourceTransaction({
        resourceId: selectedResourceId,
        actorId: currentUser?.id || 'doc-1',
        actorName: currentUser?.name || 'Dr. Ananya Sharma',
        actorRole: 'doctor',
        patientId: patientId || `pat-auto-${Date.now()}`,
        patientName: finalPatientName,
        allocationType,
        priority,
        reason: reason || 'Physician request',
        aiSuggestedPriority: aiUrgency?.suggestedPriority || null
      });

      playAlertTone('success');
      setFeedback({
        type: 'success',
        message: `Resource ${selectedResourceId} successfully assigned to ${finalPatientName}!`
      });

      if (onSuccess) onSuccess(result);
    } catch (err) {
      playAlertTone('conflict');
      setFeedback({
        type: 'error',
        message: `Request not completed: ${err.message}`
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 text-xs">
      {/* 1. Resource Type & Subtype Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-slate-700 font-semibold mb-1.5">Resource Category</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { type: 'bed', label: 'Beds', icon: Bed },
              { type: 'ot', label: 'OTs', icon: Activity },
              { type: 'equipment', label: 'Equipment', icon: Cpu }
            ].map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  type="button"
                  key={cat.type}
                  onClick={() => {
                    setResourceType(cat.type);
                    if (cat.type === 'bed') setSubType('icu');
                    else if (cat.type === 'ot') setSubType('cardiac');
                    else setSubType('ventilator');
                  }}
                  className={`p-2.5 rounded-xl flex items-center justify-center gap-1.5 font-bold border transition-all ${
                    resourceType === cat.type
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-slate-700 font-semibold mb-1.5">Sub-Classification</label>
          <select
            value={subType}
            onChange={(e) => setSubType(e.target.value)}
            className="clean-input w-full font-medium"
          >
            {resourceType === 'bed' && (
              <>
                <option value="icu">ICU Bed (Scarce)</option>
                <option value="emergency">Emergency Bay Bed</option>
                <option value="general">General Ward Bed</option>
              </>
            )}
            {resourceType === 'ot' && (
              <>
                <option value="cardiac">Cardiac Surgery OT</option>
                <option value="general_surgery">General Surgery OT</option>
                <option value="orthopedic">Orthopedic OT</option>
              </>
            )}
            {resourceType === 'equipment' && (
              <>
                <option value="ventilator">ICU Ventilator (Scarce)</option>
                <option value="mri">3.0T MRI Scanner</option>
                <option value="ct">CT Scanner</option>
                <option value="xray">Digital X-Ray</option>
              </>
            )}
          </select>
        </div>
      </div>

      {/* 2. Target Resource Selector */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-slate-700 font-semibold">Select Unit ({candidateResources.length} available)</label>
          {selectedResource && (
            <span className="text-[11px] text-slate-500 font-medium">
              Current: <StatusBadge status={selectedResource.status} size="xs" />
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-40 overflow-y-auto p-2 rounded-xl bg-slate-50 border border-slate-200">
          {candidateResources.map((res) => {
            const isSelected = res.id === selectedResourceId;
            return (
              <button
                type="button"
                key={res.id}
                onClick={() => setSelectedResourceId(res.id)}
                className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  isSelected
                    ? 'bg-emerald-50 border-emerald-600 text-emerald-900 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="font-mono font-bold text-xs truncate">{res.id}</div>
                <div className="flex items-center justify-between mt-1.5">
                  <StatusBadge status={res.status} size="xs" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Patient Assignment & Urgency Level */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-slate-700 font-semibold mb-1">Patient</label>
          <select
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            className="clean-input w-full"
          >
            <option value="">-- Select Patient --</option>
            {patients.map((p) => (
              <option key={p.patientId} value={p.patientId}>
                {p.name} ({p.age}y, {p.diagnosis || 'Admitted'})
              </option>
            ))}
          </select>
          {!patientId && (
            <input
              type="text"
              placeholder="Or type new/walk-in patient name..."
              value={customPatientName}
              onChange={(e) => setCustomPatientName(e.target.value)}
              className="clean-input w-full mt-2 text-xs"
            />
          )}
        </div>

        <div>
          <label className="block text-slate-700 font-semibold mb-1">Urgency Level</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="clean-input w-full font-mono font-medium"
          >
            <option value="normal">NORMAL (Standard Care)</option>
            <option value="high">HIGH (Urgent Procedure)</option>
            <option value="urgent">URGENT (Rapid Deterioration)</option>
            <option value="critical">CRITICAL (Emergency Priority Override)</option>
          </select>
          <div className="text-[11px] text-slate-500 mt-1">
            Critical requests can override lower-priority holds if needed.
          </div>
        </div>
      </div>

      {/* 4. Clinical Reason & AI Suggestion */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-slate-700 font-semibold">Clinical Reason / Notes</label>
          <button
            type="button"
            onClick={() => handleAiUrgencyCheck()}
            disabled={isAnalyzingAi || !reason}
            className="text-[11px] text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {isAnalyzingAi ? 'Analyzing...' : 'AI Urgency Check'}
          </button>
        </div>
        <textarea
          rows={2}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          onBlur={() => handleAiUrgencyCheck()}
          placeholder="e.g. Patient has acute respiratory distress, requires urgent ICU bed and continuous monitoring..."
          className="clean-input w-full text-xs"
        />

        {aiUrgency && (
          <div className="mt-2.5 p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-start gap-2.5 text-[11px]">
            <Sparkles className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900">AI Suggestion:</span>
                <StatusBadge status={aiUrgency.suggestedPriority} size="xs" />
                <span className="font-mono text-slate-500 font-medium">({Math.round(aiUrgency.confidence * 100)}% confidence)</span>
              </div>
              <p className="text-slate-600 mt-1">{aiUrgency.clinicalRationale}</p>
            </div>
          </div>
        )}
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs font-semibold ${
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
        disabled={submitting || !selectedResourceId}
        className="btn-primary w-full py-3 text-xs font-bold flex items-center justify-center gap-2"
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Confirming Allocation...
          </>
        ) : (
          <>
            <CheckCircle2 className="w-4 h-4" />
            Confirm Request
          </>
        )}
      </button>
    </form>
  );
}
