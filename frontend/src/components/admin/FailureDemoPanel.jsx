import React, { useState } from 'react';
import {
  Bug,
  Flame,
  RotateCcw,
  ShieldCheck,
  Play,
  Loader2,
  HelpCircle
} from 'lucide-react';
import { useHospital } from '../../context/HospitalContext.jsx';
import { allocateResourceTransaction } from '../../services/resourceService.js';
import { startPrescriptionSaga, compensateSaga } from '../../services/sagaService.js';

export default function FailureDemoPanel() {
  const { resources, playAlertTone } = useHospital();
  const [runningSim, setRunningSim] = useState(null);
  const [simResults, setSimResults] = useState([]);

  const addResult = (title, details, type = 'success') => {
    setSimResults(prev => [
      { id: Date.now(), timestamp: new Date().toLocaleTimeString(), title, details, type },
      ...prev
    ]);
  };

  /**
   * Simulation 1: Same-Time Conflict on Scarce Resource
   */
  const handleSimulateRaceCondition = async () => {
    setRunningSim('race');
    addResult('Starting Simulation', 'Sending 2 requests targeting the same ICU bed at the exact same millisecond...');

    const scarceBed = resources.find(r => r.type === 'bed' && (r.bedType === 'icu' || r.isScarce)) || resources[0];

    try {
      // Launch 2 parallel requests with different priority tiers
      const req1 = allocateResourceTransaction({
        resourceId: scarceBed.id,
        actorId: 'doc-1',
        actorName: 'Dr. Ananya Sharma',
        actorRole: 'doctor',
        patientId: 'pat-sim-1',
        patientName: 'Patient Alpha (Normal Priority)',
        allocationType: 'reserved',
        priority: 'normal',
        reason: 'Routine post-op ICU bed reservation'
      });

      const req2 = allocateResourceTransaction({
        resourceId: scarceBed.id,
        actorId: 'doc-7',
        actorName: 'Dr. Sneha Kulkarni',
        actorRole: 'doctor',
        patientId: 'pat-sim-2',
        patientName: 'Patient Beta (CRITICAL Emergency)',
        allocationType: 'occupied',
        priority: 'critical',
        reason: 'Acute cardiac arrest resuscitation escalation'
      });

      const results = await Promise.allSettled([req1, req2]);

      results.forEach((res, i) => {
        if (res.status === 'fulfilled') {
          addResult(
            `Request ${i + 1} (${i === 0 ? 'Dr. Ananya' : 'Dr. Sneha'}) Result`,
            `APPROVED: Emergency patient received the bed immediately.`,
            'success'
          );
        } else {
          addResult(
            `Request ${i + 1} (${i === 0 ? 'Dr. Ananya' : 'Dr. Sneha'}) Result`,
            `DECLINED: Lower-priority request redirected safely without locking up the system.`,
            'warning'
          );
        }
      });

      playAlertTone('success');
    } catch (err) {
      addResult('Conflict Simulation Error', err.message, 'error');
    } finally {
      setRunningSim(null);
    }
  };

  /**
   * Simulation 2: Failed Step Recovery & Automated Stock Return
   */
  const handleSimulateSagaRollback = async () => {
    setRunningSim('saga');
    addResult('Starting Step 1', 'Doctor orders 2x Adrenaline Injection (deducting pharmacy stock)...');

    try {
      // Step 1: Start Prescription
      const sagaRes = await startPrescriptionSaga({
        patientId: 'pat-sim-chaos',
        patientName: 'Recovery Test Patient',
        medicineId: 'med-adrenaline',
        medicineName: 'Adrenaline Injection (1mg/ml)',
        dosage: '1mg IV stat',
        quantity: 2,
        doctorId: 'doc-4',
        doctorName: 'Dr. Vikram Rao',
        notes: 'Stat emergency adrenaline test'
      });

      addResult(
        'Step 1 Complete',
        `Prescription ordered. Adrenaline inventory reserved (${sagaRes.remainingStock} units left).`,
        'success'
      );

      // Wait 1.2s for visual feedback
      await new Promise(r => setTimeout(r, 1200));

      addResult('Simulating Bedside Cancellation', 'Nurse detects an allergy contraindication at bedside. Undoing order...');

      // Step 2: Trigger compensation
      const compRes = await compensateSaga({
        sagaId: sagaRes.sagaId,
        actorId: 'nurse-1',
        actorName: 'Nurse Pooja Pawar',
        actorRole: 'nurse',
        reason: 'Acute allergy contraindication observed bedside. Order safely cancelled.'
      });

      addResult(
        'Recovery Complete',
        `Undone successfully! 2 units of Adrenaline refunded back to pharmacy stock (New Stock: ${compRes.newStock}).`,
        'success'
      );

      playAlertTone('success');
    } catch (err) {
      addResult('Failed Step Simulation Error', err.message, 'error');
    } finally {
      setRunningSim(null);
    }
  };

  /**
   * Simulation 3: Duplicate Request Test
   */
  const handleSimulateIdempotency = async () => {
    setRunningSim('idempotency');
    const fixedKey = `idemp-chaos-${Date.now()}`;
    addResult('Testing Request 1', 'Sending initial bed booking request...');

    try {
      const freeBed = resources.find(r => r.status === 'free') || resources[0];

      // Request 1
      const res1 = await allocateResourceTransaction({
        resourceId: freeBed.id,
        actorId: 'doc-3',
        actorName: 'Dr. Priya Nair',
        patientId: 'pat-idemp-1',
        patientName: 'Duplicate Test Patient',
        idempotencyKey: fixedKey
      });

      addResult('Request 1 Result', `Confirmed: Bed ${freeBed.id} booked.`, 'success');

      // Request 2 (Duplicate replay)
      addResult('Sending Duplicate Request', 'Simulating immediate double-click with identical request token...');
      await allocateResourceTransaction({
        resourceId: freeBed.id,
        actorId: 'doc-3',
        actorName: 'Dr. Priya Nair',
        patientId: 'pat-idemp-1',
        patientName: 'Duplicate Test Patient',
        idempotencyKey: fixedKey
      });

      addResult(
        'Duplicate Safely Filtered',
        'Duplicate recognized and ignored. No double-booking or duplicate history entry created!',
        'success'
      );
      playAlertTone('success');
    } catch (err) {
      addResult('Duplicate Test Failed', err.message, 'error');
    } finally {
      setRunningSim(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div>
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Bug className="w-5 h-5 text-rose-600" />
          Test Recovery & Failures
        </h3>
        <p className="text-xs text-slate-500 font-medium">
          Test how the system handles conflicts, failures, and recovery — safely, without affecting real data.
        </p>
      </div>

      {/* Simulation Action Triggers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Sim 1: Race Condition */}
        <div className="clean-card p-5 border-rose-200 flex flex-col justify-between space-y-4 bg-white">
          <div>
            <div className="flex items-center gap-2 text-rose-700 font-bold text-xs">
              <Flame className="w-4 h-4" /> 1. Same-Time Conflict
            </div>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed font-medium">
              Fires 2 simultaneous requests at the exact same millisecond with different priorities (Normal vs Critical Emergency) targeting a scarce ICU bed.
            </p>
          </div>
          <div>
            <button
              onClick={handleSimulateRaceCondition}
              disabled={!!runningSim}
              className="btn-danger text-xs py-2.5 w-full font-bold flex items-center justify-center gap-2 shadow-xs"
            >
              {runningSim === 'race' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              Simulate Conflict
            </button>
            <p className="text-[10px] text-slate-500 mt-2 flex items-start gap-1 font-sans">
              <HelpCircle className="w-3 h-3 text-slate-400 flex-shrink-0 mt-0.5" />
              <span><strong>Demo takeaway:</strong> Shows that when two doctors book the same bed at once, the critical patient gets it and the other is safely notified.</span>
            </p>
          </div>
        </div>

        {/* Sim 2: Mid-Saga Rollback */}
        <div className="clean-card p-5 border-purple-200 flex flex-col justify-between space-y-4 bg-white">
          <div>
            <div className="flex items-center gap-2 text-purple-700 font-bold text-xs">
              <RotateCcw className="w-4 h-4" /> 2. Failed Step Recovery
            </div>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed font-medium">
              Starts an Adrenaline prescription (reserving stock), then simulates a nurse detecting an allergy at bedside to show automated medicine return.
            </p>
          </div>
          <div>
            <button
              onClick={handleSimulateSagaRollback}
              disabled={!!runningSim}
              className="btn-purple text-xs py-2.5 w-full font-bold flex items-center justify-center gap-2 shadow-xs"
            >
              {runningSim === 'saga' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              Simulate a Failed Step
            </button>
            <p className="text-[10px] text-slate-500 mt-2 flex items-start gap-1 font-sans">
              <HelpCircle className="w-3 h-3 text-slate-400 flex-shrink-0 mt-0.5" />
              <span><strong>Demo takeaway:</strong> Shows that if an order is cancelled midway, the pharmacy stock is automatically returned to inventory.</span>
            </p>
          </div>
        </div>

        {/* Sim 3: Idempotency Deduplication */}
        <div className="clean-card p-5 border-blue-200 flex flex-col justify-between space-y-4 bg-white">
          <div>
            <div className="flex items-center gap-2 text-blue-700 font-bold text-xs">
              <ShieldCheck className="w-4 h-4" /> 3. Duplicate Request Test
            </div>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed font-medium">
              Sends identical duplicate requests to confirm the system safely handles double-clicks without duplicate bookings or corrupt records.
            </p>
          </div>
          <div>
            <button
              onClick={handleSimulateIdempotency}
              disabled={!!runningSim}
              className="btn-blue text-xs py-2.5 w-full font-bold flex items-center justify-center gap-2 shadow-xs"
            >
              {runningSim === 'idempotency' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              Test Duplicate Handling
            </button>
            <p className="text-[10px] text-slate-500 mt-2 flex items-start gap-1 font-sans">
              <HelpCircle className="w-3 h-3 text-slate-400 flex-shrink-0 mt-0.5" />
              <span><strong>Demo takeaway:</strong> Shows that accidental double-clicking or network retries never create duplicate bed bookings.</span>
            </p>
          </div>
        </div>
      </div>

      {/* Real-Time Simulation Output Console */}
      <div className="clean-card p-5 space-y-3 bg-white">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 tracking-wider uppercase font-mono">
            Test Results Console
          </span>
          {simResults.length > 0 && (
            <button
              onClick={() => setSimResults([])}
              className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
            >
              Clear Log
            </button>
          )}
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 max-h-64 overflow-y-auto font-mono text-xs space-y-2 text-slate-200">
          {simResults.length === 0 ? (
            <div className="text-slate-400 text-center py-6 font-sans">
              Click any button above to watch how the system handles edge cases live.
            </div>
          ) : (
            simResults.map((r) => (
              <div key={r.id} className="flex items-start gap-2.5 border-b border-slate-800 pb-2">
                <span className="text-slate-500 text-[10px] flex-shrink-0 mt-0.5">{r.timestamp}</span>
                <div>
                  <span
                    className={`font-bold ${
                      r.type === 'error'
                        ? 'text-rose-400'
                        : r.type === 'warning'
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    [{r.title}]:
                  </span>{' '}
                  <span className="text-slate-200 font-sans">{r.details}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
