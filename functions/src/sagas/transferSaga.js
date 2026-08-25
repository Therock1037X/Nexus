/**
 * Transfer Saga Coordinator
 * Coordinates multi-step patient transfer between wards/beds.
 */

export async function executeTransferSaga(db, hospitalId, params) {
  const {
    patientId,
    patientName,
    sourceBedId,
    targetBedId,
    doctorId,
    doctorName,
    reason = 'Step-down or condition upgrade'
  } = params;

  const sagasRef = db.collection('hospitals').doc(hospitalId).collection('sagas');
  const sagaId = `saga-trans-${Date.now()}`;

  const sagaData = {
    id: sagaId,
    type: 'transfer',
    hospitalId,
    patientId,
    patientName,
    sourceBedId,
    targetBedId,
    status: 'in_progress',
    steps: [
      {
        stepName: 'reserve_target',
        label: 'Reserve Target Bed',
        status: 'done',
        timestamp: new Date().toISOString(),
        actorId: doctorId,
        actorName: doctorName,
        actorRole: 'doctor',
        details: `Reserved bed ${targetBedId}`
      },
      {
        stepName: 'transfer_in_transit',
        label: 'Patient Bedside Transit',
        status: 'pending',
        timestamp: null,
        actorId: null,
        actorName: null,
        actorRole: 'nurse',
        details: 'Porter/Nurse transport in transit'
      },
      {
        stepName: 'complete_transfer',
        label: 'Occupy Target & Release Source',
        status: 'pending',
        timestamp: null,
        actorId: null,
        actorName: null,
        actorRole: 'nurse',
        details: 'Patient settled in target bed'
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await sagasRef.doc(sagaId).set(sagaData);
  return { success: true, sagaId };
}
