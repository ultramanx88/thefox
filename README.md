# thefox-monorepo

- `apps/web` : Next.js (Web)
- `apps/mobile` : Expo/React Native (Mobile)
- `packages/ui` : แชร์ React component

## วิธีใช้งาน
- ติดตั้ง dependencies ทั้งหมด: `npm install`
- รันเว็บ: `cd apps/web && npm run dev`
- รันมือถือ: `cd apps/mobile && npm run start`

## หมายเหตุ
- ต้องปรับ config deploy (firebase.json, apphosting.yaml) ให้ชี้ path ใหม่
- สามารถเพิ่ม package อื่น ๆ ใน packages/ ได้
