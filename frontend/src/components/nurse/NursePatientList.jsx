import React, { useState } from 'react';
import {
  Users,
  Search,
  Bed,
  FileText,
  HeartPulse,
  UserCheck
} from 'lucide-react';
import { useHospital } from '../../context/HospitalContext.jsx';
import PatientProfileModal from '../doctor/PatientProfileModal.jsx';

export default function NursePatientList({ onSelectPatientForLog = null }) {
  const { patients } = useHospital();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatientForModal, setSelectedPatientForModal] = useState(null);

  const filteredPatients = patients.filter((p) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      p.name?.toLowerCase().includes(term) ||
      p.patientId?.toLowerCase().includes(term) ||
      p.currentBedId?.toLowerCase().includes(term) ||
      p.assignedDoctorName?.toLowerCase().includes(term) ||
      p.reason?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="clean-card p-4 flex items-center justify-between gap-3 bg-white">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search patients by name, bed, doctor, or diagnosis..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="clean-input w-full pl-9 text-xs"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        </div>
        <div className="text-xs text-slate-500 font-semibold whitespace-nowrap">
          {filteredPatients.length} Patients in Ward
        </div>
      </div>

      {/* Patient Cards Grid */}
      {filteredPatients.length === 0 ? (
        <div className="clean-card p-12 text-center text-slate-500 bg-white">
          <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <p className="text-sm font-bold text-slate-800">No patients found</p>
          <p className="text-xs text-slate-500 mt-1">Try adjusting your search criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPatients.map((p) => (
            <div
              key={p.patientId}
              className="clean-card p-5 border border-slate-200 bg-white flex flex-col justify-between space-y-3 hover:border-emerald-300 transition-colors"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{p.name}</h4>
                    <p className="text-xs text-slate-500 font-medium">
                      {p.age} yrs • {p.gender} • <span className="font-mono text-slate-400">{p.patientId}</span>
                    </p>
                  </div>

                  <span className="text-xs px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold flex items-center gap-1">
                    <Bed className="w-3.5 h-3.5 text-emerald-700" /> {p.currentBedId || 'General Ward'}
                  </span>
                </div>

                <div className="mt-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Attending: <strong>{p.assignedDoctorName || 'Dr. Ananya Sharma'}</strong></span>
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    Reason: {p.reason || p.diagnosis || 'General clinical admission'}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => {
                    if (onSelectPatientForLog) onSelectPatientForLog(p.patientId);
                  }}
                  className="btn-primary text-xs py-2 px-3 flex-1 flex items-center justify-center gap-1.5 font-bold"
                >
                  <HeartPulse className="w-3.5 h-3.5" /> Log Vitals
                </button>

                <button
                  onClick={() => setSelectedPatientForModal(p)}
                  className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-500" /> View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Patient Profile Modal */}
      {selectedPatientForModal && (
        <PatientProfileModal
          patient={selectedPatientForModal}
          onClose={() => setSelectedPatientForModal(null)}
        />
      )}
    </div>
  );
}
