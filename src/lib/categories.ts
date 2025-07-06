export interface Category {
  id: string;
  name: string;
  slug: string;
}

// In a real application, this would be a database.
let categories: Category[] = [
  { id: '1', name: 'ผัก', slug: 'vegetables' },
  { id: '2', name: 'ผลไม้', slug: 'fruits' },
  { id: '3', name: 'เนื้อสัตว์', slug: 'meat' },
  { id: '4', name: 'อาหารทะเล', slug: 'seafood' },
];

export async function getCategories(): Promise<Category[]> {
  // Simulate async operation
  return Promise.resolve(categories);
}
