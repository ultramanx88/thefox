import { CategoryManager } from '@/components/CategoryManager';

export const dynamic = 'force-dynamic';

export default function CategoriesAdminPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <CategoryManager />
    </div>
  );
}