#!/bin/bash

# Script สำหรับทำความสะอาดโปรเจค thefox
# ใช้เมื่อต้องการลบไฟล์ที่ไม่จำเป็นออกจากระบบ

echo "🧹 เริ่มทำความสะอาดโปรเจค thefox..."

# ลบ node_modules ทั้งหมด
echo "📦 ลบ node_modules..."
find . -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null

# ลบ build files
echo "🏗️ ลบ build files..."
rm -rf apps/web/.next
rm -rf apps/mobile/dist
rm -rf apps/mobile/.expo
rm -rf .expo

# ลบ cache files
echo "🗂️ ลบ cache files..."
rm -rf .cursor
rm -rf .claude
find . -name "*.log" -type f -delete
find . -name ".DS_Store" -type f -delete
find . -name "*.tmp" -type f -delete
find . -name "*.temp" -type f -delete

# ลบไฟล์ temporary
echo "🗑️ ลบไฟล์ temporary..."
rm -f .modified
rm -f .git/COMMIT_EDITMSG

# แสดงขนาดโปรเจคหลังทำความสะอาด
echo "📊 ขนาดโปรเจคหลังทำความสะอาด:"
du -sh .

echo "✅ ทำความสะอาดเสร็จสิ้น!"
echo "💡 อย่าลืมรัน 'npm install' ใน apps/web และ apps/mobile หลังจากนี้"