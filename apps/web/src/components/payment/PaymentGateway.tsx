'use client';

import { useState, useEffect } from 'react';
import { PaymentClient } from '@/lib/payment/payment-client';

interface PaymentGatewayProps {
  orderId: string;
  amount: number;
  customerId: string;
  onSuccess: (transactionId: string) => void;
  onError: (error: string) => void;
}

export default function PaymentGateway({ orderId, amount, customerId, onSuccess, onError }: PaymentGatewayProps) {
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    const methods = await PaymentClient.getPaymentMethods();
    setPaymentMethods(methods);
    if (methods.length > 0) {
      setSelectedMethod(methods[0].id);
    }
  };

  const handlePayment = async () => {
    if (!selectedMethod) return;

    setLoading(true);
    try {
      const result = await PaymentClient.processPayment({
        orderId,
        amount,
        customerId,
        paymentMethodId: selectedMethod,
        description: `Payment for order ${orderId}`
      });

      if (result.success) {
        setPaymentData(result);
        
        if (result.paymentUrl) {
          window.open(result.paymentUrl, '_blank');
        }
        
        if (result.transactionId) {
          // Poll for payment status
          const status = await PaymentClient.pollPaymentStatus(result.transactionId);
          if (status === 'completed') {
            onSuccess(result.transactionId);
          } else {
            onError('Payment failed or timed out');
          }
        }
      } else {
        onError(result.error || 'Payment failed');
      }
    } catch (error) {
      onError('Payment processing error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <h3 className="text-xl font-semibold mb-6">เลือกวิธีการชำระเงิน</h3>
      
      <div className="mb-6">
        <div className="text-2xl font-bold text-gray-900 mb-2">
          ยอดรวม: ฿{amount.toLocaleString()}
        </div>
        <div className="text-sm text-gray-600">Order ID: {orderId}</div>
      </div>

      <div className="space-y-3 mb-6">
        {paymentMethods.map((method) => (
          <label
            key={method.id}
            className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
              selectedMethod === method.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <input
              type="radio"
              name="paymentMethod"
              value={method.id}
              checked={selectedMethod === method.id}
              onChange={(e) => setSelectedMethod(e.target.value)}
              className="sr-only"
            />
            <span className="text-2xl mr-3">{method.icon}</span>
            <span className="font-medium">{method.name}</span>
            {selectedMethod === method.id && (
              <span className="ml-auto text-blue-600">✓</span>
            )}
          </label>
        ))}
      </div>

      {paymentData?.qrCode && (
        <div className="mb-6 text-center">
          <h4 className="font-medium mb-3">สแกน QR Code เพื่อชำระเงิน</h4>
          <img src={paymentData.qrCode} alt="QR Code" className="mx-auto w-48 h-48 border" />
          <p className="text-sm text-gray-600 mt-2">สแกนด้วยแอปธนาคารหรือ PromptPay</p>
        </div>
      )}

      <button
        onClick={handlePayment}
        disabled={loading || !selectedMethod}
        className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        {loading ? 'กำลังดำเนินการ...' : `ชำระเงิน ฿${amount.toLocaleString()}`}
      </button>

      <div className="mt-4 text-center">
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
          <span>🔒</span>
          <span>การชำระเงินปลอดภัยด้วย SSL</span>
        </div>
      </div>
    </div>
  );
}