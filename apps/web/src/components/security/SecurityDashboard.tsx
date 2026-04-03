'use client';

import { useState, useEffect } from 'react';
import { AdvancedSecurityManager } from '@/lib/security/advanced-security';

interface SecurityMetrics {
  totalThreats: number;
  blockedIPs: number;
  suspiciousActivities: number;
  riskScore: number;
  lastScan: Date;
}

export default function SecurityDashboard() {
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    totalThreats: 0,
    blockedIPs: 0,
    suspiciousActivities: 0,
    riskScore: 0,
    lastScan: new Date()
  });

  const [realtimeThreats, setRealtimeThreats] = useState<any[]>([]);
  const [securityStatus, setSecurityStatus] = useState<'secure' | 'warning' | 'critical'>('secure');
  const [deviceFingerprint, setDeviceFingerprint] = useState<string>('');

  useEffect(() => {
    initializeSecurity();
    startRealTimeMonitoring();
  }, []);

  const initializeSecurity = async () => {
    // Generate device fingerprint
    const fingerprint = await AdvancedSecurityManager.generateDeviceFingerprint();
    setDeviceFingerprint(fingerprint);

    // Load security metrics
    loadSecurityMetrics();
  };

  const loadSecurityMetrics = () => {
    // Simulate loading security metrics
    setMetrics({
      totalThreats: 247,
      blockedIPs: 15,
      suspiciousActivities: 8,
      riskScore: 23,
      lastScan: new Date()
    });
  };

  const startRealTimeMonitoring = () => {
    const interval = setInterval(() => {
      // Simulate real-time threat detection
      const mockThreats = [
        {
          id: Date.now(),
          type: 'SQL Injection Attempt',
          ip: '192.168.1.100',
          severity: 'high',
          timestamp: new Date(),
          blocked: true
        },
        {
          id: Date.now() + 1,
          type: 'Rate Limit Exceeded',
          ip: '10.0.0.50',
          severity: 'medium',
          timestamp: new Date(),
          blocked: true
        }
      ];

      if (Math.random() > 0.7) {
        setRealtimeThreats(prev => [mockThreats[0], ...prev.slice(0, 9)]);
      }
    }, 5000);

    return () => clearInterval(interval);
  };

  const runSecurityScan = async () => {
    setSecurityStatus('warning');
    
    // Simulate security scan
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    setMetrics(prev => ({
      ...prev,
      lastScan: new Date(),
      riskScore: Math.max(0, prev.riskScore - 5)
    }));
    
    setSecurityStatus('secure');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'secure': return 'text-green-600 bg-green-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'critical': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-blue-100 text-blue-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">ระบบความปลอดภัยขั้นสูง</h1>
        <p className="text-gray-600">การตรวจสอบและป้องกันภัยคุกคามแบบเรียลไทม์</p>
      </div>

      {/* Security Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">สถานะความปลอดภัย</p>
              <p className={`text-lg font-semibold px-3 py-1 rounded-full ${getStatusColor(securityStatus)}`}>
                {securityStatus === 'secure' ? '🛡️ ปลอดภัย' : 
                 securityStatus === 'warning' ? '⚠️ เตือน' : '🚨 วิกฤต'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">ภัยคุกคามที่ตรวจพบ</p>
              <p className="text-2xl font-bold text-red-600">{metrics.totalThreats}</p>
            </div>
            <div className="text-3xl">🚫</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">IP ที่ถูกบล็อก</p>
              <p className="text-2xl font-bold text-orange-600">{metrics.blockedIPs}</p>
            </div>
            <div className="text-3xl">🔒</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">คะแนนความเสี่ยง</p>
              <p className={`text-2xl font-bold ${metrics.riskScore > 50 ? 'text-red-600' : 'text-green-600'}`}>
                {metrics.riskScore}%
              </p>
            </div>
            <div className="text-3xl">📊</div>
          </div>
        </div>
      </div>

      {/* Security Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">การควบคุมความปลอดภัย</h3>
          <div className="space-y-4">
            <button
              onClick={runSecurityScan}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              🔍 สแกนความปลอดภัย
            </button>
            
            <div className="grid grid-cols-2 gap-4">
              <button className="bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">
                🛡️ เปิดใช้ Firewall
              </button>
              <button className="bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700">
                🚫 บล็อก IP
              </button>
            </div>
            
            <div className="text-sm text-gray-600">
              <p>สแกนล่าสุด: {metrics.lastScan.toLocaleString('th-TH')}</p>
              <p>Device ID: {deviceFingerprint.substring(0, 16)}...</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">การป้องกันแบบเรียลไทม์</h3>
          <div className="space-y-3">
            {[
              { name: 'DDoS Protection', status: 'active', icon: '🛡️' },
              { name: 'SQL Injection Filter', status: 'active', icon: '🔍' },
              { name: 'XSS Protection', status: 'active', icon: '🚫' },
              { name: 'Rate Limiting', status: 'active', icon: '⏱️' },
              { name: 'Bot Detection', status: 'active', icon: '🤖' },
              { name: 'Behavioral Analysis', status: 'active', icon: '🧠' }
            ].map((protection, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{protection.icon}</span>
                  <span className="font-medium">{protection.name}</span>
                </div>
                <span className="text-green-600 text-sm font-medium">
                  ✓ {protection.status === 'active' ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Real-time Threats */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold">ภัยคุกคามแบบเรียลไทม์</h3>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">กำลังตรวจสอบ...</span>
          </div>
        </div>

        <div className="space-y-3">
          {realtimeThreats.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">🛡️</div>
              <p>ไม่พบภัยคุกคามในขณะนี้</p>
            </div>
          ) : (
            realtimeThreats.map((threat) => (
              <div key={threat.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="text-2xl">
                    {threat.type.includes('SQL') ? '💉' :
                     threat.type.includes('Rate') ? '⏱️' :
                     threat.type.includes('XSS') ? '🚫' : '⚠️'}
                  </div>
                  <div>
                    <p className="font-medium">{threat.type}</p>
                    <p className="text-sm text-gray-600">IP: {threat.ip}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getSeverityColor(threat.severity)}`}>
                    {threat.severity === 'low' ? 'ต่ำ' :
                     threat.severity === 'medium' ? 'ปานกลาง' :
                     threat.severity === 'high' ? 'สูง' : 'วิกฤต'}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    threat.blocked ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {threat.blocked ? 'บล็อกแล้ว' : 'กำลังตรวจสอบ'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {threat.timestamp.toLocaleTimeString('th-TH')}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Security Recommendations */}
      <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">🔐 คำแนะนำด้านความปลอดภัย</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-medium text-blue-600 mb-2">เปิดใช้ 2FA</h4>
            <p className="text-sm text-gray-600">เพิ่มความปลอดภัยด้วยการยืนยันตัวตน 2 ขั้นตอน</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-medium text-green-600 mb-2">อัปเดตรหัสผ่าน</h4>
            <p className="text-sm text-gray-600">เปลี่ยนรหัสผ่านเป็นประจำทุก 90 วัน</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-medium text-purple-600 mb-2">ตรวจสอบ Session</h4>
            <p className="text-sm text-gray-600">ออกจากระบบอุปกรณ์ที่ไม่ได้ใช้งาน</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-medium text-orange-600 mb-2">Backup ข้อมูล</h4>
            <p className="text-sm text-gray-600">สำรองข้อมูลสำคัญเป็นประจำ</p>
          </div>
        </div>
      </div>
    </div>
  );
}