import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Bed,
  Pill,
  Sparkles,
  ClipboardList,
  AlertTriangle,
  PackageCheck,
  Building2,
  GitMerge,
  GitPullRequest,
  History,
  Bug,
  Shield,
  Stethoscope,
  Heart,
  PlusCircle,
  Activity,
  LogOut,
  UserCheck,
  ChevronDown,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useHospital } from '../../context/HospitalContext.jsx';

export default function Sidebar({ isOpen, onClose }) {
  const { role, currentUser, switchPersona, personas, logout } = useAuth();
  const { stats } = useHospital();
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  const navSections = [
    {
      title: 'CLINICAL STATIONS',
      links: [
        { to: '/doctor/dashboard', label: 'Doctor Dashboard', icon: LayoutDashboard, badge: stats.occupiedBeds },
        { to: '/doctor/request-resource', label: 'Request Resource (AI)', icon: Bed, badge: 'AI NLP' },
        { to: '/doctor/prescribe', label: 'Prescribe (Saga Flow)', icon: Pill },
        { to: '/doctor/escalate', label: 'Emergency Escalate', icon: Sparkles, color: 'text-amber-400' },
        { to: '/doctor/activity-log', label: 'Doctor Activity Log', icon: History }
      ]
    },
    {
      title: 'NURSING & PHARMACY',
      links: [
        { to: '/nurse/dashboard', label: 'Nurse Task Queue', icon: ClipboardList, badge: stats.inProgressSagasCount },
        { to: '/nurse/log-event', label: 'Log Clinical Event', icon: Heart },
        { to: '/nurse/flag-issue', label: 'Flag Maintenance / Clean', icon: AlertTriangle },
        { to: '/pharmacy/dashboard', label: 'Pharmacy Queue', icon: PackageCheck, badge: stats.inProgressSagasCount },
        { to: '/pharmacy/dispense', label: 'Dispense Action', icon: Pill }
      ]
    },
    {
      title: 'OPERATIONS & CONCURRENCY',
      links: [
        { to: '/admin/dashboard', label: 'Live Resource Grid', icon: Building2, badge: `${stats.totalBeds} Units` },
        { to: '/admin/conflict-feed', label: 'Conflict Feed', icon: GitMerge, badge: stats.conflictsCount, badgeColor: 'bg-rose-500/20 text-rose-300' },
        { to: '/admin/saga-tracker', label: 'Saga Tracker', icon: GitPullRequest, badge: stats.inProgressSagasCount },
        { to: '/admin/audit-trail', label: 'Audit Trail (AI)', icon: History, badge: 'AI' },
        { to: '/admin/setup', label: 'Resource Setup', icon: PlusCircle },
        { to: '/admin/failure-demo', label: 'Failure Demo Panel', icon: Bug, color: 'text-rose-400' }
      ]
    }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-64 bg-[#0c2017] text-white flex flex-col justify-between transition-transform duration-200 border-r border-[#143325] select-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Header & Brand */}
        <div className="flex flex-col h-full overflow-hidden">
          <div className="p-5 border-b border-[#173829] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-700/80 border border-emerald-500/40 flex items-center justify-center text-white shadow-sm">
                <Activity className="w-5 h-5 animate-pulse text-emerald-200" />
              </div>
              <div>
                <h1 className="text-lg font-extrabold tracking-tight text-white flex items-center gap-1.5">
                  Nexus
                </h1>
                <p className="text-[11px] text-emerald-400/90 font-medium">
                  Clinical Concurrency OS
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-emerald-300 hover:bg-[#173829]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links Grouped */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-5 scrollbar-thin scrollbar-thumb-[#173829]">
            {navSections.map((section) => (
              <div key={section.title} className="space-y-1">
                <div className="px-3 pb-1 text-[10px] font-bold tracking-wider uppercase text-emerald-400/60 font-mono">
                  {section.title}
                </div>
                {section.links.map((link) => {
                  const Icon = link.icon;
                  return (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 ${
                          isActive
                            ? 'bg-[#1b4332] text-white font-semibold shadow-sm border border-emerald-600/40'
                            : 'text-slate-300 hover:text-white hover:bg-[#143325]'
                        }`
                      }
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon className={`w-4 h-4 flex-shrink-0 ${link.color || 'text-emerald-400'}`} />
                        <span className="truncate">{link.label}</span>
                      </div>
                      {link.badge !== undefined && (
                        <span
                          className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${
                            link.badgeColor || 'bg-[#173829] text-emerald-300 border border-emerald-700/50'
                          }`}
                        >
                          {link.badge}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom User Profile Section (Matching BhumiGIS) */}
        <div className="p-3 border-t border-[#173829] bg-[#091a12] relative">
          <div className="flex items-center justify-between p-2 rounded-xl bg-[#0e271c] border border-[#1a4430]">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs flex-shrink-0 shadow-sm">
                {currentUser?.avatar?.[0] || 'V'}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-white truncate">
                  {currentUser?.name || 'Vinit Paturkar'}
                </div>
                <div className="text-[10px] text-emerald-400/80 truncate capitalize">
                  {role} • {currentUser?.specialty || currentUser?.wardAssigned || 'Operations'}
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowPersonaMenu(!showPersonaMenu)}
              title="Switch Persona"
              className="p-1.5 rounded-lg text-emerald-300 hover:bg-[#173829] hover:text-white transition-colors"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between mt-2 px-1 text-[11px]">
            <button
              onClick={() => setShowPersonaMenu(!showPersonaMenu)}
              className="text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
            >
              <UserCheck className="w-3 h-3" />
              <span>Switch User</span>
            </button>
            <button
              onClick={handleSignOut}
              className="text-slate-400 hover:text-rose-300 flex items-center gap-1 font-medium transition-colors"
            >
              <LogOut className="w-3 h-3" />
              <span>Sign Out</span>
            </button>
          </div>

          {/* Popover Persona Switcher */}
          {showPersonaMenu && (
            <div className="absolute bottom-full left-3 right-3 mb-2 bg-[#0c2017] rounded-xl p-2 border border-[#1a4430] shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-2">
              <div className="px-2 py-1 text-[10px] font-mono font-bold uppercase text-emerald-400 border-b border-[#173829] mb-1">
                Select Persona (1-Click)
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {personas.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      switchPersona(p.id);
                      setShowPersonaMenu(false);
                    }}
                    className={`w-full text-left p-1.5 rounded-lg text-xs flex items-center gap-2 transition-colors ${
                      currentUser?.id === p.id
                        ? 'bg-emerald-800/60 text-white font-semibold'
                        : 'text-slate-300 hover:bg-[#143325] hover:text-white'
                    }`}
                  >
                    <div className="w-6 h-6 rounded-md bg-emerald-700/80 text-white text-[10px] font-bold flex items-center justify-center">
                      {p.avatar}
                    </div>
                    <div className="truncate">
                      <div className="text-xs truncate">{p.name}</div>
                      <div className="text-[10px] text-emerald-400/80 capitalize">{p.role}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
