interface DeliveryZone {
  id: string;
  name: string;
  type: 'premium' | 'standard' | 'extended' | 'restricted';
  boundaries: Array<{ lat: number; lng: number }>;
  center: { lat: number; lng: number };
  radius: number; // km
  active: boolean;
  timeRestrictions: {
    enabled: boolean;
    allowedHours: Array<{ start: string; end: string; days: number[] }>;
    blackoutPeriods: Array<{ start: string; end: string; reason: string }>;
  };
  capacityLimits: {
    maxOrdersPerHour: number;
    maxDrivers: number;
    currentLoad: number;
  };
  serviceLevel: {
    minDeliveryTime: number; // minutes
    maxDeliveryTime: number;
    guaranteedDelivery: boolean;
  };
  restrictions: {
    minOrderValue: number;
    maxOrderValue?: number;
    allowedFoodTypes: string[];
    blockedFoodTypes: string[];
    requiresSpecialHandling: boolean;
  };
  pricing: {
    baseRate: number;
    perKmRate: number;
    surchargeMultiplier: number;
  };
}

interface ZoneAvailability {
  zoneId: string;
  available: boolean;
  reason?: string;
  nextAvailableTime?: string;
  estimatedWaitTime?: number;
}

export class ZoneManager {
  private zones: DeliveryZone[] = [
    {
      id: 'downtown',
      name: 'Downtown Core',
      type: 'premium',
      boundaries: [
        { lat: 42.3584, lng: -71.0598 },
        { lat: 42.3601, lng: -71.0589 },
        { lat: 42.3620, lng: -71.0570 },
        { lat: 42.3605, lng: -71.0550 }
      ],
      center: { lat: 42.3601, lng: -71.0589 },
      radius: 3,
      active: true,
      timeRestrictions: {
        enabled: true,
        allowedHours: [
          { start: '07:00', end: '23:00', days: [1,2,3,4,5] }, // Weekdays
          { start: '08:00', end: '24:00', days: [6,7] } // Weekends
        ],
        blackoutPeriods: []
      },
      capacityLimits: {
        maxOrdersPerHour: 50,
        maxDrivers: 8,
        currentLoad: 32
      },
      serviceLevel: {
        minDeliveryTime: 15,
        maxDeliveryTime: 45,
        guaranteedDelivery: true
      },
      restrictions: {
        minOrderValue: 15,
        allowedFoodTypes: ['frozen', 'fresh', 'hot', 'dry'],
        blockedFoodTypes: [],
        requiresSpecialHandling: false
      },
      pricing: {
        baseRate: 3.99,
        perKmRate: 0.50,
        surchargeMultiplier: 1.0
      }
    },
    {
      id: 'suburbs_north',
      name: 'North Suburbs',
      type: 'standard',
      boundaries: [
        { lat: 42.3700, lng: -71.1200 },
        { lat: 42.3900, lng: -71.1000 },
        { lat: 42.4000, lng: -71.0800 },
        { lat: 42.3800, lng: -71.0600 }
      ],
      center: { lat: 42.3850, lng: -71.0900 },
      radius: 8,
      active: true,
      timeRestrictions: {
        enabled: true,
        allowedHours: [
          { start: '08:00', end: '22:00', days: [1,2,3,4,5,6,7] }
        ],
        blackoutPeriods: [
          { start: '2024-01-20T12:00:00Z', end: '2024-01-20T14:00:00Z', reason: 'High traffic period' }
        ]
      },
      capacityLimits: {
        maxOrdersPerHour: 30,
        maxDrivers: 5,
        currentLoad: 18
      },
      serviceLevel: {
        minDeliveryTime: 30,
        maxDeliveryTime: 75,
        guaranteedDelivery: false
      },
      restrictions: {
        minOrderValue: 25,
        allowedFoodTypes: ['fresh', 'dry'],
        blockedFoodTypes: ['hot'],
        requiresSpecialHandling: true
      },
      pricing: {
        baseRate: 5.99,
        perKmRate: 0.75,
        surchargeMultiplier: 1.2
      }
    },
    {
      id: 'extended_area',
      name: 'Extended Coverage',
      type: 'extended',
      boundaries: [
        { lat: 42.2500, lng: -71.2500 },
        { lat: 42.4500, lng: -71.2000 },
        { lat: 42.4000, lng: -70.9000 },
        { lat: 42.3000, lng: -70.9500 }
      ],
      center: { lat: 42.3500, lng: -71.1000 },
      radius: 25,
      active: true,
      timeRestrictions: {
        enabled: true,
        allowedHours: [
          { start: '09:00', end: '20:00', days: [1,2,3,4,5] },
          { start: '10:00', end: '18:00', days: [6,7] }
        ],
        blackoutPeriods: []
      },
      capacityLimits: {
        maxOrdersPerHour: 15,
        maxDrivers: 3,
        currentLoad: 8
      },
      serviceLevel: {
        minDeliveryTime: 60,
        maxDeliveryTime: 120,
        guaranteedDelivery: false
      },
      restrictions: {
        minOrderValue: 50,
        allowedFoodTypes: ['dry'],
        blockedFoodTypes: ['frozen', 'hot'],
        requiresSpecialHandling: true
      },
      pricing: {
        baseRate: 8.99,
        perKmRate: 1.00,
        surchargeMultiplier: 1.5
      }
    }
  ];

