export interface ServiceArea {
  id: string;
  name: string; // e.g., "Central Bangkok"
  province: string; // e.g., "Bangkok"
  districts: string[]; // e.g., ["Pathum Wan", "Siam", "Ratchathewi"]
  status: 'active' | 'inactive';
}

// In a real application, this would be a database.
let serviceAreas: ServiceArea[] = [
  { id: 'area-1', name: 'Central Business District', province: 'Bangkok', districts: ['Pathum Wan', 'Bang Rak', 'Sathon'], status: 'active' },
  { id: 'area-2', name: 'Sukhumvit Area', province: 'Bangkok', districts: ['Khlong Toei', 'Watthana'], status: 'active' },
  { id: 'area-3', name: 'Chiang Mai City', province: 'Chiang Mai', districts: ['Mueang Chiang Mai'], status: 'inactive' },
];

export async function getServiceAreas(): Promise<ServiceArea[]> {
  // Simulate async operation
  return Promise.resolve(JSON.parse(JSON.stringify(serviceAreas)));
}

export async function addServiceArea(area: Omit<ServiceArea, 'id'>): Promise<ServiceArea> {
  const newId = `area-${Date.now()}`;
  const newArea: ServiceArea = { id: newId, ...area };
  serviceAreas.push(newArea);
  return Promise.resolve(newArea);
}

export async function updateServiceArea(id: string, updates: Partial<Omit<ServiceArea, 'id'>>): Promise<ServiceArea | null> {
  const areaIndex = serviceAreas.findIndex(a => a.id === id);
  if (areaIndex === -1) {
    return null;
  }
  serviceAreas[areaIndex] = { ...serviceAreas[areaIndex], ...updates };
  return Promise.resolve(serviceAreas[areaIndex]);
}

export async function deleteServiceArea(id: string): Promise<{ success: boolean }> {
  const initialLength = serviceAreas.length;
  serviceAreas = serviceAreas.filter(a => a.id !== id);
  return Promise.resolve({ success: serviceAreas.length < initialLength });
}
