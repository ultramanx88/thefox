'use client';

import { useState, useEffect } from 'react';
import { getCategories, type Category } from '@repo/api';

export function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCategories();
      setCategories(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading categories...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="text-red-800">Error: {error}</div>
        <button 
          onClick={fetchCategories}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Category Management</h2>
        <div className="space-x-2">
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Add Category
          </button>
          <button
            onClick={fetchCategories}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Refresh
          </button>
        </div>
      </div>



      {/* Category List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">All Categories ({categories.length})</h3>
        </div>
        <div className="divide-y">
          {categories.map((category) => (
            <div key={category.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div>
                  <div className="font-semibold">{category.name}</div>
                  <div className="text-sm text-gray-600">{category.slug}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}