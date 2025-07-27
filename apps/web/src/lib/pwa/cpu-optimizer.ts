/**
 * CPU Usage Optimizer
 * Optimizes CPU usage for background processes and manages task scheduling
 */

export interface CPUMetrics {
  estimatedUsage: number; // 0-100%
  activeTasks: number;
  backgroundTasks: number;
  longTasks: number;
  averageTaskDuration: number;
  mainThreadBlocking: number;
}

export interface TaskPriority {
  level: 'critical' | 'high' | 'medium' | 'low' | 'idle';
  weight: number;
  maxConcurrent: number;
  timeSlice: number; // milliseconds
  canDefer: boolean;
}

export interface ScheduledTask {
  id: string;
  name: string;
  priority: TaskPriority;
  execute: () => Promise<any>;
  estimatedDuration: number;
  createdAt: number;
  scheduledAt: number;
  attempts: number;
  maxAttempts: number;
  dependencies?: string[];
}

export interface CPUOptimizerConfig {
  maxConcurrentTasks: number;
  taskTimeSlice: number; // milliseconds
  idleThreshold: number; // milliseconds
  longTaskThreshold: number; // milliseconds
  adaptiveScheduling: boolean;
  yieldToMain: boolean;
  batteryOptimization: boolean;
  thermalThrottling: boolean;
}

export class CPUOptimizer {
  private config: CPUOptimizerConfig;
  private taskQueue: Map<string, ScheduledTask[]> = new Map();
  private activeTasks: Map<string, ScheduledTask> = new Map();
  private completedTasks: ScheduledTask[] = [];
  private metrics: CPUMetrics;
  private longTaskObserver?: PerformanceObserver;
  private isProcessing = false;
  private yieldController?: AbortController;

  constructor(config: Partial<CPUOptimizerConfig> = {}) {
    this.config = {
      maxConcurrentTasks: 3,
      taskTimeSlice: 50, // 50ms
      idleThreshold: 16, // 16ms (60fps)
      longTaskThreshold: 50, // 50ms
      adaptiveScheduling: true,
      yieldToMain: true,
      batteryOptimization: true,
      thermalThrottling: false,
      ...config
    };

    this.metrics = {
      estimatedUsage: 0,
      activeTasks: 0,
      backgroundTasks: 0,
      longTasks: 0,
      averageTaskDuration: 0,
      mainThreadBlocking: 0
    };

    this.initialize();
  }

  /**
   * Initialize CPU optimizer
   */
  private initialize(): void {
    this.setupTaskQueues();
    this.setupPerformanceMonitoring();
    this.startTaskScheduler();
    
    console.log('CPU optimizer initialized');
  }

  /**
   * Schedule a task with specified priority
   */
  async scheduleTask(
    name: string,
    execute: () => Promise<any>,
    priority: 'critical' | 'high' | 'medium' | 'low' | 'idle' = 'medium',
    estimatedDuration: number = 10,
    dependencies: string[] = []
  ): Promise<string> {
    const taskPriority = this.getPriorityConfig(priority);
    const task: ScheduledTask = {
      id: this.generateTaskId(),
      name,
      priority: taskPriority,
      execute,
      estimatedDuration,
      createdAt: Date.now(),
      scheduledAt: this.calculateScheduledTime(taskPriority),
      attempts: 0,
      maxAttempts: 3,
      dependencies
    };

    // Add to appropriate queue
    const queue = this.taskQueue.get(priority) || [];
    queue.push(task);
    this.taskQueue.set(priority, queue);

    // Sort queue by scheduled time
    this.sortQueue(priority);

    console.log(`Scheduled ${priority} priority task: ${name} (${task.id})`);
    
    // Trigger immediate processing for critical tasks
    if (priority === 'critical') {
      this.processTaskQueues();
    }

    return task.id;
  }

  /**
   * Cancel a scheduled task
   */
  cancelTask(taskId: string): boolean {
    // Check active tasks first
    if (this.activeTasks.has(taskId)) {
      const task = this.activeTasks.get(taskId)!;
      this.activeTasks.delete(taskId);
      console.log(`Cancelled active task: ${task.name}`);
      return true;
    }

    // Check queued tasks
    for (const [priority, queue] of this.taskQueue.entries()) {
      const index = queue.findIndex(task => task.id === taskId);
      if (index !== -1) {
        const task = queue.splice(index, 1)[0];
        console.log(`Cancelled queued task: ${task.name}`);
        return true;
      }
    }

    return false;
  }

