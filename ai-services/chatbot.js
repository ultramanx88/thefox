const express = require('express');
const { OpenAI } = require('openai');

class AIAssistant {
  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.contexts = {
      customer: "คุณเป็นผู้ช่วยของ TheFox แพลตฟอร์มวัตถุดิบอาหาร ช่วยลูกค้าหาวัตถุดิบ แนะนำสินค้า ตอบคำถามเกี่ยวกับการสั่งซื้อ",
      business: "คุณเป็นผู้ช่วยสำหรับร้านอาหารและธุรกิจใน TheFox ช่วยจัดการคำสั่งซื้อวัตถุดิบ วิเคราะห์ต้นทุน และให้คำแนะนำการจัดซื้อ",
      supplier: "คุณเป็นผู้ช่วยสำหรับซัพพลายเออร์ใน TheFox ช่วยจัดการสินค้า คำสั่งซื้อ และให้คำแนะนำทางธุรกิจ",
      general: "คุณเป็น AI Assistant ของ TheFox Food Ingredient Supply Platform"
    };
  }

  async chat(message, userType = 'customer', context = {}) {
    const systemPrompt = this.contexts[userType] || this.contexts.general;
    
    const completion = await this.openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `${message}\n\nContext: ${JSON.stringify(context)}` }
      ],
      max_tokens: 500,
      temperature: 0.7
    });

    return completion.choices[0].message.content;
  }

  async recommendIngredients(businessType, cuisine, budget) {
    const prompt = `แนะนำวัตถุดิบอาหารสำหรับ: ${businessType} ประเภทอาหาร: ${cuisine} งบประมาณ: ${budget}`;
    return await this.chat(prompt, 'customer', { type: 'ingredient_recommendation' });
  }

  async helpBusiness(query, businessData) {
    return await this.chat(query, 'business', businessData);
  }

  async helpSupplier(query, supplierData) {
    return await this.chat(query, 'supplier', supplierData);
  }
}

const app = express();
app.use(express.json());

const aiAssistant = new AIAssistant();

app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, userType, context } = req.body;
    const response = await aiAssistant.chat(message, userType, context);
    res.json({ response });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/ai/recommend', async (req, res) => {
  try {
    const { preferences, location } = req.body;
    const recommendations = await aiAssistant.recommendRestaurants(preferences, location);
    res.json({ recommendations });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = { AIAssistant, app };