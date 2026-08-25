import React, { useState } from 'react';
import {
  History,
  Search,
  Download
} from 'lucide-react';
import { useHospital } from '../../context/HospitalContext.jsx';
import LiveFeedItem from '../common/LiveFeedItem.jsx';
import AIExplanationPanel from './AIExplanationPanel.jsx';

export default function AuditTrailSearch() {
  const { events } = useHospital();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedActorRole, setSelectedActorRole] = useState('all');

  const filteredEvents = events.filter((e) => {
    // Type filter
    if (selectedType !== 'all' && e.type !== selectedType) return false;
    // Role filter
    if (selectedActorRole !== 'all' && e.actorRole !== selectedActorRole) return false;
    // Search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchResource = e.resourceId?.toLowerCase().includes(term);
      const matchActor = e.actorName?.toLowerCase().includes(term);
      const matchPatient = e.payload?.patientName?.toLowerCase().includes(term);
      const matchType = e.type?.toLowerCase().includes(term);
      const matchReason = e.payload?.reason?.toLowerCase().includes(term);
      const matchIdemp = e.idempotencyKey?.toLowerCase().includes(term);
      if (!matchResource && !matchActor && !matchPatient && !matchType && !matchReason && !matchIdemp) {
        return false;
      }
    }
    return true;
  });

  const exportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredEvents, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `nexus_audit_trail_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-700" />
            Immutable Audit Trail & Ledger
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            Cryptographically append-only audit stream tracking every transactional resource mutation with version lineage and idempotency keys.
          </p>
        </div>

        <button
          onClick={exportJson}
          className="btn-secondary text-xs px-3.5 py-2 flex items-center gap-1.5 flex-shrink-0"
        >
          <Download className="w-4 h-4 text-slate-600" /> Export JSON Log
        </button>
      </div>

      {/* AI Explanation Assistant Integration (Feature 1) */}
      <AIExplanationPanel events={filteredEvents.slice(0, 15)} />

      {/* Filter Bar */}
      <div className="clean-card p-5 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by Resource (e.g. ICU-201), Patient, Doctor, or Idempotency Key..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="clean-input w-full pl-9 text-xs"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </div>

          {/* Event Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="clean-input text-xs font-medium md:w-52"
          >
            <option value="all">All Event Types ({events.length})</option>
            <option value="allocate">Allocate / Reserve</option>
            <option value="conflict_rejected">Conflict Rejected</option>
            <option value="escalation_preemption">Escalation Preemption</option>
            <option value="transfer">Transfer</option>
            <option value="cancel">Cancel / Release</option>
            <option value="saga_compensate">Saga Compensate</option>
            <option value="clinical_event">Clinical Event</option>
            <option value="status_change">Status Change</option>
          </select>

          {/* Actor Role Filter */}
          <select
            value={selectedActorRole}
            onChange={(e) => setSelectedActorRole(e.target.value)}
            className="clean-input text-xs font-medium md:w-44"
          >
            <option value="all">All Roles</option>
            <option value="doctor">Doctor</option>
            <option value="nurse">Nurse</option>
            <option value="pharmacy">Pharmacy</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-1 font-medium">
          <span>Showing {filteredEvents.length} of {events.length} immutable events</span>
          <span className="text-emerald-700 font-bold">Zero Plain `.update()` Calls Guarantee</span>
        </div>
      </div>

      {/* Events Stream */}
      {filteredEvents.length === 0 ? (
        <div className="clean-card p-12 text-center text-slate-500">
          <History className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <p className="text-sm font-bold text-slate-800">No events matched your search criteria.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredEvents.map((evt) => (
            <LiveFeedItem key={evt.id} event={evt} />
          ))}
        </div>
      )}
    </div>
  );
}
