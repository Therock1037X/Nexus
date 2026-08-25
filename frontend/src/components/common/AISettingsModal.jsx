import React from 'react';
import { Sparkles, Shield, CheckCircle2, X, Lock } from 'lucide-react';

export default function AISettingsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white max-w-md w-full rounded-2xl p-6 relative border border-slate-200 shadow-xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">AI Intelligence Architecture</h3>
            <p className="text-xs text-slate-500 font-medium">Google Gemini Flash via Cloud Functions</p>
          </div>
        </div>

        <div className="space-y-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-700 space-y-1.5">
            <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
              <Shield className="w-3.5 h-3.5" /> Explainable Medical AI Policy
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed font-medium">
              AI provides advisory assistance (Activity summaries, Request parsing, Urgency classification, Bed availability estimates). Doctors and hospital staff always make the final decision.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200 text-slate-700 space-y-2">
            <div className="flex items-center gap-1.5 text-emerald-900 font-bold">
              <Lock className="w-3.5 h-3.5 text-emerald-700" /> Enterprise Cloud Secret Security
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed font-medium">
              Gemini API credentials are encrypted in Google Cloud Secret Manager (<code className="font-mono text-emerald-800 font-bold">GEMINI_API_KEY</code>) and called strictly server-side through Firebase Cloud Functions.
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-800 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> No API keys exposed to browser
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-100">
            <button
              onClick={onClose}
              className="btn-primary text-xs px-5 py-2"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
