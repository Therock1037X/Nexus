import React, { useState } from 'react';
import {
  Activity,
  Heart,
  Sparkles,
  Volume2,
  VolumeX,
  RotateCcw,
  User,
  Shield,
  Stethoscope,
  Pill,
  CheckCircle2,
  ChevronDown,
  Layers
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useHospital } from '../../context/HospitalContext.jsx';
import AISettingsModal from './AISettingsModal.jsx';

export default function Navbar({ onToggleSidebar }) {
  const { currentUser, role, switchPersona, personas } = useAuth();
  const { stats, isSeeding, handleResetSeed, soundEnabled, setSoundEnabled } = useHospital();
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);

  const getRoleIcon = (r) => {
    switch (r) {
      case 'doctor':
        return <Stethoscope className="w-3.5 h-3.5 text-cyan-400" />;
      case 'nurse':
        return <Heart className="w-3.5 h-3.5 text-emerald-400" />;
      case 'pharmacy':
        return <Pill className="w-3.5 h-3.5 text-purple-400" />;
      case 'admin':
        return <Shield className="w-3.5 h-3.5 text-amber-400" />;
      default:
        return <User className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 h-16 glass-panel border-b border-slate-800/80 px-4 lg:px-6 flex items-center justify-between">
        {/* Left: Brand & Heartbeat */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800"
          >
            <Layers className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-900/30">
              <Activity className="w-5 h-5 animate-pulse" />
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-950 animate-ping-slow" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                  NEXUS
                </span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60">
                  REAL-TIME RTS
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">Clinical Resource Transaction System</p>
            </div>
          </div>
        </div>

        {/* Center: Live Command Telemetry Chips */}
        <div className="hidden md:flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-slate-400">BED OCCUPANCY:</span>
            <span className={`font-bold ${stats.occupancyRate > 85 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {stats.occupancyRate}%
            </span>
            <span className="text-slate-600">({stats.occupiedBeds + stats.reservedBeds}/{stats.totalBeds})</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-slate-400">ICU FREE:</span>
            <span className={`font-bold ${stats.freeIcuBeds <= 2 ? 'text-amber-400' : 'text-cyan-400'}`}>
              {stats.freeIcuBeds}/{stats.icuBedsCount}
            </span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-slate-400">IN-USE OTS:</span>
            <span className="font-bold text-indigo-400">{stats.inUseOts}/{stats.totalOts}</span>
          </div>

          {stats.conflictsCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-950/40 border border-rose-900/60 text-rose-400 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              <span>{stats.conflictsCount} CONFLICTS LOGGED</span>
            </div>
          )}
        </div>

        {/* Right: Actions & Fast Persona Switcher */}
        <div className="flex items-center gap-2.5">
          {/* Audio Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Mute Alert Pings' : 'Unmute Alert Pings'}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-colors"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* AI Settings Trigger */}
          <button
            onClick={() => setShowAiModal(true)}
            title="AI Settings & Model Config"
            className="p-2 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800/80 transition-colors flex items-center gap-1 text-xs"
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
          </button>

          {/* 1-Click Reset / Seed Button */}
          <button
            onClick={handleResetSeed}
            disabled={isSeeding}
            title="Reset & Seed Complete Demo Hospital Data"
            className="btn-secondary text-xs px-2.5 py-1.5 flex items-center gap-1.5 border-slate-700/80"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isSeeding ? 'animate-spin text-cyan-400' : ''}`} />
            <span className="hidden sm:inline">{isSeeding ? 'Seeding...' : 'Reset Demo'}</span>
          </button>

          {/* Persona Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowPersonaMenu(!showPersonaMenu)}
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-slate-600 transition-all text-xs"
            >
              <div className="w-6 h-6 rounded-lg bg-cyan-600/20 border border-cyan-500/40 text-cyan-300 font-bold flex items-center justify-center text-[10px]">
                {currentUser?.avatar || 'NX'}
              </div>
              <div className="text-left hidden sm:block">
                <div className="font-semibold text-slate-200 truncate max-w-[110px]">
                  {currentUser?.name || 'Demo User'}
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-400 capitalize">
                  {getRoleIcon(role)}
                  <span>{role}</span>
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Dropdown Menu */}
            {showPersonaMenu && (
              <div className="absolute right-0 mt-2 w-64 glass-panel rounded-xl p-2 border border-slate-700 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-2 py-1.5 text-[11px] font-mono uppercase text-slate-400 border-b border-slate-800">
                  Switch Demo Persona (1-Click)
                </div>
                <div className="py-1 space-y-1">
                  {personas.map((persona) => {
                    const isSelected = currentUser?.id === persona.id;
                    return (
                      <button
                        key={persona.id}
                        onClick={() => {
                          switchPersona(persona.id);
                          setShowPersonaMenu(false);
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-lg text-xs transition-colors text-left ${
                          isSelected
                            ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-medium'
                            : 'hover:bg-slate-800/80 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-slate-800 text-slate-200 flex items-center justify-center text-[10px] font-bold">
                            {persona.avatar}
                          </div>
                          <div>
                            <div className="font-medium">{persona.name}</div>
                            <div className="text-[10px] text-slate-400 capitalize">
                              {persona.role} • {persona.specialty || persona.department || persona.wardAssigned || persona.title}
                            </div>
                          </div>
                        </div>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* AI Settings Modal */}
      <AISettingsModal isOpen={showAiModal} onClose={() => setShowAiModal(false)} />
    </>
  );
}
