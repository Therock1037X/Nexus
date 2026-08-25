import React from 'react';
import { History, Stethoscope } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useHospital } from '../../context/HospitalContext.jsx';
import LiveFeedItem from '../../components/common/LiveFeedItem.jsx';
import AIExplanationPanel from '../../components/admin/AIExplanationPanel.jsx';

export default function DoctorActivityLogPage() {
  const { currentUser } = useAuth();
  const { events } = useHospital();

  const myEvents = events.filter(e => e.actorId === currentUser?.id || e.actorRole === 'doctor');

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <History className="w-5 h-5 text-cyan-400" />
          Physician Activity & Audit History
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Chronological record of all resource transactions, prescriptions, transfers, and escalations initiated by your account.
        </p>
      </div>

      <AIExplanationPanel events={myEvents.slice(0, 10)} />

      {myEvents.length === 0 ? (
        <div className="glass-panel rounded-2xl p-8 text-center text-slate-400">
          <History className="w-8 h-8 mx-auto text-slate-600 mb-2" />
          <p className="text-sm font-medium text-slate-300">No actions recorded yet for your session.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {myEvents.map((evt) => (
            <LiveFeedItem key={evt.id} event={evt} />
          ))}
        </div>
      )}
    </div>
  );
}
