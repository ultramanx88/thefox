interface DeliveryDriver {
  id: string;
  name: string;
  phone: string;
  vehicleType: 'motorcycle' | 'car' | 'bicycle';
  maxOrders: number;
  workingHours: { start: string; end: string };
  availability: string[]; // dates available
  currentLocation: { lat: number; lng: number };
  rating: number;
  status: 'available' | 'busy' | 'offline';
}

interface DeliveryJob {
  id: string;
  orderId: string;
  driverId?: string;
  scheduledDate: string;
  timeSlot: string;
  pickupLocation: { lat: number; lng: number; address: string };
  deliveryLocation: { lat: number; lng: number; address: string };
  estimatedDuration: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'scheduled' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  specialInstructions?: string;
}

interface DeliverySchedule {
  driverId: string;
  date: string;
  jobs: DeliveryJob[];
  totalHours: number;
  estimatedEarnings: number;
}

export class DeliverySchedulingManager {
  private drivers: DeliveryDriver[] = [
    {
      id: 'driver_001',
      name: 'สมชาย ใจดี',
      phone: '081-234-5678',
      vehicleType: 'motorcycle',
      maxOrders: 8,
      workingHours: { start: '08:00', end: '20:00' },
      availability: [],
      currentLocation: { lat: 13.7563, lng: 100.5018 },
      rating: 4.8,
      status: 'available'
    }
  ];
  
  private jobs: DeliveryJob[] = [];
  private schedules: DeliverySchedule[] = [];

  createAdvanceSchedule(startDate: string, endDate: string) {
    const dates = this.getDateRange(startDate, endDate);
    
    dates.forEach(date => {
      this.drivers.forEach(driver => {
        if (driver.availability.includes(date)) {
          const schedule: DeliverySchedule = {
            driverId: driver.id,
            date,
            jobs: [],
            totalHours: 0,
            estimatedEarnings: 0
          };
          this.schedules.push(schedule);
        }
      });
    });
  }

  private getDateRange(start: string, end: string): string[] {
    const dates: string[] = [];
    const current = new Date(start);
    const endDate = new Date(end);
    
    while (current <= endDate) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
    
    return dates;
  }

  scheduleJob(job: Omit<DeliveryJob, 'id' | 'status'>) {
    const newJob: DeliveryJob = {
      ...job,
      id: `job_${Date.now()}`,
      status: 'scheduled'
    };
    
    this.jobs.push(newJob);
    
    if (!job.driverId) {
      this.autoAssignDriver(newJob);
    } else {
      this.assignJobToDriver(newJob.id, job.driverId);
    }
  }

  private autoAssignDriver(job: DeliveryJob) {
    const availableDrivers = this.drivers.filter(driver => 
      driver.status === 'available' && 
      driver.availability.includes(job.scheduledDate)
    );

    if (availableDrivers.length === 0) return;

    // Find best driver based on location, capacity, and rating
    const bestDriver = availableDrivers.reduce((best, current) => {
      const bestDistance = this.calculateDistance(
        best.currentLocation, 
        job.pickupLocation
      );
      const currentDistance = this.calculateDistance(
        current.currentLocation, 
        job.pickupLocation
      );
      
      const bestScore = (best.rating * 0.4) + ((1 / bestDistance) * 0.6);
      const currentScore = (current.rating * 0.4) + ((1 / currentDistance) * 0.6);
      
      return currentScore > bestScore ? current : best;
    });

    this.assignJobToDriver(job.id, bestDriver.id);
  }

  private calculateDistance(point1: {lat: number, lng: number}, point2: {lat: number, lng: number}): number {
    const R = 6371; // Earth's radius in km
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLng = (point2.lng - point1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  assignJobToDriver(jobId: string, driverId: string) {
    const job = this.jobs.find(j => j.id === jobId);
    const driver = this.drivers.find(d => d.id === driverId);
    
    if (!job || !driver) return;

    job.driverId = driverId;
    job.status = 'assigned';

    const schedule = this.schedules.find(s => 
      s.driverId === driverId && s.date === job.scheduledDate
    );

    if (schedule) {
      schedule.jobs.push(job);
      schedule.totalHours += job.estimatedDuration / 60;
      schedule.estimatedEarnings += this.calculateJobEarnings(job);
    }
  }

  private calculateJobEarnings(job: DeliveryJob): number {
    const baseRate = 50; // base rate per job
    const distanceRate = 5; // per km
    const priorityMultiplier = {
      low: 1,
      medium: 1.2,
      high: 1.5,
      urgent: 2
    };
    
    const distance = this.calculateDistance(job.pickupLocation, job.deliveryLocation);
    return (baseRate + (distance * distanceRate)) * priorityMultiplier[job.priority];
  }

  getDriverSchedule(driverId: string, date: string): DeliverySchedule | undefined {
    return this.schedules.find(s => s.driverId === driverId && s.date === date);
  }

  getAvailableDrivers(date: string, timeSlot: string): DeliveryDriver[] {
    return this.drivers.filter(driver => {
      const schedule = this.getDriverSchedule(driver.id, date);
      const currentJobs = schedule?.jobs.length || 0;
      
      return driver.availability.includes(date) && 
             currentJobs < driver.maxOrders &&
             this.isTimeSlotAvailable(driver.id, date, timeSlot);
    });
  }

  private isTimeSlotAvailable(driverId: string, date: string, timeSlot: string): boolean {
    const schedule = this.getDriverSchedule(driverId, date);
    if (!schedule) return true;
    
    return !schedule.jobs.some(job => job.timeSlot === timeSlot);
  }

  updateDriverAvailability(driverId: string, dates: string[]) {
    const driver = this.drivers.find(d => d.id === driverId);
    if (driver) {
      driver.availability = dates;
    }
  }

  getScheduleOverview(startDate: string, endDate: string) {
    const dates = this.getDateRange(startDate, endDate);
    
    return dates.map(date => {
      const daySchedules = this.schedules.filter(s => s.date === date);
      const totalJobs = daySchedules.reduce((sum, s) => sum + s.jobs.length, 0);
      const totalDrivers = daySchedules.length;
      const unassignedJobs = this.jobs.filter(j => 
        j.scheduledDate === date && j.status === 'scheduled'
      ).length;
      
      return {
        date,
        totalJobs,
        totalDrivers,
        unassignedJobs,
        capacity: daySchedules.reduce((sum, s) => {
          const driver = this.drivers.find(d => d.id === s.driverId);
          return sum + (driver?.maxOrders || 0);
        }, 0)
      };
    });
  }

  optimizeSchedules(date: string) {
    const daySchedules = this.schedules.filter(s => s.date === date);
    
    daySchedules.forEach(schedule => {
      // Sort jobs by priority and location for optimal routing
      schedule.jobs.sort((a, b) => {
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });
    });
  }
}

export const deliverySchedulingManager = new DeliverySchedulingManager();