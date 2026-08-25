import { useHospital } from '../context/HospitalContext.jsx';

export function useSagaTracker(filterStatus = null, patientId = null) {
  const { sagas } = useHospital();

  let filtered = sagas;
  if (filterStatus && filterStatus !== 'all') {
    filtered = filtered.filter(s => s.status === filterStatus);
  }
  if (patientId) {
    filtered = filtered.filter(s => s.patientId === patientId);
  }

  return {
    sagas: filtered,
    totalSagas: sagas.length,
    inProgress: sagas.filter(s => s.status === 'in_progress'),
    completed: sagas.filter(s => s.status === 'completed'),
    compensated: sagas.filter(s => s.status === 'compensated')
  };
}
