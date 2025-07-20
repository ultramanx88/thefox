# 📂 Categories System

ระบบหมวดหมู่สินค้าที่ใช้งานได้จริงด้วย Firebase Firestore

## 🎯 Features

### ✅ Category Management
- **Hierarchical Categories**: หมวดหมู่หลักและหมวดหมู่ย่อย
- **Real-time Updates**: อัปเดตแบบ real-time
- **Multi-language Support**: ภาษาไทยและอังกฤษ
- **Visual Design**: ไอคอนและสีสำหรับแต่ละหมวดหมู่
- **Active/Inactive Status**: เปิด/ปิดการใช้งาน
- **Order Management**: จัดลำดับการแสดงผล

### ✅ Default Categories
- **ผักและผลไม้** (Fruits & Vegetables)
  - ผักใบเขียว (Leafy Greens)
  - ผลไม้ตามฤดูกาล (Seasonal Fruits)
  - ผักรากและหัว (Root Vegetables)
- **เนื้อสัตว์และอาหารทะเล** (Meat & Seafood)
  - เนื้อหมู (Pork)
  - เนื้อไก่ (Chicken)
  - ปลาและอาหารทะเล (Fish & Seafood)
- **ข้าวและธัญพืช** (Rice & Grains)
  - ข้าวหอมมะลิ (Jasmine Rice)
  - แป้งและผงต่างๆ (Flour & Powder)
- **เครื่องปรุงและเครื่องเทศ** (Seasonings & Spices)
- **ขนมและของหวาน** (Snacks & Sweets)
- **เครื่องดื่ม** (Beverages)

## 🏗️ Data Structure

### Category Model
```typescript
interface Category {
  id: string;
  name: string;           // ชื่อภาษาไทย
  nameEn: string;         // ชื่อภาษาอังกฤษ
  description?: string;   // คำอธิบาย
  icon: string;           // Emoji icon
  color: string;          // Hex color code
  parentId?: string;      // ID ของหมวดหมู่แม่
  level: number;          // 0 = หมวดหมู่หลัก, 1 = หมวดหมู่ย่อย
  order: number;          // ลำดับการแสดงผล
  isActive: boolean;      // สถานะการใช้งาน
  productCount?: number;  // จำนวนสินค้าในหมวดหมู่
  createdAt: string;
  updatedAt: string;
}
```

### Category Tree
```typescript
interface CategoryTree extends Category {
  children?: CategoryTree[];
}
```

## 🚀 Usage Examples

### Web App (React)
```typescript
import { useCategories, useCategoryTree, firebaseApi } from '@repo/api';

// Get all categories
function CategoriesList() {
  const { categories, loading, error } = useCategories(true, true); // active only, real-time
  
  return (
    <div>
      {categories.map(category => (
        <div key={category.id}>
          <span>{category.icon}</span>
          <span>{category.name}</span>
        </div>
      ))}
    </div>
  );
}

// Get category tree
function CategoryTree() {
  const { categoryTree, loading } = useCategoryTree();
  
  return (
    <div>
      {categoryTree.map(mainCategory => (
        <div key={mainCategory.id}>
          <h3>{mainCategory.name}</h3>
          {mainCategory.children?.map(subCategory => (
            <div key={subCategory.id}>
              {subCategory.name}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// Create category
async function createCategory() {
  await firebaseApi.categories.createCategory({
    name: 'หมวดหมู่ใหม่',
    nameEn: 'New Category',
    icon: '📦',
    color: '#6B7280',
    level: 0,
    order: 1,
    isActive: true,
  });
}
```

### Mobile App (React Native)
```typescript
import { CategoryList, CategoryGrid } from '../src/components/CategoryList';

// Category list with subcategories
function CategoriesScreen() {
  const handleCategorySelect = (category: Category) => {
    // Navigate to products
  };

  return (
    <CategoryList 
      onCategorySelect={handleCategorySelect}
      showSubcategories={true}
    />
  );
}

// Category grid for home screen
function HomeScreen() {
  return (
    <CategoryGrid onCategorySelect={handleCategorySelect} />
  );
}
```

## 🔧 API Methods

### Category Service
```typescript
// CRUD Operations
CategoryService.createCategory(categoryData)
CategoryService.getCategory(id)
CategoryService.updateCategory(id, updates)
CategoryService.deleteCategory(id)

// Query Methods
CategoryService.getCategories(activeOnly)
CategoryService.getMainCategories()
CategoryService.getSubcategories(parentId)
CategoryService.getCategoryTree()
CategoryService.searchCategories(searchTerm)
CategoryService.getCategoriesWithProductCount()

// Utility Methods
CategoryService.updateCategoryOrder(categoryId, newOrder)
CategoryService.toggleCategoryStatus(categoryId)
CategoryService.initializeDefaultCategories()

// Real-time Updates
CategoryService.onCategoriesChange(callback)
```

