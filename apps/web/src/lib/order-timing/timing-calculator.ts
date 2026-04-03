interface OrderItem {
  id: string;
  name: string;
  category: 'fresh' | 'frozen' | 'dry' | 'fragile';
  weight: number; // kg
  quantity: number;
  preparationTime: number; // minutes per unit
  freshnessLevel: 'high' | 'medium' | 'low'; // how quickly it spoils
  specialHandling: boolean;
}

interface DeliveryLocation {
  lat: number;
  lng: number;
  address: string;
}

interface TrafficCondition {
  level: 'light' | 'moderate' | 'heavy' | 'severe';
  multiplier: number;
  timeOfDay: string;
}

interface OrderTiming {
  orderId: string;
  storeId: string;
  items: OrderItem[];
  pickupLocation: DeliveryLocation;
  deliveryLocation: DeliveryLocation;
  preparationTime: number; // minutes
  travelTime: number; // minutes
  bufferTime: number; // minutes
  totalTime: number; // minutes
  readyTime: string; // ISO string
  pickupTime: string; // ISO string
  deliveryTime: string; // ISO string
  driverAssignTime: string; // when to assign driver
}

export class OrderTimingCalculator {
  private trafficPatterns: Record<string, TrafficCondition> = {
    '06:00-09:00': { level: 'heavy', multiplier: 1.8, timeOfDay: 'morning_rush' },
    '09:00-11:00': { level: 'moderate', multiplier: 1.2, timeOfDay: 'morning' },
    '11:00-13:00': { level: 'heavy', multiplier: 1.6, timeOfDay: 'lunch_rush' },
    '13:00-16:00': { level: 'light', multiplier: 1.0, timeOfDay: 'afternoon' },
    '16:00-19:00': { level: 'heavy', multiplier: 1.7, timeOfDay: 'evening_rush' },
    '19:00-22:00': { level: 'moderate', multiplier: 1.3, timeOfDay: 'evening' },
    '22:00-06:00': { level: 'light', multiplier: 0.8, timeOfDay: 'night' }
  };

  calculateOrderTiming(order: Omit<OrderTiming, 'preparationTime' | 'travelTime' | 'bufferTime' | 'totalTime' | 'readyTime' | 'pickupTime' | 'deliveryTime' | 'driverAssignTime'>): OrderTiming {
    const preparationTime = this.calculatePreparationTime(order.items);
    const travelTime = this.calculateTravelTime(order.pickupLocation, order.deliveryLocation);
    const bufferTime = this.calculateBufferTime(order.items, preparationTime);
    
    const now = new Date();
    const readyTime = new Date(now.getTime() + preparationTime * 60000);
    const pickupTime = new Date(readyTime.getTime() + bufferTime * 60000);
    const deliveryTime = new Date(pickupTime.getTime() + travelTime * 60000);
    
    // Calculate when to assign driver (15 minutes before pickup)
    const driverAssignTime = new Date(pickupTime.getTime() - 15 * 60000);
    
    return {
      ...order,
      preparationTime,
      travelTime,
      bufferTime,
      totalTime: preparationTime + bufferTime + travelTime,
      readyTime: readyTime.toISOString(),
      pickupTime: pickupTime.toISOString(),
      deliveryTime: deliveryTime.toISOString(),
      driverAssignTime: driverAssignTime.toISOString()
    };
  }

  private calculatePreparationTime(items: OrderItem[]): number {
    let totalTime = 0;
    let complexityMultiplier = 1;
    
    items.forEach(item => {
      // Base preparation time
      const itemTime = item.preparationTime * item.quantity;
      
      // Freshness factor
      const freshnessMultiplier = {
        high: 1.5, // Fresh items need more careful handling
        medium: 1.2,
        low: 1.0
      };
      
      // Weight factor (heavier items take longer to handle)
      const weightMultiplier = item.weight > 5 ? 1.3 : 1.0;
      
      // Special handling factor
      const specialMultiplier = item.specialHandling ? 1.4 : 1.0;
      
      totalTime += itemTime * freshnessMultiplier[item.freshnessLevel] * weightMultiplier * specialMultiplier;
    });
    
    // Complexity multiplier based on number of different categories
    const categories = new Set(items.map(item => item.category));
    if (categories.size > 2) complexityMultiplier = 1.2;
    if (categories.size > 3) complexityMultiplier = 1.4;
    
    // Minimum preparation time
    const finalTime = Math.max(totalTime * complexityMultiplier, 10);
    
    return Math.ceil(finalTime);
  }

