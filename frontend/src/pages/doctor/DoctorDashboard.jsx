import React, { useState } from 'react';
import {
  Stethoscope,
  Bed,
  Pill,
  Sparkles,
  PlusCircle,
  Activity,
  History,
  CheckCircle2,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useHospital } from '../../context/HospitalContext.jsx';
import PatientList from '../../components/doctor/PatientList.jsx';
import NaturalLanguageRequestInput from '../../components/doctor/NaturalLanguageRequestInput.jsx';
import RequestResourceForm from '../../components/doctor/RequestResourceForm.jsx';
import PrescriptionForm from '../../components/doctor/PrescriptionForm.jsx';
import EscalateForm from '../../components/doctor/EscalateForm.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';

export default function DoctorDashboard() {
  const { currentUser } = useAuth();
  const { patients, resources } = useHospital();

  const [parsedNlpData, setParsedNlpData] = useState(null);
  const [activeModal, setActiveModal] = useState(null); // 'request' | 'prescribe' | 'escalate'
  const [modalPatient, setModalPatient] = useState(null);

  const openPrescribeModal = (patient) => {
    setModalPatient(patient);
    setActiveModal('prescribe');
  };

  const openTransferModal = (patient) => {
    setModalPatient(patient);
    setActiveModal('request');
  };

  const handleNlpParsed = (data) => {
    setParsedNlpData(data);
    setActiveModal('request');
  };

  // Quick bed availability summary for Doctor
  const freeBeds = resources.filter(r => r.type === 'bed' && r.status === 'free');
  const freeIcu = freeBeds.filter(b => b.bedType === 'icu');
  const freeER = freeBeds.filter(b => b.bedType === 'emergency');

  return (
    <div className="space-y-6">
      {/* Top Welcome & Quick Telemetry Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel rounded-3xl p-6 border border-slate-800">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-cyan-950/40">
            {currentUser?.avatar || 'DR'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-100">{currentUser?.name || 'Attending Physician'}</h2>
              <StatusBadge status="normal" size="xs" />
            </div>
            <p className="text-xs text-slate-400">
              {currentUser?.specialty || 'General Medicine'} • Clinical Resource Coordination Station
            </p>
          </div>
        </div>

        {/* Action Triggers */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => { setModalPatient(null); setActiveModal('request'); }}
            className="btn-primary text-xs px-3.5 py-2 flex items-center gap-1.5"
          >
            <Bed className="w-4 h-4" /> Request Bed / OT
          </button>

          <button
            onClick={() => { setModalPatient(null); setActiveModal('prescribe'); }}
            className="btn-secondary text-xs px-3.5 py-2 flex items-center gap-1.5 border-slate-700"
          >
            <Pill className="w-4 h-4 text-purple-400" /> Prescribe (Saga)
          </button>

          <button
            onClick={() => setActiveModal('escalate')}
            className="btn-danger text-xs px-3.5 py-2 flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4" /> Emergency Escalate
          </button>
        </div>
      </div>

      {/* Feature 3: Natural Language Resource Request Input */}
      <NaturalLanguageRequestInput onParsed={handleNlpParsed} />

      {/* Live Availability Quick Matrix */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
        <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
          <div className="text-[10px] text-slate-400 uppercase">Free General Beds</div>
          <div className="text-lg font-bold text-emerald-400 mt-0.5">
            {freeBeds.filter(b => b.bedType === 'general').length} Units
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
          <div className="text-[10px] text-slate-400 uppercase">Free Emergency Beds</div>
          <div className="text-lg font-bold text-cyan-400 mt-0.5">
            {freeER.length} Units
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
          <div className="text-[10px] text-slate-400 uppercase">Free ICU Beds (Scarce)</div>
          <div className={`text-lg font-bold mt-0.5 ${freeIcu.length <= 2 ? 'text-amber-400' : 'text-cyan-400'}`}>
            {freeIcu.length} Units
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
          <div className="text-[10px] text-slate-400 uppercase">Available Ventilators</div>
          <div className="text-lg font-bold text-indigo-400 mt-0.5">
            {resources.filter(r => r.type === 'equipment' && r.id?.includes('VENT') && r.status === 'free').length} Units
          </div>
        </div>
      </div>

      {/* Active Patients Assigned */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-cyan-400" />
            Assigned Patients & Live Bed Status
          </h3>
          <span className="text-xs font-mono text-slate-400">
            {patients.length} Registered Patients
          </span>
        </div>

        <PatientList
          patients={patients}
          onPrescribe={openPrescribeModal}
          onTransfer={openTransferModal}
        />
      </div>

      {/* Dynamic Action Modals */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in">
          <div className="glass-panel max-w-xl w-full rounded-3xl p-6 border border-slate-700/80 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => { setActiveModal(null); setParsedNlpData(null); }}
              className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            {activeModal === 'request' && (
              <div>
                <h3 className="text-base font-bold text-slate-100 mb-1 flex items-center gap-2">
                  <Bed className="w-5 h-5 text-cyan-400" /> Allocate / Reserve Resource
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  Select a bed, OT, or ventilator with optimistic concurrency checking.
                </p>
                <RequestResourceForm
                  initialParsedData={parsedNlpData}
                  onSuccess={() => {
                    setTimeout(() => { setActiveModal(null); setParsedNlpData(null); }, 1000);
                  }}
                />
              </div>
            )}

            {activeModal === 'prescribe' && (
              <div>
                <h3 className="text-base font-bold text-slate-100 mb-1 flex items-center gap-2">
                  <Pill className="w-5 h-5 text-purple-400" /> New Prescription (Start Saga)
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  Initiates a 3-step clinical saga (Order → Dispense → Administer) with automated inventory rollback protection.
                </p>
                <PrescriptionForm
                  preselectedPatient={modalPatient}
                  onSuccess={() => {
                    setTimeout(() => setActiveModal(null), 1000);
                  }}
                />
              </div>
            )}

            {activeModal === 'escalate' && (
              <div>
                <h3 className="text-base font-bold text-slate-100 mb-1 flex items-center gap-2 text-rose-400">
                  <Sparkles className="w-5 h-5" /> Emergency Priority Escalation & Preemption
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  Apply deterministic preemption to override lower-priority resource holds for acute emergencies.
                </p>
                <EscalateForm
                  onSuccess={() => {
                    setTimeout(() => setActiveModal(null), 1000);
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
