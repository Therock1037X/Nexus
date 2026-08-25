import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
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
  ChevronRight,
  PlusCircle,
  FileSpreadsheet
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useHospital } from '../../context/HospitalContext.jsx';

export default function Sidebar({ isOpen, onClose }) {
  const { role, currentUser } = useAuth();
  const { stats } = useHospital();
  const location = useLocation();

  const getDoctorLinks = () => [
    { to: '/doctor/dashboard', label: 'Patient Dashboard', icon: LayoutDashboard, badge: stats.occupiedBeds },
    { to: '/doctor/request-resource', label: 'Request Resource (AI)', icon: Bed, badge: 'NL AI' },
    { to: '/doctor/prescribe', label: 'Prescribe (Saga Start)', icon: Pill },
    { to: '/doctor/escalate', label: 'Emergency Escalate', icon: Sparkles, color: 'text-amber-400' },
    { to: '/doctor/activity-log', label: 'My Clinical Log', icon: History }
  ];

  const getNurseLinks = () => [
    { to: '/nurse/dashboard', label: 'Nurse Task Queue', icon: ClipboardList, badge: stats.inProgressSagasCount },
    { to: '/nurse/log-event', label: 'Log Clinical Event', icon: Heart },
    { to: '/nurse/flag-issue', label: 'Flag Maintenance / Clean', icon: AlertTriangle }
  ];

  const getPharmacyLinks = () => [
    { to: '/pharmacy/dashboard', label: 'Prescription Queue', icon: PackageCheck, badge: stats.inProgressSagasCount },
    { to: '/pharmacy/dispense', label: 'Dispense Action', icon: Pill }
  ];

  const getAdminLinks = () => [
    { to: '/admin/dashboard', label: 'Live Resource Grid', icon: Building2, badge: `${stats.totalBeds} beds` },
    { to: '/admin/conflict-feed', label: 'Conflict Feed', icon: GitMerge, badge: stats.conflictsCount, badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
    { to: '/admin/saga-tracker', label: 'Saga Tracker', icon: GitPullRequest, badge: stats.inProgressSagasCount },
    { to: '/admin/audit-trail', label: 'Audit Trail (AI)', icon: History, badge: 'AI' },
    { to: '/admin/setup', label: 'Resource Setup', icon: PlusCircle },
    { to: '/admin/failure-demo', label: 'Failure Demo Panel', icon: Bug, color: 'text-rose-400' }
  ];

  let currentNav = [];
  if (role === 'doctor') currentNav = getDoctorLinks();
  else if (role === 'nurse') currentNav = getNurseLinks();
  else if (role === 'pharmacy') currentNav = getPharmacyLinks();
  else currentNav = getAdminLinks();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden animate-in fade-in"
        />
      )}

      <aside
        className={`fixed lg:sticky top-16 z-40 h-[calc(100vh-4rem)] w-64 glass-panel border-r border-slate-800/80 flex flex-col justify-between p-3.5 transition-transform duration-200 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="space-y-4 overflow-y-auto">
          {/* Current Role Banner */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="text-[11px] font-mono uppercase text-slate-400 tracking-wider">Active Workspace</div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-sm font-bold text-slate-100 capitalize flex items-center gap-1.5">
                {role === 'doctor' && <Stethoscope className="w-4 h-4 text-cyan-400" />}
                {role === 'nurse' && <Heart className="w-4 h-4 text-emerald-400" />}
                {role === 'pharmacy' && <Pill className="w-4 h-4 text-purple-400" />}
                {role === 'admin' && <Shield className="w-4 h-4 text-amber-400" />}
                {role} Station
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                L-1 Mode
              </span>
            </div>
          </div>

          {/* Primary Nav Links */}
          <div className="space-y-1">
            <div className="px-2 pb-1 text-[11px] font-mono uppercase text-slate-400">Navigation</div>
            {currentNav.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/10 text-cyan-300 border border-cyan-500/30 shadow-md shadow-cyan-950/20'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`
                  }
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${link.color || 'text-slate-400'}`} />
                    <span>{link.label}</span>
                  </div>
                  {link.badge !== undefined && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                        link.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      {link.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>

          {/* Quick Cross-Role Inspector (for Hackathon Evaluation) */}
          <div className="pt-3 border-t border-slate-800/80 space-y-1">
            <div className="px-2 pb-1 text-[10px] font-mono uppercase text-slate-400 flex items-center justify-between">
              <span>All Role Portals</span>
              <span className="text-[9px] text-cyan-400">DEMO</span>
            </div>
            <div className="grid grid-cols-2 gap-1 text-[11px]">
              <NavLink
                to="/doctor/dashboard"
                className="p-1.5 rounded-lg bg-slate-950/40 border border-slate-800 hover:border-cyan-500/40 text-slate-300 text-center"
              >
                Doctor View
              </NavLink>
              <NavLink
                to="/nurse/dashboard"
                className="p-1.5 rounded-lg bg-slate-950/40 border border-slate-800 hover:border-emerald-500/40 text-slate-300 text-center"
              >
                Nurse View
              </NavLink>
              <NavLink
                to="/pharmacy/dashboard"
                className="p-1.5 rounded-lg bg-slate-950/40 border border-slate-800 hover:border-purple-500/40 text-slate-300 text-center"
              >
                Pharmacy View
              </NavLink>
              <NavLink
                to="/admin/dashboard"
                className="p-1.5 rounded-lg bg-slate-950/40 border border-slate-800 hover:border-amber-500/40 text-slate-300 text-center"
              >
                Admin Grid
              </NavLink>
            </div>
          </div>
        </div>

        {/* Bottom Hospital Summary */}
        <div className="pt-3 border-t border-slate-800/80 text-[11px] font-mono text-slate-400 space-y-1">
          <div className="flex items-center justify-between">
            <span>TRANSACTIONS:</span>
            <span className="text-emerald-400 font-bold">ATOMIC (RTS)</span>
          </div>
          <div className="flex items-center justify-between">
            <span>CONCURRENCY:</span>
            <span className="text-cyan-400">OPTIMISTIC (OCC)</span>
          </div>
        </div>
      </aside>
    </>
  );
}
