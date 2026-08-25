import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Bed,
  Activity,
  GitPullRequest,
  GitMerge,
  Building2,
  History,
  PlusCircle,
  Bug,
  PackageCheck,
  Pill,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useHospital } from '../../context/HospitalContext.jsx';
import LiveResourceGrid from '../../components/admin/LiveResourceGrid.jsx';
import ConflictFeed from '../../components/admin/ConflictFeed.jsx';
import SagaTracker from '../../components/admin/SagaTracker.jsx';
import AuditTrailSearch from '../../components/admin/AuditTrailSearch.jsx';
import ResourceSetupForm from '../../components/admin/ResourceSetupForm.jsx';
import FailureDemoPanel from '../../components/admin/FailureDemoPanel.jsx';
import PrescriptionQueue from '../../components/pharmacy/PrescriptionQueue.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';

export default function AdminDashboard() {
  const { currentUser } = useAuth();
  const { stats, resources, sagas } = useHospital();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam || 'grid');

  useEffect(() => {
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  const medicines = resources.filter(r => r.type === 'medicine');
  const incomingPrescriptions = sagas.filter(s => s.status === 'in_progress' && s.steps?.[1]?.status === 'pending');
  const scarceMeds = medicines.filter(m => Number(m.quantity) <= (m.minThreshold || 30));

  const tabs = [
    { id: 'grid', label: 'Live Grid', icon: Building2, badge: `${stats.totalBeds} Units` },
    { id: 'conflicts', label: 'Conflict Feed', icon: GitMerge, badge: stats.conflictsCount, badgeColor: stats.conflictsCount > 0 ? 'bg-rose-50 text-rose-800' : 'bg-slate-300/60 text-slate-700' },
    { id: 'sagas', label: 'Saga Tracker', icon: GitPullRequest, badge: stats.inProgressSagasCount, badgeColor: stats.inProgressSagasCount > 0 ? 'bg-purple-50 text-purple-800' : 'bg-slate-300/60 text-slate-700' },
    { id: 'audit', label: 'Audit Trail', icon: History, badge: 'AI' },
    { id: 'setup', label: 'Resource Setup', icon: PlusCircle },
    { id: 'demo', label: 'Failure Demo', icon: Bug, badge: 'Chaos', badgeColor: 'bg-rose-50 text-rose-800' },
    { id: 'pharmacy', label: 'Pharmacy Queue', icon: PackageCheck, badge: incomingPrescriptions.length, badgeColor: incomingPrescriptions.length > 0 ? 'bg-purple-50 text-purple-800' : 'bg-slate-300/60 text-slate-700' }
  ];

  return (
    <div className="space-y-6">
      {/* Top Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Hospital Operations & Concurrency Command
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Real-time multi-floor resource control, optimistic concurrency control (OCC), distributed sagas, audit ledger, and pharmacy dispatch.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-semibold">
            Operations Officer: <strong className="text-slate-800">{currentUser?.name || 'Operations Director'}</strong>
          </span>
          <StatusBadge status="normal" size="xs" />
        </div>
      </div>

      {/* Top 4 Floating Metric & Stat Cards (BhumiGIS Reference Pattern) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Bed Occupancy */}
        <div className="clean-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Bed Occupancy</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <Bed className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900">
              {stats.occupancyRate}%
            </div>
            <div className="text-xs text-slate-500 font-medium mt-1">
              • {stats.occupiedBeds + stats.reservedBeds} of {stats.totalBeds} beds allocated
            </div>
          </div>
        </div>

        {/* Card 2: ICU Availability */}
        <div className="clean-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">ICU Beds Free</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-blue-700">
              {stats.freeIcuBeds} <span className="text-sm font-semibold text-slate-500">/ {stats.icuBedsCount}</span>
            </div>
            <div className="text-xs text-slate-500 font-medium mt-1">
              • {stats.freeIcuBeds <= 2 ? '⚠️ High Critical Demand' : 'Normal Reserve Capacity'}
            </div>
          </div>
        </div>

        {/* Card 3: Active Sagas */}
        <div className="clean-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Sagas</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
              <GitPullRequest className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-purple-700">
              {stats.inProgressSagasCount}
            </div>
            <div className="text-xs text-slate-500 font-medium mt-1">
              • Multi-step distributed transactions
            </div>
          </div>
        </div>

        {/* Card 4: OCC Conflicts Handled */}
        <div className="clean-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Conflicts Logged</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-700">
              <GitMerge className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900">
              {stats.conflictsCount}
            </div>
            <div className="text-xs text-slate-500 font-medium mt-1">
              • Deterministic resolution applied
            </div>
          </div>
        </div>
      </div>

      {/* Horizontal Feature Tab Bar (Directly below stats) */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-200/70 border border-slate-300/60 rounded-2xl w-full overflow-x-auto shadow-xs">
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

      {/* Tab 1: Live Grid */}
      {activeTab === 'grid' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <LiveResourceGrid />
        </div>
      )}

      {/* Tab 2: Conflict Feed */}
      {activeTab === 'conflicts' && (
        <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-150">
          <ConflictFeed />
        </div>
      )}

      {/* Tab 3: Saga Tracker */}
      {activeTab === 'sagas' && (
        <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-150">
          <SagaTracker />
        </div>
      )}

      {/* Tab 4: Audit Trail */}
      {activeTab === 'audit' && (
        <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-150">
          <AuditTrailSearch />
        </div>
      )}

      {/* Tab 5: Resource Setup */}
      {activeTab === 'setup' && (
        <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-150">
          <ResourceSetupForm />
        </div>
      )}

      {/* Tab 6: Failure Demo */}
      {activeTab === 'demo' && (
        <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-150">
          <FailureDemoPanel />
        </div>
      )}

      {/* Tab 7: Pharmacy Queue */}
      {activeTab === 'pharmacy' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* 3 Pharmacy Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="clean-card p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Awaiting Dispense</span>
                <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
                  <PackageCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-extrabold text-purple-700">
                  {incomingPrescriptions.length} <span className="text-sm font-semibold text-slate-500">Orders</span>
                </div>
                <div className="text-xs text-slate-500 font-medium mt-1">
                  • Step 2 verification queue
                </div>
              </div>
            </div>

            <div className="clean-card p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Scarce Drugs</span>
                <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
                  <Pill className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className={`text-2xl font-extrabold ${scarceMeds.length > 0 ? 'text-amber-700' : 'text-slate-900'}`}>
                  {scarceMeds.length} <span className="text-sm font-semibold text-slate-500">Items</span>
                </div>
                <div className="text-xs text-slate-500 font-medium mt-1">
                  • Below threshold demo inventory
                </div>
              </div>
            </div>

            <div className="clean-card p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Formularies</span>
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                  <Pill className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-extrabold text-emerald-700">
                  {medicines.length} <span className="text-sm font-semibold text-slate-500">Formularies</span>
                </div>
                <div className="text-xs text-slate-500 font-medium mt-1">
                  • Real-time stock telemetry
                </div>
              </div>
            </div>
          </div>

          {/* Live Pharmaceutical Stock Cards */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Pill className="w-4 h-4 text-purple-700" />
                Live Hospital Pharmaceutical Inventory ({medicines.length} Formularies)
              </h3>
              <span className="text-xs font-mono text-slate-500 font-bold">Real-Time Sync</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              {medicines.map((med) => {
                const isLow = Number(med.quantity) <= (med.minThreshold || 30);
                return (
                  <div
                    key={med.id}
                    className={`clean-card p-4 transition-all ${
                      isLow ? 'border-amber-300 bg-amber-50/40' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1 mb-1.5">
                      <span className="font-mono text-[10px] text-slate-500 font-bold uppercase truncate">{med.category || 'Drug'}</span>
                      {med.isScarce && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                          SCARCE
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-slate-900 truncate">{med.name}</h4>
                    <div className="flex items-baseline justify-between mt-2 pt-2 border-t border-slate-100 font-mono">
                      <span className="text-xs text-slate-500 font-medium">Available:</span>
                      <span className={`text-sm font-extrabold ${isLow ? 'text-amber-800' : 'text-emerald-700'}`}>
                        {med.quantity} <span className="text-[10px] font-normal text-slate-500">{med.unit}</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Incoming Prescriptions Queue */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <PackageCheck className="w-5 h-5 text-purple-700" />
                Incoming Prescription Fulfillment Queue (Step 2 in Saga Loop)
              </h3>
              <span className="text-xs font-mono text-slate-500 font-bold">
                {incomingPrescriptions.length} Orders Awaiting Verification
              </span>
            </div>

            <PrescriptionQueue />
          </div>
        </div>
      )}
    </div>
  );
}
