'use client';

import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Loader2, ShieldAlert } from 'lucide-react';

type Role = 'customer' | 'vendor' | 'driver' | 'admin' | 'superadmin';

type AuthUser = {
  displayName: string;
  email: string | null;
  role: Role;
};

type GuardState = 'loading' | 'allowed' | 'unauthenticated' | 'forbidden';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

const roleDestinations: Record<Role, string> = {
  customer: '/',
  vendor: '/vendor',
  driver: '/driver',
  admin: '/admin',
  superadmin: '/admin'
};

type RoleGuardProps = {
  allowedRoles: Role[];
  workspaceName: string;
  children: ReactNode;
};

export function RoleGuard({ allowedRoles, workspaceName, children }: RoleGuardProps) {
  const [state, setState] = useState<GuardState>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);

  const allowedRoleKey = allowedRoles.join('|');
  const allowedRoleSet = useMemo(() => new Set<Role>(allowedRoles), [allowedRoleKey]);
  const userDestination = user ? roleDestinations[user.role] : '/auth/continue';

  useEffect(() => {
    let active = true;

    fetch(`${apiBaseUrl}/v1/auth/me`, {
      credentials: 'include'
    })
      .then(async (response) => {
        if (response.status === 401) {
          return null;
        }

        if (!response.ok) {
          throw new Error('Failed to resolve auth session');
        }

        return response.json() as Promise<{ user: AuthUser }>;
      })
      .then((payload) => {
        if (!active) {
          return;
        }

        if (!payload) {
          setState('unauthenticated');
          return;
        }

        setUser(payload.user);
        setState(allowedRoleSet.has(payload.user.role) ? 'allowed' : 'forbidden');
      })
      .catch(() => {
        if (!active) {
          return;
        }

        setState('unauthenticated');
      });

    return () => {
      active = false;
    };
  }, [allowedRoleSet]);

  if (state === 'allowed') {
    return children;
  }

  return (
    <main className="fox-auth-continue fox-guard-state" aria-live="polite">
      <section className="fox-auth-continue__panel">
        <span className="fox-auth-continue__mark">
          {state === 'loading' ? <Loader2 className="fox-auth-continue__spinner" size={28} /> : <ShieldAlert size={28} />}
        </span>
        <p className="fox-kicker">THEFOX ACCESS</p>
        <h1>
          {state === 'loading'
            ? `กำลังตรวจสิทธิ์เข้า ${workspaceName}`
            : state === 'forbidden'
              ? `บัญชีนี้ยังเข้า ${workspaceName} ไม่ได้`
              : 'กรุณา login ก่อนเข้า workspace'}
        </h1>
        <p>
          {state === 'loading'
            ? 'ระบบกำลังอ่าน session จาก Fastify auth endpoint'
            : state === 'forbidden' && user
              ? `${user.displayName} ถูกจัดอยู่ใน role ${user.role} จึงควรไปที่ workspace ของตัวเอง`
              : 'เลือก LINE หรือ Google จากหน้าแรก แล้วระบบจะพาไป workspace ที่ถูกต้อง'}
        </p>
        <div className="fox-guard-actions">
          {state === 'forbidden' ? (
            <a className="fox-console-button" href={userDestination}>
              ไป workspace ของฉัน
            </a>
          ) : (
            <a className="fox-console-button" href="/">
              ไปหน้า login
            </a>
          )}
          <a className="fox-auth-secondary" href="/auth/continue">
            ตรวจ session อีกครั้ง
          </a>
        </div>
      </section>
    </main>
  );
}
