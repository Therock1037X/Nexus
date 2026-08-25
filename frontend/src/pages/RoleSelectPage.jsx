import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, Heart, Shield, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function RoleSelectPage() {
  const navigate = useNavigate();
  const { setRole } = useAuth();

  const handleSelect = (r) => {
    setRole(r);
    if (r === 'doctor') navigate('/doctor/dashboard');
    else if (r === 'nurse') navigate('/nurse/dashboard');
    else navigate('/admin/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#f8fafc] text-slate-900">
      <div className="clean-card max-w-xl w-full p-8 text-center space-y-6 bg-white">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Select Clinical Station</h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Choose your hospital workspace station to load role-specific features and concurrency controls.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-left">
          {[
            { role: 'doctor', title: 'Doctor Station', icon: Stethoscope, desc: 'Patients, request beds/OTs, prescribe medicines, and emergency escalations.', color: 'bg-emerald-50 text-emerald-700' },
            { role: 'nurse', title: 'Nurse Station', icon: Heart, desc: 'Bedside administration queue, vitals recording, and room sanitization.', color: 'bg-blue-50 text-blue-700' },
            { role: 'admin', title: 'Admin Command', icon: Shield, desc: 'Live resource grid, OCC conflict feed, saga tracker, audit log, and pharmacy queue.', color: 'bg-amber-50 text-amber-700' }
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.role}
                onClick={() => handleSelect(item.role)}
                className="p-4 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/30 transition-all text-xs space-y-2.5 group bg-slate-50/50 flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className={`p-2 rounded-xl ${item.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-700 transition-transform group-hover:translate-x-0.5" />
                  </div>
                  <span className="font-bold text-sm text-slate-900 group-hover:text-emerald-900 block">{item.title}</span>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-medium">{item.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
