import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  Stethoscope,
  Heart,
  Pill,
  Shield,
  ArrowRight,
  Lock,
  Mail,
  User
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, signup, switchPersona, personas } = useAuth();

  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('doctor');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handlePersonaClick = (personaId, targetRole) => {
    switchPersona(personaId);
    if (targetRole === 'doctor') navigate('/doctor/dashboard');
    else if (targetRole === 'nurse') navigate('/nurse/dashboard');
    else if (targetRole === 'pharmacy') navigate('/pharmacy/dashboard');
    else navigate('/admin/dashboard');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isSignup) {
        await signup(email, password, role, name);
        if (role === 'doctor') navigate('/doctor/dashboard');
        else if (role === 'nurse') navigate('/nurse/dashboard');
        else if (role === 'pharmacy') navigate('/pharmacy/dashboard');
        else navigate('/admin/dashboard');
      } else {
        await login(email, password);
        navigate('/admin/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-8 bg-[#f8fafc] text-slate-900 relative">
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center z-10">
        
        {/* Left: Brand & Hackathon 1-Click Fast Login Personas (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-700 flex items-center justify-center text-white shadow-md shadow-emerald-900/20">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
                NEXUS
              </h1>
              <p className="text-xs text-emerald-800 font-bold uppercase tracking-wider">
                Clinical Resource Coordination & Concurrency System
              </p>
            </div>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed font-medium">
            Real-time hospital operations with <strong className="text-slate-900">Optimistic Concurrency Control (OCC)</strong>, deterministic preemption tiebreakers, 3-step distributed <strong className="text-slate-900">Prescription Sagas</strong> with automated rollback compensation, and <strong className="text-slate-900">Gemini AI medical intelligence</strong>.
          </p>

          {/* 1-Click Quick Personas (Hackathon Fast-Access) */}
          <div className="clean-card p-5 space-y-3.5 bg-white">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-500 uppercase tracking-wider font-bold text-[11px]">1-Click Demo Personas</span>
              <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">INSTANT ACCESS</span>
            </div>

            <div className="space-y-2.5">
              {personas.map((persona) => {
                const getIcon = () => {
                  if (persona.role === 'doctor') return <Stethoscope className="w-4 h-4 text-emerald-700" />;
                  if (persona.role === 'nurse') return <Heart className="w-4 h-4 text-blue-700" />;
                  if (persona.role === 'pharmacy') return <Pill className="w-4 h-4 text-purple-700" />;
                  return <Shield className="w-4 h-4 text-amber-700" />;
                };

                return (
                  <button
                    key={persona.id}
                    onClick={() => handlePersonaClick(persona.id, persona.role)}
                    className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 transition-all text-left text-xs group bg-slate-50/60"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-slate-900 text-white font-bold flex items-center justify-center text-xs">
                        {persona.avatar}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 group-hover:text-emerald-900 transition-colors">
                          {persona.name}
                        </div>
                        <div className="text-[11px] text-slate-500 capitalize font-medium">
                          {persona.role} • {persona.specialty || persona.department || persona.wardAssigned || persona.title}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400 group-hover:text-emerald-700">
                      {getIcon()}
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Standard Firebase Auth Login / Signup Card (5 cols) */}
        <div className="lg:col-span-5 clean-card p-6 sm:p-8 bg-white">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-extrabold text-slate-900">
              {isSignup ? 'Create Account' : 'Staff Sign In'}
            </h2>
            <button
              onClick={() => setIsSignup(!isSignup)}
              className="text-xs text-emerald-700 hover:text-emerald-800 font-bold"
            >
              {isSignup ? 'Already registered? Sign in' : 'New staff? Sign up'}
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {isSignup && (
              <>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Full Name & Title</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. Dr. Priya Nair"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="clean-input w-full pl-9"
                      required
                    />
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Assigned Clinical Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="clean-input w-full font-medium capitalize"
                  >
                    <option value="doctor">Doctor — Resources & Prescriptions</option>
                    <option value="nurse">Nurse — Bedside Tasks & Vitals</option>
                    <option value="pharmacy">Pharmacy — Dispense & Stock</option>
                    <option value="admin">Admin — Operations & Governance</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Hospital Email</label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="name@nexus.hospital"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="clean-input w-full pl-9"
                  required
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Security Password</label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="clean-input w-full pl-9"
                  required
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-xs font-bold mt-2 shadow-sm"
            >
              {loading ? 'Authenticating...' : isSignup ? 'Complete Registration' : 'Sign In to Workspace'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
