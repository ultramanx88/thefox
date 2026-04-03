'use client';

import { useState } from 'react';
import { Package, ArrowLeft, Upload, CheckCircle } from 'lucide-react';

interface ReturnItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  reason: string;
  condition: string;
}

interface ReturnRequest {
  id: string;
  orderNumber: string;
  items: ReturnItem[];
  status: 'pending' | 'approved' | 'processing' | 'completed';
  refundAmount: number;
  createdAt: string;
}

export default function ReturnsPage() {
  const [activeTab, setActiveTab] = useState<'request' | 'history'>('request');
  const [orderNumber, setOrderNumber] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [returnReason, setReturnReason] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const mockOrderItems = [
    {
      id: '1',
      name: 'Organic Bananas',
      price: 2.99,
      quantity: 2,
      image: '/api/placeholder/100/100'
    },
    {
      id: '2',
      name: 'Fresh Strawberries',
      price: 4.99,
      quantity: 1,
      image: '/api/placeholder/100/100'
    }
  ];

  const mockReturns: ReturnRequest[] = [
    {
      id: 'RET001',
      orderNumber: 'ORD123456',
      items: [
        {
          id: '1',
          name: 'Organic Milk',
          price: 3.49,
          quantity: 1,
          image: '/api/placeholder/100/100',
          reason: 'Damaged during shipping',
          condition: 'Unopened'
        }
      ],
      status: 'approved',
      refundAmount: 3.49,
      createdAt: '2024-01-15'
    }
  ];

  const handleSubmitReturn = () => {
    if (selectedItems.length === 0 || !returnReason) return;
    
    // Submit return request logic
    console.log('Submitting return request:', {
      orderNumber,
      selectedItems,
      returnReason
    });
    
    setSubmitted(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Return Request Submitted</h1>
            <p className="text-gray-600 mb-6">
              Your return request has been submitted successfully. We'll review it within 24 hours 
              and send you an email with further instructions.
            </p>
            <div className="space-y-2 text-sm text-gray-500">
              <p>Return Request ID: RET{Date.now()}</p>
              <p>Order Number: {orderNumber}</p>
            </div>
            <button
              onClick={() => setSubmitted(false)}
              className="mt-6 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
            >
              Submit Another Return
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Returns & Refunds</h1>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('request')}
                className={`py-4 border-b-2 font-medium text-sm ${
                  activeTab === 'request'
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Request Return
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`py-4 border-b-2 font-medium text-sm ${
                  activeTab === 'history'
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Return History
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'request' ? (
              <div className="space-y-6">
                {/* Order Number Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Order Number
                  </label>
                  <input
                    type="text"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    placeholder="Enter your order number"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                {/* Items Selection */}
                {orderNumber && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-4">Select Items to Return</h3>
                    <div className="space-y-3">
                      {mockOrderItems.map((item) => (
                        <div key={item.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                          <input
                            type="checkbox"
                            checked={selectedItems.includes(item.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedItems([...selectedItems, item.id]);
                              } else {
                                setSelectedItems(selectedItems.filter(id => id !== item.id));
                              }
                            }}
                            className="h-4 w-4 text-green-600"
                          />
                          <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded" />
                          <div className="flex-1">
                            <h4 className="font-medium">{item.name}</h4>
                            <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                            <p className="text-sm font-medium">${item.price.toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Return Reason */}
                {selectedItems.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason for Return
                    </label>
                    <select
                      value={returnReason}
                      onChange={(e) => setReturnReason(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="">Select a reason</option>
                      <option value="damaged">Damaged during shipping</option>
                      <option value="wrong_item">Wrong item received</option>
                      <option value="not_as_described">Not as described</option>
                      <option value="quality_issues">Quality issues</option>
                      <option value="changed_mind">Changed my mind</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                )}

                {/* Submit Button */}
                {selectedItems.length > 0 && returnReason && (
                  <button
                    onClick={handleSubmitReturn}
                    className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700"
                  >
                    Submit Return Request
                  </button>
                )}
              </div>
            ) : (
              /* Return History */
              <div className="space-y-4">
                {mockReturns.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No return requests found</p>
                  </div>
                ) : (
                  mockReturns.map((returnReq) => (
                    <div key={returnReq.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-medium">Return #{returnReq.id}</h3>
                          <p className="text-sm text-gray-500">Order: {returnReq.orderNumber}</p>
                          <p className="text-sm text-gray-500">
                            Requested: {new Date(returnReq.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(returnReq.status)}`}>
                          {returnReq.status.toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        {returnReq.items.map((item) => (
                          <div key={item.id} className="flex items-center space-x-3">
                            <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded" />
                            <div className="flex-1">
                              <p className="font-medium">{item.name}</p>
                              <p className="text-sm text-gray-500">Reason: {item.reason}</p>
                            </div>
                            <p className="font-medium">${item.price.toFixed(2)}</p>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-4 pt-4 border-t flex justify-between">
                        <span className="font-medium">Refund Amount:</span>
                        <span className="font-bold text-green-600">${returnReq.refundAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Return Policy */}
        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="font-medium text-blue-900 mb-2">Return Policy</h3>
          <ul className="text-blue-800 text-sm space-y-1">
            <li>• Items must be returned within 30 days of purchase</li>
            <li>• Items must be in original condition and packaging</li>
            <li>• Perishable items cannot be returned</li>
            <li>• Refunds will be processed within 5-7 business days</li>
          </ul>
        </div>
      </div>
    </div>
  );
}