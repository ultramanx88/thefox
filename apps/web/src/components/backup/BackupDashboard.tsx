'use client';

import { useState, useEffect } from 'react';
import { BackupManager, MigrationManager } from '@/lib/backup/backup-manager';

export default function BackupDashboard() {
  const [backups, setBackups] = useState<any[]>([]);
  const [currentVersion, setCurrentVersion] = useState('');
  const [pendingMigrations, setPendingMigrations] = useState<any[]>([]);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const backupList = await BackupManager.listBackups();
    const version = await MigrationManager.getCurrentVersion();
    const pending = MigrationManager.getPendingMigrations();
    
    setBackups(backupList);
    setCurrentVersion(version);
    setPendingMigrations(pending);
  };

  const createBackup = async () => {
    setIsCreatingBackup(true);
    try {
      const backupId = await BackupManager.createBackup();
      alert(`Backup created: ${backupId}`);
      await loadData();
    } catch (error) {
      alert(`Backup failed: ${error}`);
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const restoreBackup = async (backupId: string) => {
    if (!confirm('คุณต้องการคืนค่าข้อมูลหรือไม่? การดำเนินการนี้จะเขียนทับข้อมูลปัจจุบัน')) return;
    
    setIsRestoring(true);
    try {
      await BackupManager.restoreBackup(backupId);
      alert('Restore completed successfully');
      window.location.reload();
    } catch (error) {
      alert(`Restore failed: ${error}`);
    } finally {
      setIsRestoring(false);
    }
  };

  const deleteBackup = async (backupId: string) => {
    if (!confirm('คุณต้องการลบ backup นี้หรือไม่?')) return;
    
    try {
      await BackupManager.deleteBackup(backupId);
      await loadData();
    } catch (error) {
      alert(`Delete failed: ${error}`);
    }
  };

  const exportBackup = async (backupId: string) => {
    try {
      const blob = await BackupManager.exportBackup(backupId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_${backupId}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert(`Export failed: ${error}`);
    }
  };

  const importBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const backupId = await BackupManager.importBackup(file);
      alert(`Backup imported: ${backupId}`);
      await loadData();
    } catch (error) {
      alert(`Import failed: ${error}`);
    }
    
    event.target.value = '';
  };

  const runMigrations = async () => {
    if (!confirm('คุณต้องการรัน migrations หรือไม่?')) return;
    
    setIsMigrating(true);
    try {
      const applied = await MigrationManager.runMigrations();
      alert(`Migrations completed: ${applied.join(', ')}`);
      await loadData();
    } catch (error) {
      alert(`Migration failed: ${error}`);
    } finally {
      setIsMigrating(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">ระบบ Backup & Migration</h1>
        <p className="text-gray-600">จัดการการสำรองข้อมูลและการอัปเกรดระบบ</p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">เวอร์ชันปัจจุบัน</p>
              <p className="text-2xl font-bold text-blue-600">{currentVersion}</p>
            </div>
            <div className="text-3xl">🏷️</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Backups ทั้งหมด</p>
              <p className="text-2xl font-bold text-green-600">{backups.length}</p>
            </div>
            <div className="text-3xl">💾</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Migrations รอ</p>
              <p className="text-2xl font-bold text-orange-600">{pendingMigrations.length}</p>
            </div>
            <div className="text-3xl">⏳</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">สถานะ</p>
              <p className="text-lg font-semibold text-green-600">🟢 พร้อมใช้งาน</p>
            </div>
            <div className="text-3xl">✅</div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">การจัดการ Backup</h3>
          <div className="space-y-4">
            <button
              onClick={createBackup}
              disabled={isCreatingBackup}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
            >
              {isCreatingBackup ? 'กำลังสร้าง Backup...' : '🗄️ สร้าง Backup ใหม่'}
            </button>
            
            <div className="flex gap-4">
              <label className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 cursor-pointer text-center">
                📥 Import Backup
                <input
                  type="file"
                  accept=".json"
                  onChange={importBackup}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">การจัดการ Migration</h3>
          <div className="space-y-4">
            {pendingMigrations.length > 0 ? (
              <button
                onClick={runMigrations}
                disabled={isMigrating}
                className="w-full bg-orange-600 text-white py-3 rounded-lg hover:bg-orange-700 disabled:bg-gray-300"
              >
                {isMigrating ? 'กำลังรัน Migrations...' : `🚀 รัน ${pendingMigrations.length} Migrations`}
              </button>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <div className="text-2xl mb-2">✅</div>
                <p>ไม่มี migrations ที่รอดำเนินการ</p>
              </div>
            )}
            
            <div className="text-sm text-gray-600">
              <p>Migrations ที่รอ:</p>
              {pendingMigrations.map((migration, index) => (
                <div key={index} className="ml-4 mt-1">
                  • {migration.version}: {migration.description}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Backup List */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">รายการ Backup</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">วันที่สร้าง</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ขนาด</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">การดำเนินการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {backups.map((backup) => (
                <tr key={backup.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                    {backup.id.substring(0, 20)}...
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {backup.timestamp.toLocaleString('th-TH')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatFileSize(backup.size)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    <button
                      onClick={() => restoreBackup(backup.id)}
                      disabled={isRestoring}
                      className="text-blue-600 hover:text-blue-800 disabled:text-gray-400"
                    >
                      คืนค่า
                    </button>
                    <button
                      onClick={() => exportBackup(backup.id)}
                      className="text-green-600 hover:text-green-800"
                    >
                      ส่งออก
                    </button>
                    <button
                      onClick={() => deleteBackup(backup.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      ลบ
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {backups.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">💾</div>
            <p className="text-gray-600">ยังไม่มี backup</p>
            <button
              onClick={createBackup}
              className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              สร้าง Backup แรก
            </button>
          </div>
        )}
      </div>

      {/* Best Practices */}
      <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">💡 แนวทางปฏิบัติที่ดี</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-medium text-blue-600 mb-2">การสำรองข้อมูล</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• สร้าง backup ก่อนทำ migration</li>
              <li>• เก็บ backup หลายเวอร์ชัน</li>
              <li>• ทดสอบการคืนค่าเป็นประจำ</li>
            </ul>
          </div>
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-medium text-green-600 mb-2">การ Migration</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• ทดสอบใน environment ทดสอบก่อน</li>
              <li>• อ่านรายละเอียด migration ก่อนรัน</li>
              <li>• มี rollback plan พร้อมใช้</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}