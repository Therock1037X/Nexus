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
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#f8fafc] text-slate-900">
      <div className="clean-card max-w-xl w-full p-8 text-center space-y-6 bg-white">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Select Clinical Station</h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Choose your hospital workspace station to load role-specific tools and concurrency controls.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-left">
          {[
            { role: 'doctor', title: 'Doctor Station', icon: Stethoscope, desc: 'Request beds/OTs, prescribe medicines, and raise emergency escalations.', color: 'bg-emerald-50 text-emerald-700' },
            { role: 'nurse', title: 'Nurse Station', icon: Heart, desc: 'Manage bedside task queue, log vitals, and flag cleaning/turnover.', color: 'bg-blue-50 text-blue-700' },
            { role: 'pharmacy', title: 'Central Pharmacy', icon: Pill, desc: 'Fulfill incoming doctor prescriptions, verify inventory, and dispense.', color: 'bg-purple-50 text-purple-700' },
            { role: 'admin', title: 'Admin Command Center', icon: Shield, desc: 'Live resource grid, OCC conflict feeds, saga tracker, and audit trail.', color: 'bg-amber-50 text-amber-700' }
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.role}
                onClick={() => handleSelect(item.role)}
                className="p-4 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/30 transition-all text-xs space-y-2.5 group bg-slate-50/50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-xl ${item.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-sm text-slate-900 group-hover:text-emerald-900">{item.title}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-700 transition-transform group-hover:translate-x-0.5" />
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed font-medium">{item.desc}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
