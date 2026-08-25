import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ClipboardList,
  HeartPulse,
  AlertTriangle,
  Pill,
  Bed,
  CheckCircle2,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useHospital } from '../../context/HospitalContext.jsx';
import TaskQueue from '../../components/nurse/TaskQueue.jsx';
import LogEventForm from '../../components/nurse/LogEventForm.jsx';
import FlagIssueForm from '../../components/nurse/FlagIssueForm.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';

export default function NurseDashboard() {
  const { currentUser } = useAuth();
  const { resources, sagas } = useHospital();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam || 'queue');

  useEffect(() => {
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  const [activeModal, setActiveModal] = useState(null); // 'log' | 'flag'

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
    { id: 'log', label: 'Log Care Event', icon: HeartPulse, badge: 'Vitals' },
    { id: 'flag', label: 'Flag Issue', icon: AlertTriangle, badge: bedsNeedingCleaning.length, badgeColor: bedsNeedingCleaning.length > 0 ? 'bg-amber-50 text-amber-800' : 'bg-slate-300/60 text-slate-700' }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Nurse Care & Task Station
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Ward: {currentUser?.wardAssigned || 'General Floor 1'} • Active nurse: <strong className="text-slate-800">{currentUser?.name || 'Nurse Pooja Pawar'}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-semibold">Ward Concurrency:</span>
          <StatusBadge status="done" size="xs" />
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
          {/* 3 Floating Stat Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="clean-card p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Prescriptions</span>
                <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
                  <Pill className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-extrabold text-purple-700">
                  {inProgressSagas.length} <span className="text-sm font-semibold text-slate-500">Sagas</span>
                </div>
                <div className="text-xs text-slate-500 font-medium mt-1">
                  • In-progress hospital sagas
                </div>
              </div>
            </div>

            <div className="clean-card p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Beds in Sanitization</span>
                <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
                  <Bed className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-extrabold text-blue-700">
                  {bedsNeedingCleaning.length} <span className="text-sm font-semibold text-slate-500">Units</span>
                </div>
                <div className="text-xs text-slate-500 font-medium mt-1">
                  • Cleaning & disinfection in progress
                </div>
              </div>
            </div>

            <div className="clean-card p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ward System Status</span>
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-extrabold text-emerald-700">
                  NOMINAL
                </div>
                <div className="text-xs text-slate-500 font-medium mt-1">
                  • Real-time concurrency connected
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-emerald-700" />
                Bedside Administration Queue (Step 3 in Saga Loop)
              </h3>
              <span className="text-xs font-mono text-slate-500 font-bold">
                Real-Time Live Feed
              </span>
            </div>

            <TaskQueue />
          </div>
        </div>
      )}

      {/* Tab 2: Log Care Event */}
      {activeTab === 'log' && (
        <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-150">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <HeartPulse className="w-5 h-5 text-emerald-700" />
              Log Clinical Bedside Event & Vitals
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Record nursing observations, vital telemetry checks, and patient bed rotations directly into the immutable audit ledger.
            </p>
          </div>

          <div className="clean-card p-6">
            <LogEventForm />
          </div>
        </div>
      )}

      {/* Tab 3: Flag Issue */}
      {activeTab === 'flag' && (
        <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-150">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              Flag Resource Maintenance & Sanitization
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Mark beds, operating suites, or biomedical equipment as undergoing cleaning or calibration to block conflict requests.
            </p>
          </div>

          <div className="clean-card p-6">
            <FlagIssueForm />
          </div>
        </div>
      )}
    </div>
  );
}
