import React, { useState } from 'react';
import {
  Menu,
  Sparkles,
  Volume2,
  VolumeX,
  RotateCcw,
  Building,
  ShieldAlert,
  UserPlus
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useHospital } from '../../context/HospitalContext.jsx';
import AISettingsModal from './AISettingsModal.jsx';
import AdmitPatientModal from './AdmitPatientModal.jsx';

export default function Navbar({ onToggleSidebar }) {
  const { currentUser, role } = useAuth();
  const { stats, isSeeding, handleResetSeed, soundEnabled, setSoundEnabled } = useHospital();
  const [showAiModal, setShowAiModal] = useState(false);
  const [showAdmitModal, setShowAdmitModal] = useState(false);

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-200/80 px-4 lg:px-8 flex items-center justify-between shadow-clean flex-shrink-0">
        {/* Left: Mobile Toggle & Hospital Location Context */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-800 bg-slate-100/80 px-3 py-1.5 rounded-xl border border-slate-200">
              <Building className="w-3.5 h-3.5 text-emerald-700" />
              <span>St. Jude Memorial Hospital</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-500 font-normal">Level-1 Trauma & Surgical Wing</span>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
              Live
            </span>
          </div>
        </div>

        {/* Center: Live Occupancy Telemetry Chips */}
        <div className="hidden xl:flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-50 border border-slate-200 text-slate-700">
            <span className="text-slate-500 font-sans">BED OCCUPANCY:</span>
            <span className={`font-bold ${stats.occupancyRate > 80 ? 'text-rose-600' : 'text-emerald-700'}`}>
              {stats.occupancyRate}%
            </span>
            <span className="text-slate-400 text-[11px]">({stats.occupiedBeds + stats.reservedBeds}/{stats.totalBeds})</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-50 border border-slate-200 text-slate-700">
            <span className="text-slate-500 font-sans">ICU FREE:</span>
            <span className={`font-bold ${stats.freeIcuBeds <= 2 ? 'text-amber-600' : 'text-blue-600'}`}>
              {stats.freeIcuBeds}/{stats.icuBedsCount} Beds
            </span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-50 border border-slate-200 text-slate-700">
            <span className="text-slate-500 font-sans">PRESCRIPTIONS:</span>
            <span className="font-bold text-purple-600">{stats.inProgressSagasCount} Active</span>
          </div>

          {stats.conflictsCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-bold">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{stats.conflictsCount} Overrides Logged</span>
            </div>
          )}
        </div>

        {/* Right: Actions & Modals */}
        <div className="flex items-center gap-2.5">
          {/* 1-Click Admit Patient Action */}
          <button
            onClick={() => setShowAdmitModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-all"
            title="Admit a new patient from OPD / Reception"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Admit Patient</span>
          </button>

          {/* Audio Ping Mute/Unmute */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Mute Alert Audio' : 'Unmute Alert Audio'}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-700" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* AI Settings Trigger */}
          <button
            onClick={() => setShowAiModal(true)}
            title="Configure AI & Gemini Settings"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">AI Settings</span>
          </button>

          {/* Reset & Seed Demo Data CTA */}
          <button
            onClick={handleResetSeed}
            disabled={isSeeding}
            title="Reset hospital demo data to default clean state"
            className="btn-secondary text-xs px-3 py-1.5 font-bold"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isSeeding ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isSeeding ? 'Resetting...' : 'Reset Demo'}</span>
          </button>
        </div>
      </header>

      {/* Modals */}
      <AISettingsModal isOpen={showAiModal} onClose={() => setShowAiModal(false)} />
      <AdmitPatientModal isOpen={showAdmitModal} onClose={() => setShowAdmitModal(false)} />
    </>
  );
}
