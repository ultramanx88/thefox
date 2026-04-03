# TheFox AI Services

ระบบ AI และ Machine Learning สำหรับ TheFox Food Marketplace Platform

## 🤖 Features

### 1. AI Chatbot
- ช่วยเหลือลูกค้าหาร้านอาหารและแนะนำเมนู
- ช่วยเหลือร้านอาหารในการจัดการธุรกิจ
- รองรับภาษาไทยและอังกฤษ

### 2. Recommendation Engine
- แนะนำร้านอาหารตามความชอบของผู้ใช้
- แนะนำเมนูจากประวัติการสั่ง
- วิเคราะห์เทรนด์อาหารยอดนิยม

### 3. Business Intelligence
- ทำนายยอดขายร้านอาหาร
- วิเคราะห์ประสิทธิภาพร้านอาหาร
- ให้คำแนะนำเพื่อปรับปรุงธุรกิจ
- วิเคราะห์ตลาดรวม

## 🚀 Quick Start

```bash
# ติดตั้ง dependencies
npm install

# ตั้งค่า environment variables
cp .env.example .env
# แก้ไข .env ให้ถูกต้อง

# รันในโหมด development
npm run dev

# รันในโหมด production
npm start
```

## 📡 API Endpoints

### Chatbot
- `POST /api/ai/chat` - AI Chat

### Recommendations
- `POST /api/ai/recommend/restaurants` - แนะนำร้านอาหาร
- `POST /api/ai/recommend/menu` - แนะนำเมนู
- `GET /api/ai/trends` - วิเคราะห์เทรนด์

### Analytics
- `GET /api/ai/analytics/restaurant/:id` - วิเคราะห์ร้านอาหาร
- `POST /api/ai/predict/sales` - ทำนายยอดขาย
- `GET /api/ai/analytics/market` - วิเคราะห์ตลาด

## 🔧 Configuration

ตั้งค่าใน `.env`:
- `OPENAI_API_KEY` - OpenAI API Key สำหรับ Chatbot
- `AI_SERVICE_PORT` - Port สำหรับ AI Service (default: 3001)

## 🐳 Docker

```bash
# Build image
docker build -t thefox-ai .

# Run container
docker run -p 3001:3001 --env-file .env thefox-ai
```