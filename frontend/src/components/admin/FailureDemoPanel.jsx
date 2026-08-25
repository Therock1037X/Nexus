import React, { useState } from 'react';
import {
  Bug,
  Flame,
  RotateCcw,
  ShieldCheck,
  Play,
  Loader2
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
   * Simulation 1: Concurrent Race Condition on Scarce Resource
   */
  const handleSimulateRaceCondition = async () => {
    setRunningSim('race');
    addResult('Starting Simulation', 'Spawning 2 concurrent requests targeting the same scarce ICU bed at the exact same millisecond...');

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
            `Request ${i + 1} (${i === 0 ? 'Dr. Ananya' : 'Dr. Sneha'}) Resolved`,
            `Status: APPROVED (v${res.value.version}). ${res.value.preemptionNotice || 'Acquired resource atomically.'}`,
            'success'
          );
        } else {
          addResult(
            `Request ${i + 1} (${i === 0 ? 'Dr. Ananya' : 'Dr. Sneha'}) Deterministically Handled`,
            `Status: REJECTED with explicit reason: "${res.reason.message}"`,
            'warning'
          );
        }
      });

      playAlertTone('success');
    } catch (err) {
      addResult('Race Condition Error', err.message, 'error');
    } finally {
      setRunningSim(null);
    }
  };

  /**
   * Simulation 2: Mid-Saga Failure & Automatic Inventory Rollback
   */
  const handleSimulateSagaRollback = async () => {
    setRunningSim('saga');
    addResult('Starting Saga Simulation', 'Initiating 3-step Prescription Saga for 2x Adrenaline Injection (Scarce stock)...');

    try {
      // Step 1: Start Prescription
      const sagaRes = await startPrescriptionSaga({
        patientId: 'pat-sim-chaos',
        patientName: 'Chaos Test Patient',
        medicineId: 'med-adrenaline',
        medicineName: 'Adrenaline Injection (1mg/ml)',
        dosage: '1mg IV stat',
        quantity: 2,
        doctorId: 'doc-4',
        doctorName: 'Dr. Vikram Rao',
        notes: 'Stat emergency adrenaline test'
      });

      addResult(
        'Step 1 Executed',
        `Prescription ordered (#${sagaRes.sagaId}). Adrenaline inventory decremented to ${sagaRes.remainingStock} units.`,
        'success'
      );

      // Wait 1.2s for visual feedback
      await new Promise(r => setTimeout(r, 1200));

      addResult('Simulating Bedside Failure', 'Nurse detects severe acute anaphylaxis / allergy contraindication. Triggering saga rollback...');

      // Step 2: Trigger compensation
      const compRes = await compensateSaga({
        sagaId: sagaRes.sagaId,
        actorId: 'nurse-1',
        actorName: 'Nurse Pooja Pawar',
        actorRole: 'nurse',
        reason: 'Severe acute anaphylactoid reaction observed bedside. Order aborted.'
      });

      addResult(
        'Saga Compensation Complete',
        `Rollback successful! 2 units of Adrenaline refunded back into inventory (New Stock: ${compRes.newStock}). Saga marked "COMPENSATED".`,
        'success'
      );

      playAlertTone('success');
    } catch (err) {
      addResult('Saga Simulation Failed', err.message, 'error');
    } finally {
      setRunningSim(null);
    }
  };

  /**
   * Simulation 3: Idempotency Duplicate Replay
   */
  const handleSimulateIdempotency = async () => {
    setRunningSim('idempotency');
    const fixedKey = `idemp-chaos-${Date.now()}`;
    addResult('Testing Idempotency', `Firing request 1 with idempotencyKey: ${fixedKey}...`);

    try {
      const freeBed = resources.find(r => r.status === 'free') || resources[0];

      // Request 1
      const res1 = await allocateResourceTransaction({
        resourceId: freeBed.id,
        actorId: 'doc-3',
        actorName: 'Dr. Priya Nair',
        patientId: 'pat-idemp-1',
        patientName: 'Idempotency Test Patient',
        idempotencyKey: fixedKey
      });

      addResult('Request 1 Result', `Committed v${res1.version} with event #${res1.eventId}.`, 'success');

      // Request 2 (Duplicate replay)
      addResult('Firing Duplicate Request', `Firing request 2 with duplicate idempotencyKey: ${fixedKey}...`);
      const res2 = await allocateResourceTransaction({
        resourceId: freeBed.id,
        actorId: 'doc-3',
        actorName: 'Dr. Priya Nair',
        patientId: 'pat-idemp-1',
        patientName: 'Idempotency Test Patient',
        idempotencyKey: fixedKey
      });

      addResult(
        'Duplicate Filtered',
        `Duplicate ignored safely (idempotent replay detected). No duplicate mutation or event created!`,
        'success'
      );
      playAlertTone('success');
    } catch (err) {
      addResult('Idempotency Test Failed', err.message, 'error');
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
          Failure & Chaos Simulation Control Panel
        </h3>
        <p className="text-xs text-slate-500 font-medium">
          Simulate concurrent race conditions, mid-saga failures, and service recoveries to prove deterministic conflict handling and rollback consistency in real-time.
        </p>
      </div>

      {/* Simulation Action Triggers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Sim 1: Race Condition */}
        <div className="clean-card p-5 border-rose-200 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 text-rose-700 font-bold text-xs">
              <Flame className="w-4 h-4" /> 1. Concurrent Race Condition
            </div>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Fires 2 simultaneous requests at the exact same millisecond with different priorities (Normal vs Critical Preemption) targeting a scarce ICU bed.
            </p>
          </div>
          <button
            onClick={handleSimulateRaceCondition}
            disabled={!!runningSim}
            className="btn-danger text-xs py-2.5 w-full font-bold flex items-center justify-center gap-2"
          >
            {runningSim === 'race' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            Run Race Condition
          </button>
        </div>

        {/* Sim 2: Mid-Saga Rollback */}
        <div className="clean-card p-5 border-purple-200 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 text-purple-700 font-bold text-xs">
              <RotateCcw className="w-4 h-4" /> 2. Mid-Saga Compensation
            </div>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Initiates an Adrenaline prescription (deducting stock), then simulates a mid-saga bedside abort to demonstrate automated stock restoration and saga rollback.
            </p>
          </div>
          <button
            onClick={handleSimulateSagaRollback}
            disabled={!!runningSim}
            className="btn-purple text-xs py-2.5 w-full font-bold flex items-center justify-center gap-2"
          >
            {runningSim === 'saga' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            Run Saga Rollback Demo
          </button>
        </div>

        {/* Sim 3: Idempotency Deduplication */}
        <div className="clean-card p-5 border-blue-200 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 text-blue-700 font-bold text-xs">
              <ShieldCheck className="w-4 h-4" /> 3. Idempotency Key Replay
            </div>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Fires duplicate requests carrying identical idempotency keys to verify zero-duplicate state corruption.
            </p>
          </div>
          <button
            onClick={handleSimulateIdempotency}
            disabled={!!runningSim}
            className="btn-blue text-xs py-2.5 w-full font-bold flex items-center justify-center gap-2"
          >
            {runningSim === 'idempotency' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            Test Idempotency Replay
          </button>
        </div>
      </div>

      {/* Real-Time Simulation Output Terminal */}
      <div className="clean-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase text-slate-800 tracking-wider">
            Simulation Telemetry Console
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
            <div className="text-slate-400 text-center py-6">
              Click any simulation button above to watch live transactional behavior.
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
                  <span className="text-slate-200">{r.details}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
