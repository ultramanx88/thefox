interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error' | 'critical';
  category: string;
  message: string;
  metadata?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  ip?: string;
  userAgent?: string;
  stack?: string;
}

interface LogFilter {
  level?: string[];
  category?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  userId?: string;
  search?: string;
}

export class LogManager {
  private static logs: LogEntry[] = [];
  private static maxLogs = 10000;
  private static sessionId = this.generateSessionId();

  static log(level: LogEntry['level'], category: string, message: string, metadata?: Record<string, any>) {
    const entry: LogEntry = {
      id: this.generateId(),
      timestamp: new Date(),
      level,
      category,
      message,
      metadata,
      sessionId: this.sessionId,
      ip: this.getClientIP(),
      userAgent: navigator?.userAgent
    };

    // Add stack trace for errors
    if (level === 'error' || level === 'critical') {
      entry.stack = new Error().stack;
    }

    this.addLog(entry);
    this.sendToRemote(entry);
  }

  private static addLog(entry: LogEntry) {
    this.logs.unshift(entry);
    
    // Keep only recent logs in memory
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Store in localStorage for persistence
    this.saveToLocalStorage(entry);
  }

  private static saveToLocalStorage(entry: LogEntry) {
    try {
      const stored = localStorage.getItem('app_logs') || '[]';
      const logs = JSON.parse(stored);
      logs.unshift(entry);
      
      // Keep only last 1000 logs in localStorage
      const trimmed = logs.slice(0, 1000);
      localStorage.setItem('app_logs', JSON.stringify(trimmed));
    } catch (error) {
      console.error('Failed to save log to localStorage:', error);
    }
  }

  private static async sendToRemote(entry: LogEntry) {
    try {
      await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
      });
    } catch (error) {
      // Fail silently for remote logging
    }
  }

  static getLogs(filter?: LogFilter): LogEntry[] {
    let filtered = [...this.logs];

    if (filter) {
      if (filter.level?.length) {
        filtered = filtered.filter(log => filter.level!.includes(log.level));
      }
      
      if (filter.category?.length) {
        filtered = filtered.filter(log => filter.category!.includes(log.category));
      }
      
      if (filter.dateFrom) {
        filtered = filtered.filter(log => log.timestamp >= filter.dateFrom!);
      }
      
      if (filter.dateTo) {
        filtered = filtered.filter(log => log.timestamp <= filter.dateTo!);
      }
      
      if (filter.userId) {
        filtered = filtered.filter(log => log.userId === filter.userId);
      }
      
      if (filter.search) {
        const search = filter.search.toLowerCase();
        filtered = filtered.filter(log => 
          log.message.toLowerCase().includes(search) ||
          log.category.toLowerCase().includes(search)
        );
      }
    }

    return filtered;
  }

  static exportLogs(format: 'json' | 'csv' = 'json'): string {
    const logs = this.getLogs();
    
    if (format === 'csv') {
      const headers = ['timestamp', 'level', 'category', 'message', 'userId', 'ip'];
      const rows = logs.map(log => [
        log.timestamp.toISOString(),
        log.level,
        log.category,
        log.message.replace(/,/g, ';'),
        log.userId || '',
        log.ip || ''
      ]);
      
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
    
    return JSON.stringify(logs, null, 2);
  }

  static clearLogs() {
    this.logs = [];
    localStorage.removeItem('app_logs');
  }

  static getLogStats() {
    const logs = this.getLogs();
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const recent = logs.filter(log => log.timestamp >= last24h);
    
    const levelCounts = logs.reduce((acc, log) => {
      acc[log.level] = (acc[log.level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const categoryCounts = logs.reduce((acc, log) => {
      acc[log.category] = (acc[log.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: logs.length,
      last24h: recent.length,
      levels: levelCounts,
      categories: categoryCounts,
      errors: logs.filter(log => log.level === 'error' || log.level === 'critical').length
    };
  }

  private static generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private static generateSessionId(): string {
    return 'session_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private static getClientIP(): string {
    // This would be set by server-side middleware in real implementation
    return 'client';
  }

  // Convenience methods
  static debug(category: string, message: string, metadata?: Record<string, any>) {
    this.log('debug', category, message, metadata);
  }

  static info(category: string, message: string, metadata?: Record<string, any>) {
    this.log('info', category, message, metadata);
  }

  static warn(category: string, message: string, metadata?: Record<string, any>) {
    this.log('warn', category, message, metadata);
  }

  static error(category: string, message: string, metadata?: Record<string, any>) {
    this.log('error', category, message, metadata);
  }

  static critical(category: string, message: string, metadata?: Record<string, any>) {
    this.log('critical', category, message, metadata);
  }
}

// Auto-capture unhandled errors
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    LogManager.error('javascript', `Unhandled error: ${event.message}`, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    LogManager.error('promise', `Unhandled promise rejection: ${event.reason}`, {
      reason: event.reason
    });
  });
}

// Performance logging
export class PerformanceLogger {
  private static marks: Map<string, number> = new Map();

  static startTimer(name: string) {
    this.marks.set(name, performance.now());
  }

  static endTimer(name: string, category = 'performance') {
    const start = this.marks.get(name);
    if (start) {
      const duration = performance.now() - start;
      LogManager.info(category, `${name} completed`, { duration: `${duration.toFixed(2)}ms` });
      this.marks.delete(name);
      return duration;
    }
    return 0;
  }

  static logPageLoad() {
    if (typeof window !== 'undefined' && window.performance) {
      const timing = window.performance.timing;
      const loadTime = timing.loadEventEnd - timing.navigationStart;
      
      LogManager.info('performance', 'Page loaded', {
        loadTime: `${loadTime}ms`,
        domReady: `${timing.domContentLoadedEventEnd - timing.navigationStart}ms`,
        firstPaint: `${timing.responseStart - timing.navigationStart}ms`
      });
    }
  }
}