export interface Category {
  id: string;
  nameKey: 'vegetables' | 'fruits' | 'meat' | 'seafood' | 'bakery';
  slug: string;
}

// In a real application, this would be a database.
let categories: Category[] = [
  { id: '1', nameKey: 'vegetables', slug: 'vegetables' },
  { id: '2', nameKey: 'fruits', slug: 'fruits' },
  { id: '3', nameKey: 'meat', slug: 'meat' },
  { id: '4', nameKey: 'seafood', slug: 'seafood' },
  { id: '5', nameKey: 'bakery', slug: 'bakery' },
];

export async function getCategories(): Promise<Category[]> {
  // Simulate async operation
  return Promise.resolve(categories);
}

// This function is no longer compatible with the new i18n structure and should be updated if used.
// For now, we assume categories are managed centrally.
export async function addCategory(name: string): Promise<Category> {
  const newId = (Math.max(...categories.map(c => parseInt(c.id, 10))) + 1).toString();
  
  const slug = name
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '');

  const newCategory: Category = {
    id: newId,
    // This is a simplification. A real system would need a way to manage translation keys.
    nameKey: name.toLowerCase().replace(' ', '') as any,
    slug: slug,
  };

  categories.push(newCategory);
  return Promise.resolve(newCategory);
}
