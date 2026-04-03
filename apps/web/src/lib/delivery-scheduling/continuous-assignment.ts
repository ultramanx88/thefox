interface AutoAssignmentSettings {
  enabled: boolean;
  maxJobsPerDriver: number;
  priorityWeights: {
    distance: number;
    rating: number;
    workload: number;
  };
  timeBuffer: number; // minutes between jobs
  workingHours: { start: string; end: string };
}

interface ContinuousJobQueue {
  id: string;
  jobs: DeliveryJob[];
  isProcessing: boolean;
  lastProcessed: string;
}

export class ContinuousAssignmentManager {
  private autoSettings: AutoAssignmentSettings = {
    enabled: true,
    maxJobsPerDriver: 8,
    priorityWeights: { distance: 0.4, rating: 0.3, workload: 0.3 },
    timeBuffer: 15,
    workingHours: { start: '08:00', end: '20:00' }
  };
  
  private jobQueue: ContinuousJobQueue = {
    id: 'main_queue',
    jobs: [],
    isProcessing: false,
    lastProcessed: new Date().toISOString()
  };
  
  private intervalId: NodeJS.Timeout | null = null;

  startContinuousAssignment() {
    if (this.intervalId) return;
    
    this.intervalId = setInterval(() => {
      if (this.autoSettings.enabled && !this.jobQueue.isProcessing) {
        this.processJobQueue();
      }
    }, 30000); // Check every 30 seconds
  }

  stopContinuousAssignment() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  toggleAutoAssignment(enabled: boolean) {
    this.autoSettings.enabled = enabled;
    if (enabled) {
      this.startContinuousAssignment();
    } else {
      this.stopContinuousAssignment();
    }
  }

  addJobToQueue(job: DeliveryJob) {
    this.jobQueue.jobs.push(job);
    if (this.autoSettings.enabled) {
      this.processJobQueue();
    }
  }

  private async processJobQueue() {
    if (this.jobQueue.jobs.length === 0 || this.jobQueue.isProcessing) return;
    
    this.jobQueue.isProcessing = true;
    
    try {
      const unassignedJobs = this.jobQueue.jobs.filter(job => !job.driverId);
      
      for (const job of unassignedJobs) {
        const bestDriver = this.findBestDriver(job);
        if (bestDriver) {
          this.assignJobToDriver(job, bestDriver);
          this.removeJobFromQueue(job.id);
        }
      }
      
      this.jobQueue.lastProcessed = new Date().toISOString();
    } finally {
      this.jobQueue.isProcessing = false;
    }
  }

  private findBestDriver(job: DeliveryJob): DeliveryDriver | null {
    const availableDrivers = this.getAvailableDrivers(job.scheduledDate, job.timeSlot);
    if (availableDrivers.length === 0) return null;

    return availableDrivers.reduce((best, current) => {
      const bestScore = this.calculateDriverScore(best, job);
      const currentScore = this.calculateDriverScore(current, job);
      return currentScore > bestScore ? current : best;
    });
  }

  private calculateDriverScore(driver: DeliveryDriver, job: DeliveryJob): number {
    const distance = this.calculateDistance(driver.currentLocation, job.pickupLocation);
    const distanceScore = 1 / (distance + 1);
    const ratingScore = driver.rating / 5;
    const workloadScore = 1 - (this.getDriverWorkload(driver.id, job.scheduledDate) / this.autoSettings.maxJobsPerDriver);
    
    return (
      distanceScore * this.autoSettings.priorityWeights.distance +
      ratingScore * this.autoSettings.priorityWeights.rating +
      workloadScore * this.autoSettings.priorityWeights.workload
    );
  }

  private getAvailableDrivers(date: string, timeSlot: string): DeliveryDriver[] {
    return deliverySchedulingManager.getAvailableDrivers(date, timeSlot)
      .filter(driver => {
        const workload = this.getDriverWorkload(driver.id, date);
        return workload < this.autoSettings.maxJobsPerDriver;
      });
  }

  private getDriverWorkload(driverId: string, date: string): number {
    const schedule = deliverySchedulingManager.getDriverSchedule(driverId, date);
    return schedule?.jobs.length || 0;
  }

  private assignJobToDriver(job: DeliveryJob, driver: DeliveryDriver) {
    deliverySchedulingManager.assignJobToDriver(job.id, driver.id);
    console.log(`Auto-assigned job ${job.id} to driver ${driver.name}`);
  }

  private removeJobFromQueue(jobId: string) {
    this.jobQueue.jobs = this.jobQueue.jobs.filter(job => job.id !== jobId);
  }

  updateSettings(settings: Partial<AutoAssignmentSettings>) {
    this.autoSettings = { ...this.autoSettings, ...settings };
  }

  getSettings(): AutoAssignmentSettings {
    return { ...this.autoSettings };
  }

  getQueueStatus() {
    return {
      queueLength: this.jobQueue.jobs.length,
      isProcessing: this.jobQueue.isProcessing,
      lastProcessed: this.jobQueue.lastProcessed,
      autoAssignmentEnabled: this.autoSettings.enabled
    };
  }

  forceProcessQueue() {
    if (!this.jobQueue.isProcessing) {
      this.processJobQueue();
    }
  }

  clearQueue() {
    this.jobQueue.jobs = [];
  }

  private calculateDistance(point1: {lat: number, lng: number}, point2: {lat: number, lng: number}): number {
    const R = 6371;
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLng = (point2.lng - point1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }
}

export const continuousAssignmentManager = new ContinuousAssignmentManager();