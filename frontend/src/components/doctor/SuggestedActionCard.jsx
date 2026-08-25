import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Clock,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useHospital } from '../../context/HospitalContext.jsx';
import { getSuggestedActionForDoctor } from '../../services/aiService.js';

export default function SuggestedActionCard({ onNavigateTab }) {
  const { currentUser } = useAuth();
  const { patients, sagas, events } = useHospital();
  const [actionData, setActionData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchAction = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const res = await getSuggestedActionForDoctor({
        doctorId: currentUser.id || 'doc-1',
        doctorName: currentUser.name || 'Dr. Ananya Sharma',
        patients,
        sagas,
        events
      });
      setActionData(res);
    } catch (err) {
      console.warn('[SuggestedActionCard] Failed to load action:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAction();
    const interval = setInterval(fetchAction, 60000); // 60s periodic refresh
    return () => clearInterval(interval);
  }, [currentUser?.id, patients.length, sagas.length, events.length]);

  if (!actionData || !actionData.actionSummary) {
    return null;
  }

  const isCritical = actionData.urgencyLevel === 'critical';
  const isUrgent = actionData.urgencyLevel === 'urgent';
  const isInfo = actionData.urgencyLevel === 'info';

  const tabLabels = {
    patients: 'View Patients',
    request: 'Request Bed',
    prescribe: 'View Prescriptions',
    escalate: 'Review Overrides',
    activity: 'View History'
  };

  return (
    <div
      className={`p-4 rounded-2xl border transition-all duration-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in ${
        isCritical
          ? 'bg-rose-50/90 border-rose-200 text-rose-900 ring-2 ring-rose-400/20'
          : isUrgent
          ? 'bg-amber-50/90 border-amber-200 text-amber-900'
          : isInfo
          ? 'bg-emerald-50/90 border-emerald-200 text-emerald-900'
          : 'bg-blue-50/90 border-blue-200 text-blue-900'
      }`}
    >
      {/* Left: Icon & Text Summary */}
      <div className="flex items-start gap-3 min-w-0">
        <div
          className={`p-2 rounded-xl border mt-0.5 flex-shrink-0 ${
            isCritical
              ? 'bg-rose-100/80 border-rose-300 text-rose-700'
              : isUrgent
              ? 'bg-amber-100/80 border-amber-300 text-amber-700'
              : 'bg-emerald-100/80 border-emerald-300 text-emerald-700'
          }`}
        >
          {isCritical ? (
            <AlertCircle className="w-4 h-4 animate-pulse" />
          ) : isInfo ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                isCritical
                  ? 'bg-rose-200 text-rose-900'
                  : isUrgent
                  ? 'bg-amber-200 text-amber-900'
                  : 'bg-emerald-200 text-emerald-900'
              }`}
            >
              Suggested Next Action
            </span>
            <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
              <Clock className="w-3 h-3" /> Updated live
            </span>
          </div>

          <p className="text-xs font-semibold text-slate-900 mt-1 leading-relaxed">
            {actionData.actionSummary}
          </p>
        </div>
      </div>

      {/* Right: Navigate Button */}
      <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
        <button
          onClick={() => {
            if (onNavigateTab && actionData.targetTab) {
              onNavigateTab(actionData.targetTab);
            }
          }}
          className={`text-xs py-1.5 px-3.5 rounded-xl font-bold transition-all flex items-center gap-1.5 shadow-xs ${
            isCritical
              ? 'bg-rose-700 text-white hover:bg-rose-800'
              : isUrgent
              ? 'bg-amber-700 text-white hover:bg-amber-800'
              : 'bg-emerald-700 text-white hover:bg-emerald-800'
          }`}
        >
          <span>{tabLabels[actionData.targetTab] || 'Take Action'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={fetchAction}
          disabled={loading}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white/60 transition-colors"
          title="Refresh suggestion"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
        </button>
      </div>
    </div>
  );
}
