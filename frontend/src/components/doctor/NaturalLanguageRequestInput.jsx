import React, { useState } from 'react';
import { Sparkles, Loader2, Wand2 } from 'lucide-react';
import { parseNaturalLanguageRequest } from '../../services/aiService.js';

export default function NaturalLanguageRequestInput({ onParsed }) {
  const [inputPrompt, setInputPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const samplePrompts = [
    'Need an ICU bed urgently for 62yo female with acute ARDS and ventilator',
    'Reserve General Bed for post-op patient Ramesh Gupta',
    'Emergency cardiac OT needed for acute STEMI with Dr. Arjun Mehta'
  ];

  const handleParse = async (textToParse) => {
    const text = textToParse || inputPrompt;
    if (!text.trim()) return;

    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await parseNaturalLanguageRequest(text);
      if (res?.success && res?.data) {
        onParsed(res.data);
      } else if (res?.resourceType) {
        onParsed(res);
      } else {
        setErrorMessage("Couldn't understand that — please fill the form manually");
      }
    } catch {
      setErrorMessage("Couldn't understand that — please fill the form manually");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="clean-card p-5 border-emerald-200 bg-white">
      <div className="flex items-center gap-2.5 mb-1.5">
        <div className="p-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
          <Wand2 className="w-4 h-4" />
        </div>
        <h4 className="text-xs font-bold text-slate-900">
          Quick Request (type in plain English)
        </h4>
      </div>

      <p className="text-xs text-slate-600 mb-3.5 leading-relaxed font-medium">
        Type what you need in normal everyday words. The system will understand and pre-fill your request form.
      </p>

      <div className="flex flex-col sm:flex-row gap-2.5">
        <input
          type="text"
          value={inputPrompt}
          onChange={(e) => setInputPrompt(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleParse()}
          placeholder="e.g. 'Need an ICU bed and ventilator urgently for a cardiac arrest patient'..."
          className="clean-input flex-1 text-xs"
        />
        <button
          onClick={() => handleParse()}
          disabled={loading || !inputPrompt.trim()}
          className="btn-primary text-xs px-5 py-2.5 flex items-center justify-center gap-2 flex-shrink-0 font-bold"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Sparkles className="w-4 h-4" /> Fill Form Automatically
            </>
          )}
        </button>
      </div>

      {errorMessage && (
        <div className="mt-2.5 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-semibold">
          ⚠️ {errorMessage}
        </div>
      )}

      {/* Quick Sample Prompts */}
      <div className="flex items-center gap-2 mt-3 flex-wrap">
        <span className="text-[10px] text-slate-500 font-bold uppercase">Examples:</span>
        {samplePrompts.map((p, i) => (
          <button
            key={i}
            onClick={() => {
              setInputPrompt(p);
              handleParse(p);
            }}
            className="text-[11px] px-3 py-1 rounded-full bg-slate-50 hover:bg-emerald-50 hover:text-emerald-800 text-slate-600 border border-slate-200 transition-colors font-medium truncate max-w-[320px]"
          >
            "{p}"
          </button>
        ))}
      </div>
    </div>
  );
}
