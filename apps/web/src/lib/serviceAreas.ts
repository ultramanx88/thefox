export interface AdministrativeArea {
  id: string;
  type: 'administrative';
  name: string;
  province: string;
  districts: string[];
  status: 'active' | 'inactive';
}

export interface RadiusArea {
  id: string;
  type: 'radius';
  name: string;
  lat: number;
  lng: number;
  radius: number; // in km
  status: 'active' | 'inactive';
}

export type ServiceArea = AdministrativeArea | RadiusArea;


// In a real application, this would be a database.
let serviceAreas: ServiceArea[] = [
  { id: 'area-1', type: 'radius', name: 'ตัวเมืองเชียงใหม่', lat: 18.7883, lng: 98.9853, radius: 10, status: 'active' },
  { id: 'area-2', type: 'administrative', name: 'อำเภอรอบนอกเชียงใหม่', province: 'เชียงใหม่', districts: ['สันทราย', 'สันกำแพง', 'สารภี', 'หางดง', 'แม่ริม'], status: 'active' },
];

export async function getServiceAreas(): Promise<ServiceArea[]> {
  // Simulate async operation
  return Promise.resolve(JSON.parse(JSON.stringify(serviceAreas)));
}

export async function addServiceArea(area: Omit<ServiceArea, 'id'>): Promise<ServiceArea> {
  const newId = `area-${Date.now()}`;
  const newArea = { id: newId, ...area } as ServiceArea;
  serviceAreas.push(newArea);
  return Promise.resolve(newArea);
}

export async function updateServiceArea(id: string, updates: Partial<Omit<ServiceArea, 'id'>>): Promise<ServiceArea | null> {
  const areaIndex = serviceAreas.findIndex(a => a.id === id);
  if (areaIndex === -1) {
    return null;
  }
  // This simplistic update works because we are replacing all defining fields.
  // In a real DB, you might need more nuanced logic.
  serviceAreas[areaIndex] = { ...serviceAreas[areaIndex], ...updates, id } as ServiceArea;
  return Promise.resolve(serviceAreas[areaIndex]);
}

export async function deleteServiceArea(id: string): Promise<{ success: boolean }> {
  const initialLength = serviceAreas.length;
  serviceAreas = serviceAreas.filter(a => a.id !== id);
  return Promise.resolve({ success: serviceAreas.length < initialLength });
}
