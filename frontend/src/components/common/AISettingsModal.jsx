import React, { useState } from 'react';
import { Sparkles, Key, Check, Shield, X } from 'lucide-react';
import { getCustomApiKey, setCustomApiKey } from '../../services/aiService.js';

export default function AISettingsModal({ isOpen, onClose }) {
  const [apiKey, setApiKey] = useState(() => getCustomApiKey());
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    setCustomApiKey(apiKey);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 800);
  };

  const handleClear = () => {
    setApiKey('');
    setCustomApiKey('');
  };

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
            <h3 className="text-base font-bold text-slate-900">AI Intelligence Engine</h3>
            <p className="text-xs text-slate-500 font-medium">Google Gemini & Local Heuristic Fallback</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 space-y-1.5">
            <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
              <Shield className="w-3.5 h-3.5" /> Explainable Medical AI Policy
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed font-medium">
              AI provides advisory assistance (Activity summaries, Request parsing, Urgency classification, Bed availability estimates). Doctors and hospital staff always make the final decision.
            </p>
          </div>

          <form onSubmit={handleSave} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Gemini API Key (Optional)
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIzaSy... (leave blank for local heuristic engine)"
                  className="clean-input w-full pl-9 font-mono text-xs"
                />
                <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                If no API key is provided, the built-in clinical heuristic engine will seamlessly generate responses.
              </p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleClear}
                className="text-xs font-semibold text-rose-600 hover:underline"
              >
                Clear Key
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-secondary text-xs px-3.5 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs px-4 py-2"
                >
                  {saved ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> Saved!
                    </>
                  ) : (
                    'Save Settings'
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
