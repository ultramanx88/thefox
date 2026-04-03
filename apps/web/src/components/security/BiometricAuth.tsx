'use client';

import { useState, useEffect } from 'react';
import { AdvancedSecurityManager } from '@/lib/security/advanced-security';

interface BiometricAuthProps {
  onSuccess: (method: string) => void;
  onError: (error: string) => void;
}

export default function BiometricAuth({ onSuccess, onError }: BiometricAuthProps) {
  const [availableMethods, setAvailableMethods] = useState<string[]>([]);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [enrollmentMode, setEnrollmentMode] = useState(false);

  useEffect(() => {
    checkAvailableBiometrics();
  }, []);

  const checkAvailableBiometrics = async () => {
    const methods: string[] = [];

    // Check for WebAuthn support
    if (window.PublicKeyCredential) {
      methods.push('webauthn');
    }

    // Check for Face ID/Touch ID (iOS Safari)
    if (window.navigator.userAgent.includes('Safari') && 'credentials' in navigator) {
      methods.push('touchid');
    }

    // Check for fingerprint API
    if ('navigator' in window && 'credentials' in navigator) {
      methods.push('fingerprint');
    }

    // Check for camera access (for face recognition)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      methods.push('facerecognition');
    } catch (error) {
      // Camera not available
    }

    setAvailableMethods(methods);
  };

  const authenticateWithWebAuthn = async () => {
    setIsAuthenticating(true);
    try {
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: new Uint8Array(32),
          rp: { name: 'TheFox Food Delivery' },
          user: {
            id: new Uint8Array(16),
            name: 'user@example.com',
            displayName: 'User'
          },
          pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required'
          }
        }
      });

      if (credential) {
        onSuccess('webauthn');
      }
    } catch (error) {
      onError('WebAuthn authentication failed');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const authenticateWithFingerprint = async () => {
    setIsAuthenticating(true);
    try {
      // Simulate fingerprint authentication
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In real implementation, this would capture and verify fingerprint
      const mockFingerprintData = 'fingerprint_hash_' + Date.now();
      const isValid = await AdvancedSecurityManager.verifyBiometric('user123', 'fingerprint', mockFingerprintData);
      
      if (isValid) {
        onSuccess('fingerprint');
      } else {
        onError('Fingerprint not recognized');
      }
    } catch (error) {
      onError('Fingerprint authentication failed');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const authenticateWithFaceRecognition = async () => {
    setIsAuthenticating(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      
      // Create video element for face capture
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();

      // Simulate face recognition processing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Stop camera
      stream.getTracks().forEach(track => track.stop());
      
      // In real implementation, this would process face data
      const mockFaceData = 'face_hash_' + Date.now();
      const isValid = await AdvancedSecurityManager.verifyBiometric('user123', 'faceId', mockFaceData);
      
      if (isValid) {
        onSuccess('facerecognition');
      } else {
        onError('Face not recognized');
      }
    } catch (error) {
      onError('Face recognition failed');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const enrollBiometric = async (method: string) => {
    setEnrollmentMode(true);
    try {
      let biometricData = '';
      
      switch (method) {
        case 'fingerprint':
          biometricData = 'fingerprint_hash_' + Date.now();
          break;
        case 'facerecognition':
          biometricData = 'face_hash_' + Date.now();
          break;
        case 'webauthn':
          biometricData = 'webauthn_key_' + Date.now();
          break;
      }
      
      const success = await AdvancedSecurityManager.enrollBiometric('user123', method as any, biometricData);
      
      if (success) {
        alert('Biometric enrolled successfully!');
      }
    } catch (error) {
      onError('Enrollment failed');
    } finally {
      setEnrollmentMode(false);
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'webauthn': return '🔐';
      case 'touchid': return '👆';
      case 'fingerprint': return '👆';
      case 'facerecognition': return '👤';
      default: return '🔒';
    }
  };

  const getMethodName = (method: string) => {
    switch (method) {
      case 'webauthn': return 'WebAuthn';
      case 'touchid': return 'Touch ID';
      case 'fingerprint': return 'ลายนิ้วมือ';
      case 'facerecognition': return 'ใบหน้า';
      default: return method;
    }
  };

  const handleAuthenticate = (method: string) => {
    switch (method) {
      case 'webauthn':
      case 'touchid':
        authenticateWithWebAuthn();
        break;
      case 'fingerprint':
        authenticateWithFingerprint();
        break;
      case 'facerecognition':
        authenticateWithFaceRecognition();
        break;
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-6">
      <div className="text-center mb-6">
        <div className="text-4xl mb-4">🔐</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">ยืนยันตัวตนด้วยไบโอเมตริก</h2>
        <p className="text-gray-600">เลือกวิธีการยืนยันตัวตนที่คุณต้องการ</p>
      </div>

      {availableMethods.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">❌</div>
          <p className="text-gray-600">อุปกรณ์ของคุณไม่รองรับการยืนยันตัวตนด้วยไบโอเมตริก</p>
        </div>
      ) : (
        <div className="space-y-4">
          {availableMethods.map((method) => (
            <div key={method} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getMethodIcon(method)}</span>
                  <div>
                    <h3 className="font-medium">{getMethodName(method)}</h3>
                    <p className="text-sm text-gray-600">
                      {method === 'fingerprint' && 'ใช้ลายนิ้วมือเพื่อยืนยันตัวตน'}
                      {method === 'facerecognition' && 'ใช้ใบหน้าเพื่อยืนยันตัวตน'}
                      {method === 'webauthn' && 'ใช้ WebAuthn สำหรับความปลอดภัยสูง'}
                      {method === 'touchid' && 'ใช้ Touch ID หรือ Face ID'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAuthenticate(method)}
                    disabled={isAuthenticating}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 text-sm"
                  >
                    {isAuthenticating ? 'กำลังยืนยัน...' : 'ยืนยัน'}
                  </button>
                  <button
                    onClick={() => enrollBiometric(method)}
                    disabled={enrollmentMode}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:bg-gray-300 text-sm"
                  >
                    {enrollmentMode ? 'กำลังลงทะเบียน...' : 'ลงทะเบียน'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Security Notice */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <span className="text-blue-600 text-lg">ℹ️</span>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">ข้อมูลความปลอดภัย</p>
            <ul className="space-y-1 text-xs">
              <li>• ข้อมูลไบโอเมตริกจะถูกเข้ารหัสและเก็บในอุปกรณ์ของคุณ</li>
              <li>• ไม่มีการส่งข้อมูลไบโอเมตริกไปยังเซิร์ฟเวอร์</li>
              <li>• คุณสามารถยกเลิกการใช้งานได้ตลอดเวลา</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}