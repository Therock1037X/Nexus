import React, { useState } from 'react';
import { Sparkles, ArrowRight, Loader2, Wand2 } from 'lucide-react';
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
    <div className="glass-card rounded-2xl p-4 border border-cyan-500/30 bg-gradient-to-r from-cyan-950/20 via-slate-900/60 to-blue-950/20">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1 rounded bg-cyan-500/20 text-cyan-400">
          <Wand2 className="w-4 h-4" />
        </div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-300 font-mono">
          AI Natural Language Resource Request (Feature 3)
        </h4>
      </div>

      <p className="text-xs text-slate-400 mb-3">
        Enter natural speech or notes. AI will extract resource type, sub-type, priority, and clinical reason to pre-fill the form for 1-click confirmation.
      </p>

      <div className="flex gap-2">
        <input
          type="text"
          value={inputPrompt}
          onChange={(e) => setInputPrompt(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleParse()}
          placeholder="e.g. 'Need ICU bed and ventilator urgently for acute cardiac arrest patient'..."
          className="glass-input flex-1 text-xs"
        />
        <button
          onClick={() => handleParse()}
          disabled={loading || !inputPrompt.trim()}
          className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5 flex-shrink-0"
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" /> Parse & Fill
            </>
          )}
        </button>
      </div>

      {/* Quick Sample Prompts */}
      <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
        <span className="text-[10px] font-mono text-slate-500 uppercase">Try quick prompt:</span>
        {samplePrompts.map((p, i) => (
          <button
            key={i}
            onClick={() => {
              setInputPrompt(p);
              handleParse(p);
            }}
            className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800/80 hover:bg-cyan-950/60 hover:text-cyan-300 text-slate-400 border border-slate-700/60 transition-colors truncate max-w-[280px]"
          >
            "{p}"
          </button>
        ))}
      </div>
    </div>
  );
}
