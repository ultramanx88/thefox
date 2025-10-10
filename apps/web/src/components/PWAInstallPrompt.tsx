"use client";

import { useEffect, useState } from "react";

export default function PWAInstallPrompt() {
  const [deferred, setDeferred] = useState<any>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferred(e);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-white border shadow rounded p-3 flex items-center gap-3 z-50">
      <div className="text-sm">ติดตั้งแอปสำหรับใช้งานรวดเร็วขึ้น</div>
      <button
        className="px-3 py-1 rounded bg-black text-white"
        onClick={async () => {
          if (deferred) {
            deferred.prompt();
            const choice = await deferred.userChoice;
            // hide after choice
            setVisible(false);
            setDeferred(null);
          }
        }}
      >ติดตั้ง</button>
      <button className="px-3 py-1 rounded border" onClick={() => setVisible(false)}>ภายหลัง</button>
    </div>
  );
}


