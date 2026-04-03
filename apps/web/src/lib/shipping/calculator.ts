interface ShippingZone {
  id: string;
  name: string;
  baseRate: number;
  perKmRate: number;
  maxDistance: number;
}

interface FoodCategory {
  id: string;
  name: string;
  multiplier: number;
  specialHandling: number;
  temperatureControl: boolean;
}

interface TimeSlot {
  id: string;
  name: string;
  multiplier: number;
  available: boolean;
}

interface ShippingCalculation {
  baseRate: number;
  distanceRate: number;
  foodHandling: number;
  temperatureControl: number;
  timeSlotSurcharge: number;
  urgencyFee: number;
  fuelSurcharge: number;
  weatherSurcharge: number;
  total: number;
  breakdown: Array<{ label: string; amount: number; description: string }>;
}

export class ShippingCalculator {
  private zones: ShippingZone[] = [
    { id: 'zone1', name: 'City Center', baseRate: 3.99, perKmRate: 0.5, maxDistance: 5 },
    { id: 'zone2', name: 'Suburbs', baseRate: 5.99, perKmRate: 0.75, maxDistance: 15 },
    { id: 'zone3', name: 'Extended Area', baseRate: 8.99, perKmRate: 1.0, maxDistance: 30 }
  ];

  private foodCategories: FoodCategory[] = [
    { id: 'frozen', name: 'Frozen Foods', multiplier: 1.5, specialHandling: 2.0, temperatureControl: true },
    { id: 'fresh', name: 'Fresh/Chilled', multiplier: 1.3, specialHandling: 1.5, temperatureControl: true },
    { id: 'hot', name: 'Hot Foods', multiplier: 1.4, specialHandling: 1.8, temperatureControl: true },
    { id: 'dry', name: 'Dry Goods', multiplier: 1.0, specialHandling: 0, temperatureControl: false }
  ];

  private timeSlots: TimeSlot[] = [
    { id: 'standard', name: 'Standard (2-4 hours)', multiplier: 1.0, available: true },
    { id: 'express', name: 'Express (1-2 hours)', multiplier: 1.5, available: true },
    { id: 'rush', name: 'Rush (30-60 min)', multiplier: 2.0, available: true },
    { id: 'scheduled', name: 'Scheduled Delivery', multiplier: 0.9, available: true }
  ];

  calculateShipping(params: {
    distance: number;
    weight: number;
    orderValue: number;
    foodCategories: string[];
    timeSlot: string;
    isUrgent: boolean;
    weatherCondition: 'normal' | 'rain' | 'snow' | 'storm';
    fuelPrice: number;
  }): ShippingCalculation {
    const zone = this.getZoneByDistance(params.distance);
    const timeSlot = this.timeSlots.find(t => t.id === params.timeSlot) || this.timeSlots[0];
    
    // Base rate calculation
    const baseRate = zone.baseRate;
    
    // Distance-based rate
    const distanceRate = params.distance * zone.perKmRate;
    
    // Food handling fees
    let foodHandling = 0;
    let temperatureControl = 0;
    
    params.foodCategories.forEach(categoryId => {
      const category = this.foodCategories.find(c => c.id === categoryId);
      if (category) {
        foodHandling += category.specialHandling;
        if (category.temperatureControl) {
          temperatureControl += 1.5;
        }
      }
    });
    
    // Time slot surcharge
    const timeSlotSurcharge = baseRate * (timeSlot.multiplier - 1);
    
    // Urgency fee
    const urgencyFee = params.isUrgent ? 5.0 : 0;
    
    // Fuel surcharge (based on current fuel prices)
    const baseFuelPrice = 1.5; // Base fuel price per liter
    const fuelSurchargeRate = Math.max(0, (params.fuelPrice - baseFuelPrice) * 0.1);
    const fuelSurcharge = params.distance * fuelSurchargeRate;
    
    // Weather surcharge
    const weatherMultipliers = { normal: 0, rain: 1.5, snow: 3.0, storm: 5.0 };
    const weatherSurcharge = weatherMultipliers[params.weatherCondition];
    
    // Calculate total
    const subtotal = baseRate + distanceRate + foodHandling + temperatureControl + 
                    timeSlotSurcharge + urgencyFee + fuelSurcharge + weatherSurcharge;
    
    // Free shipping threshold
    const freeShippingThreshold = 75;
    const total = params.orderValue >= freeShippingThreshold ? 0 : subtotal;
    
    // Create breakdown
    const breakdown = [
      { label: 'Base Rate', amount: baseRate, description: `${zone.name} delivery zone` },
      { label: 'Distance Fee', amount: distanceRate, description: `${params.distance.toFixed(1)} km × $${zone.perKmRate}/km` },
      { label: 'Food Handling', amount: foodHandling, description: 'Special food category handling' },
      { label: 'Temperature Control', amount: temperatureControl, description: 'Cold/hot chain maintenance' },
      { label: 'Time Slot', amount: timeSlotSurcharge, description: timeSlot.name },
      { label: 'Urgency Fee', amount: urgencyFee, description: 'Priority delivery' },
      { label: 'Fuel Surcharge', amount: fuelSurcharge, description: 'Current fuel price adjustment' },
      { label: 'Weather Surcharge', amount: weatherSurcharge, description: `${params.weatherCondition} conditions` }
    ].filter(item => item.amount > 0);

    if (params.orderValue >= freeShippingThreshold) {
      breakdown.push({
        label: 'Free Shipping Discount',
        amount: -subtotal,
        description: `Orders over $${freeShippingThreshold} qualify for free shipping`
      });
    }

    return {
      baseRate,
      distanceRate,
      foodHandling,
      temperatureControl,
      timeSlotSurcharge,
      urgencyFee,
      fuelSurcharge,
      weatherSurcharge,
      total,
      breakdown
    };
  }

  private getZoneByDistance(distance: number): ShippingZone {
    return this.zones.find(zone => distance <= zone.maxDistance) || this.zones[this.zones.length - 1];
  }

  getAvailableTimeSlots(): TimeSlot[] {
    return this.timeSlots.filter(slot => slot.available);
  }

  getFoodCategories(): FoodCategory[] {
    return this.foodCategories;
  }

  getShippingZones(): ShippingZone[] {
    return this.zones;
  }
}