import { useHospital } from '../context/HospitalContext.jsx';

export function useEventLog(filterType = null, resourceId = null) {
  const { events } = useHospital();

  let filtered = events;
  if (filterType && filterType !== 'all') {
    filtered = filtered.filter(e => e.type === filterType);
  }
  if (resourceId) {
    filtered = filtered.filter(e => e.resourceId === resourceId);
  }

  return {
    events: filtered,
    totalEvents: events.length,
    conflicts: events.filter(e => e.type === 'conflict_rejected' || e.type === 'escalation_preemption')
  };
}
