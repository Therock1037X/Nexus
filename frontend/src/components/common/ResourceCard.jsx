import React from 'react';
import { Bed, Activity, Cpu, Pill, AlertTriangle, User, Sparkles, Layers } from 'lucide-react';
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
        return <Bed className="w-4 h-4 text-emerald-700" />;
      case 'ot':
        return <Activity className="w-4 h-4 text-blue-700" />;
      case 'equipment':
        return <Cpu className="w-4 h-4 text-purple-700" />;
      case 'medicine':
        return <Pill className="w-4 h-4 text-amber-700" />;
      default:
        return <Bed className="w-4 h-4 text-slate-700" />;
    }
  };

  const isFree = status === 'free';
  const isOccupied = status === 'occupied' || status === 'in_use';
  const isReserved = status === 'reserved';

  return (
    <div
      className={`clean-card-hover relative overflow-hidden cursor-pointer flex flex-col justify-between ${
        isScarce ? 'border-amber-300 ring-2 ring-amber-400/20' : ''
      } ${compact ? 'p-3.5' : 'p-4'}`}
      onClick={() => onSelect && onSelect(resource)}
    >
      <div>
        {/* Top Header */}
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80 shadow-xs flex-shrink-0">
              {getTypeIcon()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-xs font-bold text-slate-800 truncate">{id}</span>
                {isScarce && (
                  <span className="inline-flex items-center gap-0.5 text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-amber-50 text-amber-800 border border-amber-300 font-bold">
                    <AlertTriangle className="w-2.5 h-2.5" /> SCARCE
                  </span>
                )}
              </div>
              <h4 className="text-xs font-semibold text-slate-900 truncate">{name || id}</h4>
            </div>
          </div>

          {/* Status Badge & Version Indicator */}
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <StatusBadge status={status} size="xs" />
            <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
              v{version}
            </span>
          </div>
        </div>

        {/* Sub-details / Floor / Room */}
        <div className="flex items-center justify-between text-xs text-slate-500 mb-3 pt-2 border-t border-slate-100 font-medium">
          <span className="capitalize text-slate-600">
            {bedType || otType || equipmentType || (type === 'medicine' ? `${quantity} ${unit || 'units'}` : type)}
          </span>
          {roomNo && <span className="font-mono text-[11px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">{roomNo}</span>}
        </div>

        {/* Current Patient Allocation */}
        {currentAllocation && (
          <div className="mb-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
            <div className="flex items-center justify-between gap-1 text-slate-800 mb-1">
              <span className="flex items-center gap-1.5 font-semibold truncate text-emerald-800">
                <User className="w-3.5 h-3.5 text-emerald-700 flex-shrink-0" />
                {currentAllocation.patientName || currentAllocation.patientId}
              </span>
              {currentAllocation.priority && (
                <StatusBadge status={currentAllocation.priority} size="xs" />
              )}
            </div>
            {currentAllocation.assignedDoctorName && (
              <div className="text-[11px] text-slate-600 truncate font-medium">
                Dr. {currentAllocation.assignedDoctorName}
              </div>
            )}
            {currentAllocation.reason && (
              <div className="text-[10px] text-slate-500 italic truncate mt-0.5">
                "{currentAllocation.reason}"
              </div>
            )}
          </div>
        )}

        {/* Medicine Stock Bar (if medicine) */}
        {type === 'medicine' && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-[11px] text-slate-600 mb-1 font-mono font-medium">
              <span>Stock: {quantity} {unit}</span>
              <span className={Number(quantity) < 40 ? 'text-amber-700 font-bold' : 'text-emerald-700 font-bold'}>
                {Number(quantity) < 40 ? 'LOW STOCK' : 'IN STOCK'}
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  Number(quantity) < 40 ? 'bg-amber-500' : 'bg-emerald-600'
                }`}
                style={{ width: `${Math.min(100, (Number(quantity) / 200) * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Quick Action Footer */}
      <div className="flex items-center gap-1.5 pt-2.5 border-t border-slate-100">
        {isFree && onAllocate && (
          <button
            onClick={(e) => { e.stopPropagation(); onAllocate(resource); }}
            className="flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 active:scale-95 transition-all text-center shadow-xs"
          >
            Allocate / Reserve
          </button>
        )}

        {(isReserved || isOccupied) && onEscalate && userRole === 'doctor' && (
          <button
            onClick={(e) => { e.stopPropagation(); onEscalate(resource); }}
            className="flex-1 py-1.5 px-2.5 rounded-xl text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 active:scale-95 transition-all text-center flex items-center justify-center gap-1 shadow-xs"
          >
            <Sparkles className="w-3 h-3" /> Escalate
          </button>
        )}

        {(isReserved || isOccupied) && onRelease && (
          <button
            onClick={(e) => { e.stopPropagation(); onRelease(resource); }}
            className="py-1.5 px-3 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-95 transition-all border border-slate-200"
          >
            Release
          </button>
        )}

        {onFlagIssue && (
          <button
            onClick={(e) => { e.stopPropagation(); onFlagIssue(resource); }}
            title="Flag cleaning / maintenance"
            className="p-1.5 rounded-xl text-slate-500 hover:text-emerald-700 hover:bg-slate-100 transition-colors border border-slate-200"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
