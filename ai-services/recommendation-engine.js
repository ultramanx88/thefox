class IngredientRecommendationEngine {
  constructor() {
    this.businessProfiles = new Map();
    this.supplierProfiles = new Map();
    this.orderHistory = [];
    this.ingredientCatalog = [];
  }

  // สร้างโปรไฟล์ธุรกิจจากประวัติการสั่งซื้อ
  buildBusinessProfile(businessId, orders) {
    const profile = {
      businessType: '', // restaurant, cafe, bakery, hotel
      cuisineTypes: {},
      ingredientPreferences: {},
      orderVolume: { min: 0, max: 0, avg: 0 },
      orderFrequency: 'weekly', // daily, weekly, monthly
      budgetRange: { min: 0, max: 100000 },
      seasonalPatterns: {},
      preferredSuppliers: {}
    };

    orders.forEach(order => {
      // วิเคราะห์ประเภทวัตถุดิบที่สั่ง
      if (order.items) {
        order.items.forEach(item => {
          const category = item.category || 'other';
          profile.ingredientPreferences[category] = 
            (profile.ingredientPreferences[category] || 0) + item.quantity;
        });
      }

      // วิเคราะห์ปริมาณการสั่ง
      if (order.totalAmount) {
        profile.budgetRange.min = Math.min(profile.budgetRange.min, order.totalAmount);
        profile.budgetRange.max = Math.max(profile.budgetRange.max, order.totalAmount);
      }

      // วิเคราะห์ซัพพลายเออร์ที่ชอบ
      if (order.supplierId) {
        profile.preferredSuppliers[order.supplierId] = 
          (profile.preferredSuppliers[order.supplierId] || 0) + 1;
      }
    });

    // คำนวณค่าเฉลี่ย
    const totalOrders = orders.length;
    if (totalOrders > 0) {
      const totalAmount = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      profile.orderVolume.avg = totalAmount / totalOrders;
    }

    this.businessProfiles.set(businessId, profile);
    return profile;
  }

  // แนะนำวัตถุดิบสำหรับธุรกิจ
  recommendIngredients(businessId, ingredients, limit = 10) {
    const businessProfile = this.businessProfiles.get(businessId);
    if (!businessProfile) return ingredients.slice(0, limit);

    const scored = ingredients.map(ingredient => {
      let score = 0;

      // คะแนนจากประเภทวัตถุดิบที่เคยสั่ง
      if (businessProfile.ingredientPreferences[ingredient.category]) {
        score += businessProfile.ingredientPreferences[ingredient.category] * 0.4;
      }

      // คะแนนจากช่วงราคา
      if (ingredient.price >= businessProfile.budgetRange.min && 
          ingredient.price <= businessProfile.budgetRange.max) {
        score += 0.3;
      }

      // คะแนนจากคุณภาพ
      score += (ingredient.quality || 0) * 0.2;

      // คะแนนจากความนิยม
      score += (ingredient.orderCount || 0) * 0.1;

      return { ...ingredient, score };
    });

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  // แนะนำซัพพลายเออร์
  recommendSuppliers(businessId, suppliers) {
    const businessProfile = this.businessProfiles.get(businessId);
    if (!businessProfile) return suppliers;

    return suppliers
      .map(supplier => ({
        ...supplier,
        preferenceScore: businessProfile.preferredSuppliers[supplier.id] || 0
      }))
      .sort((a, b) => b.preferenceScore - a.preferenceScore);
  }

  // วิเคราะห์เทรนด์วัตถุดิบ
  analyzeIngredientTrends(timeRange = 30) {
    const recentOrders = this.orderHistory.filter(order => {
      const orderDate = new Date(order.createdAt);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - timeRange);
      return orderDate >= cutoffDate;
    });

    const categoryTrends = {};
    const ingredientTrends = {};
    const seasonalDemand = {};

    recentOrders.forEach(order => {
      const month = new Date(order.createdAt).getMonth();
      
      if (order.items) {
        order.items.forEach(item => {
          // เทรนด์ตามหมวดหมู่
          const category = item.category || 'other';
          categoryTrends[category] = (categoryTrends[category] || 0) + item.quantity;
          
          // เทรนด์วัตถุดิบเฉพาะ
          ingredientTrends[item.name] = (ingredientTrends[item.name] || 0) + item.quantity;
          
          // ความต้องการตามฤดูกาล
          if (!seasonalDemand[month]) seasonalDemand[month] = {};
          seasonalDemand[month][category] = (seasonalDemand[month][category] || 0) + item.quantity;
        });
      }
    });

    return {
      trendingCategories: Object.entries(categoryTrends)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5),
      trendingIngredients: Object.entries(ingredientTrends)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10),
      seasonalDemand
    };
  }

  // คำนวณความต้องการวัตถุดิบในอนาคต
  predictDemand(ingredientId, days = 7) {
    const history = this.orderHistory
      .filter(order => order.items?.some(item => item.id === ingredientId))
      .slice(-30);

    if (history.length < 7) return { prediction: 0, confidence: 0 };

    const dailyDemand = {};
    history.forEach(order => {
      const date = new Date(order.createdAt).toDateString();
      const item = order.items.find(item => item.id === ingredientId);
      if (item) {
        dailyDemand[date] = (dailyDemand[date] || 0) + item.quantity;
      }
    });

    const avgDemand = Object.values(dailyDemand).reduce((sum, qty) => sum + qty, 0) / Object.keys(dailyDemand).length;
    const prediction = avgDemand * days;
    const confidence = Math.min(0.95, history.length / 30);

    return { prediction: Math.round(prediction), confidence };
  }

  // เพิ่มข้อมูลการสั่งซื้อ
  addOrder(order) {
    this.orderHistory.push(order);
    this.buildBusinessProfile(order.businessId, 
      this.orderHistory.filter(o => o.businessId === order.businessId)
    );
  }
}

module.exports = IngredientRecommendationEngine;