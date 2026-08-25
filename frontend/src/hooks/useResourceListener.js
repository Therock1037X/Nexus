import { useHospital } from '../context/HospitalContext.jsx';

export function useResourceListener(filterType = null, filterFloor = null) {
  const { resources, stats } = useHospital();

  let filtered = resources;
  if (filterType && filterType !== 'all') {
    filtered = filtered.filter(r => r.type === filterType);
  }
  if (filterFloor && filterFloor !== 'all') {
    filtered = filtered.filter(r => r.floorId === filterFloor);
  }

  return {
    resources: filtered,
    allResources: resources,
    stats
  };
}
