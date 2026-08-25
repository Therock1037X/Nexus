import React, { useState } from 'react';
import { PlusCircle, CheckCircle2, Loader2, Bed, Activity, Cpu, Pill, RotateCcw } from 'lucide-react';
import { useHospital } from '../../context/HospitalContext.jsx';
import { db, doc, setDoc, DEFAULT_HOSPITAL_ID } from '../../firebase/firestore.js';

export default function ResourceSetupForm({ onSuccess = null }) {
  const { floors, isSeeding, handleResetSeed, playAlertTone } = useHospital();

  const [resourceType, setResourceType] = useState('bed');
  const [resourceId, setResourceId] = useState('G-121');
  const [name, setName] = useState('General Bed G-121');
  const [floorId, setFloorId] = useState('floor-1');
  const [roomNo, setRoomNo] = useState('Room 106');
  const [subClassification, setSubClassification] = useState('general');
  const [quantity, setQuantity] = useState(100);
  const [unit, setUnit] = useState('tablets');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const handleTypeChange = (type) => {
    setResourceType(type);
    if (type === 'bed') {
      setResourceId(`G-${Math.floor(100 + Math.random() * 900)}`);
      setName('General Ward Bed');
      setSubClassification('general');
    } else if (type === 'ot') {
      setResourceId(`OT-${Math.floor(4 + Math.random() * 5)}`);
      setName('Specialty Surgery OT');
      setSubClassification('General Surgery');
    } else if (type === 'equipment') {
      setResourceId(`EQ-VENT-${Math.floor(5 + Math.random() * 5)}`);
      setName('ICU Ventilator Unit');
      setSubClassification('Ventilator');
    } else if (type === 'medicine') {
      setResourceId(`med-custom-${Math.floor(10 + Math.random() * 90)}`);
      setName('Ceftriaxone 1g IV');
      setQuantity(100);
      setUnit('vials');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!resourceId) return;

    setSubmitting(true);
    setFeedback(null);

    const newResource = {
      id: resourceId,
      name,
      type: resourceType,
      floorId,
      roomNo: roomNo || null,
      status: 'free',
      version: 1,
      hospitalId: DEFAULT_HOSPITAL_ID,
      ...(resourceType === 'bed' ? { bedType: subClassification } : {}),
      ...(resourceType === 'ot' ? { otType: subClassification } : {}),
      ...(resourceType === 'equipment' ? { equipmentType: subClassification } : {}),
      ...(resourceType === 'medicine' ? { quantity: Number(quantity), unit, minThreshold: 30 } : {}),
      updatedAt: new Date().toISOString()
    };

    try {
      // Write doc
      await setDoc(doc(db, 'hospitals', DEFAULT_HOSPITAL_ID, 'resources', resourceId), newResource).catch(() => {});

      // Sync local store
      const raw = localStorage.getItem('nexus_local_resources');
      const resources = raw ? JSON.parse(raw) : [];
      const idx = resources.findIndex(r => r.id === resourceId);
      if (idx >= 0) resources[idx] = newResource;
      else resources.push(newResource);
      localStorage.setItem('nexus_local_resources', JSON.stringify(resources));

      // Append registry audit event
      const eventId = `evt-reg-${Date.now()}`;
      const regEvt = {
        id: eventId,
        type: 'status_change',
        resourceId,
        actorId: 'admin-1',
        actorName: 'Hospital Admin Vinit',
        actorRole: 'admin',
        timestamp: new Date().toISOString(),
        idempotencyKey: `reg-${Date.now()}`,
        resultingVersion: 1,
        payload: { action: 'RESOURCE_REGISTERED', details: `Added new ${resourceType} ${resourceId} to ${floorId}` }
      };

      await setDoc(doc(db, 'hospitals', DEFAULT_HOSPITAL_ID, 'events', eventId), regEvt).catch(() => {});
      const rawE = localStorage.getItem('nexus_local_events');
      const events = rawE ? JSON.parse(rawE) : [];
      events.unshift(regEvt);
      localStorage.setItem('nexus_local_events', JSON.stringify(events));

      window.dispatchEvent(new CustomEvent('nexus_store_updated', { detail: { key: 'all' } }));
      playAlertTone('success');
      setFeedback({ type: 'success', message: `Resource ${resourceId} successfully registered in hospital inventory!` });

      if (onSuccess) onSuccess(newResource);
    } catch (err) {
      setFeedback({ type: 'error', message: `Registration failed: ${err.message}` });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-cyan-400" />
            Hospital Resource Setup & Registry Config
          </h3>
          <p className="text-xs text-slate-400">
            Add dynamic floors, beds, operating theatres, diagnostic equipment, or pharmaceutical inventory.
          </p>
        </div>

        <button
          type="button"
          onClick={handleResetSeed}
          disabled={isSeeding}
          className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5 border-slate-700"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${isSeeding ? 'animate-spin text-cyan-400' : ''}`} />
          <span>Re-seed 38-Bed Layout</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Category Selector */}
        <div>
          <label className="block text-slate-300 font-medium mb-1.5">Resource Category</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { type: 'bed', label: 'Bed', icon: Bed },
              { type: 'ot', label: 'OT', icon: Activity },
              { type: 'equipment', label: 'Equipment', icon: Cpu },
              { type: 'medicine', label: 'Medicine', icon: Pill }
            ].map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  type="button"
                  key={cat.type}
                  onClick={() => handleTypeChange(cat.type)}
                  className={`p-2.5 rounded-xl flex items-center justify-center gap-2 font-medium border transition-all ${
                    resourceType === cat.type
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Resource ID & Display Name */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Unique Resource ID</label>
            <input
              type="text"
              value={resourceId}
              onChange={(e) => setResourceId(e.target.value)}
              className="glass-input w-full font-mono text-cyan-300"
              required
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Display Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="glass-input w-full"
              required
            />
          </div>
        </div>

        {/* Floor & Room Location */}
        {resourceType !== 'medicine' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Assigned Floor</label>
              <select
                value={floorId}
                onChange={(e) => setFloorId(e.target.value)}
                className="glass-input w-full"
              >
                {floors.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} (Level {f.level})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Room / Bay No</label>
              <input
                type="text"
                value={roomNo}
                onChange={(e) => setRoomNo(e.target.value)}
                placeholder="e.g. Room 108 or Bay-04"
                className="glass-input w-full"
              />
            </div>
          </div>
        )}

        {/* Medicine Quantity & Units */}
        {resourceType === 'medicine' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Initial Stock Quantity</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="glass-input w-full font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Unit of Measure</label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="tablets, vials, ampoules"
                className="glass-input w-full font-mono"
              />
            </div>
          </div>
        )}

        {feedback && (
          <div
            className={`p-3 rounded-xl border flex items-center gap-2 text-xs ${
              feedback.type === 'success'
                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{feedback.message}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || !resourceId}
          className="btn-primary w-full py-2.5 text-xs font-bold flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Registering Resource...
            </>
          ) : (
            <>
              <PlusCircle className="w-4 h-4" /> Save Resource to Registry
            </>
          )}
        </button>
      </form>
    </div>
  );
}
