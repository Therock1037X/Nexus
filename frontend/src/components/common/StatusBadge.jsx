import React from 'react';

export default function StatusBadge({ status, size = 'sm', pulse = false }) {
  const s = String(status || 'free').toLowerCase();

  const configs = {
    free: {
      label: 'AVAILABLE',
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-200/90 font-semibold',
      dot: 'bg-emerald-500'
    },
    reserved: {
      label: 'RESERVED',
      bg: 'bg-amber-50 text-amber-800 border-amber-200/90 font-semibold',
      dot: 'bg-amber-500'
    },
    occupied: {
      label: 'OCCUPIED',
      bg: 'bg-rose-50 text-rose-800 border-rose-200/90 font-semibold',
      dot: 'bg-rose-500'
    },
    in_use: {
      label: 'IN USE',
      bg: 'bg-indigo-50 text-indigo-800 border-indigo-200/90 font-semibold',
      dot: 'bg-indigo-500'
    },
    cleaning: {
      label: 'CLEANING',
      bg: 'bg-cyan-50 text-cyan-800 border-cyan-200/90 font-semibold',
      dot: 'bg-cyan-500'
    },
    maintenance: {
      label: 'MAINTENANCE',
      bg: 'bg-slate-100 text-slate-700 border-slate-200 font-semibold',
      dot: 'bg-slate-500'
    },
    compensated: {
      label: 'COMPENSATED',
      bg: 'bg-purple-50 text-purple-800 border-purple-200/90 font-semibold',
      dot: 'bg-purple-500'
    },
    critical: {
      label: 'CRITICAL',
      bg: 'bg-rose-100 text-rose-900 border-rose-300 font-bold shadow-sm',
      dot: 'bg-rose-600'
    },
    urgent: {
      label: 'URGENT',
      bg: 'bg-orange-50 text-orange-800 border-orange-200/90 font-semibold',
      dot: 'bg-orange-500'
    },
    high: {
      label: 'HIGH',
      bg: 'bg-amber-50 text-amber-800 border-amber-200/90 font-semibold',
      dot: 'bg-amber-500'
    },
    normal: {
      label: 'NORMAL',
      bg: 'bg-slate-100 text-slate-700 border-slate-200 font-medium',
      dot: 'bg-slate-400'
    },
    done: {
      label: 'COMPLETED',
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold',
      dot: 'bg-emerald-500'
    },
    completed: {
      label: 'COMPLETED',
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold',
      dot: 'bg-emerald-500'
    },
    pending: {
      label: 'PENDING',
      bg: 'bg-amber-50 text-amber-800 border-amber-200 font-semibold',
      dot: 'bg-amber-500'
    }
  };

  const conf = configs[s] || {
    label: s.toUpperCase(),
    bg: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-400'
  };

  const sizeClasses = {
    xs: 'px-2 py-0.5 text-[10px]',
    sm: 'px-2.5 py-0.5 text-xs',
    md: 'px-3 py-1 text-xs'
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-mono tracking-wider uppercase transition-colors ${conf.bg} ${sizeClasses[size] || sizeClasses.sm}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${conf.dot} ${pulse || s === 'occupied' || s === 'critical' ? 'animate-pulse' : ''}`} />
      {conf.label}
    </span>
  );
}
