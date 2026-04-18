// Shared types for API responses

export interface Market {
  id: string;
  name: string;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  rating: number;
  isOpen: boolean;
  openingHours: {
    open: string;
    close: string;
  };
  categories: string[];
  imageUrl?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  category: string;
  imageUrl?: string;
  marketId: string;
  inStock: boolean;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  marketId: string;
  market: Market;
  items: OrderItem[];
  status: OrderStatus;
  totalAmount: number;
  deliveryAddress: Address;
  createdAt: string;
  updatedAt: string;
  estimatedDelivery?: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  price: number;
  subtotal: number;
}

export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'in_transit'
  | 'delivered'
  | 'cancelled';

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  avatar?: string;
  addresses: Address[];
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  nameEn: string;
  description?: string;
  icon: string;
  color: string;
  parentId?: string; // For subcategories
  level: number; // 0 = main category, 1 = subcategory
  order: number; // Display order
  isActive: boolean;
  productCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryTree extends Category {
  children?: CategoryTree[];
}

export interface Address {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone: string;
}

// Re-export settings types
export * from './types/settings';

// ─── Queue ───────────────────────────────────────────────────────────────────

export type QueueStatus = 'waiting' | 'called' | 'serving' | 'done' | 'skipped';

export interface Queue {
  id: string;
  branchId: string;
  branchName: string;
  number: number;
  status: QueueStatus;
  customerName?: string;
  customerPhone?: string;
  counter?: string;
  note?: string;
  createdAt: string;
  calledAt?: string;
  servedAt?: string;
  doneAt?: string;
}

export interface QueueBranch {
  id: string;
  name: string;
  currentNumber: number;  // last issued number
  callingNumber?: number; // currently being called
  isOpen: boolean;
  counters: string[];     // ['A', 'B', 'C']
  avgWaitMinutes: number;
}