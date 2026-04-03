interface DriverRating {
  id: string;
  driverId: string;
  orderId: string;
  customerId: string;
  rating: number; // 1-5
  comment?: string;
  criteria: {
    speed: number;
    politeness: number;
    foodCondition: number;
    communication: number;
  };
  createdAt: string;
}

interface DriverPerformance {
  driverId: string;
  name: string;
  totalRatings: number;
  averageRating: number;
  totalDeliveries: number;
  onTimeDeliveries: number;
  lateDeliveries: number;
  cancelledOrders: number;
  criteriaAverages: {
    speed: number;
    politeness: number;
    foodCondition: number;
    communication: number;
  };
  monthlyStats: Array<{
    month: string;
    rating: number;
    deliveries: number;
  }>;
  badges: string[];
}

export class DriverRatingManager {
  private ratings: DriverRating[] = [];
  private drivers: DriverPerformance[] = [
    {
      driverId: 'driver_001',
      name: 'สมชาย ใจดี',
      totalRatings: 0,
      averageRating: 0,
      totalDeliveries: 0,
      onTimeDeliveries: 0,
      lateDeliveries: 0,
      cancelledOrders: 0,
      criteriaAverages: { speed: 0, politeness: 0, foodCondition: 0, communication: 0 },
      monthlyStats: [],
      badges: []
    }
  ];

  addRating(rating: Omit<DriverRating, 'id' | 'createdAt'>) {
    const newRating: DriverRating = {
      ...rating,
      id: `rating_${Date.now()}`,
      createdAt: new Date().toISOString()
    };

    this.ratings.push(newRating);
    this.updateDriverPerformance(rating.driverId);
    return newRating;
  }

  private updateDriverPerformance(driverId: string) {
    const driver = this.drivers.find(d => d.driverId === driverId);
    if (!driver) return;

    const driverRatings = this.ratings.filter(r => r.driverId === driverId);
    
    driver.totalRatings = driverRatings.length;
    driver.averageRating = driverRatings.reduce((sum, r) => sum + r.rating, 0) / driverRatings.length;
    
    // Calculate criteria averages
    driver.criteriaAverages = {
      speed: driverRatings.reduce((sum, r) => sum + r.criteria.speed, 0) / driverRatings.length,
      politeness: driverRatings.reduce((sum, r) => sum + r.criteria.politeness, 0) / driverRatings.length,
      foodCondition: driverRatings.reduce((sum, r) => sum + r.criteria.foodCondition, 0) / driverRatings.length,
      communication: driverRatings.reduce((sum, r) => sum + r.criteria.communication, 0) / driverRatings.length
    };

    this.updateBadges(driver);
  }

  private updateBadges(driver: DriverPerformance) {
    driver.badges = [];
    
    if (driver.averageRating >= 4.8) driver.badges.push('⭐ Super Driver');
    if (driver.averageRating >= 4.5) driver.badges.push('🏆 Top Rated');
    if (driver.totalDeliveries >= 100) driver.badges.push('💯 Century Club');
    if (driver.onTimeDeliveries / driver.totalDeliveries >= 0.95) driver.badges.push('⏰ Always On Time');
    if (driver.criteriaAverages.politeness >= 4.7) driver.badges.push('😊 Super Friendly');
    if (driver.criteriaAverages.speed >= 4.5) driver.badges.push('🚀 Speed Demon');
  }

  recordDelivery(driverId: string, onTime: boolean, cancelled: boolean = false) {
    const driver = this.drivers.find(d => d.driverId === driverId);
    if (!driver) return;

    driver.totalDeliveries++;
    if (cancelled) {
      driver.cancelledOrders++;
    } else if (onTime) {
      driver.onTimeDeliveries++;
    } else {
      driver.lateDeliveries++;
    }

    this.updateBadges(driver);
  }

  getDriverPerformance(driverId: string): DriverPerformance | undefined {
    return this.drivers.find(d => d.driverId === driverId);
  }

  getAllDrivers(): DriverPerformance[] {
    return this.drivers.sort((a, b) => b.averageRating - a.averageRating);
  }

  getTopDrivers(limit: number = 10): DriverPerformance[] {
    return this.drivers
      .filter(d => d.totalRatings >= 5)
      .sort((a, b) => b.averageRating - a.averageRating)
      .slice(0, limit);
  }

  getDriverRatings(driverId: string): DriverRating[] {
    return this.ratings.filter(r => r.driverId === driverId);
  }

  getRecentRatings(limit: number = 20): DriverRating[] {
    return this.ratings
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  getDriverStats() {
    const totalDrivers = this.drivers.length;
    const activeDrivers = this.drivers.filter(d => d.totalDeliveries > 0).length;
    const avgRating = this.drivers.reduce((sum, d) => sum + d.averageRating, 0) / totalDrivers;
    
    return {
      totalDrivers,
      activeDrivers,
      avgRating: avgRating || 0,
      totalRatings: this.ratings.length,
      excellentDrivers: this.drivers.filter(d => d.averageRating >= 4.5).length
    };
  }

  searchDrivers(query: string): DriverPerformance[] {
    return this.drivers.filter(d => 
      d.name.toLowerCase().includes(query.toLowerCase()) ||
      d.driverId.includes(query)
    );
  }

  getDriversByRatingRange(min: number, max: number): DriverPerformance[] {
    return this.drivers.filter(d => 
      d.averageRating >= min && d.averageRating <= max && d.totalRatings > 0
    );
  }
}

export const driverRatingManager = new DriverRatingManager();