// Export Firebase services
export * from './firebase';

// Export services
export { RegistrationService } from './services/RegistrationService';
export { VerificationService } from './services/VerificationService';
export { SettingsManager } from './services/SettingsManager';

// Export types
export type * from './types/settings';

export type Category = {
  id: string;
  name: string;
  slug: string;
};

// Mock API function. In a real app, this would fetch data from your backend.
export const getCategories = async (): Promise<Category[]> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  return [
    { id: '1', name: 'Vegetables & Fruits', slug: 'vegetables-fruits' },
    { id: '2', name: 'Meat & Seafood', slug: 'meat-seafood' },
    { id: '3', name: 'Bakery & Dairy', slug: 'bakery-dairy' },
    { id: '4', name: 'Pantry Staples', slug: 'pantry-staples' },
    { id: '5', name: 'Beverages', slug: 'beverages' },
    { id: '6', name: 'Snacks & Sweets', slug: 'snacks-sweets' },
  ];
};