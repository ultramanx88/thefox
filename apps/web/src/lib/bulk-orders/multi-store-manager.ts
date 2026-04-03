interface MultiStoreOrder {
  id: string;
  businessId: string;
  orderDate: string;
  deliveryDate: string;
  storeOrders: StoreOrder[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered';
  paymentStatus: 'pending' | 'paid' | 'failed';
}

interface StoreOrder {
  storeId: string;
  storeName: string;
  items: OrderItem[];
  subtotal: number;
  preparationTime: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready';
}

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  specialInstructions?: string;
}

export class MultiStoreOrderManager {
  private orders: MultiStoreOrder[] = [];

  createMultiStoreOrder(businessId: string, deliveryDate: string): MultiStoreOrder {
    const order: MultiStoreOrder = {
      id: `multi_${Date.now()}`,
      businessId,
      orderDate: new Date().toISOString(),
      deliveryDate,
      storeOrders: [],
      totalAmount: 0,
      status: 'pending',
      paymentStatus: 'pending'
    };
    
    this.orders.push(order);
    return order;
  }

  addStoreToOrder(orderId: string, storeId: string, storeName: string) {
    const order = this.orders.find(o => o.id === orderId);
    if (!order) return;

    const existingStore = order.storeOrders.find(s => s.storeId === storeId);
    if (existingStore) return;

    order.storeOrders.push({
      storeId,
      storeName,
      items: [],
      subtotal: 0,
      preparationTime: 30, // default 30 minutes
      status: 'pending'
    });
  }

  addItemToStore(orderId: string, storeId: string, item: OrderItem) {
    const order = this.orders.find(o => o.id === orderId);
    if (!order) return;

    const storeOrder = order.storeOrders.find(s => s.storeId === storeId);
    if (!storeOrder) return;

    storeOrder.items.push(item);
    this.calculateStoreTotals(storeOrder);
    this.calculateOrderTotal(order);
  }

  private calculateStoreTotals(storeOrder: StoreOrder) {
    storeOrder.subtotal = storeOrder.items.reduce((sum, item) => 
      sum + (item.quantity * item.unitPrice), 0
    );
  }

  private calculateOrderTotal(order: MultiStoreOrder) {
    order.totalAmount = order.storeOrders.reduce((sum, store) => 
      sum + store.subtotal, 0
    );
  }

  confirmOrder(orderId: string) {
    const order = this.orders.find(o => o.id === orderId);
    if (!order) return;

    order.status = 'confirmed';
    order.storeOrders.forEach(store => {
      store.status = 'confirmed';
      this.notifyStore(store);
    });
  }

  private notifyStore(storeOrder: StoreOrder) {
    // Send notification to store
    console.log(`Notifying ${storeOrder.storeName} of new order`);
  }

  updateStoreStatus(orderId: string, storeId: string, status: StoreOrder['status']) {
    const order = this.orders.find(o => o.id === orderId);
    if (!order) return;

    const storeOrder = order.storeOrders.find(s => s.storeId === storeId);
    if (!storeOrder) return;

    storeOrder.status = status;
    this.updateOrderStatus(order);
  }

  private updateOrderStatus(order: MultiStoreOrder) {
    const allReady = order.storeOrders.every(s => s.status === 'ready');
    const anyPreparing = order.storeOrders.some(s => s.status === 'preparing');
    
    if (allReady) {
      order.status = 'ready';
      this.scheduleDelivery(order);
    } else if (anyPreparing) {
      order.status = 'preparing';
    }
  }

  private scheduleDelivery(order: MultiStoreOrder) {
    // Calculate optimal delivery route
    const deliveryRoute = this.optimizeDeliveryRoute(order.storeOrders);
    console.log('Scheduling delivery with route:', deliveryRoute);
  }

  private optimizeDeliveryRoute(storeOrders: StoreOrder[]) {
    // Simple optimization - sort by preparation time
    return storeOrders
      .map(store => ({
        storeId: store.storeId,
        storeName: store.storeName,
        preparationTime: store.preparationTime
      }))
      .sort((a, b) => a.preparationTime - b.preparationTime);
  }

  getOrdersByBusiness(businessId: string): MultiStoreOrder[] {
    return this.orders.filter(o => o.businessId === businessId);
  }

  getOrdersByDate(date: string): MultiStoreOrder[] {
    return this.orders.filter(o => o.deliveryDate === date);
  }

  getStoreWorkload(storeId: string, date: string) {
    const orders = this.getOrdersByDate(date);
    const storeOrders = orders.flatMap(o => 
      o.storeOrders.filter(s => s.storeId === storeId)
    );

    return {
      totalOrders: storeOrders.length,
      totalItems: storeOrders.reduce((sum, s) => 
        sum + s.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
      ),
      totalRevenue: storeOrders.reduce((sum, s) => sum + s.subtotal, 0),
      estimatedPreparationTime: storeOrders.reduce((sum, s) => sum + s.preparationTime, 0)
    };
  }

  generateDeliveryManifest(date: string) {
    const orders = this.getOrdersByDate(date);
    
    return orders.map(order => ({
      orderId: order.id,
      businessName: order.businessId,
      deliveryTime: order.deliveryDate,
      stores: order.storeOrders.map(store => ({
        storeName: store.storeName,
        itemCount: store.items.reduce((sum, item) => sum + item.quantity, 0),
        value: store.subtotal
      })),
      totalValue: order.totalAmount,
      status: order.status
    }));
  }
}

export const multiStoreOrderManager = new MultiStoreOrderManager();