import React from 'react';

export default function StatusBadge({ status, size = 'sm', pulse = false }) {
  const s = String(status || 'free').toLowerCase();

  const configs = {
    free: {
      label: 'AVAILABLE',
      bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      dot: 'bg-emerald-400'
    },
    reserved: {
      label: 'RESERVED',
      bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      dot: 'bg-amber-400'
    },
    occupied: {
      label: 'OCCUPIED',
      bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      dot: 'bg-rose-400'
    },
    in_use: {
      label: 'IN USE',
      bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
      dot: 'bg-indigo-400'
    },
    cleaning: {
      label: 'CLEANING',
      bg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
      dot: 'bg-cyan-400'
    },
    maintenance: {
      label: 'MAINTENANCE',
      bg: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
      dot: 'bg-slate-400'
    },
    compensated: {
      label: 'COMPENSATED',
      bg: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
      dot: 'bg-purple-400'
    },
    critical: {
      label: 'CRITICAL',
      bg: 'bg-red-500/20 text-red-400 border-red-500/40 shadow-[0_0_10px_rgba(239,68,68,0.3)]',
      dot: 'bg-red-400'
    },
    urgent: {
      label: 'URGENT',
      bg: 'bg-orange-500/15 text-orange-400 border-orange-500/35',
      dot: 'bg-orange-400'
    },
    high: {
      label: 'HIGH',
      bg: 'bg-amber-500/15 text-amber-400 border-amber-500/35',
      dot: 'bg-amber-400'
    },
    normal: {
      label: 'NORMAL',
      bg: 'bg-slate-700/40 text-slate-300 border-slate-600/40',
      dot: 'bg-slate-400'
    },
    done: {
      label: 'COMPLETED',
      bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      dot: 'bg-emerald-400'
    },
    pending: {
      label: 'PENDING',
      bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      dot: 'bg-amber-400'
    }
  };

  const conf = configs[s] || {
    label: s.toUpperCase(),
    bg: 'bg-slate-800 text-slate-300 border-slate-700',
    dot: 'bg-slate-400'
  };

  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-[10px]',
    sm: 'px-2.5 py-0.5 text-xs',
    md: 'px-3 py-1 text-xs'
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-mono font-medium tracking-wider uppercase transition-colors ${conf.bg} ${sizeClasses[size] || sizeClasses.sm}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${conf.dot} ${pulse || s === 'occupied' || s === 'critical' ? 'animate-pulse' : ''}`} />
      {conf.label}
    </span>
  );
}
