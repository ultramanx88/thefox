"use client";

import { useEffect, useState } from "react";

export default function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  if (!offline) return null;
  return (
    <div className="fixed top-0 left-0 right-0 bg-yellow-400 text-black text-center py-2 text-sm z-50">
      โหมดออฟไลน์: ข้อมูลใหม่จะไม่อัปเดตจนกว่าจะเชื่อมต่ออีกครั้ง
    </div>
  );
}


