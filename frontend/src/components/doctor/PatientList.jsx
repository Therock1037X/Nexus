import React, { useState } from 'react';
import {
  User,
  Bed,
  Pill,
  ArrowRightLeft,
  FileText,
  Eye,
  Stethoscope,
  Users,
  Search,
  PlusCircle,
  Phone
} from 'lucide-react';
import StatusBadge from '../common/StatusBadge.jsx';
import PatientProfileModal from './PatientProfileModal.jsx';

export default function PatientList({
  patients = [],
  onPrescribe = null,
  onTransfer = null,
  onEscalate = null,
  onAdmit = null,
  currentDoctorId = null,
  currentDoctorName = null
}) {
  const [viewFilter, setViewFilter] = useState('my'); // 'my' | 'all'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatientForProfile, setSelectedPatientForProfile] = useState(null);

  // Filter patients by doctor
  let displayPatients = patients;
  if (viewFilter === 'my') {
    displayPatients = patients.filter(p =>
      p.assignedDoctorId === currentDoctorId ||
      p.assignedDoctorName?.toLowerCase() === currentDoctorName?.toLowerCase() ||
      (!p.assignedDoctorId && currentDoctorId === 'doc-1')
    );
  }

  if (searchTerm.trim()) {
    const term = searchTerm.toLowerCase();
    displayPatients = displayPatients.filter(p =>
      p.name.toLowerCase().includes(term) ||
      p.patientId.toLowerCase().includes(term) ||
      p.diagnosis?.toLowerCase().includes(term) ||
      p.assignedDoctorName?.toLowerCase().includes(term)
    );
  }

  const myPatientsCount = patients.filter(p =>
    p.assignedDoctorId === currentDoctorId ||
    p.assignedDoctorName?.toLowerCase() === currentDoctorName?.toLowerCase() ||
    (!p.assignedDoctorId && currentDoctorId === 'doc-1')
  ).length;

  return (
    <div className="space-y-4">
      {/* Control Bar: View Toggle (My Patients vs All Patients) & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-xs">
        {/* Toggle Pills: My Patients vs All Patients */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-fit">
          <button
            onClick={() => setViewFilter('my')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewFilter === 'my'
                ? 'bg-white text-emerald-800 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span>My Patients ({myPatientsCount})</span>
          </button>

          <button
            onClick={() => setViewFilter('all')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewFilter === 'all'
                ? 'bg-white text-emerald-800 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>All Patients ({patients.length})</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative flex-1 sm:w-64">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by patient, diagnosis..."
            className="clean-input w-full pl-8 py-1.5 text-xs"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        </div>
      </div>

      {/* Patients Grid */}
      {displayPatients.length === 0 ? (
        <div className="clean-card p-12 text-center text-slate-500 bg-white">
          <User className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <p className="text-sm font-bold text-slate-800">
            {viewFilter === 'my' ? 'No patients currently assigned to you.' : 'No patients match your search.'}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {viewFilter === 'my'
              ? 'Admit a patient from OPD or toggle to "All Patients" to view the hospital list.'
              : 'Try clearing your search query.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayPatients.map((patient) => {
            const {
              patientId,
              name,
              age,
              gender,
              diagnosis,
              reason,
              currentBedId,
              assignedDoctorId,
              assignedDoctorName,
              vitals = {},
              status = 'admitted',
              documents = []
            } = patient;

            const isCritical = status === 'critical' || currentBedId?.startsWith('ICU');
            const isAssignedToMe = assignedDoctorId === currentDoctorId;

            return (
              <div
                key={patientId}
                className={`clean-card-hover p-5 relative overflow-hidden flex flex-col justify-between bg-white cursor-pointer ${
                  isCritical ? 'border-rose-300 ring-2 ring-rose-400/20' : ''
                }`}
                onClick={() => setSelectedPatientForProfile(patient)}
              >
                <div>
                  {/* Top Header */}
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div>
                      <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-500 font-medium">
                        <span>{patientId}</span>
                        <span>•</span>
                        <span className="font-sans">{age}y, {gender}</span>
                      </div>
                      <h4 className="text-base font-extrabold text-slate-900 mt-0.5 hover:text-emerald-800 transition-colors">
                        {name}
                      </h4>
                    </div>
                    <StatusBadge status={status} size="xs" pulse={isCritical} />
                  </div>

                  {/* Diagnosis */}
                  <div className="text-xs text-slate-700 mb-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                    <span className="text-slate-500 font-bold text-[10px] uppercase block">Reason for Visit:</span>
                    <span className="font-semibold text-slate-800 line-clamp-1">{diagnosis || reason || 'OPD Evaluation'}</span>
                  </div>

                  {/* Bed & Attending Doctor Tag */}
                  <div className="space-y-1.5 mb-3 text-xs">
                    <div className="flex items-center justify-between text-slate-600 font-medium">
                      <span className="flex items-center gap-1.5 text-emerald-800 font-bold">
                        <Bed className="w-4 h-4 text-emerald-700" />
                        {currentBedId ? `Bed ${currentBedId}` : 'Awaiting Bed Allocation'}
                      </span>

                      {documents.length > 0 && (
                        <span className="flex items-center gap-1 text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md font-medium border border-slate-200">
                          <FileText className="w-3 h-3 text-emerald-700" />
                          {documents.length} {documents.length === 1 ? 'Report' : 'Reports'}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                      <span>Attending Doctor:</span>
                      <span className={`font-bold truncate max-w-[150px] ${isAssignedToMe ? 'text-emerald-800' : 'text-slate-800'}`}>
                        {assignedDoctorName || 'Dr. Assigned'} {isAssignedToMe && '(You)'}
                      </span>
                    </div>
                  </div>

                  {/* Live Vitals Telemetry Box */}
                  {vitals && (
                    <div className="grid grid-cols-4 gap-1.5 p-2 rounded-xl bg-slate-50 border border-slate-200 text-center font-mono text-[11px] mb-3">
                      <div>
                        <div className="text-[9px] text-slate-500 font-bold">HR</div>
                        <div className={`font-bold ${vitals.hr > 100 ? 'text-rose-700' : 'text-emerald-700'}`}>
                          {vitals.hr || '--'} <span className="text-[8px] font-normal text-slate-400">bpm</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-[9px] text-slate-500 font-bold">BP</div>
                        <div className="font-bold text-slate-800">{vitals.bp || '--'}</div>
                      </div>
                      <div>
                        <div className="text-[9px] text-slate-500 font-bold">SpO2</div>
                        <div className={`font-bold ${vitals.spo2 < 93 ? 'text-amber-700' : 'text-blue-700'}`}>
                          {vitals.spo2 || '--'}%
                        </div>
                      </div>
                      <div>
                        <div className="text-[9px] text-slate-500 font-bold">TEMP</div>
                        <div className="font-bold text-slate-800">{vitals.temp || '--'}</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions Bar */}
                <div
                  className="flex items-center gap-2 pt-3 border-t border-slate-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  {onPrescribe && (
                    <button
                      onClick={() => onPrescribe(patient)}
                      className="flex-1 py-2 px-2.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <Pill className="w-3.5 h-3.5" /> Prescribe
                    </button>
                  )}

                  {onTransfer && (
                    <button
                      onClick={() => onTransfer(patient)}
                      className="p-2 px-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-95 transition-all flex items-center gap-1 border border-slate-200"
                      title="Request or Change Bed"
                    >
                      <Bed className="w-3.5 h-3.5 text-emerald-700" /> Bed
                    </button>
                  )}

                  <button
                    onClick={() => setSelectedPatientForProfile(patient)}
                    className="p-2 px-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all border border-slate-200 flex items-center gap-1"
                    title="View Full Patient Chart & Reports"
                  >
                    <Eye className="w-3.5 h-3.5" /> Profile
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Patient Profile Modal */}
      {selectedPatientForProfile && (
        <PatientProfileModal
          patient={selectedPatientForProfile}
          isOpen={Boolean(selectedPatientForProfile)}
          onClose={() => setSelectedPatientForProfile(null)}
          onPrescribe={onPrescribe}
          onTransfer={onTransfer}
          onEscalate={onEscalate}
        />
      )}
    </div>
  );
}
