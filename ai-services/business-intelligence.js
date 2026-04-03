class SupplyChainIntelligence {
  constructor() {
    this.supplierMetrics = new Map();
    this.demandData = [];
    this.priceHistory = new Map();
  }

  // ทำนายความต้องการวัตถุดิบ
  predictIngredientDemand(ingredientId, days = 7) {
    const history = this.demandData
      .filter(data => data.ingredientId === ingredientId)
      .slice(-30);

    if (history.length < 7) {
      return { prediction: 0, confidence: 0 };
    }

    const trend = this.calculateDemandTrend(history);
    const seasonality = this.calculateSeasonality(history);
    
    let prediction = 0;
    for (let i = 1; i <= days; i++) {
      const dayPrediction = history[history.length - 1].quantity * 
        (1 + trend) * seasonality[i % 7];
      prediction += dayPrediction;
    }

    const confidence = Math.min(0.95, history.length / 30);
    
    return { prediction: Math.round(prediction), confidence };
  }

  // คำนวณเทรนด์ความต้องการ
  calculateDemandTrend(demandHistory) {
    if (demandHistory.length < 2) return 0;
    
    const recent = demandHistory.slice(-7).reduce((sum, day) => sum + day.quantity, 0) / 7;
    const previous = demandHistory.slice(-14, -7).reduce((sum, day) => sum + day.quantity, 0) / 7;
    
    return previous > 0 ? (recent - previous) / previous : 0;
  }

  // วิเคราะห์ประสิทธิภาพซัพพลายเออร์
  analyzeSupplierPerformance(supplierId) {
    const supplier = this.supplierMetrics.get(supplierId);
    if (!supplier) return null;

    const last30Days = supplier.deliveryHistory.slice(-30);
    const onTimeDeliveries = last30Days.filter(d => d.onTime).length;
    const onTimeRate = onTimeDeliveries / last30Days.length;
    
    const qualityScores = last30Days.map(d => d.qualityScore || 0);
    const avgQuality = qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length;
    
    const priceCompetitiveness = this.calculatePriceCompetitiveness(supplierId);
    const responseTime = this.calculateAvgResponseTime(supplier.orderHistory);

    return {
      onTimeDeliveryRate: onTimeRate,
      averageQuality: avgQuality,
      priceCompetitiveness,
      avgResponseTime: responseTime,
      totalOrders: supplier.orderHistory.length,
      recommendations: this.generateSupplierRecommendations(supplier)
    };
  }

  // คำนวณความสามารถในการแข่งขันด้านราคา
  calculatePriceCompetitiveness(supplierId) {
    const supplier = this.supplierMetrics.get(supplierId);
    if (!supplier) return 0;

    const supplierPrices = supplier.priceHistory || [];
    if (supplierPrices.length === 0) return 0;

    // เปรียบเทียบกับราคาตลาด
    const marketPrices = Array.from(this.supplierMetrics.values())
      .flatMap(s => s.priceHistory || [])
      .filter(p => supplierPrices.some(sp => sp.ingredientId === p.ingredientId));

    if (marketPrices.length === 0) return 0.5;

    const avgSupplierPrice = supplierPrices.reduce((sum, p) => sum + p.price, 0) / supplierPrices.length;
    const avgMarketPrice = marketPrices.reduce((sum, p) => sum + p.price, 0) / marketPrices.length;

    return avgMarketPrice > 0 ? Math.max(0, 1 - (avgSupplierPrice / avgMarketPrice)) : 0.5;
  }

  // คำนวณเวลาตอบสนองเฉลี่ย
  calculateAvgResponseTime(orderHistory) {
    if (!orderHistory || orderHistory.length === 0) return 0;

    const responseTimes = orderHistory
      .filter(order => order.responseTime)
      .map(order => order.responseTime);

    return responseTimes.length > 0 ? 
      responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length : 0;
  }

  // วิเคราะห์ราคาตลาด
  analyzeMarketPrices(ingredientId) {
    const priceHistory = this.priceHistory.get(ingredientId) || [];
    if (priceHistory.length === 0) return null;

    const currentPrice = priceHistory[priceHistory.length - 1]?.price || 0;
    const last30Days = priceHistory.slice(-30);
    const avgPrice = last30Days.reduce((sum, p) => sum + p.price, 0) / last30Days.length;
    
    const priceVolatility = this.calculatePriceVolatility(last30Days);
    const priceTrend = this.calculatePriceTrend(last30Days);

    return {
      currentPrice,
      averagePrice: avgPrice,
      volatility: priceVolatility,
      trend: priceTrend,
      recommendation: this.generatePriceRecommendation(currentPrice, avgPrice, priceTrend)
    };
  }

  // คำนวณความผันผวนของราคา
  calculatePriceVolatility(priceHistory) {
    if (priceHistory.length < 2) return 0;

    const prices = priceHistory.map(p => p.price);
    const mean = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const variance = prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / prices.length;
    
    return Math.sqrt(variance) / mean; // Coefficient of variation
  }

  // คำนวณเทรนด์ราคา
  calculatePriceTrend(priceHistory) {
    if (priceHistory.length < 2) return 0;
    
    const recent = priceHistory.slice(-7).reduce((sum, p) => sum + p.price, 0) / 7;
    const previous = priceHistory.slice(-14, -7).reduce((sum, p) => sum + p.price, 0) / 7;
    
    return previous > 0 ? (recent - previous) / previous : 0;
  }

  // สร้างคำแนะนำด้านราคา
  generatePriceRecommendation(currentPrice, avgPrice, trend) {
    if (trend > 0.1) {
      return {
        action: 'buy_now',
        message: 'ราคากำลังขึ้น ควรสั่งซื้อเร็วๆ นี้',
        priority: 'high'
      };
    } else if (trend < -0.1) {
      return {
        action: 'wait',
        message: 'ราคากำลังลง อาจรอสักพักก่อนสั่งซื้อ',
        priority: 'low'
      };
    } else {
      return {
        action: 'normal',
        message: 'ราคาค่อนข้างเสถียร สามารถสั่งซื้อได้ตามปกติ',
        priority: 'medium'
      };
    }
  }

  // สร้างคำแนะนำสำหรับซัพพลายเออร์
  generateSupplierRecommendations(supplier) {
    const recommendations = [];
    const performance = this.analyzeSupplierPerformance(supplier.id);
    
    if (performance.onTimeDeliveryRate < 0.8) {
      recommendations.push({
        type: 'delivery',
        message: 'อัตราการส่งตรงเวลาต่ำ ควรติดตามการส่งมอบอย่างใกล้ชิด',
        priority: 'high'
      });
    }

    if (performance.averageQuality < 4.0) {
      recommendations.push({
        type: 'quality',
        message: 'คุณภาพสินค้าต่ำกว่าเกณฑ์ ควรหารือเรื่องการปรับปรุง',
        priority: 'high'
      });
    }

    if (performance.priceCompetitiveness < 0.3) {
      recommendations.push({
        type: 'pricing',
        message: 'ราคาสูงกว่าตลาด ควรเจรจาราคาใหม่',
        priority: 'medium'
      });
    }

    return recommendations;
  }

  // เพิ่มข้อมูลความต้องการ
  addDemandData(ingredientId, date, quantity) {
    this.demandData.push({ ingredientId, date, quantity });
    
    // เก็บข้อมูลแค่ 90 วันล่าสุด
    if (this.demandData.length > 1000) {
      this.demandData = this.demandData.slice(-1000);
    }
  }

  // เพิ่มข้อมูลราคา
  addPriceData(ingredientId, price, date = new Date()) {
    if (!this.priceHistory.has(ingredientId)) {
      this.priceHistory.set(ingredientId, []);
    }
    
    const history = this.priceHistory.get(ingredientId);
    history.push({ price, date });
    
    // เก็บข้อมูลแค่ 90 วันล่าสุด
    if (history.length > 90) {
      this.priceHistory.set(ingredientId, history.slice(-90));
    }
  }

  // วิเคราะห์ supply chain รวม
  analyzeSupplyChain() {
    const suppliers = Array.from(this.supplierMetrics.values());
    const totalSuppliers = suppliers.length;
    
    const avgOnTimeRate = suppliers.reduce((sum, s) => {
      const performance = this.analyzeSupplierPerformance(s.id);
      return sum + (performance?.onTimeDeliveryRate || 0);
    }, 0) / totalSuppliers;

    const avgQuality = suppliers.reduce((sum, s) => {
      const performance = this.analyzeSupplierPerformance(s.id);
      return sum + (performance?.averageQuality || 0);
    }, 0) / totalSuppliers;

    const riskSuppliers = suppliers.filter(s => {
      const performance = this.analyzeSupplierPerformance(s.id);
      return performance?.onTimeDeliveryRate < 0.7 || performance?.averageQuality < 3.5;
    });

    return {
      totalSuppliers,
      avgOnTimeDeliveryRate: avgOnTimeRate,
      avgQualityScore: avgQuality,
      riskSuppliersCount: riskSuppliers.length,
      supplyChainHealth: avgOnTimeRate > 0.8 && avgQuality > 4.0 ? 'healthy' : 'needs_attention'
    };
  }
}

module.exports = SupplyChainIntelligence;