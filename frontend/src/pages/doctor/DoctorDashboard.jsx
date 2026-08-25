import React, { useState } from 'react';
import {
  Stethoscope,
  Bed,
  Pill,
  Sparkles,
  Activity,
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
      {/* Top Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Doctor Command & Patient Care Station
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {currentUser?.specialty || 'General & Critical Care'} • Live bed allocations, natural language AI requests, and prescription sagas.
          </p>
        </div>

        {/* Action Triggers */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => { setModalPatient(null); setActiveModal('request'); }}
            className="btn-primary text-xs px-3.5 py-2 flex items-center gap-1.5 font-bold"
          >
            <Bed className="w-4 h-4" /> Request Bed / OT
          </button>

          <button
            onClick={() => { setModalPatient(null); setActiveModal('prescribe'); }}
            className="btn-purple text-xs px-3.5 py-2 flex items-center gap-1.5 font-bold"
          >
            <Pill className="w-4 h-4" /> Prescribe (Saga)
          </button>

          <button
            onClick={() => setActiveModal('escalate')}
            className="btn-danger text-xs px-3.5 py-2 flex items-center gap-1.5 font-bold"
          >
            <Sparkles className="w-4 h-4" /> Emergency Escalate
          </button>
        </div>
      </div>

      {/* Feature 3: Natural Language Resource Request Input */}
      <NaturalLanguageRequestInput onParsed={handleNlpParsed} />

      {/* 4 Floating Stat Metric Cards (BhumiGIS Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="clean-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Free General Beds</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <Bed className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-emerald-700">
              {freeBeds.filter(b => b.bedType === 'general').length} <span className="text-sm font-semibold text-slate-500">Units</span>
            </div>
            <div className="text-xs text-slate-500 font-medium mt-1">
              • Floor 1 & Floor 4 general wards
            </div>
          </div>
        </div>

        <div className="clean-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Free ER Bays</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-blue-700">
              {freeER.length} <span className="text-sm font-semibold text-slate-500">Bays</span>
            </div>
            <div className="text-xs text-slate-500 font-medium mt-1">
              • Trauma & resuscitation unit
            </div>
          </div>
        </div>

        <div className="clean-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">ICU Beds (Scarce)</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-2xl font-extrabold ${freeIcu.length <= 2 ? 'text-amber-700' : 'text-slate-900'}`}>
              {freeIcu.length} <span className="text-sm font-semibold text-slate-500">Available</span>
            </div>
            <div className="text-xs text-slate-500 font-medium mt-1">
              • Critical care monitoring unit
            </div>
          </div>
        </div>

        <div className="clean-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">ICU Ventilators</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-purple-700">
              {resources.filter(r => r.type === 'equipment' && r.id?.includes('VENT') && r.status === 'free').length} <span className="text-sm font-semibold text-slate-500">Free</span>
            </div>
            <div className="text-xs text-slate-500 font-medium mt-1">
              • Biomedical respiratory units
            </div>
          </div>
        </div>
      </div>

      {/* Active Patients Assigned */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-emerald-700" />
            Assigned Patients & Live Bed Status
          </h3>
          <span className="text-xs font-mono text-slate-500 font-bold">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white max-w-xl w-full rounded-2xl p-6 border border-slate-200 shadow-xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => { setActiveModal(null); setParsedNlpData(null); }}
              className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            {activeModal === 'request' && (
              <div>
                <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
                  <Bed className="w-5 h-5 text-emerald-700" /> Allocate / Reserve Resource
                </h3>
                <p className="text-xs text-slate-500 mb-4 font-medium">
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
                <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
                  <Pill className="w-5 h-5 text-purple-700" /> New Prescription (Start Saga)
                </h3>
                <p className="text-xs text-slate-500 mb-4 font-medium">
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
                <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2 text-rose-700">
                  <Sparkles className="w-5 h-5" /> Emergency Priority Escalation & Preemption
                </h3>
                <p className="text-xs text-slate-500 mb-4 font-medium">
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
