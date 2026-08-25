import React, { useState } from 'react';
import {
  History,
  Search
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
      const matchDesc = e.payload?.description?.toLowerCase().includes(term);
      if (!matchResource && !matchActor && !matchPatient && !matchType && !matchReason && !matchDesc) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <History className="w-5 h-5 text-emerald-700" />
          Activity History
        </h3>
        <p className="text-xs text-slate-500 font-medium">
          A complete, permanent record of every action taken on hospital resources.
        </p>
      </div>

      {/* AI Explanation Assistant Integration */}
      <AIExplanationPanel events={filteredEvents.slice(0, 15)} />

      {/* Filter Bar */}
      <div className="clean-card p-5 space-y-3 bg-white">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by bed, patient name, doctor, or keyword..."
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
            className="clean-input text-xs font-medium md:w-56"
          >
            <option value="all">All Activity Types ({events.length})</option>
            <option value="allocate">Bed / Resource Assigned</option>
            <option value="conflict_rejected">Conflict Handled</option>
            <option value="escalation_preemption">Emergency Priority Override</option>
            <option value="transfer">Bed Transfer</option>
            <option value="cancel">Discharge / Released</option>
            <option value="saga_compensate">Failed Step Rolled Back</option>
            <option value="clinical_event">Care / Vitals Logged</option>
            <option value="patient_admitted">Patient Admitted (OPD)</option>
            <option value="patient_reassigned">Doctor Reassigned</option>
            <option value="document_uploaded">Document Uploaded</option>
            <option value="status_change">Cleaning / Maintenance</option>
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
            <option value="reception">Reception</option>
          </select>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 font-medium">
          <span>Showing {filteredEvents.length} of {events.length} logged activities</span>
          <span className="text-slate-400 text-[11px]">All changes recorded in real time</span>
        </div>
      </div>

      {/* Events Stream */}
      {filteredEvents.length === 0 ? (
        <div className="clean-card p-12 text-center text-slate-500 bg-white">
          <History className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <p className="text-sm font-bold text-slate-800">No activities matched your search criteria.</p>
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
