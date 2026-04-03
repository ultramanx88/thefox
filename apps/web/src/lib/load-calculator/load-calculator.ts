interface VehicleCapacity {
  typeId: string;
  maxWeight: number; // kg
  maxVolume: number; // liters
  maxItems: number;
  specialConstraints: {
    fragileLimit: number;
    frozenLimit: number;
    liquidLimit: number;
  };
}

interface OrderLoad {
  orderId: string;
  items: LoadItem[];
  totalWeight: number;
  totalVolume: number;
  totalItems: number;
  specialRequirements: string[];
}

interface LoadItem {
  id: string;
  name: string;
  weight: number; // kg per unit
  volume: number; // liters per unit
  quantity: number;
  category: 'fragile' | 'frozen' | 'liquid' | 'dry' | 'fresh';
  stackable: boolean;
}

interface LoadOptimization {
  vehicleTypeId: string;
  orders: string[];
  totalWeight: number;
  totalVolume: number;
  totalItems: number;
  utilizationRate: number;
  canFit: boolean;
  warnings: string[];
}

export class LoadCalculator {
  private vehicleCapacities: Record<string, VehicleCapacity> = {
    motorcycle: {
      typeId: 'motorcycle',
      maxWeight: 30,
      maxVolume: 50,
      maxItems: 15,
      specialConstraints: {
        fragileLimit: 5,
        frozenLimit: 10,
        liquidLimit: 8
      }
    },
    car: {
      typeId: 'car',
      maxWeight: 200,
      maxVolume: 300,
      maxItems: 50,
      specialConstraints: {
        fragileLimit: 20,
        frozenLimit: 100,
        liquidLimit: 50
      }
    },
    pickup: {
      typeId: 'pickup',
      maxWeight: 500,
      maxVolume: 800,
      maxItems: 100,
      specialConstraints: {
        fragileLimit: 40,
        frozenLimit: 300,
        liquidLimit: 150
      }
    }
  };

  calculateOrderLoad(orderId: string, items: LoadItem[]): OrderLoad {
    let totalWeight = 0;
    let totalVolume = 0;
    let totalItems = 0;
    const specialRequirements: string[] = [];

    items.forEach(item => {
      totalWeight += item.weight * item.quantity;
      totalVolume += item.volume * item.quantity;
      totalItems += item.quantity;

      if (item.category === 'fragile' && !specialRequirements.includes('fragile')) {
        specialRequirements.push('fragile');
      }
      if (item.category === 'frozen' && !specialRequirements.includes('frozen')) {
        specialRequirements.push('frozen');
      }
      if (item.category === 'liquid' && !specialRequirements.includes('liquid')) {
        specialRequirements.push('liquid');
      }
    });

    return {
      orderId,
      items,
      totalWeight,
      totalVolume,
      totalItems,
      specialRequirements
    };
  }

  findOptimalVehicle(orderLoad: OrderLoad): string | null {
    const suitableVehicles = Object.values(this.vehicleCapacities)
      .filter(vehicle => this.canVehicleHandle(vehicle, orderLoad))
      .sort((a, b) => {
        // Sort by efficiency (smaller vehicle first if it can handle the load)
        const aEfficiency = this.calculateEfficiency(a, orderLoad);
        const bEfficiency = this.calculateEfficiency(b, orderLoad);
        return bEfficiency - aEfficiency;
      });

    return suitableVehicles.length > 0 ? suitableVehicles[0].typeId : null;
  }

  private canVehicleHandle(vehicle: VehicleCapacity, orderLoad: OrderLoad): boolean {
    if (orderLoad.totalWeight > vehicle.maxWeight) return false;
    if (orderLoad.totalVolume > vehicle.maxVolume) return false;
    if (orderLoad.totalItems > vehicle.maxItems) return false;

    // Check special constraints
    const fragileItems = orderLoad.items
      .filter(item => item.category === 'fragile')
      .reduce((sum, item) => sum + item.quantity, 0);
    if (fragileItems > vehicle.specialConstraints.fragileLimit) return false;

    const frozenItems = orderLoad.items
      .filter(item => item.category === 'frozen')
      .reduce((sum, item) => sum + item.quantity, 0);
    if (frozenItems > vehicle.specialConstraints.frozenLimit) return false;

    const liquidItems = orderLoad.items
      .filter(item => item.category === 'liquid')
      .reduce((sum, item) => sum + item.quantity, 0);
    if (liquidItems > vehicle.specialConstraints.liquidLimit) return false;

    return true;
  }

  private calculateEfficiency(vehicle: VehicleCapacity, orderLoad: OrderLoad): number {
    const weightUtilization = orderLoad.totalWeight / vehicle.maxWeight;
    const volumeUtilization = orderLoad.totalVolume / vehicle.maxVolume;
    const itemUtilization = orderLoad.totalItems / vehicle.maxItems;
    
    return Math.max(weightUtilization, volumeUtilization, itemUtilization);
  }

