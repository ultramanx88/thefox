interface VehicleType {
  id: string;
  name: string;
  icon: string;
  maxCapacity: number;
  enabled: boolean;
}

interface Vehicle {
  id: string;
  driverId: string;
  typeId: string;
  licensePlate: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  documents: {
    registration: string;
    insurance: string;
    inspection?: string;
  };
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  isActive: boolean;
  approvedAt?: string;
  rejectedReason?: string;
}

interface Driver {
  id: string;
  name: string;
  vehicles: Vehicle[];
  activeVehicleId?: string;
}

export class VehicleManager {
  private vehicleTypes: VehicleType[] = [
    { id: 'motorcycle', name: 'มอเตอร์ไซค์', icon: '🏍️', maxCapacity: 2, enabled: true },
    { id: 'car', name: 'รถยนต์', icon: '🚗', maxCapacity: 4, enabled: true },
    { id: 'pickup', name: 'รถกระบะ', icon: '🚚', maxCapacity: 10, enabled: true }
  ];

  private vehicles: Vehicle[] = [];
  private drivers: Driver[] = [
    { id: 'driver_001', name: 'สมชาย ใจดี', vehicles: [] }
  ];

  // Vehicle Type Management
  addVehicleType(type: Omit<VehicleType, 'id'>) {
    const newType: VehicleType = {
      ...type,
      id: `type_${Date.now()}`
    };
    this.vehicleTypes.push(newType);
    return newType;
  }

  updateVehicleType(id: string, updates: Partial<VehicleType>) {
    const type = this.vehicleTypes.find(t => t.id === id);
    if (type) {
      Object.assign(type, updates);
    }
  }

  getVehicleTypes(): VehicleType[] {
    return this.vehicleTypes.filter(t => t.enabled);
  }

  getAllVehicleTypes(): VehicleType[] {
    return this.vehicleTypes;
  }

  // Vehicle Management
  addVehicle(driverId: string, vehicleData: Omit<Vehicle, 'id' | 'driverId' | 'status' | 'isActive'>) {
    const vehicle: Vehicle = {
      ...vehicleData,
      id: `vehicle_${Date.now()}`,
      driverId,
      status: 'pending',
      isActive: false
    };

    this.vehicles.push(vehicle);
    
    const driver = this.drivers.find(d => d.id === driverId);
    if (driver) {
      driver.vehicles.push(vehicle);
    }

    return vehicle;
  }

  approveVehicle(vehicleId: string) {
    const vehicle = this.vehicles.find(v => v.id === vehicleId);
    if (vehicle) {
      vehicle.status = 'approved';
      vehicle.approvedAt = new Date().toISOString();
    }
  }

  rejectVehicle(vehicleId: string, reason: string) {
    const vehicle = this.vehicles.find(v => v.id === vehicleId);
    if (vehicle) {
      vehicle.status = 'rejected';
      vehicle.rejectedReason = reason;
    }
  }

  setActiveVehicle(driverId: string, vehicleId: string): boolean {
    const driver = this.drivers.find(d => d.id === driverId);
    const vehicle = this.vehicles.find(v => v.id === vehicleId && v.driverId === driverId);
    
    if (!driver || !vehicle || vehicle.status !== 'approved') {
      return false;
    }

    // Deactivate all vehicles for this driver
    driver.vehicles.forEach(v => v.isActive = false);
    
    // Activate selected vehicle
    vehicle.isActive = true;
    driver.activeVehicleId = vehicleId;
    
    return true;
  }

  getDriverVehicles(driverId: string): Vehicle[] {
    return this.vehicles.filter(v => v.driverId === driverId);
  }

  getActiveVehicle(driverId: string): Vehicle | undefined {
    return this.vehicles.find(v => v.driverId === driverId && v.isActive);
  }

  getPendingVehicles(): Vehicle[] {
    return this.vehicles.filter(v => v.status === 'pending');
  }

  getVehicleById(id: string): Vehicle | undefined {
    return this.vehicles.find(v => v.id === id);
  }

  getVehicleStats() {
    return {
      total: this.vehicles.length,
      pending: this.vehicles.filter(v => v.status === 'pending').length,
      approved: this.vehicles.filter(v => v.status === 'approved').length,
      rejected: this.vehicles.filter(v => v.status === 'rejected').length,
      active: this.vehicles.filter(v => v.isActive).length
    };
  }

  getVehiclesByType(typeId: string): Vehicle[] {
    return this.vehicles.filter(v => v.typeId === typeId && v.status === 'approved');
  }

  canDriverTakeJob(driverId: string): boolean {
    const activeVehicle = this.getActiveVehicle(driverId);
    return activeVehicle !== undefined && activeVehicle.status === 'approved';
  }

  getDriverInfo(driverId: string) {
    const driver = this.drivers.find(d => d.id === driverId);
    if (!driver) return null;

    const activeVehicle = this.getActiveVehicle(driverId);
    const vehicleType = activeVehicle ? this.vehicleTypes.find(t => t.id === activeVehicle.typeId) : null;

    return {
      ...driver,
      activeVehicle,
      vehicleType,
      canTakeJob: this.canDriverTakeJob(driverId)
    };
  }
}

export const vehicleManager = new VehicleManager();