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
  { id: '5', name: 'เบเกอรี่', slug: 'bakery' },
];

export async function getCategories(): Promise<Category[]> {
  // Simulate async operation
  return Promise.resolve(categories);
}

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
    name: name,
    slug: slug,
  };

  categories.push(newCategory);
  return Promise.resolve(newCategory);
}
