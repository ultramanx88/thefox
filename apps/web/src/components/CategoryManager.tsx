'use client';

import { useState, useEffect } from 'react';
import { useCategories, useCategoryTree, firebaseApi } from '@repo/api';
import type { Category, CategoryTree } from '@repo/api';

export function CategoryManager() {
  const { categories, loading, error, refetch } = useCategories(false, true);
  const { categoryTree, loading: treeLoading } = useCategoryTree();
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Initialize default categories on first load
  useEffect(() => {
    const initializeCategories = async () => {
      if (categories.length === 0 && !loading) {
        try {
          await firebaseApi.categories.initializeDefaultCategories();
          refetch();
        } catch (error) {
          console.error('Failed to initialize categories:', error);
        }
      }
    };

    initializeCategories();
  }, [categories.length, loading, refetch]);

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
          onClick={refetch}
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
            onClick={refetch}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Category Tree View */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">Category Tree</h3>
        </div>
        <div className="p-4">
          {treeLoading ? (
            <div>Loading category tree...</div>
          ) : (
            <div className="space-y-2">
              {categoryTree.map((mainCategory) => (
                <div key={mainCategory.id} className="border rounded-lg">
                  <div className="p-3 bg-gray-50 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{mainCategory.icon}</span>
                      <div>
                        <div className="font-semibold">{mainCategory.name}</div>
                        <div className="text-sm text-gray-600">{mainCategory.nameEn}</div>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded ${
                        mainCategory.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {mainCategory.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  
                  {mainCategory.children && mainCategory.children.length > 0 && (
                    <div className="p-3 space-y-2">
                      {mainCategory.children.map((subCategory) => (
                        <div key={subCategory.id} className="flex items-center justify-between pl-6 py-2 bg-gray-25 rounded">
                          <div className="flex items-center space-x-3">
                            <span className="text-lg">{subCategory.icon}</span>
                            <div>
                              <div className="font-medium">{subCategory.name}</div>
                              <div className="text-sm text-gray-600">{subCategory.nameEn}</div>
                            </div>
                            <span className={`px-2 py-1 text-xs rounded ${
                              subCategory.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {subCategory.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
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
                <span className="text-2xl">{category.icon}</span>
                <div>
                  <div className="font-semibold">{category.name}</div>
                  <div className="text-sm text-gray-600">{category.nameEn}</div>
                  {category.description && (
                    <div className="text-sm text-gray-500">{category.description}</div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs rounded ${
                    category.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {category.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">
                    Level {category.level}
                  </span>
                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                    Order {category.order}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}