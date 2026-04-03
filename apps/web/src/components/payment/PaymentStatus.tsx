'use client';

import { useState, useEffect } from 'react';
import { PaymentClient } from '@/lib/payment/payment-client';

interface PaymentStatusProps {
  transactionId: string;
  onStatusChange?: (status: string) => void;
}

export default function PaymentStatus({ transactionId, onStatusChange }: PaymentStatusProps) {
  const [status, setStatus] = useState<'pending' | 'completed' | 'failed' | 'checking'>('checking');
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    checkPaymentStatus();
    const interval = setInterval(checkPaymentStatus, 3000); // Check every 3 seconds
    
    return () => clearInterval(interval);
  }, [transactionId]);

  const checkPaymentStatus = async () => {
    try {
      const result = await PaymentClient.verifyPayment(transactionId);
      
      if (result.verified) {
        setVerified(true);
        setStatus(result.status as any);
        onStatusChange?.(result.status);
      } else {
        setStatus('pending');
      }
    } catch (error) {
      setStatus('failed');
    }
  };

  const getStatusDisplay = () => {
    switch (status) {
      case 'checking':
        return {
          icon: '🔄',
          title: 'กำลังตรวจสอบ',
          message: 'กำลังตรวจสอบสถานะการชำระเงิน...',
          color: 'text-blue-600',
          bg: 'bg-blue-50'
        };
      case 'pending':
        return {
          icon: '⏳',
          title: 'รอการชำระเงิน',
          message: 'กรุณาทำการชำระเงินให้เสร็จสิ้น',
          color: 'text-yellow-600',
          bg: 'bg-yellow-50'
        };
      case 'completed':
        return {
          icon: '✅',
          title: 'ชำระเงินสำเร็จ',
          message: 'การชำระเงินเสร็จสิ้นแล้ว',
          color: 'text-green-600',
          bg: 'bg-green-50'
        };
      case 'failed':
        return {
          icon: '❌',
          title: 'ชำระเงินไม่สำเร็จ',
          message: 'การชำระเงินล้มเหลว กรุณาลองใหม่',
          color: 'text-red-600',
          bg: 'bg-red-50'
        };
    }
  };

  const statusDisplay = getStatusDisplay();

  return (
    <div className={`rounded-xl p-6 text-center ${statusDisplay.bg}`}>
      <div className="text-4xl mb-4">{statusDisplay.icon}</div>
      <h3 className={`text-xl font-semibold mb-2 ${statusDisplay.color}`}>
        {statusDisplay.title}
      </h3>
      <p className="text-gray-600 mb-4">{statusDisplay.message}</p>
      
      <div className="text-sm text-gray-500">
        Transaction ID: {transactionId}
      </div>

      {status === 'checking' && (
        <div className="mt-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      )}

      {status === 'failed' && (
        <button
          onClick={checkPaymentStatus}
          className="mt-4 bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700"
        >
          ลองตรวจสอบอีกครั้ง
        </button>
      )}
    </div>
  );
}