  /**
   * Get current CPU metrics
   */
  getCPUMetrics(): CPUMetrics {
    return { ...this.metrics };
  }

  /**
   * Optimize CPU usage for background processes
   */
  async optimizeBackgroundProcesses(): Promise<void> {
    console.log('Optimizing background processes');

    // Defer low priority tasks if CPU usage is high
    if (this.metrics.estimatedUsage > 80) {
      await this.deferLowPriorityTasks();
    }

    // Reduce concurrent tasks if main thread is blocked
    if (this.metrics.mainThreadBlocking > this.config.longTaskThreshold) {
      await this.reduceTaskConcurrency();
    }

    // Implement thermal throttling if supported
    if (this.config.thermalThrottling) {
      await this.handleThermalThrottling();
    }

    // Battery optimization
    if (this.config.batteryOptimization) {
      await this.optimizeForBattery();
    }
  }

  /**
   * Yield control to main thread
   */
  async yieldToMainThread(): Promise<void> {
    if (!this.config.yieldToMain) return;

    return new Promise(resolve => {
      if ('scheduler' in window && 'postTask' in (window as any).scheduler) {
        // Use Scheduler API if available
        (window as any).scheduler.postTask(() => resolve(), { priority: 'background' });
      } else {
        // Fallback to setTimeout
        setTimeout(resolve, 0);
      }
    });
  }

