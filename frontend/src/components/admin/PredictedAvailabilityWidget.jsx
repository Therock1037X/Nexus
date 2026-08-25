import React, { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, RefreshCw, Loader2 } from 'lucide-react';
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
    <div className="clean-card p-6 border-emerald-100 bg-white">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Expected Bed Availability
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                Estimate only
              </span>
            </h4>
            <p className="text-xs text-slate-500 font-medium">Turnover and bed release projections for the next 1-2 hours</p>
          </div>
        </div>

        <button
          onClick={fetchForecast}
          disabled={loading}
          className="p-2 rounded-xl text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors border border-slate-200"
          title="Refresh Forecast"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
        </button>
      </div>

      {forecast ? (
        <div className="space-y-4 text-xs">
          {/* Summary Banner */}
          <p className="text-slate-700 text-xs leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200/80 font-medium">
            {forecast.summary}
          </p>

          {/* Metric Projections */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Est. ICU Freeing</div>
              <div className="text-xl font-extrabold text-emerald-700 mt-1">
                +{forecast.projectedFreedIcuBedsInNext2Hours || 1} Bed(s)
              </div>
              <div className="text-[10px] text-slate-500 font-medium mt-0.5">Next 60-90 min projection</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">OT Turnover</div>
              <div className="text-xl font-extrabold text-blue-700 mt-1">
                ~{forecast.projectedOtTurnoverMinutes || 30} mins
              </div>
              <div className="text-[10px] text-slate-500 font-medium mt-0.5">Cardiac OT wrap & clean</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Capacity Status</div>
              <div
                className={`text-xl font-extrabold mt-1 ${
                  forecast.bottleneckRiskLevel === 'HIGH' || forecast.bottleneckRiskLevel === 'CRITICAL'
                    ? 'text-rose-700'
                    : 'text-emerald-700'
                }`}
              >
                {forecast.bottleneckRiskLevel || 'NORMAL'}
              </div>
              <div className="text-[10px] text-slate-500 font-medium mt-0.5">Hospital Load</div>
            </div>
          </div>

          {/* Actionable Recommendation */}
          {forecast.recommendedAction && (
            <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-slate-800 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-emerald-900">Recommendation: </span>
                <span className="text-slate-700 font-medium">{forecast.recommendedAction}</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-6 text-center text-slate-500 text-xs">
          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-600" />
          Calculating expected capacity...
        </div>
      )}
    </div>
  );
}