### Firebase API Endpoints
```typescript
// Get categories
const categories = await firebaseApi.categories.getCategories();

// Get category tree
const tree = await firebaseApi.categories.getCategoryTree();

// Create category
await firebaseApi.categories.createCategory(categoryData);

// Search categories
const results = await firebaseApi.categories.searchCategories('ผัก');

// Initialize default categories
await firebaseApi.categories.initializeDefaultCategories();
```

## 🎨 UI Components

### Web Components
- **CategoryManager**: Complete admin interface
- **CategoryTree**: Hierarchical display
- **CategoryForm**: Create/edit form

### Mobile Components
- **CategoryList**: Expandable list with subcategories
- **CategoryGrid**: Grid layout for home screen
- **CategoryCard**: Individual category display

## 📱 Platform Support

| Feature | Web App | Mobile App |
|---------|---------|------------|
| **View Categories** | ✅ | ✅ |
| **Category Tree** | ✅ | ✅ |
| **Real-time Updates** | ✅ | ✅ |
| **Search Categories** | ✅ | ✅ |
| **Admin Management** | ✅ | - |
| **Create/Edit** | ✅ | - |
| **Grid Display** | ✅ | ✅ |

## 🔐 Security Rules

### Firestore Rules
```javascript
// Categories collection
match /categories/{categoryId} {
  allow read: if true; // Public read access
  allow write: if request.auth != null && hasRole('admin');
}

function hasRole(role) {
  return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == role;
}
```

## 🚀 Getting Started

### 1. Initialize Categories
```typescript
// Run once to create default categories
await firebaseApi.categories.initializeDefaultCategories();
```

### 2. Display Categories
```typescript
// Web
import { CategoryManager } from '@/components/CategoryManager';
<CategoryManager />

// Mobile
import { CategoryList } from '../src/components/CategoryList';
<CategoryList onCategorySelect={handleSelect} />
```

### 3. Admin Management
```typescript
// Access admin page
/admin/categories
```

## 📊 Performance

### Optimization Features
- **Real-time Updates**: Only active categories
- **Caching**: Client-side category caching
- **Lazy Loading**: Load subcategories on demand
- **Search**: Client-side search for better performance

### Best Practices
1. **Cache Categories**: Categories don't change often
2. **Use Real-time**: For admin interfaces only
3. **Filter Active**: Show only active categories to users
4. **Optimize Icons**: Use emoji or small SVG icons

## 🔍 Testing

### Test Categories
```typescript
// Test category creation
const categoryId = await CategoryService.createCategory({
  name: 'Test Category',
  nameEn: 'Test Category',
  icon: '🧪',
  color: '#6B7280',
  level: 0,
  order: 999,
  isActive: true,
});

// Test category retrieval
const category = await CategoryService.getCategory(categoryId);
expect(category).toBeDefined();
expect(category.name).toBe('Test Category');

// Test category tree
const tree = await CategoryService.getCategoryTree();
expect(tree.length).toBeGreaterThan(0);
```

## 🚨 Troubleshooting

### Common Issues

#### Categories Not Loading
```typescript
// Check if categories are initialized
const categories = await firebaseApi.categories.getCategories(false);
if (categories.length === 0) {
  await firebaseApi.categories.initializeDefaultCategories();
}
```

#### Real-time Updates Not Working
```typescript
// Check Firestore connection
// Verify security rules
// Check component cleanup
```

#### Permission Denied
```typescript
// Check user authentication
// Verify admin role
// Check Firestore rules
```

## 📈 Future Enhancements

### Planned Features
- [ ] **Category Analytics**: Track popular categories
- [ ] **Category Images**: Support for category images
- [ ] **Multi-level Hierarchy**: Support for deeper nesting
- [ ] **Category Recommendations**: AI-powered suggestions
- [ ] **Bulk Operations**: Import/export categories
- [ ] **Category Templates**: Pre-defined category sets

### Integration Ideas
- **Product Association**: Link products to categories
- **Market Categories**: Market-specific categories
- **User Preferences**: Personalized category display
- **Search Integration**: Category-based search filters

ระบบหมวดหมู่ที่สมบูรณ์และใช้งานได้จริงสำหรับ theFOX marketplace! 📂