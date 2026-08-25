import React, { useState } from 'react';
import { Sparkles, Loader2, Wand2 } from 'lucide-react';
import { parseNaturalLanguageRequest } from '../../services/aiService.js';

export default function NaturalLanguageRequestInput({ onParsed }) {
  const [inputPrompt, setInputPrompt] = useState('');
  const [loading, setLoading] = useState(false);

  const samplePrompts = [
    'Need an ICU bed urgently for 62yo female with acute ARDS and ventilator',
    'Reserve General Bed for post-op cholecystectomy patient Ramesh Gupta',
    'Emergency cardiac OT needed stat for acute STEMI with Dr. Arjun Mehta'
  ];

  const handleParse = async (textToParse) => {
    const text = textToParse || inputPrompt;
    if (!text.trim()) return;

    setLoading(true);
    try {
      const parsed = await parseNaturalLanguageRequest(text);
      if (parsed) {
        onParsed(parsed);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="clean-card p-5 border-emerald-200 bg-white">
      <div className="flex items-center gap-2.5 mb-2">
        <div className="p-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
          <Wand2 className="w-4 h-4" />
        </div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-mono">
          AI Natural Language Resource Request (Feature 3)
        </h4>
      </div>

      <p className="text-xs text-slate-600 mb-3.5 leading-relaxed">
        Enter natural speech or notes. AI will extract resource type, sub-type, priority, and clinical reason to pre-fill the form for 1-click confirmation.
      </p>

      <div className="flex flex-col sm:flex-row gap-2.5">
        <input
          type="text"
          value={inputPrompt}
          onChange={(e) => setInputPrompt(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleParse()}
          placeholder="e.g. 'Need ICU bed and ventilator urgently for acute cardiac arrest patient'..."
          className="clean-input flex-1 text-xs"
        />
        <button
          onClick={() => handleParse()}
          disabled={loading || !inputPrompt.trim()}
          className="btn-primary text-xs px-5 py-2.5 flex items-center justify-center gap-2 flex-shrink-0"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Sparkles className="w-4 h-4" /> Parse & Auto-Fill
            </>
          )}
        </button>
      </div>

      {/* Quick Sample Prompts */}
      <div className="flex items-center gap-2 mt-3 flex-wrap">
        <span className="text-[10px] font-mono text-slate-500 font-bold uppercase">Try quick prompt:</span>
        {samplePrompts.map((p, i) => (
          <button
            key={i}
            onClick={() => {
              setInputPrompt(p);
              handleParse(p);
            }}
            className="text-[11px] px-2.5 py-1 rounded-full bg-slate-50 hover:bg-emerald-50 hover:text-emerald-800 text-slate-600 border border-slate-200 transition-colors font-medium truncate max-w-[280px]"
          >
            "{p}"
          </button>
        ))}
      </div>
    </div>
  );
}
