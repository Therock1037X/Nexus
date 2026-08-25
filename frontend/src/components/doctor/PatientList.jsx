import React from 'react';
import { User, Bed, HeartPulse, Pill, ArrowRightLeft, CheckCircle, Activity, Sparkles } from 'lucide-react';
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
      <div className="glass-panel rounded-2xl p-8 text-center text-slate-400">
        <User className="w-8 h-8 mx-auto text-slate-600 mb-2" />
        <p className="text-sm font-medium text-slate-300">No patients currently assigned to this doctor.</p>
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
            className={`glass-card rounded-2xl p-4 relative overflow-hidden transition-all duration-200 ${
              isCritical ? 'border-rose-900/60 bg-rose-950/10 ring-1 ring-rose-500/20' : ''
            }`}
          >
            {/* Top Bar */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[11px] text-slate-500">{patientId}</span>
                  <span className="text-[11px] text-slate-400">({age}y, {gender})</span>
                </div>
                <h4 className="text-base font-bold text-slate-100">{name}</h4>
              </div>
              <StatusBadge status={status} size="xs" pulse={isCritical} />
            </div>

            {/* Diagnosis */}
            <div className="text-xs text-slate-300 mb-3 bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
              <span className="text-slate-500 font-mono text-[10px] uppercase block">Diagnosis:</span>
              <span className="font-medium text-slate-200 line-clamp-1">{diagnosis || 'Clinical Observation'}</span>
            </div>

            {/* Allocation Location & Assigned Clinician */}
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-3">
              <span className="flex items-center gap-1 text-cyan-300">
                <Bed className="w-3.5 h-3.5 text-cyan-400" />
                Bed: {currentBedId || 'Awaiting Bed'}
              </span>
              <span className="text-slate-400 truncate max-w-[130px]">
                {assignedDoctorName || 'Dr. Assigned'}
              </span>
            </div>

            {/* Live Vitals Telemetry Box */}
            {vitals && (
              <div className="grid grid-cols-4 gap-1 p-2 rounded-xl bg-slate-950/80 border border-slate-800 text-center font-mono text-[11px] mb-3">
                <div>
                  <div className="text-[9px] text-slate-500">HR</div>
                  <div className={`font-bold ${vitals.hr > 100 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {vitals.hr || '--'} <span className="text-[8px] font-normal text-slate-500">bpm</span>
                  </div>
                </div>
                <div>
                  <div className="text-[9px] text-slate-500">BP</div>
                  <div className="font-bold text-slate-200">{vitals.bp || '--'}</div>
                </div>
                <div>
                  <div className="text-[9px] text-slate-500">SpO2</div>
                  <div className={`font-bold ${vitals.spo2 < 93 ? 'text-amber-400' : 'text-cyan-400'}`}>
                    {vitals.spo2 || '--'}%
                  </div>
                </div>
                <div>
                  <div className="text-[9px] text-slate-500">TEMP</div>
                  <div className="font-bold text-slate-200">{vitals.temp || '--'}</div>
                </div>
              </div>
            )}

            {/* Actions Bar */}
            <div className="flex items-center gap-1.5 pt-2 border-t border-slate-800/80">
              {onPrescribe && (
                <button
                  onClick={() => onPrescribe(patient)}
                  className="flex-1 py-1.5 px-2 rounded-lg text-xs font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-95 transition-all flex items-center justify-center gap-1 shadow-sm shadow-purple-950/40"
                >
                  <Pill className="w-3 h-3" /> Prescribe (Saga)
                </button>
              )}

              {onTransfer && (
                <button
                  onClick={() => onTransfer(patient)}
                  className="p-1.5 px-2.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 active:scale-95 transition-all flex items-center gap-1 border border-slate-700"
                  title="Initiate Bed Transfer"
                >
                  <ArrowRightLeft className="w-3 h-3" /> Transfer
                </button>
              )}

              {onRelease && currentBedId && (
                <button
                  onClick={() => onRelease(currentBedId, patient)}
                  className="p-1.5 px-2 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all border border-slate-800"
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
