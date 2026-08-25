import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, Heart, Pill, Shield, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function RoleSelectPage() {
  const navigate = useNavigate();
  const { setRole } = useAuth();

  const handleSelect = (r) => {
    setRole(r);
    if (r === 'doctor') navigate('/doctor/dashboard');
    else if (r === 'nurse') navigate('/nurse/dashboard');
    else if (r === 'pharmacy') navigate('/pharmacy/dashboard');
    else navigate('/admin/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 text-slate-100">
      <div className="glass-panel max-w-xl w-full rounded-3xl p-8 border border-slate-800 text-center space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Select Clinical Role</h2>
          <p className="text-xs text-slate-400 mt-1">
            Choose your hospital workspace station to load role-specific views and permission rules.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
          {[
            { role: 'doctor', title: 'Doctor Station', icon: Stethoscope, desc: 'Request beds/OTs, prescribe medicines, and raise priority escalations.', color: 'text-cyan-400 border-cyan-500/30' },
            { role: 'nurse', title: 'Nurse Station', icon: Heart, desc: 'Manage bedside task queue, log vitals, and flag cleaning/maintenance.', color: 'text-emerald-400 border-emerald-500/30' },
            { role: 'pharmacy', title: 'Central Pharmacy', icon: Pill, desc: 'View incoming doctor prescriptions, verify inventory, and dispense.', color: 'text-purple-400 border-purple-500/30' },
            { role: 'admin', title: 'Admin Command Center', icon: Shield, desc: 'Live resource grid, conflict resolution feeds, saga trackers, and audit trail.', color: 'text-amber-400 border-amber-500/30' }
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.role}
                onClick={() => handleSelect(item.role)}
                className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-850 transition-all text-xs space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-slate-800 text-slate-200">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-sm text-slate-100 group-hover:text-cyan-300">{item.title}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400" />
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">{item.desc}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
