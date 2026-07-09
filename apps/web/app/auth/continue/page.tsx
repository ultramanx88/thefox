'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, ShieldCheck } from 'lucide-react';

type Role = 'customer' | 'vendor' | 'driver' | 'admin' | 'superadmin';

type AuthUser = {
  displayName: string;
  email: string | null;
  role: Role;
};

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

const roleDestinations: Record<Role, string> = {
  customer: '/',
  vendor: '/vendor',
  driver: '/driver',
  admin: '/admin',
  superadmin: '/admin'
};

export default function AuthContinuePage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<'loading' | 'redirecting' | 'failed'>('loading');

  const destination = useMemo(() => (user ? roleDestinations[user.role] : '/'), [user]);

  useEffect(() => {
    let active = true;

    fetch(`${apiBaseUrl}/v1/auth/me`, {
      credentials: 'include'
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('Unauthenticated');
        }

        return response.json() as Promise<{ user: AuthUser }>;
      })
      .then((payload) => {
        if (!active) {
          return;
        }

        setUser(payload.user);
        setStatus('redirecting');
        window.setTimeout(() => {
          window.location.href = roleDestinations[payload.user.role];
        }, 420);
      })
      .catch(() => {
        if (!active) {
          return;
        }

        setStatus('failed');
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="fox-auth-continue">
      <section className="fox-auth-continue__panel" aria-live="polite">
        <span className="fox-auth-continue__mark">
          {status === 'failed' ? <ShieldCheck size={28} /> : <Loader2 className="fox-auth-continue__spinner" size={28} />}
        </span>
        <p className="fox-kicker">THEFOX AUTH</p>
        <h1>{status === 'failed' ? 'ยังตรวจ session ไม่สำเร็จ' : 'กำลังพาคุณเข้า workspace ที่ถูกต้อง'}</h1>
        <p>
          {status === 'failed'
            ? 'กรุณากลับหน้าแรกแล้วเลือก LINE หรือ Google อีกครั้ง'
            : user
              ? `${user.displayName} · ${user.role} → ${destination}`
              : 'ระบบกำลังอ่าน role จาก Fastify auth session'}
        </p>
        {status === 'failed' ? (
          <a className="fox-console-button" href="/">
            กลับหน้าแรก
          </a>
        ) : null}
      </section>
    </main>
  );
}
