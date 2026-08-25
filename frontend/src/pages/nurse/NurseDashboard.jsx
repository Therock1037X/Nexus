import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ClipboardList,
  HeartPulse,
  AlertTriangle,
  Pill,
  Bed,
  CheckCircle2,
  Users
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useHospital } from '../../context/HospitalContext.jsx';
import TaskQueue from '../../components/nurse/TaskQueue.jsx';
import LogEventForm from '../../components/nurse/LogEventForm.jsx';
import FlagIssueForm from '../../components/nurse/FlagIssueForm.jsx';
import NursePatientList from '../../components/nurse/NursePatientList.jsx';

export default function NurseDashboard() {
  const { currentUser } = useAuth();
  const { resources, sagas, patients } = useHospital();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam || 'queue');
  const [preselectedPatientId, setPreselectedPatientId] = useState(null);

  useEffect(() => {
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  const inProgressSagas = sagas.filter(s => s.status === 'in_progress');
  const bedsNeedingCleaning = resources.filter(r => r.status === 'cleaning' || r.status === 'maintenance');

  const pendingNurseTasksCount = sagas.filter((s) => {
    if (s.status !== 'in_progress') return false;
    const dispenseStep = s.steps?.find(st => st.stepName === 'dispense');
    const adminStep = s.steps?.find(st => st.stepName === 'administer');
    return dispenseStep?.status === 'done' && adminStep?.status === 'pending';
  }).length;

  const tabs = [
    { id: 'queue', label: 'Task Queue', icon: ClipboardList, badge: pendingNurseTasksCount, badgeColor: pendingNurseTasksCount > 0 ? 'bg-blue-50 text-blue-800' : 'bg-slate-300/60 text-slate-700' },
    { id: 'patients', label: 'My Patients', icon: Users, badge: patients.length },
    { id: 'log', label: 'Log Care Event', icon: HeartPulse, badge: 'Vitals' },
    { id: 'flag', label: 'Report a Problem', icon: AlertTriangle, badge: bedsNeedingCleaning.length, badgeColor: bedsNeedingCleaning.length > 0 ? 'bg-amber-50 text-amber-800' : 'bg-slate-300/60 text-slate-700' }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Nurse Dashboard
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Ward: {currentUser?.wardAssigned || 'General Floor 1'} • Attending nurse: <strong className="text-slate-800">{currentUser?.name || 'Nurse Pooja Pawar'}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
            ● Station Active
          </span>
        </div>
      </div>

      {/* Horizontal Feature Tab Bar */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-200/70 border border-slate-300/60 rounded-2xl w-full sm:w-fit overflow-x-auto shadow-xs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
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

      {/* Tab 1: Task Queue (Default) */}
      {activeTab === 'queue' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* 3 Stat Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="clean-card p-5 flex flex-col justify-between bg-white">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Medication Tasks</span>
                <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
                  <Pill className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-extrabold text-purple-700">
                  {inProgressSagas.length} <span className="text-sm font-semibold text-slate-500">Orders</span>
                </div>
                <div className="text-xs text-slate-500 font-medium mt-1">
                  • In-progress prescriptions
                </div>
              </div>
            </div>

            <div className="clean-card p-5 flex flex-col justify-between bg-white">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Beds Being Cleaned</span>
                <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
                  <Bed className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-extrabold text-blue-700">
                  {bedsNeedingCleaning.length} <span className="text-sm font-semibold text-slate-500">Beds</span>
                </div>
                <div className="text-xs text-slate-500 font-medium mt-1">
                  • Sanitization in progress
                </div>
              </div>
            </div>

            <div className="clean-card p-5 flex flex-col justify-between bg-white">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ward Status</span>
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-extrabold text-emerald-700">
                  READY
                </div>
                <div className="text-xs text-slate-500 font-medium mt-1">
                  • All care systems operational
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-emerald-700" />
                Medication Delivery Queue
              </h3>
              <span className="text-xs text-slate-500 font-semibold">
                Updated in real time
              </span>
            </div>

            <TaskQueue />
          </div>
        </div>
      )}

      {/* Tab 2: My Patients */}
      {activeTab === 'patients' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-700" />
              Ward Patient Roster
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Patients currently admitted to your ward area. You can log vitals or review their chart directly.
            </p>
          </div>

          <NursePatientList
            onSelectPatientForLog={(pid) => {
              setPreselectedPatientId(pid);
              handleTabChange('log');
            }}
          />
        </div>
      )}

      {/* Tab 3: Log Care Event */}
      {activeTab === 'log' && (
        <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-150">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <HeartPulse className="w-5 h-5 text-emerald-700" />
              Log Patient Care & Vitals
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Log vitals and care given to this patient.
            </p>
          </div>

          <div className="clean-card p-6 bg-white">
            <LogEventForm
              initialPatientId={preselectedPatientId}
              onSuccess={() => setPreselectedPatientId(null)}
            />
          </div>
        </div>
      )}

      {/* Tab 4: Report a Problem */}
      {activeTab === 'flag' && (
        <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-150">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              Report a Problem
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              e.g. bed needs cleaning, equipment not working
            </p>
          </div>

          <div className="clean-card p-6 bg-white">
            <FlagIssueForm />
          </div>
        </div>
      )}
    </div>
  );
}
