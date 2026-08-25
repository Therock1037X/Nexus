import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Stethoscope,
  Bed,
  Pill,
  Sparkles,
  Activity,
  History,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  X,
  Users,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useHospital } from '../../context/HospitalContext.jsx';
import PatientList from '../../components/doctor/PatientList.jsx';
import NaturalLanguageRequestInput from '../../components/doctor/NaturalLanguageRequestInput.jsx';
import RequestResourceForm from '../../components/doctor/RequestResourceForm.jsx';
import PrescriptionForm from '../../components/doctor/PrescriptionForm.jsx';
import EscalateForm from '../../components/doctor/EscalateForm.jsx';
import LiveFeedItem from '../../components/common/LiveFeedItem.jsx';
import AIExplanationPanel from '../../components/admin/AIExplanationPanel.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';

export default function DoctorDashboard() {
  const { currentUser } = useAuth();
  const { patients, resources, events } = useHospital();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam || 'patients');

  useEffect(() => {
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

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
    handleTabChange('request');
  };

  // Quick bed availability summary for Doctor
  const freeBeds = resources.filter(r => r.type === 'bed' && r.status === 'free');
  const freeIcu = freeBeds.filter(b => b.bedType === 'icu');
  const freeER = freeBeds.filter(b => b.bedType === 'emergency');
  const myEvents = events.filter(e => e.actorId === currentUser?.id || e.actorRole === 'doctor');

  const tabs = [
    { id: 'patients', label: 'Patients', icon: Users, badge: patients.length },
    { id: 'request', label: 'Request Resource', icon: Bed, badge: 'OCC' },
    { id: 'prescribe', label: 'Prescribe', icon: Pill, badge: 'Saga' },
    { id: 'escalate', label: 'Escalate', icon: Sparkles, badge: 'Preempt', badgeColor: 'bg-rose-50 text-rose-700' },
    { id: 'activity', label: 'Activity Log', icon: History, badge: myEvents.length }
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Doctor Command & Clinical Station
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {currentUser?.specialty || 'General & Critical Care'} • Clinical coordinator: <strong className="text-slate-800">{currentUser?.name || 'Attending Physician'}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-semibold">Active Session:</span>
          <StatusBadge status="normal" size="xs" />
        </div>
      </div>

      {/* Horizontal Feature Tab Bar (Directly below header) */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-200/70 border border-slate-300/60 rounded-2xl w-full sm:w-fit overflow-x-auto shadow-xs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/90'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 border border-transparent'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-700' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-md ${
                    tab.badgeColor || (isActive ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-300/60 text-slate-700')
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Patients & Live Matrix */}
      {activeTab === 'patients' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Quick NLP Input */}
          <NaturalLanguageRequestInput onParsed={handleNlpParsed} />

          {/* 4 Floating Stat Metric Cards */}
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

          {/* Assigned Patient Cards */}
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
        </div>
      )}

      {/* Tab 2: Request Resource */}
      {activeTab === 'request' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <NaturalLanguageRequestInput onParsed={(data) => setParsedNlpData(data)} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 clean-card p-6">
              <h3 className="text-sm font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100">
                Resource Allocation Parameters
              </h3>
              <RequestResourceForm initialParsedData={parsedNlpData} />
            </div>

            <div className="space-y-4">
              <div className="clean-card p-5 space-y-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  Concurrency Rules (OCC)
                </h3>
                <ul className="text-xs text-slate-600 space-y-2.5 leading-relaxed font-medium">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span><strong>Optimistic Locking:</strong> Reads version before write. Rejects stale writes deterministically.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span><strong>Atomic Firestore:</strong> State updates and immutable audit events write simultaneously in a single transaction.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span><strong>Deterministic Preemption:</strong> Tier-4 CRITICAL requests automatically preempt lower-tier holds with rollback logs.</span>
                  </li>
                </ul>
              </div>

              <div className="clean-card p-5 bg-emerald-50/50 border-emerald-200">
                <h4 className="text-xs font-bold text-emerald-900 flex items-center gap-1.5 mb-1.5 uppercase font-mono">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-700" /> AI Advisory Support
                </h4>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  Free-text medical notes are scored by Gemini AI into priority tiers (Tier 1 Normal → Tier 4 Critical). Clinicians maintain full manual override control.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Prescribe (Saga) */}
      {activeTab === 'prescribe' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 clean-card p-6">
              <h3 className="text-sm font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
                <Pill className="w-4 h-4 text-purple-700" />
                Initiate Clinical Prescription Saga
              </h3>
              <PrescriptionForm preselectedPatient={modalPatient} />
            </div>

            <div className="space-y-4">
              <div className="clean-card p-5 space-y-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-purple-700" />
                  Saga Architecture (3-Step)
                </h3>
                <div className="space-y-2 text-xs text-slate-600 font-medium">
                  <div className="p-3 rounded-xl bg-purple-50 border border-purple-200">
                    <span className="font-bold text-purple-900">Step 1: Doctor Prescribes</span>
                    <p className="text-[11px] text-purple-800 mt-0.5">Stock decremented atomically in inventory.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="font-bold text-slate-800">Step 2: Pharmacy Dispenses</span>
                    <p className="text-[11px] text-slate-600 mt-0.5">Batch verified & packaged for ward delivery.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="font-bold text-slate-800">Step 3: Nurse Administers</span>
                    <p className="text-[11px] text-slate-600 mt-0.5">Dose given to patient & post-dose vitals logged.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Escalate */}
      {activeTab === 'escalate' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 clean-card p-6">
              <h3 className="text-sm font-bold text-rose-700 mb-4 pb-3 border-b border-rose-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Emergency Priority Escalation & Preemption
              </h3>
              <EscalateForm />
            </div>

            <div className="space-y-4">
              <div className="clean-card p-5 space-y-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-700" />
                  Preemption Policy & Safety
                </h3>
                <ul className="text-xs text-slate-600 space-y-2.5 leading-relaxed font-medium">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span><strong>Explicit Tiebreaker:</strong> When multiple requests contest a resource, the system deterministically awards to highest priority tier.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span><strong>Preempted Patient Notification:</strong> The previous holder's doctor receives an immediate notification to select alternate capacity.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span><strong>Immutable Audit Lineage:</strong> Escalation reasons and AI urgency scores are permanently recorded in the ledger.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Activity Log */}
      {activeTab === 'activity' && (
        <div className="space-y-6 animate-in fade-in duration-150">
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
      )}

      {/* Dynamic Action Modals (from Patient Card Clicks) */}
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