  checkZoneAvailability(coordinates: { lat: number; lng: number }, orderValue: number, foodTypes: string[]): ZoneAvailability[] {
    return this.zones.map(zone => {
      // Check if location is within zone
      const isInZone = this.isPointInZone(coordinates, zone);
      if (!isInZone) {
        return { zoneId: zone.id, available: false, reason: 'Outside delivery area' };
      }

      // Check if zone is active
      if (!zone.active) {
        return { zoneId: zone.id, available: false, reason: 'Zone temporarily unavailable' };
      }

      // Check time restrictions
      const timeCheck = this.checkTimeRestrictions(zone);
      if (!timeCheck.allowed) {
        return {
          zoneId: zone.id,
          available: false,
          reason: timeCheck.reason,
          nextAvailableTime: timeCheck.nextAvailable
        };
      }

      // Check capacity limits
      const capacityCheck = this.checkCapacity(zone);
      if (!capacityCheck.available) {
        return {
          zoneId: zone.id,
          available: false,
          reason: 'Zone at capacity',
          estimatedWaitTime: capacityCheck.waitTime
        };
      }

      // Check order restrictions
      if (orderValue < zone.restrictions.minOrderValue) {
        return {
          zoneId: zone.id,
          available: false,
          reason: `Minimum order $${zone.restrictions.minOrderValue} required`
        };
      }

      // Check food type restrictions
      const blockedTypes = foodTypes.filter(type => zone.restrictions.blockedFoodTypes.includes(type));
      if (blockedTypes.length > 0) {
        return {
          zoneId: zone.id,
          available: false,
          reason: `${blockedTypes.join(', ')} not available in this zone`
        };
      }

      return { zoneId: zone.id, available: true };
    }).filter(result => result.available || result.reason);
  }

  private isPointInZone(point: { lat: number; lng: number }, zone: DeliveryZone): boolean {
    // Simple radius check for now
    const distance = this.calculateDistance(point, zone.center);
    return distance <= zone.radius;
  }

  private calculateDistance(point1: { lat: number; lng: number }, point2: { lat: number; lng: number }): number {
    const R = 6371; // Earth's radius in km
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLng = (point2.lng - point1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private checkTimeRestrictions(zone: DeliveryZone): { allowed: boolean; reason?: string; nextAvailable?: string } {
    if (!zone.timeRestrictions.enabled) return { allowed: true };

    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

    // Check blackout periods
    for (const blackout of zone.timeRestrictions.blackoutPeriods) {
      const start = new Date(blackout.start);
      const end = new Date(blackout.end);
      if (now >= start && now <= end) {
        return {
          allowed: false,
          reason: blackout.reason,
          nextAvailable: end.toISOString()
        };
      }
    }

    // Check allowed hours
    const todaySchedule = zone.timeRestrictions.allowedHours.find(schedule =>
      schedule.days.includes(currentDay)
    );

    if (!todaySchedule) {
      return { allowed: false, reason: 'No delivery service today' };
    }

    if (currentTime < todaySchedule.start || currentTime > todaySchedule.end) {
      return {
        allowed: false,
        reason: `Delivery hours: ${todaySchedule.start} - ${todaySchedule.end}`,
        nextAvailable: todaySchedule.start
      };
    }

    return { allowed: true };
  }

  private checkCapacity(zone: DeliveryZone): { available: boolean; waitTime?: number } {
    const utilizationRate = zone.capacityLimits.currentLoad / zone.capacityLimits.maxOrdersPerHour;
    
    if (utilizationRate >= 0.9) {
      const waitTime = Math.ceil((utilizationRate - 0.9) * 60); // Estimated wait in minutes
      return { available: false, waitTime };
    }

    return { available: true };
  }

  getZoneById(zoneId: string): DeliveryZone | undefined {
    return this.zones.find(zone => zone.id === zoneId);
  }

  getAllZones(): DeliveryZone[] {
    return this.zones;
  }

  getActiveZones(): DeliveryZone[] {
    return this.zones.filter(zone => zone.active);
  }

  updateZoneCapacity(zoneId: string, currentLoad: number): void {
    const zone = this.getZoneById(zoneId);
    if (zone) {
      zone.capacityLimits.currentLoad = currentLoad;
    }
  }

  toggleZoneStatus(zoneId: string, active: boolean): void {
    const zone = this.getZoneById(zoneId);
    if (zone) {
      zone.active = active;
    }
  }
}