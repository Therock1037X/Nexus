import React, { useState } from 'react';
import { Sparkles, Key, Check, Shield, X, AlertCircle } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glass-panel max-w-md w-full rounded-2xl p-6 relative border border-slate-700/80 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-100">AI Intelligence Engine</h3>
            <p className="text-xs text-slate-400">Google Gemini & Local Heuristic Fallback</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 space-y-1.5">
            <div className="flex items-center gap-1.5 text-cyan-400 font-medium">
              <Shield className="w-3.5 h-3.5" /> Explainable Medical AI Policy
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              AI provides advisory assistance (Audit narratives, Natural Language request parsing, Urgency classification, Availability forecasts). The core deterministic conflict engine always enforces final resource truth.
            </p>
          </div>

          <form onSubmit={handleSave} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Gemini API Key (Optional)
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIzaSy... (leave blank for local mock engine)"
                  className="glass-input w-full pl-9 text-xs font-mono"
                />
                <Key className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                If no API key is provided, the built-in clinical heuristic engine will seamlessly generate responses.
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleClear}
                className="text-xs text-rose-400 hover:underline"
              >
                Clear Key
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-secondary text-xs px-3 py-1.5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs px-4 py-1.5"
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
