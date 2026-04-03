'use client';

import { useState } from 'react';
import { Tag, X, Check } from 'lucide-react';

interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minAmount: number;
  maxDiscount?: number;
  expiresAt: string;
  usageLimit: number;
  usedCount: number;
  description: string;
}

interface CouponSystemProps {
  onApplyCoupon: (discount: number, couponCode: string) => void;
  onRemoveCoupon: () => void;
  appliedCoupon?: string;
  cartTotal: number;
}

export default function CouponSystem({ onApplyCoupon, onRemoveCoupon, appliedCoupon, cartTotal }: CouponSystemProps) {
  const [couponCode, setCouponCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [availableCoupons] = useState<Coupon[]>([
    {
      id: '1',
      code: 'SAVE10',
      type: 'percentage',
      value: 10,
      minAmount: 50,
      expiresAt: '2024-12-31',
      usageLimit: 100,
      usedCount: 45,
      description: '10% off orders over $50'
    },
    {
      id: '2',
      code: 'WELCOME20',
      type: 'fixed',
      value: 20,
      minAmount: 100,
      expiresAt: '2024-12-31',
      usageLimit: 50,
      usedCount: 12,
      description: '$20 off orders over $100'
    }
  ]);

  const validateCoupon = (code: string): { valid: boolean; coupon?: Coupon; error?: string } => {
    const coupon = availableCoupons.find(c => c.code.toLowerCase() === code.toLowerCase());
    
    if (!coupon) {
      return { valid: false, error: 'Invalid coupon code' };
    }
    
    if (new Date(coupon.expiresAt) < new Date()) {
      return { valid: false, error: 'Coupon has expired' };
    }
    
    if (coupon.usedCount >= coupon.usageLimit) {
      return { valid: false, error: 'Coupon usage limit reached' };
    }
    
    if (cartTotal < coupon.minAmount) {
      return { valid: false, error: `Minimum order amount is $${coupon.minAmount}` };
    }
    
    return { valid: true, coupon };
  };

  const calculateDiscount = (coupon: Coupon, total: number): number => {
    if (coupon.type === 'percentage') {
      const discount = (total * coupon.value) / 100;
      return coupon.maxDiscount ? Math.min(discount, coupon.maxDiscount) : discount;
    }
    return coupon.value;
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    
    setLoading(true);
    setError('');
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const validation = validateCoupon(couponCode);
    
    if (!validation.valid) {
      setError(validation.error || 'Invalid coupon');
      setLoading(false);
      return;
    }
    
    const discount = calculateDiscount(validation.coupon!, cartTotal);
    onApplyCoupon(discount, couponCode);
    setCouponCode('');
    setLoading(false);
  };

  const handleRemoveCoupon = () => {
    onRemoveCoupon();
    setError('');
  };

  return (
    <div className="space-y-4">
      {/* Coupon Input */}
      <div className="border rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-3">Apply Coupon</h3>
        
        {appliedCoupon ? (
          <div className="flex items-center justify-between bg-green-50 p-3 rounded-lg">
            <div className="flex items-center space-x-2">
              <Check className="h-5 w-5 text-green-600" />
              <span className="text-green-800 font-medium">{appliedCoupon} applied</span>
            </div>
            <button
              onClick={handleRemoveCoupon}
              className="text-red-600 hover:text-red-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex space-x-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="Enter coupon code"
                className="flex-1 px-3 py-2 border rounded-lg"
              />
              <button
                onClick={handleApplyCoupon}
                disabled={loading || !couponCode.trim()}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Applying...' : 'Apply'}
              </button>
            </div>
            
            {error && (
              <p className="text-red-600 text-sm">{error}</p>
            )}
          </div>
        )}
      </div>

      {/* Available Coupons */}
      <div className="border rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-3">Available Coupons</h3>
        <div className="space-y-2">
          {availableCoupons.map((coupon) => {
            const isExpired = new Date(coupon.expiresAt) < new Date();
            const isUsageLimitReached = coupon.usedCount >= coupon.usageLimit;
            const isMinAmountNotMet = cartTotal < coupon.minAmount;
            const isDisabled = isExpired || isUsageLimitReached || isMinAmountNotMet;
            
            return (
              <div
                key={coupon.id}
                className={`flex items-center justify-between p-3 border rounded-lg ${
                  isDisabled ? 'bg-gray-50 opacity-60' : 'bg-white hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Tag className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="font-medium">{coupon.code}</div>
                    <div className="text-sm text-gray-500">{coupon.description}</div>
                    {isMinAmountNotMet && (
                      <div className="text-xs text-red-500">
                        Add ${(coupon.minAmount - cartTotal).toFixed(2)} more to use this coupon
                      </div>
                    )}
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    setCouponCode(coupon.code);
                    handleApplyCoupon();
                  }}
                  disabled={isDisabled || appliedCoupon === coupon.code}
                  className="text-green-600 hover:text-green-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {appliedCoupon === coupon.code ? 'Applied' : 'Use'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}