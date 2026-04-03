interface BulkOrderItem {
  storeId: string;
  storeName: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  deliveryDate: string;
}

interface BulkOrder {
  id: string;
  businessId: string;
  businessName: string;
  orderType: 'weekly' | 'monthly' | 'custom';
  startDate: string;
  endDate: string;
  frequency: number; // days
  items: BulkOrderItem[];
  totalAmount: number;
  status: 'draft' | 'confirmed' | 'active' | 'completed' | 'cancelled';
  deliveryInstructions: string;
  paymentTerms: 'prepaid' | 'monthly' | 'cod';
  createdAt: string;
}

export class BulkOrderManager {
  private orders: BulkOrder[] = [];

  createBulkOrder(businessId: string, businessName: string): BulkOrder {
    return {
      id: `bulk_${Date.now()}`,
      businessId,
      businessName,
      orderType: 'weekly',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      frequency: 7,
      items: [],
      totalAmount: 0,
      status: 'draft',
      deliveryInstructions: '',
      paymentTerms: 'monthly',
      createdAt: new Date().toISOString()
    };
  }

  addItemToOrder(orderId: string, item: Omit<BulkOrderItem, 'deliveryDate'>) {
    const order = this.orders.find(o => o.id === orderId);
    if (!order) return;

    const deliveryDates = this.generateDeliveryDates(order);
    deliveryDates.forEach(date => {
      order.items.push({ ...item, deliveryDate: date });
    });
    
    this.calculateTotal(order);
  }

  private generateDeliveryDates(order: BulkOrder): string[] {
    const dates: string[] = [];
    const start = new Date(order.startDate);
    const end = new Date(order.endDate);
    
    let current = new Date(start);
    while (current <= end) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + order.frequency);
    }
    
    return dates;
  }

  private calculateTotal(order: BulkOrder) {
    order.totalAmount = order.items.reduce((sum, item) => 
      sum + (item.quantity * item.unitPrice), 0
    );
  }

  getOrdersByStore(orderId: string) {
    const order = this.orders.find(o => o.id === orderId);
    if (!order) return {};

    return order.items.reduce((acc, item) => {
      if (!acc[item.storeId]) {
        acc[item.storeId] = {
          storeName: item.storeName,
          items: [],
          total: 0
        };
      }
      acc[item.storeId].items.push(item);
      acc[item.storeId].total += item.quantity * item.unitPrice;
      return acc;
    }, {} as Record<string, any>);
  }

  confirmOrder(orderId: string) {
    const order = this.orders.find(o => o.id === orderId);
    if (order) {
      order.status = 'confirmed';
      this.scheduleDeliveries(order);
    }
  }

  private scheduleDeliveries(order: BulkOrder) {
    // Group by delivery date and store
    const schedule = order.items.reduce((acc, item) => {
      const key = `${item.deliveryDate}_${item.storeId}`;
      if (!acc[key]) {
        acc[key] = {
          date: item.deliveryDate,
          storeId: item.storeId,
          storeName: item.storeName,
          items: []
        };
      }
      acc[key].items.push(item);
      return acc;
    }, {} as Record<string, any>);

    // Create individual orders for each delivery
    Object.values(schedule).forEach((delivery: any) => {
      this.createDeliveryOrder(order, delivery);
    });
  }

  private createDeliveryOrder(bulkOrder: BulkOrder, delivery: any) {
    // This would integrate with the regular order system
    console.log(`Creating delivery order for ${delivery.date} from ${delivery.storeName}`);
  }

  getBulkOrders(businessId: string): BulkOrder[] {
    return this.orders.filter(o => o.businessId === businessId);
  }

  updateOrderSchedule(orderId: string, orderType: 'weekly' | 'monthly' | 'custom', frequency?: number) {
    const order = this.orders.find(o => o.id === orderId);
    if (!order) return;

    order.orderType = orderType;
    if (orderType === 'weekly') order.frequency = 7;
    else if (orderType === 'monthly') order.frequency = 30;
    else if (frequency) order.frequency = frequency;

    // Regenerate delivery dates
    order.items = order.items.filter((item, index, arr) => 
      arr.findIndex(i => i.storeId === item.storeId && i.productId === item.productId) === index
    );
    
    const uniqueItems = order.items.map(item => ({
      storeId: item.storeId,
      storeName: item.storeName,
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice
    }));

    order.items = [];
    uniqueItems.forEach(item => this.addItemToOrder(orderId, item));
  }
}

export const bulkOrderManager = new BulkOrderManager();