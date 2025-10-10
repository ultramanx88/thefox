# Socket.IO Configuration for iOS

## การตั้งค่า Socket.IO สำหรับ iOS Simulator

### 1. IP Address Configuration
- **Expo URL**: `exp://192.168.0.2:8084`
- **Socket.IO URL**: `http://192.168.0.2:3000`

### 2. Backend Server Setup
ต้องมี Socket.IO server รันอยู่ที่ `http://192.168.0.2:3000`

```bash
# ตัวอย่างการรัน backend server
cd backend
npm start
# หรือ
node server.js
```

### 3. iOS Simulator Configuration
1. เปิด iOS Simulator
2. เปิด Expo Go
3. เชื่อมต่อกับ `exp://192.168.0.2:8084`
4. ดูแท็บ "Delivery" เพื่อทดสอบ Socket.IO

### 4. Socket.IO Events
```javascript
// Driver events
socket.emit('join_driver_room', driverId);
socket.emit('leave_driver_room', driverId);
socket.emit('accept_offer', offerId);
socket.emit('decline_offer', offerId);
socket.emit('update_job_status', { jobId, status, data });
socket.emit('location_update', { lat, lng });

// Server events
socket.on('new_offer', (offer) => {});
socket.on('offer_update', (offer) => {});
socket.on('job_assigned', (job) => {});
socket.on('job_update', (job) => {});
```

### 5. Troubleshooting
- **Connection Failed**: ตรวจสอบว่า backend server รันอยู่ที่ port 3000
- **CORS Error**: ตรวจสอบ CORS configuration ใน backend
- **Network Error**: ตรวจสอบ IP address และ port

### 6. Development vs Production
- **Development**: ใช้ IP address `192.168.0.2`
- **Production**: ใช้ domain name ของ production server
