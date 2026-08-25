import React from 'react';
import { History } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useHospital } from '../../context/HospitalContext.jsx';
import LiveFeedItem from '../../components/common/LiveFeedItem.jsx';
import AIExplanationPanel from '../../components/admin/AIExplanationPanel.jsx';

export default function DoctorActivityLogPage() {
  const { currentUser } = useAuth();
  const { events } = useHospital();

  const myEvents = events.filter(e => e.actorId === currentUser?.id || e.actorRole === 'doctor');

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
          <History className="w-6 h-6 text-emerald-700" />
          Physician Activity & Audit History
        </h2>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Chronological record of all resource transactions, prescriptions, transfers, and escalations initiated by your clinician account.
        </p>
      </div>

      <AIExplanationPanel events={myEvents.slice(0, 10)} />

      {myEvents.length === 0 ? (
        <div className="clean-card p-12 text-center text-slate-500">
          <History className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <p className="text-sm font-bold text-slate-800">No actions recorded yet for your session.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {myEvents.map((evt) => (
            <LiveFeedItem key={evt.id} event={evt} />
          ))}
        </div>
      )}
    </div>
  );
}
