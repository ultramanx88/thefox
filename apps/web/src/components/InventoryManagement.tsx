'use client';

import { useEffect, useState } from 'react';

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  price: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  lastUpdated: string;
}

export default function InventoryManagement() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'low_stock' | 'out_of_stock'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Mock inventory data
    const mockInventory: InventoryItem[] = [
      {
        id: '1',
        name: 'Organic Bananas',
        sku: 'ORG-BAN-001',
        currentStock: 150,
        minStock: 50,
        maxStock: 500,
        price: 2.99,
        status: 'in_stock',
        lastUpdated: new Date().toISOString()
      },
      {
        id: '2',
        name: 'Fresh Strawberries',
        sku: 'FRS-STR-002',
        currentStock: 25,
        minStock: 30,
        maxStock: 200,
        price: 4.99,
        status: 'low_stock',
        lastUpdated: new Date().toISOString()
      },
      {
        id: '3',
        name: 'Organic Milk',
        sku: 'ORG-MLK-003',
        currentStock: 0,
        minStock: 20,
        maxStock: 100,
        price: 3.49,
        status: 'out_of_stock',
        lastUpdated: new Date().toISOString()
      }
    ];

    setInventory(mockInventory);
  }, []);

  const filteredInventory = inventory.filter(item => {
    const matchesFilter = filter === 'all' || item.status === filter;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.sku.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const updateStock = async (id: string, newStock: number) => {
    setInventory(prev => prev.map(item => {
      if (item.id === id) {
        const status = newStock === 0 ? 'out_of_stock' :
                      newStock <= item.minStock ? 'low_stock' : 'in_stock';
        return {
          ...item,
          currentStock: newStock,
          status,
          lastUpdated: new Date().toISOString()
        };
      }
      return item;
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_stock': return 'bg-green-100 text-green-800';
      case 'low_stock': return 'bg-yellow-100 text-yellow-800';
      case 'out_of_stock': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Inventory Management</h1>
        
        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              All Items
            </button>
            <button
              onClick={() => setFilter('low_stock')}
              className={`px-4 py-2 rounded-lg ${filter === 'low_stock' ? 'bg-yellow-600 text-white' : 'bg-gray-200'}`}
            >
              Low Stock
            </button>
            <button
              onClick={() => setFilter('out_of_stock')}
              className={`px-4 py-2 rounded-lg ${filter === 'out_of_stock' ? 'bg-red-600 text-white' : 'bg-gray-200'}`}
            >
              Out of Stock
            </button>
          </div>
          
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border rounded-lg flex-1 max-w-md"
          />
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredInventory.map((item) => (
              <tr key={item.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{item.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.sku}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {item.currentStock} / {item.maxStock}
                  </div>
                  <div className="text-xs text-gray-500">
                    Min: {item.minStock}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                    {item.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ${item.price.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => updateStock(item.id, item.currentStock + 10)}
                      className="text-green-600 hover:text-green-900"
                    >
                      +10
                    </button>
                    <button
                      onClick={() => updateStock(item.id, Math.max(0, item.currentStock - 10))}
                      className="text-red-600 hover:text-red-900"
                    >
                      -10
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}