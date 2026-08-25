import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  Stethoscope,
  Heart,
  Pill,
  Shield,
  ArrowRight,
  Sparkles,
  Lock,
  Mail,
  User,
  CheckCircle2
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 text-slate-100 relative overflow-hidden">
      {/* Background Neon Gradients */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center z-10">
        {/* Left: Brand & Hackathon 1-Click Fast Login Personas */}
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-xl shadow-cyan-950/50">
              <Activity className="w-7 h-7 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                NEXUS
              </h1>
              <p className="text-xs text-cyan-400 font-mono">Real-Time Clinical Resource Transaction System</p>
            </div>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed">
            Live hospital coordination & transaction engine with <strong>Optimistic Concurrency Control</strong>, deterministic preemption tiebreakers, 3-step clinical <strong>Sagas</strong> with automated rollback compensation, and <strong>AI-assisted medical intelligence</strong>.
          </p>

          {/* 1-Click Quick Personas (Hackathon Fast-Access) */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400 uppercase font-semibold">1-Click Fast Demo Login</span>
              <span className="text-cyan-400">INSTANT ACCESS</span>
            </div>

            <div className="space-y-2">
              {personas.map((persona) => {
                const getIcon = () => {
                  if (persona.role === 'doctor') return <Stethoscope className="w-4 h-4 text-cyan-400" />;
                  if (persona.role === 'nurse') return <Heart className="w-4 h-4 text-emerald-400" />;
                  if (persona.role === 'pharmacy') return <Pill className="w-4 h-4 text-purple-400" />;
                  return <Shield className="w-4 h-4 text-amber-400" />;
                };

                return (
                  <button
                    key={persona.id}
                    onClick={() => handlePersonaClick(persona.id, persona.role)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/90 hover:border-cyan-500/50 hover:bg-slate-850 transition-all text-left text-xs group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-slate-800 text-slate-200 font-bold flex items-center justify-center text-[10px]">
                        {persona.avatar}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors">
                          {persona.name}
                        </div>
                        <div className="text-[11px] text-slate-400 capitalize">
                          {persona.role} • {persona.specialty || persona.department || persona.wardAssigned || persona.title}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-slate-500 group-hover:text-cyan-400">
                      {getIcon()}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Standard Firebase Auth Login / Signup Card */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-100">
              {isSignup ? 'Create Account' : 'Sign In'}
            </h2>
            <button
              onClick={() => setIsSignup(!isSignup)}
              className="text-xs text-cyan-400 hover:underline font-medium"
            >
              {isSignup ? 'Already have account? Sign in' : 'New staff? Sign up'}
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {isSignup && (
              <>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Full Name & Title</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. Dr. Priya Nair"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="glass-input w-full pl-9"
                      required
                    />
                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Assigned Clinical Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="glass-input w-full font-mono font-medium capitalize"
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
              <label className="block text-slate-300 font-medium mb-1">Hospital Email</label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="name@nexus.hospital"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="glass-input w-full pl-9"
                  required
                />
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Security Password</label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="glass-input w-full pl-9"
                  required
                />
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 text-xs font-bold mt-2"
            >
              {loading ? 'Authenticating...' : isSignup ? 'Complete Registration' : 'Sign In to Workspace'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
