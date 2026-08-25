import React from 'react';
import { Bed, Activity, Cpu, Pill, AlertTriangle, User, Lock, Clock, Sparkles } from 'lucide-react';
import StatusBadge from './StatusBadge.jsx';

export default function ResourceCard({
  resource,
  onSelect = null,
  onAllocate = null,
  onEscalate = null,
  onRelease = null,
  onFlagIssue = null,
  userRole = 'admin',
  compact = false
}) {
  const {
    id,
    name,
    type,
    bedType,
    otType,
    equipmentType,
    roomNo,
    floorId,
    status = 'free',
    version = 1,
    quantity,
    unit,
    currentAllocation,
    isScarce
  } = resource;

  const getTypeIcon = () => {
    switch (type) {
      case 'bed':
        return <Bed className="w-4 h-4 text-cyan-400" />;
      case 'ot':
        return <Activity className="w-4 h-4 text-rose-400" />;
      case 'equipment':
        return <Cpu className="w-4 h-4 text-indigo-400" />;
      case 'medicine':
        return <Pill className="w-4 h-4 text-emerald-400" />;
      default:
        return <Bed className="w-4 h-4 text-slate-400" />;
    }
  };

  const isFree = status === 'free';
  const isOccupied = status === 'occupied' || status === 'in_use';
  const isReserved = status === 'reserved';
  const isCleaning = status === 'cleaning' || status === 'maintenance';

  return (
    <div
      className={`glass-card rounded-xl p-4 relative overflow-hidden transition-all duration-200 hover:border-slate-700/80 ${
        isScarce ? 'ring-1 ring-amber-500/30' : ''
      } ${compact ? 'p-3' : 'p-4'}`}
      onClick={() => onSelect && onSelect(resource)}
    >
      {/* Top Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-slate-800/80 border border-slate-700/50">
            {getTypeIcon()}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-xs font-semibold text-slate-200">{id}</span>
              {isScarce && (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  <AlertTriangle className="w-2.5 h-2.5" /> SCARCE
                </span>
              )}
            </div>
            <h4 className="text-sm font-medium text-slate-100 line-clamp-1">{name || id}</h4>
          </div>
        </div>

        {/* Status Badge & Version Indicator */}
        <div className="flex flex-col items-end gap-1">
          <StatusBadge status={status} size="xs" />
          <span className="font-mono text-[10px] text-slate-400 bg-slate-800/60 px-1.5 py-0.5 rounded border border-slate-700/50">
            v{version}
          </span>
        </div>
      </div>

      {/* Sub-details / Floor / Location */}
      <div className="flex items-center justify-between text-xs text-slate-400 mb-3 pt-1 border-t border-slate-800/60">
        <span className="capitalize text-slate-400">
          {bedType || otType || equipmentType || (type === 'medicine' ? `${quantity} ${unit || 'units'}` : type)}
        </span>
        {roomNo && <span className="font-mono text-[11px] text-slate-400">{roomNo}</span>}
      </div>

      {/* Current Allocation Pill */}
      {currentAllocation && (
        <div className="mb-3 p-2 rounded-lg bg-slate-950/60 border border-slate-800 text-xs">
          <div className="flex items-center justify-between gap-1 text-slate-300 mb-1">
            <span className="flex items-center gap-1 font-medium truncate text-cyan-300">
              <User className="w-3 h-3 text-cyan-400 flex-shrink-0" />
              {currentAllocation.patientName || currentAllocation.patientId}
            </span>
            {currentAllocation.priority && (
              <StatusBadge status={currentAllocation.priority} size="xs" />
            )}
          </div>
          {currentAllocation.assignedDoctorName && (
            <div className="text-[11px] text-slate-400 truncate">
              Dr. {currentAllocation.assignedDoctorName}
            </div>
          )}
          {currentAllocation.reason && (
            <div className="text-[10px] text-slate-400 italic truncate mt-0.5">
              "{currentAllocation.reason}"
            </div>
          )}
        </div>
      )}

      {/* Medicine Stock Bar (if medicine) */}
      {type === 'medicine' && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1 font-mono">
            <span>Stock: {quantity} {unit}</span>
            <span className={Number(quantity) < 40 ? 'text-amber-400 font-semibold' : 'text-emerald-400'}>
              {Number(quantity) < 40 ? 'LOW STOCK' : 'IN STOCK'}
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                Number(quantity) < 40 ? 'bg-amber-400' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, (Number(quantity) / 200) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Quick Action Footer */}
      <div className="flex items-center gap-1.5 pt-2 border-t border-slate-800/60">
        {isFree && onAllocate && (
          <button
            onClick={(e) => { e.stopPropagation(); onAllocate(resource); }}
            className="flex-1 py-1.5 px-2.5 rounded-lg text-xs font-medium text-white bg-cyan-600 hover:bg-cyan-500 active:scale-95 transition-all text-center"
          >
            Allocate / Reserve
          </button>
        )}

        {(isReserved || isOccupied) && onEscalate && userRole === 'doctor' && (
          <button
            onClick={(e) => { e.stopPropagation(); onEscalate(resource); }}
            className="flex-1 py-1.5 px-2 rounded-lg text-xs font-medium text-white bg-red-600/90 hover:bg-red-500 active:scale-95 transition-all text-center flex items-center justify-center gap-1"
          >
            <Sparkles className="w-3 h-3" /> Escalate
          </button>
        )}

        {(isReserved || isOccupied) && onRelease && (
          <button
            onClick={(e) => { e.stopPropagation(); onRelease(resource); }}
            className="py-1.5 px-2.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 active:scale-95 transition-all"
          >
            Release
          </button>
        )}

        {onFlagIssue && (
          <button
            onClick={(e) => { e.stopPropagation(); onFlagIssue(resource); }}
            title="Flag cleaning / maintenance"
            className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