  /**
   * Execute task with time slicing
   */
  async executeWithTimeSlicing<T>(
    task: () => Promise<T>,
    timeSlice: number = this.config.taskTimeSlice
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await task();
      
      const duration = performance.now() - startTime;
      if (duration > timeSlice) {
        // Task took longer than time slice, yield to main thread
        await this.yieldToMainThread();
      }
      
      return result;
    } catch (error) {
      // Always yield on error to prevent blocking
      await this.yieldToMainThread();
      throw error;
    }
  }

  /**
   * Process task queues with intelligent scheduling
   */
  private async processTaskQueues(): Promise<void> {
    if (this.isProcessing) return;
    
    this.isProcessing = true;

    try {
      // Process queues in priority order
      const priorities = ['critical', 'high', 'medium', 'low', 'idle'];
      
      for (const priority of priorities) {
        await this.processQueue(priority);
        
        // Check if we should stop processing
        if (this.shouldPauseProcessing()) {
          break;
        }
        
        // Yield between priority levels
        await this.yieldToMainThread();
      }
    } catch (error) {
      console.error('Error processing task queues:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process specific priority queue
   */
  private async processQueue(priority: string): Promise<void> {
    const queue = this.taskQueue.get(priority) || [];
    if (queue.length === 0) return;

    const priorityConfig = this.getPriorityConfig(priority as any);
    const activeCount = Array.from(this.activeTasks.values())
      .filter(task => task.priority.level === priority).length;

    if (activeCount >= priorityConfig.maxConcurrent) {
      return; // Already at max concurrent for this priority
    }

    // Get tasks ready for execution
    const readyTasks = queue.filter(task => 
      this.isTaskReady(task) && 
      this.areDependenciesMet(task)
    );

    if (readyTasks.length === 0) return;

    // Execute tasks up to concurrent limit
    const tasksToExecute = readyTasks.slice(0, priorityConfig.maxConcurrent - activeCount);
    
    for (const task of tasksToExecute) {
      await this.executeTask(task);
      
      // Yield between tasks
      if (this.config.yieldToMain) {
        await this.yieldToMainThread();
      }
    }
  }

  /**
   * Execute individual task
   */
  private async executeTask(task: ScheduledTask): Promise<void> {
    // Remove from queue and add to active tasks
    const queue = this.taskQueue.get(task.priority.level) || [];
    const index = queue.findIndex(t => t.id === task.id);
    if (index !== -1) {
      queue.splice(index, 1);
    }
    
    this.activeTasks.set(task.id, task);
    task.attempts++;

    console.log(`Executing ${task.priority.level} priority task: ${task.name} (attempt ${task.attempts})`);

    const startTime = performance.now();
    
    try {
      // Execute with time slicing
      await this.executeWithTimeSlicing(task.execute, task.priority.timeSlice);
      
      const duration = performance.now() - startTime;
      
      // Task completed successfully
      this.handleTaskSuccess(task, duration);
      
    } catch (error) {
      const duration = performance.now() - startTime;
      await this.handleTaskFailure(task, error, duration);
    } finally {
      this.activeTasks.delete(task.id);
      this.updateMetrics();
    }
  }

  /**
   * Handle successful task completion
   */
  private handleTaskSuccess(task: ScheduledTask, duration: number): void {
    task.scheduledAt = Date.now(); // Update for completion time
    this.completedTasks.push(task);
    
    // Keep completed tasks list manageable
    if (this.completedTasks.length > 1000) {
      this.completedTasks = this.completedTasks.slice(-1000);
    }

    console.log(`Task ${task.name} completed successfully in ${duration.toFixed(2)}ms`);
  }

  /**
   * Handle task failure
   */
  private async handleTaskFailure(task: ScheduledTask, error: any, duration: number): Promise<void> {
    console.error(`Task ${task.name} failed (attempt ${task.attempts}):`, error);

    if (task.attempts < task.maxAttempts) {
      // Reschedule with exponential backoff
      const delay = Math.min(1000 * Math.pow(2, task.attempts - 1), 30000);
      task.scheduledAt = Date.now() + delay;
      
      // Add back to queue
      const queue = this.taskQueue.get(task.priority.level) || [];
      queue.push(task);
      this.taskQueue.set(task.priority.level, queue);
      this.sortQueue(task.priority.level);
      
      console.log(`Task ${task.name} rescheduled for retry in ${delay}ms`);
    } else {
      console.error(`Task ${task.name} failed permanently after ${task.attempts} attempts`);
    }
  }

  /**
   * Check if task is ready for execution
   */
  private isTaskReady(task: ScheduledTask): boolean {
    return Date.now() >= task.scheduledAt;
  }

  /**
   * Check if task dependencies are met
   */
  private areDependenciesMet(task: ScheduledTask): boolean {
    if (!task.dependencies || task.dependencies.length === 0) {
      return true;
    }

    return task.dependencies.every(depId => 
      this.completedTasks.some(completed => completed.id === depId)
    );
  }

  /**
   * Check if processing should be paused
   */
  private shouldPauseProcessing(): boolean {
    // Pause if too many active tasks
    if (this.activeTasks.size >= this.config.maxConcurrentTasks) {
      return true;
    }

    // Pause if main thread is heavily blocked
    if (this.metrics.mainThreadBlocking > this.config.longTaskThreshold * 2) {
      return true;
    }

    // Pause if estimated CPU usage is too high
    if (this.metrics.estimatedUsage > 90) {
      return true;
    }

    return false;
  }

  /**
   * Defer low priority tasks
   */
  private async deferLowPriorityTasks(): Promise<void> {
    const lowPriorityQueues = ['low', 'idle'];
    
    for (const priority of lowPriorityQueues) {
      const queue = this.taskQueue.get(priority) || [];
      queue.forEach(task => {
        if (task.priority.canDefer) {
          task.scheduledAt = Date.now() + 60000; // Defer by 1 minute
        }
      });
      
      this.sortQueue(priority);
    }
    
    console.log('Deferred low priority tasks due to high CPU usage');
  }

  /**
   * Reduce task concurrency
   */
  private async reduceTaskConcurrency(): Promise<void> {
    const newMaxConcurrent = Math.max(1, Math.floor(this.config.maxConcurrentTasks / 2));
    this.config.maxConcurrentTasks = newMaxConcurrent;
    
    console.log(`Reduced max concurrent tasks to ${newMaxConcurrent} due to main thread blocking`);
  }

  /**
   * Handle thermal throttling
   */
  private async handleThermalThrottling(): Promise<void> {
    // This would integrate with thermal APIs if available
    // For now, just reduce task frequency
    const thermalState = 'normal'; // Would get from thermal API
    
    if (thermalState === 'critical') {
      await this.deferLowPriorityTasks();
      this.config.maxConcurrentTasks = 1;
    }
  }

  /**
   * Optimize for battery usage
   */
  private async optimizeForBattery(): Promise<void> {
    try {
      if ('getBattery' in navigator) {
        const battery = await (navigator as any).getBattery();
        
        if (battery.level < 0.2 && !battery.charging) {
          // Low battery - reduce background activity
          await this.deferLowPriorityTasks();
          this.config.maxConcurrentTasks = Math.max(1, Math.floor(this.config.maxConcurrentTasks / 2));
          
          console.log('Reduced CPU activity due to low battery');
        }
      }
    } catch (error) {
      console.warn('Battery optimization not available:', error);
    }
  }

  /**
   * Update CPU metrics
   */
  private updateMetrics(): void {
    this.metrics.activeTasks = this.activeTasks.size;
    this.metrics.backgroundTasks = Array.from(this.taskQueue.values())
      .reduce((total, queue) => total + queue.length, 0);

    // Estimate CPU usage based on active tasks
    this.metrics.estimatedUsage = Math.min(100, this.metrics.activeTasks * 25);

    // Calculate average task duration
    if (this.completedTasks.length > 0) {
      const recentTasks = this.completedTasks.slice(-50);
      const totalDuration = recentTasks.reduce((sum, task) => {
        return sum + (task.scheduledAt - task.createdAt);
      }, 0);
      this.metrics.averageTaskDuration = totalDuration / recentTasks.length;
    }
  }

  // Helper methods

  private setupTaskQueues(): void {
    const priorities = ['critical', 'high', 'medium', 'low', 'idle'];
    priorities.forEach(priority => {
      this.taskQueue.set(priority, []);
    });
  }

  private setupPerformanceMonitoring(): void {
    try {
      // Monitor long tasks
      this.longTaskObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        this.metrics.longTasks += entries.length;
        
        const totalDuration = entries.reduce((sum, entry) => sum + entry.duration, 0);
        this.metrics.mainThreadBlocking = totalDuration / entries.length || 0;
        
        entries.forEach(entry => {
          if (entry.duration > this.config.longTaskThreshold) {
            console.warn(`Long task detected: ${entry.duration.toFixed(2)}ms`);
          }
        });
      });
      
      this.longTaskObserver.observe({ entryTypes: ['longtask'] });
    } catch (error) {
      console.warn('Performance monitoring not available:', error);
    }
  }

  private startTaskScheduler(): void {
    // Process task queues every 100ms
    setInterval(() => {
      if (!this.isProcessing) {
        this.processTaskQueues();
      }
    }, 100);

    // Update metrics every 5 seconds
    setInterval(() => {
      this.updateMetrics();
    }, 5000);
  }

  private getPriorityConfig(priority: 'critical' | 'high' | 'medium' | 'low' | 'idle'): TaskPriority {
    const configs = {
      critical: {
        level: 'critical' as const,
        weight: 100,
        maxConcurrent: 5,
        timeSlice: 100,
        canDefer: false
      },
      high: {
        level: 'high' as const,
        weight: 75,
        maxConcurrent: 3,
        timeSlice: 50,
        canDefer: false
      },
      medium: {
        level: 'medium' as const,
        weight: 50,
        maxConcurrent: 2,
        timeSlice: 25,
        canDefer: true
      },
      low: {
        level: 'low' as const,
        weight: 25,
        maxConcurrent: 1,
        timeSlice: 16,
        canDefer: true
      },
      idle: {
        level: 'idle' as const,
        weight: 10,
        maxConcurrent: 1,
        timeSlice: 5,
        canDefer: true
      }
    };

    return configs[priority];
  }

  private sortQueue(priority: string): void {
    const queue = this.taskQueue.get(priority) || [];
    queue.sort((a, b) => {
      // First by scheduled time
      if (a.scheduledAt !== b.scheduledAt) {
        return a.scheduledAt - b.scheduledAt;
      }
      // Then by creation time
      return a.createdAt - b.createdAt;
    });
  }

  private calculateScheduledTime(priority: TaskPriority): number {
    const now = Date.now();
    
    // Critical tasks execute immediately
    if (priority.level === 'critical') {
      return now;
    }
    
    // Add small delays for other priorities
    const delays = {
      high: 10,
      medium: 50,
      low: 200,
      idle: 1000
    };
    
    return now + (delays[priority.level as keyof typeof delays] || 0);
  }

  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Destroy CPU optimizer
   */
  destroy(): void {
    // Clear all queues
    this.taskQueue.clear();
    this.activeTasks.clear();
    this.completedTasks = [];

    // Disconnect observers
    if (this.longTaskObserver) {
      this.longTaskObserver.disconnect();
    }

    // Cancel yield controller
    if (this.yieldController) {
      this.yieldController.abort();
    }

    console.log('CPU optimizer destroyed');
  }
}