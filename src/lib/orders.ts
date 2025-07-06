export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  date: string;
  status: 'Delivered' | 'In Progress';
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  total: number;
}

// In a real application, this would be a database.
const orders: Order[] = [
  {
    id: 'ORD-001',
    date: '2024-07-28',
    status: 'Delivered',
    items: [
      { id: '1', name: 'เนื้อสันในวัว', quantity: 2, price: 350.0 },
      { id: '2', name: 'กะหล่ำปลีออร์แกนิก', quantity: 1, price: 35.0 },
    ],
    subtotal: 735.0,
    deliveryFee: 40.0,
    serviceFee: 20.0,
    total: 795.0,
  },
  {
    id: 'ORD-002',
    date: '2024-07-30',
    status: 'In Progress',
    items: [
      { id: '3', name: 'ปลาแซลมอนสด (ต่อ กก.)', quantity: 1, price: 750.0 },
      { id: '4', name: 'มะนาวแป้น (ต่อ กก.)', quantity: 1, price: 40.0 },
      { id: '5', name: 'อกไก่ (ต่อ กก.)', quantity: 3, price: 85.0 },
    ],
    subtotal: 1045.0,
    deliveryFee: 50.0,
    serviceFee: 30.0,
    total: 1125.0,
  },
];


export async function getOrders(): Promise<Order[]> {
  // Simulate async operation
  return Promise.resolve(orders);
}
