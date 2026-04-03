interface BackupData {
  version: string;
  timestamp: Date;
  data: {
    users: any[];
    orders: any[];
    products: any[];
    settings: any;
    logs: any[];
  };
  metadata: {
    size: number;
    checksum: string;
    compression: boolean;
  };
}

interface MigrationScript {
  version: string;
  description: string;
  up: () => Promise<void>;
  down: () => Promise<void>;
}

export class BackupManager {
  private static readonly STORAGE_KEY = 'app_backup';
  private static readonly MAX_BACKUPS = 10;

  static async createBackup(description?: string): Promise<string> {
    try {
      const data = await this.collectData();
      const backup: BackupData = {
        version: '1.0.0',
        timestamp: new Date(),
        data,
        metadata: {
          size: JSON.stringify(data).length,
          checksum: await this.generateChecksum(data),
          compression: false
        }
      };

      const backupId = this.generateBackupId();
      await this.saveBackup(backupId, backup);
      await this.cleanupOldBackups();

      return backupId;
    } catch (error) {
      throw new Error(`Backup failed: ${error}`);
    }
  }

  static async restoreBackup(backupId: string): Promise<void> {
    try {
      const backup = await this.loadBackup(backupId);
      if (!backup) throw new Error('Backup not found');

      // Verify checksum
      const currentChecksum = await this.generateChecksum(backup.data);
      if (currentChecksum !== backup.metadata.checksum) {
        throw new Error('Backup integrity check failed');
      }

      await this.restoreData(backup.data);
    } catch (error) {
      throw new Error(`Restore failed: ${error}`);
    }
  }

  static async listBackups(): Promise<Array<{id: string; timestamp: Date; size: number}>> {
    const backups = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '{}');
    return Object.entries(backups).map(([id, backup]: [string, any]) => ({
      id,
      timestamp: new Date(backup.timestamp),
      size: backup.metadata.size
    }));
  }

  static async deleteBackup(backupId: string): Promise<void> {
    const backups = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '{}');
    delete backups[backupId];
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(backups));
  }

  static async exportBackup(backupId: string): Promise<Blob> {
    const backup = await this.loadBackup(backupId);
    if (!backup) throw new Error('Backup not found');

    const data = JSON.stringify(backup, null, 2);
    return new Blob([data], { type: 'application/json' });
  }

  static async importBackup(file: File): Promise<string> {
    try {
      const text = await file.text();
      const backup: BackupData = JSON.parse(text);
      
      // Validate backup structure
      if (!backup.version || !backup.data || !backup.metadata) {
        throw new Error('Invalid backup format');
      }

      const backupId = this.generateBackupId();
      await this.saveBackup(backupId, backup);
      
      return backupId;
    } catch (error) {
      throw new Error(`Import failed: ${error}`);
    }
  }

  private static async collectData() {
    return {
      users: JSON.parse(localStorage.getItem('users') || '[]'),
      orders: JSON.parse(localStorage.getItem('orders') || '[]'),
      products: JSON.parse(localStorage.getItem('products') || '[]'),
      settings: JSON.parse(localStorage.getItem('settings') || '{}'),
      logs: JSON.parse(localStorage.getItem('app_logs') || '[]')
    };
  }

  private static async restoreData(data: any) {
    localStorage.setItem('users', JSON.stringify(data.users || []));
    localStorage.setItem('orders', JSON.stringify(data.orders || []));
    localStorage.setItem('products', JSON.stringify(data.products || []));
    localStorage.setItem('settings', JSON.stringify(data.settings || {}));
    localStorage.setItem('app_logs', JSON.stringify(data.logs || []));
  }

  private static async saveBackup(id: string, backup: BackupData) {
    const backups = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '{}');
    backups[id] = backup;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(backups));
  }

  private static async loadBackup(id: string): Promise<BackupData | null> {
    const backups = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '{}');
    return backups[id] || null;
  }

  private static async cleanupOldBackups() {
    const backups = await this.listBackups();
    if (backups.length > this.MAX_BACKUPS) {
      const sorted = backups.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      const toDelete = sorted.slice(0, sorted.length - this.MAX_BACKUPS);
      
      for (const backup of toDelete) {
        await this.deleteBackup(backup.id);
      }
    }
  }

  private static generateBackupId(): string {
    return `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private static async generateChecksum(data: any): Promise<string> {
    const text = JSON.stringify(data);
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}

export class MigrationManager {
  private static migrations: MigrationScript[] = [
    {
      version: '1.0.1',
      description: 'Add user preferences',
      up: async () => {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const updated = users.map((user: any) => ({
          ...user,
          preferences: { theme: 'light', language: 'th' }
        }));
        localStorage.setItem('users', JSON.stringify(updated));
      },
      down: async () => {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const reverted = users.map((user: any) => {
          const { preferences, ...rest } = user;
          return rest;
        });
        localStorage.setItem('users', JSON.stringify(reverted));
      }
    },
    {
      version: '1.1.0',
      description: 'Add order tracking',
      up: async () => {
        const orders = JSON.parse(localStorage.getItem('orders') || '[]');
        const updated = orders.map((order: any) => ({
          ...order,
          tracking: { status: 'pending', updates: [] }
        }));
        localStorage.setItem('orders', JSON.stringify(updated));
      },
      down: async () => {
        const orders = JSON.parse(localStorage.getItem('orders') || '[]');
        const reverted = orders.map((order: any) => {
          const { tracking, ...rest } = order;
          return rest;
        });
        localStorage.setItem('orders', JSON.stringify(reverted));
      }
    }
  ];

  static async getCurrentVersion(): Promise<string> {
    return localStorage.getItem('app_version') || '1.0.0';
  }

  static async setVersion(version: string): Promise<void> {
    localStorage.setItem('app_version', version);
  }

  static async runMigrations(targetVersion?: string): Promise<string[]> {
    const currentVersion = await this.getCurrentVersion();
    const applied: string[] = [];

    for (const migration of this.migrations) {
      if (this.compareVersions(migration.version, currentVersion) > 0) {
        if (!targetVersion || this.compareVersions(migration.version, targetVersion) <= 0) {
          await migration.up();
          await this.setVersion(migration.version);
          applied.push(migration.version);
        }
      }
    }

    return applied;
  }

  static async rollbackMigration(targetVersion: string): Promise<string[]> {
    const currentVersion = await this.getCurrentVersion();
    const rolledBack: string[] = [];

    const reverseMigrations = [...this.migrations].reverse();
    
    for (const migration of reverseMigrations) {
      if (this.compareVersions(migration.version, currentVersion) <= 0 &&
          this.compareVersions(migration.version, targetVersion) > 0) {
        await migration.down();
        rolledBack.push(migration.version);
      }
    }

    await this.setVersion(targetVersion);
    return rolledBack;
  }

  static getPendingMigrations(): MigrationScript[] {
    const currentVersion = localStorage.getItem('app_version') || '1.0.0';
    return this.migrations.filter(m => 
      this.compareVersions(m.version, currentVersion) > 0
    );
  }

  private static compareVersions(a: string, b: string): number {
    const aParts = a.split('.').map(Number);
    const bParts = b.split('.').map(Number);
    
    for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
      const aPart = aParts[i] || 0;
      const bPart = bParts[i] || 0;
      
      if (aPart > bPart) return 1;
      if (aPart < bPart) return -1;
    }
    
    return 0;
  }
}