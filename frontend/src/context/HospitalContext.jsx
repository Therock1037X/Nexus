/**
 * Hospital Context: Real-Time State Hub & Subscriptions
 * Tracks resources, sagas, events, floors, patients, and staff via onSnapshot with automatic local store fallback.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  db,
  collection,
  onSnapshot,
  DEFAULT_HOSPITAL_ID,
  getResourcesCollectionRef,
  getEventsCollectionRef,
  getSagasCollectionRef,
  getPatientsCollectionRef,
  getFloorsCollectionRef,
  getStaffCollectionRef
} from '../firebase/firestore.js';
import { seedDemoHospital, generateDemoBeds, SEED_DATA, INITIAL_SAGAS } from '../services/seedService.js';

const HospitalContext = createContext(null);

export function HospitalProvider({ children }) {
  const [hospitalId] = useState(DEFAULT_HOSPITAL_ID);
  const [resources, setResources] = useState([]);
  const [events, setEvents] = useState([]);
  const [sagas, setSagas] = useState([]);
  const [patients, setPatients] = useState([]);
  const [floors, setFloors] = useState([]);
  const [staff, setStaff] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);

  // Play subtle synthesized audio cue for command center notifications
  const playAlertTone = useCallback((type = 'ping') => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === 'conflict') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(320, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(160, audioCtx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
      } else if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
        osc.frequency.exponentialRampToValueAtTime(659.25, audioCtx.currentTime + 0.15); // E5
        gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.25);
      } else {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.15);
      }
    } catch {
      // AudioContext policy or unsupported
    }
  }, [soundEnabled]);

  const sanitizePatientData = (p) => {
    const diag = (p.diagnosis || '').toLowerCase();
    if (diag.includes('height') || diag.includes('test') || diag.includes('placeholder')) {
      return {
        ...p,
        name: p.name === 'Aishita' ? 'Aishita Sharma' : (p.name || 'Patient'),
        diagnosis: 'Post-Op Cardiac Monitoring & Arrhythmia Surveillance',
        age: p.age || 58,
        gender: p.gender || 'Female',
        currentBedId: p.currentBedId || 'ICU-204',
        status: 'critical'
      };
    }
    return p;
  };

  // Load from LocalStorage helper
  const loadLocalFallback = useCallback(() => {
    try {
      const r = localStorage.getItem('nexus_local_resources');
      const e = localStorage.getItem('nexus_local_events');
      const s = localStorage.getItem('nexus_local_sagas');
      const p = localStorage.getItem('nexus_local_patients');
      const f = localStorage.getItem('nexus_local_floors');
      const st = localStorage.getItem('nexus_local_staff');

      if (r) setResources(JSON.parse(r));
      if (e) setEvents(JSON.parse(e));
      if (s) setSagas(JSON.parse(s));
      if (p) setPatients(JSON.parse(p).map(sanitizePatientData));
      if (f) setFloors(JSON.parse(f));
      if (st) setStaff(JSON.parse(st));

      // If storage is completely empty, auto-seed
      if (!r || JSON.parse(r).length === 0) {
        seedDemoHospital(hospitalId);
      }
    } catch (err) {
      console.warn('Failed to load local fallback:', err);
    }
  }, [hospitalId]);

  // Real-Time Subscriptions
  useEffect(() => {
    // 1. Initial local load
    loadLocalFallback();

    // 2. Set up Firestore onSnapshot listeners
    let unsubRes, unsubEvents, unsubSagas, unsubPatients, unsubFloors, unsubStaff;

    try {
      unsubRes = onSnapshot(getResourcesCollectionRef(hospitalId), (snap) => {
        if (!snap.empty) {
          const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          setResources(list);
          localStorage.setItem('nexus_local_resources', JSON.stringify(list));
        }
      }, () => loadLocalFallback());

      unsubEvents = onSnapshot(getEventsCollectionRef(hospitalId), (snap) => {
        if (!snap.empty) {
          const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          // Sort by timestamp desc
          list.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
          setEvents(list);
          localStorage.setItem('nexus_local_events', JSON.stringify(list));
        }
      }, () => loadLocalFallback());

      unsubSagas = onSnapshot(getSagasCollectionRef(hospitalId), (snap) => {
        if (!snap.empty) {
          const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          list.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
          setSagas(list);
          localStorage.setItem('nexus_local_sagas', JSON.stringify(list));
        }
      }, () => loadLocalFallback());

      unsubPatients = onSnapshot(getPatientsCollectionRef(hospitalId), (snap) => {
        if (!snap.empty) {
          const list = snap.docs.map(d => sanitizePatientData({ id: d.id, ...d.data() }));
          setPatients(list);
          localStorage.setItem('nexus_local_patients', JSON.stringify(list));
        }
      }, () => loadLocalFallback());

      unsubFloors = onSnapshot(getFloorsCollectionRef(hospitalId), (snap) => {
        if (!snap.empty) {
          const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          setFloors(list);
          localStorage.setItem('nexus_local_floors', JSON.stringify(list));
        }
      }, () => loadLocalFallback());

      unsubStaff = onSnapshot(getStaffCollectionRef(hospitalId), (snap) => {
        if (!snap.empty) {
          const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          setStaff(list);
          localStorage.setItem('nexus_local_staff', JSON.stringify(list));
        }
      }, () => loadLocalFallback());
    } catch (err) {
      console.warn('[FIRESTORE] Real-time setup fallback to local listener:', err.message);
    }

    // 3. Local Custom Event listener for synchronized reactive updates
    const handleStoreUpdate = () => {
      loadLocalFallback();
    };
    window.addEventListener('nexus_store_updated', handleStoreUpdate);

    return () => {
      if (unsubRes) unsubRes();
      if (unsubEvents) unsubEvents();
      if (unsubSagas) unsubSagas();
      if (unsubPatients) unsubPatients();
      if (unsubFloors) unsubFloors();
      if (unsubStaff) unsubStaff();
      window.removeEventListener('nexus_store_updated', handleStoreUpdate);
    };
  }, [hospitalId, loadLocalFallback]);

  // Trigger Seeding
  const handleResetSeed = async () => {
    setIsSeeding(true);
    try {
      await seedDemoHospital(hospitalId);
      loadLocalFallback();
      playAlertTone('success');
    } finally {
      setIsSeeding(false);
    }
  };

  // Aggregated Telemetry Calculations
  const beds = resources.filter(r => r.type === 'bed');
  const totalBeds = beds.length;
  const occupiedBeds = beds.filter(b => b.status === 'occupied').length;
  const reservedBeds = beds.filter(b => b.status === 'reserved').length;
  const freeBeds = beds.filter(b => b.status === 'free').length;
  const cleaningBeds = beds.filter(b => b.status === 'cleaning' || b.status === 'maintenance').length;
  
  const icuBeds = beds.filter(b => b.bedType === 'icu');
  const freeIcuBeds = icuBeds.filter(b => b.status === 'free').length;

  const ots = resources.filter(r => r.type === 'ot');
  const inUseOts = ots.filter(o => o.status === 'in_use').length;

  const medicines = resources.filter(r => r.type === 'medicine');
  const lowStockMedicines = medicines.filter(m => Number(m.quantity) <= (m.minThreshold || 30));

  const conflicts = events.filter(e => e.type === 'conflict_rejected' || e.type === 'escalation_preemption');
  const inProgressSagas = sagas.filter(s => s.status === 'in_progress');
  const completedSagas = sagas.filter(s => s.status === 'completed');
  const compensatedSagas = sagas.filter(s => s.status === 'compensated');

  return (
    <HospitalContext.Provider
      value={{
        hospitalId,
        resources,
        events,
        sagas,
        patients,
        floors: floors.length > 0 ? floors : SEED_DATA.floors,
        staff: staff.length > 0 ? staff : [...SEED_DATA.doctors, ...SEED_DATA.nurses, ...SEED_DATA.staffOther],
        isSeeding,
        soundEnabled,
        setSoundEnabled,
        playAlertTone,
        handleResetSeed,
        // Computed stats
        stats: {
          totalBeds,
          occupiedBeds,
          reservedBeds,
          freeBeds,
          cleaningBeds,
          occupancyRate: totalBeds > 0 ? Math.round(((occupiedBeds + reservedBeds) / totalBeds) * 100) : 0,
          icuBedsCount: icuBeds.length,
          freeIcuBeds,
          totalOts: ots.length,
          inUseOts,
          lowStockMedicinesCount: lowStockMedicines.length,
          conflictsCount: conflicts.length,
          inProgressSagasCount: inProgressSagas.length,
          completedSagasCount: completedSagas.length,
          compensatedSagasCount: compensatedSagas.length
        }
      }}
    >
      {children}
    </HospitalContext.Provider>
  );
}

export function useHospital() {
  const context = useContext(HospitalContext);
  if (!context) throw new Error('useHospital must be used within a HospitalProvider');
  return context;
}
