import React, { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, AlertTriangle, Clock, RefreshCw, Loader2, Bed, Activity } from 'lucide-react';
import { useHospital } from '../../context/HospitalContext.jsx';
import { getAvailabilityForecast } from '../../services/aiService.js';

export default function PredictedAvailabilityWidget() {
  const { resources, events } = useHospital();
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchForecast = async () => {
    setLoading(true);
    try {
      const res = await getAvailabilityForecast(resources, events);
      setForecast(res);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForecast();
  }, [resources.length, events.length]);

  return (
    <div className="glass-card rounded-2xl p-4 border border-cyan-500/30 bg-gradient-to-r from-cyan-950/20 via-slate-900/50 to-blue-950/20">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-300 font-mono flex items-center gap-1.5">
              Predictive Resource Availability (Feature 4)
            </h4>
            <p className="text-[11px] text-slate-400">1-2 Hour Advisory Turnover Forecast</p>
          </div>
        </div>

        <button
          onClick={fetchForecast}
          disabled={loading}
          className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors"
          title="Refresh AI Forecast"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
        </button>
      </div>

      {forecast ? (
        <div className="space-y-3 text-xs">
          {/* Summary Banner */}
          <p className="text-slate-300 text-xs leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            {forecast.summary}
          </p>

          {/* Metric Projections */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
              <div className="text-[10px] font-mono text-slate-400 uppercase">Est. ICU Freeing</div>
              <div className="text-base font-bold text-cyan-300 mt-0.5">
                +{forecast.projectedFreedIcuBedsInNext2Hours || 1} Bed(s)
              </div>
              <div className="text-[10px] text-slate-500 font-mono">Next 60-90 min</div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
              <div className="text-[10px] font-mono text-slate-400 uppercase">OT Turnover</div>
              <div className="text-base font-bold text-purple-300 mt-0.5">
                ~{forecast.projectedOtTurnoverMinutes || 30} mins
              </div>
              <div className="text-[10px] text-slate-500 font-mono">OT-2 Cardiac wrap</div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
              <div className="text-[10px] font-mono text-slate-400 uppercase">Surge Bottleneck</div>
              <div
                className={`text-base font-bold mt-0.5 ${
                  forecast.bottleneckRiskLevel === 'HIGH' || forecast.bottleneckRiskLevel === 'CRITICAL'
                    ? 'text-rose-400'
                    : 'text-amber-400'
                }`}
              >
                {forecast.bottleneckRiskLevel || 'MODERATE'}
              </div>
              <div className="text-[10px] text-slate-500 font-mono">Capacity Risk Tier</div>
            </div>
          </div>

          {/* Actionable Recommendation */}
          {forecast.recommendedAction && (
            <div className="p-2.5 rounded-xl bg-slate-950/90 border border-cyan-900/40 text-[11px] text-slate-300 flex items-start gap-2">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-cyan-300">Operational Advisory: </span>
                <span className="text-slate-300">{forecast.recommendedAction}</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-4 text-center text-slate-500 text-xs">
          <Loader2 className="w-4 h-4 animate-spin mx-auto mb-1 text-cyan-400" />
          Calculating predictive capacity model...
        </div>
      )}
    </div>
  );
}
