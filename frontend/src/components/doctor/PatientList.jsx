import React from 'react';
import { User, Bed, Pill, ArrowRightLeft } from 'lucide-react';
import StatusBadge from '../common/StatusBadge.jsx';

export default function PatientList({
  patients = [],
  onPrescribe = null,
  onTransfer = null,
  onRelease = null,
  selectedDoctorId = null
}) {
  const filteredPatients = selectedDoctorId
    ? patients.filter(p => p.assignedDoctorId === selectedDoctorId)
    : patients;

  if (filteredPatients.length === 0) {
    return (
      <div className="clean-card p-12 text-center text-slate-500">
        <User className="w-10 h-10 mx-auto text-slate-300 mb-2" />
        <p className="text-sm font-bold text-slate-800">No patients currently assigned to this doctor.</p>
        <p className="text-xs text-slate-500 mt-1">Allocate a bed or select another clinician persona above.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredPatients.map((patient) => {
        const {
          patientId,
          name,
          age,
          gender,
          diagnosis,
          currentBedId,
          assignedDoctorName,
          vitals = {},
          status = 'admitted'
        } = patient;

        const isCritical = status === 'critical' || currentBedId?.startsWith('ICU');

        return (
          <div
            key={patientId}
            className={`clean-card-hover p-5 relative overflow-hidden flex flex-col justify-between ${
              isCritical ? 'border-rose-300 ring-2 ring-rose-400/20' : ''
            }`}
          >
            <div>
              {/* Top Bar */}
              <div className="flex items-start justify-between gap-2 mb-2.5">
                <div>
                  <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-500 font-medium">
                    <span>{patientId}</span>
                    <span>•</span>
                    <span className="font-sans">{age}y, {gender}</span>
                  </div>
                  <h4 className="text-base font-extrabold text-slate-900 mt-0.5">{name}</h4>
                </div>
                <StatusBadge status={status} size="xs" pulse={isCritical} />
              </div>

              {/* Diagnosis */}
              <div className="text-xs text-slate-700 mb-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                <span className="text-slate-500 font-bold text-[10px] uppercase block">Clinical Diagnosis:</span>
                <span className="font-semibold text-slate-800 line-clamp-1">{diagnosis || 'Clinical Observation'}</span>
              </div>

              {/* Allocation Location & Assigned Clinician */}
              <div className="flex items-center justify-between text-xs font-mono text-slate-600 mb-3 font-medium">
                <span className="flex items-center gap-1.5 text-emerald-800 font-bold">
                  <Bed className="w-4 h-4 text-emerald-700" />
                  Bed: {currentBedId || 'Awaiting Bed'}
                </span>
                <span className="text-slate-500 truncate max-w-[130px]">
                  {assignedDoctorName || 'Dr. Assigned'}
                </span>
              </div>

              {/* Live Vitals Telemetry Box */}
              {vitals && (
                <div className="grid grid-cols-4 gap-1.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center font-mono text-[11px] mb-4">
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
            <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
              {onPrescribe && (
                <button
                  onClick={() => onPrescribe(patient)}
                  className="flex-1 py-2 px-3 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Pill className="w-3.5 h-3.5" /> Prescribe (Saga)
                </button>
              )}

              {onTransfer && (
                <button
                  onClick={() => onTransfer(patient)}
                  className="p-2 px-3 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-95 transition-all flex items-center gap-1.5 border border-slate-200"
                  title="Initiate Bed Transfer"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" /> Transfer
                </button>
              )}

              {onRelease && currentBedId && (
                <button
                  onClick={() => onRelease(currentBedId, patient)}
                  className="p-2 px-3 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all border border-slate-200"
                  title="Discharge & Release Bed"
                >
                  Discharge
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