  optimizeMultipleOrders(orderLoads: OrderLoad[], vehicleTypeId: string): LoadOptimization {
    const vehicle = this.vehicleCapacities[vehicleTypeId];
    if (!vehicle) {
      throw new Error('Invalid vehicle type');
    }

    let totalWeight = 0;
    let totalVolume = 0;
    let totalItems = 0;
    const warnings: string[] = [];
    const compatibleOrders: string[] = [];

    // Sort orders by priority (smaller orders first for better packing)
    const sortedOrders = orderLoads.sort((a, b) => a.totalWeight - b.totalWeight);

    for (const orderLoad of sortedOrders) {
      const newWeight = totalWeight + orderLoad.totalWeight;
      const newVolume = totalVolume + orderLoad.totalVolume;
      const newItems = totalItems + orderLoad.totalItems;

      if (newWeight <= vehicle.maxWeight && 
          newVolume <= vehicle.maxVolume && 
          newItems <= vehicle.maxItems) {
        
        // Check special constraints
        if (this.checkSpecialConstraints(compatibleOrders.map(id => 
          orderLoads.find(o => o.orderId === id)!
        ).concat([orderLoad]), vehicle)) {
          
          totalWeight = newWeight;
          totalVolume = newVolume;
          totalItems = newItems;
          compatibleOrders.push(orderLoad.orderId);
        } else {
          warnings.push(`Order ${orderLoad.orderId}: Special constraint exceeded`);
        }
      } else {
        if (newWeight > vehicle.maxWeight) {
          warnings.push(`Order ${orderLoad.orderId}: Weight limit exceeded`);
        }
        if (newVolume > vehicle.maxVolume) {
          warnings.push(`Order ${orderLoad.orderId}: Volume limit exceeded`);
        }
        if (newItems > vehicle.maxItems) {
          warnings.push(`Order ${orderLoad.orderId}: Item count limit exceeded`);
        }
      }
    }

    const utilizationRate = Math.max(
      totalWeight / vehicle.maxWeight,
      totalVolume / vehicle.maxVolume,
      totalItems / vehicle.maxItems
    );

    return {
      vehicleTypeId,
      orders: compatibleOrders,
      totalWeight,
      totalVolume,
      totalItems,
      utilizationRate,
      canFit: compatibleOrders.length > 0,
      warnings
    };
  }

  private checkSpecialConstraints(orderLoads: OrderLoad[], vehicle: VehicleCapacity): boolean {
    const allItems = orderLoads.flatMap(order => order.items);
    
    const fragileCount = allItems
      .filter(item => item.category === 'fragile')
      .reduce((sum, item) => sum + item.quantity, 0);
    
    const frozenCount = allItems
      .filter(item => item.category === 'frozen')
      .reduce((sum, item) => sum + item.quantity, 0);
    
    const liquidCount = allItems
      .filter(item => item.category === 'liquid')
      .reduce((sum, item) => sum + item.quantity, 0);

    return fragileCount <= vehicle.specialConstraints.fragileLimit &&
           frozenCount <= vehicle.specialConstraints.frozenLimit &&
           liquidCount <= vehicle.specialConstraints.liquidLimit;
  }

  getLoadRecommendations(orderLoads: OrderLoad[]): Array<{
    vehicleType: string;
    optimization: LoadOptimization;
    efficiency: number;
  }> {
    const recommendations = Object.keys(this.vehicleCapacities).map(vehicleType => {
      const optimization = this.optimizeMultipleOrders([...orderLoads], vehicleType);
      const efficiency = optimization.utilizationRate;
      
      return {
        vehicleType,
        optimization,
        efficiency
      };
    }).filter(rec => rec.optimization.canFit)
      .sort((a, b) => b.efficiency - a.efficiency);

    return recommendations;
  }

  calculatePackingEfficiency(orderLoad: OrderLoad, vehicleTypeId: string): {
    weightEfficiency: number;
    volumeEfficiency: number;
    itemEfficiency: number;
    overallEfficiency: number;
    recommendations: string[];
  } {
    const vehicle = this.vehicleCapacities[vehicleTypeId];
    if (!vehicle) {
      throw new Error('Invalid vehicle type');
    }

    const weightEfficiency = (orderLoad.totalWeight / vehicle.maxWeight) * 100;
    const volumeEfficiency = (orderLoad.totalVolume / vehicle.maxVolume) * 100;
    const itemEfficiency = (orderLoad.totalItems / vehicle.maxItems) * 100;
    const overallEfficiency = Math.max(weightEfficiency, volumeEfficiency, itemEfficiency);

    const recommendations: string[] = [];
    
    if (weightEfficiency > 90) {
      recommendations.push('น้ำหนักใกล้เต็มแล้ว - พิจารณาใช้รถที่ใหญ่กว่า');
    }
    if (volumeEfficiency > 90) {
      recommendations.push('ปริมาตรใกล้เต็มแล้ว - จัดเรียงสินค้าให้กระชับ');
    }
    if (itemEfficiency > 90) {
      recommendations.push('จำนวนสินค้าเยอะ - แบ่งเป็นหลายเที่ยว');
    }
    if (overallEfficiency < 50) {
      recommendations.push('ใช้ประสิทธิภาพต่ำ - พิจารณาใช้รถที่เล็กกว่า');
    }

    return {
      weightEfficiency,
      volumeEfficiency,
      itemEfficiency,
      overallEfficiency,
      recommendations
    };
  }

  getVehicleCapacity(vehicleTypeId: string): VehicleCapacity | null {
    return this.vehicleCapacities[vehicleTypeId] || null;
  }

  updateVehicleCapacity(vehicleTypeId: string, capacity: VehicleCapacity): void {
    this.vehicleCapacities[vehicleTypeId] = capacity;
  }
}

export const loadCalculator = new LoadCalculator();