  private calculateTravelTime(pickup: DeliveryLocation, delivery: DeliveryLocation): number {
    // Calculate distance (simplified)
    const distance = this.calculateDistance(pickup, delivery);
    
    // Base travel time (assuming 30 km/h average speed)
    let baseTime = (distance / 30) * 60; // minutes
    
    // Apply traffic multiplier based on current time
    const currentHour = new Date().getHours();
    const trafficMultiplier = this.getTrafficMultiplier(currentHour);
    
    return Math.ceil(baseTime * trafficMultiplier);
  }

  private calculateDistance(point1: DeliveryLocation, point2: DeliveryLocation): number {
    const R = 6371; // Earth's radius in km
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLng = (point2.lng - point1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  private getTrafficMultiplier(hour: number): number {
    for (const [timeRange, condition] of Object.entries(this.trafficPatterns)) {
      const [start, end] = timeRange.split('-').map(t => parseInt(t.split(':')[0]));
      if ((start <= hour && hour < end) || (start > end && (hour >= start || hour < end))) {
        return condition.multiplier;
      }
    }
    return 1.0;
  }

  private calculateBufferTime(items: OrderItem[], preparationTime: number): number {
    // Base buffer time
    let bufferTime = 5;
    
    // Add buffer for fresh items
    const hasFreshItems = items.some(item => item.freshnessLevel === 'high');
    if (hasFreshItems) bufferTime += 3;
    
    // Add buffer for fragile items
    const hasFragileItems = items.some(item => item.category === 'fragile');
    if (hasFragileItems) bufferTime += 2;
    
    // Add buffer based on preparation complexity
    if (preparationTime > 30) bufferTime += 5;
    if (preparationTime > 60) bufferTime += 10;
    
    return bufferTime;
  }

  scheduleDriverAssignment(orderTiming: OrderTiming): void {
    const assignTime = new Date(orderTiming.driverAssignTime);
    const now = new Date();
    
    if (assignTime > now) {
      const delay = assignTime.getTime() - now.getTime();
      setTimeout(() => {
        this.assignDriver(orderTiming);
      }, delay);
    } else {
      // Assign immediately if time has passed
      this.assignDriver(orderTiming);
    }
  }

  private assignDriver(orderTiming: OrderTiming): void {
    console.log(`Auto-assigning driver for order ${orderTiming.orderId} at ${new Date().toISOString()}`);
    // Integration with delivery scheduling system
  }

  getEstimatedDeliveryTime(orderId: string, items: OrderItem[], pickup: DeliveryLocation, delivery: DeliveryLocation): string {
    const timing = this.calculateOrderTiming({
      orderId,
      storeId: 'store_001',
      items,
      pickupLocation: pickup,
      deliveryLocation: delivery
    });
    
    return new Date(timing.deliveryTime).toLocaleString('th-TH');
  }

  getOptimalOrderTime(targetDeliveryTime: string, items: OrderItem[], pickup: DeliveryLocation, delivery: DeliveryLocation): string {
    const targetTime = new Date(targetDeliveryTime);
    const timing = this.calculateOrderTiming({
      orderId: 'temp',
      storeId: 'store_001',
      items,
      pickupLocation: pickup,
      deliveryLocation: delivery
    });
    
    const optimalOrderTime = new Date(targetTime.getTime() - timing.totalTime * 60000);
    return optimalOrderTime.toISOString();
  }

  updateTrafficConditions(timeRange: string, condition: TrafficCondition): void {
    this.trafficPatterns[timeRange] = condition;
  }

  getTimingBreakdown(orderTiming: OrderTiming) {
    return {
      preparation: {
        time: orderTiming.preparationTime,
        description: 'เวลาจัดเตรียมสินค้า'
      },
      buffer: {
        time: orderTiming.bufferTime,
        description: 'เวลาสำรอง'
      },
      travel: {
        time: orderTiming.travelTime,
        description: 'เวลาเดินทาง'
      },
      total: {
        time: orderTiming.totalTime,
        description: 'เวลารวมทั้งหมด'
      }
    };
  }
}

export const orderTimingCalculator = new OrderTimingCalculator();