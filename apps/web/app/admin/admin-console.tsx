'use client';

import { useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, CheckCircle2, DatabaseZap, History, RefreshCcw, Search, ShieldCheck, UsersRound } from 'lucide-react';

type Role = 'customer' | 'vendor' | 'driver' | 'admin' | 'superadmin';

type AdminUser = {
  id: string;
  email: string | null;
  displayName: string | null;
  photoUrl: string | null;
  role: Role;
  createdAt: string;
  updatedAt: string;
  authAccounts: Array<{
    provider: string;
    providerUserId: string;
  }>;
  vendorMemberships: Array<{
    tenantId: string;
    role: string;
    tenant: {
      name: string;
      slug: string;
      status: string;
    };
  }>;
  driverProfile: {
    id: string;
    status: string;
    serviceArea: string | null;
  } | null;
};

type AuditLog = {
  id: string;
  actorUserId: string | null;
  actorRole: Role | null;
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  route: string | null;
  method: string | null;
  ipAddress: string | null;
  metadata: unknown;
  createdAt: string;
  actorUser: {
    email: string | null;
    displayName: string | null;
  } | null;
};

type AdminMe = {
  user: {
    id: string;
    displayName: string;
    email: string | null;
    role: Role;
  };
  permissions: {
    canReviewTenants: boolean;
    canInspectOrders: boolean;
    canManageRoles: boolean;
  };
};

type LoadState = 'loading' | 'ready' | 'error';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const roles: Role[] = ['customer', 'vendor', 'driver', 'admin', 'superadmin'];

const roleLabels: Record<Role, string> = {
  customer: 'Customer',
  vendor: 'Vendor',
  driver: 'Driver',
  admin: 'Admin',
  superadmin: 'Superadmin'
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('th-TH', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Bangkok'
  }).format(new Date(value));
}

function roleClassName(role: Role) {
  return `fox-role-pill fox-role-pill--${role}`;
}

async function fetchJson<T>(path: string, init?: RequestInit) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers
    }
  });

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

export function AdminConsole() {
  const [admin, setAdmin] = useState<AdminMe | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [state, setState] = useState<LoadState>('loading');
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role | 'all'>('all');
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);

  const loadAdminData = async () => {
    setState((current) => (current === 'ready' ? current : 'loading'));
    setNotice(null);

    try {
      const [adminPayload, usersPayload, auditPayload] = await Promise.all([
        fetchJson<AdminMe>('/v1/admin/me'),
        fetchJson<{ data: AdminUser[] }>('/v1/admin/users'),
        fetchJson<{ data: AuditLog[] }>('/v1/admin/audit-logs')
      ]);

      setAdmin(adminPayload);
      setUsers(usersPayload.data);
      setAuditLogs(auditPayload.data);
      setState('ready');
    } catch (error) {
      setState('error');
      setNotice({
        tone: 'error',
        message: error instanceof Error ? error.message : 'ไม่สามารถโหลดข้อมูล admin ได้'
      });
    }
  };

  useEffect(() => {
    void loadAdminData();
  }, []);

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return users.filter((user) => {
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const searchable = [user.displayName, user.email, user.id, user.authAccounts.map((account) => account.provider).join(' ')]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return matchesRole && (!normalizedQuery || searchable.includes(normalizedQuery));
    });
  }, [query, roleFilter, users]);

  const metrics = useMemo(() => {
    const adminCount = users.filter((user) => user.role === 'admin' || user.role === 'superadmin').length;
    const vendorCount = users.filter((user) => user.role === 'vendor').length;
    const driverCount = users.filter((user) => user.role === 'driver').length;

    return [
      { label: 'Users', value: users.length.toString(), detail: 'บัญชีในระบบ', icon: UsersRound },
      { label: 'Privileged', value: adminCount.toString(), detail: 'admin/superadmin', icon: ShieldCheck },
      { label: 'Vendors', value: vendorCount.toString(), detail: 'partner roles', icon: DatabaseZap },
      { label: 'Drivers', value: driverCount.toString(), detail: 'delivery roles', icon: Activity }
    ];
  }, [users]);

  const updateRole = async (user: AdminUser, nextRole: Role) => {
    if (user.role === nextRole) {
      return;
    }

    setUpdatingUserId(user.id);
    setNotice(null);

    try {
      await fetchJson<{ user: Pick<AdminUser, 'id' | 'email' | 'displayName' | 'role' | 'updatedAt'> }>(`/v1/admin/users/${user.id}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role: nextRole })
      });

      setUsers((currentUsers) =>
        currentUsers.map((currentUser) =>
          currentUser.id === user.id ? { ...currentUser, role: nextRole, updatedAt: new Date().toISOString() } : currentUser
        )
      );
      setNotice({
        tone: 'success',
        message: `อัปเดต ${user.displayName ?? user.email ?? user.id} เป็น ${roleLabels[nextRole]} แล้ว`
      });
      const auditPayload = await fetchJson<{ data: AuditLog[] }>('/v1/admin/audit-logs');
      setAuditLogs(auditPayload.data);
    } catch (error) {
      setNotice({
        tone: 'error',
        message: error instanceof Error ? error.message : 'เปลี่ยน role ไม่สำเร็จ'
      });
    } finally {
      setUpdatingUserId(null);
    }
  };

  return (
    <>
      <section className="fox-admin-toolbar" aria-label="Admin operations toolbar">
        <div>
          <span>Operations Control</span>
          <strong>{admin ? `${admin.user.displayName} · ${roleLabels[admin.user.role]}` : 'Loading admin session'}</strong>
        </div>
        <button type="button" onClick={() => void loadAdminData()} disabled={state === 'loading'}>
          <RefreshCcw size={17} />
          Refresh
        </button>
      </section>

      {notice ? (
        <section className={`fox-admin-notice fox-admin-notice--${notice.tone}`} aria-live="polite">
          {notice.tone === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <p>{notice.message}</p>
        </section>
      ) : null}

      <section className="fox-admin-metrics" aria-label="Admin metrics">
        {metrics.map(({ label, value, detail, icon: Icon }) => (
          <article key={label}>
            <span>
              <Icon size={18} />
              {label}
            </span>
            <strong>{value}</strong>
            <small>{detail}</small>
          </article>
        ))}
      </section>

      <section className="fox-admin-workbench">
        <div className="fox-admin-panel fox-admin-panel--users">
          <div className="fox-admin-panel__head">
            <div>
              <h2>Users & Roles</h2>
              <p>จัดการสิทธิ์บัญชีจากข้อมูลจริงใน production DB</p>
            </div>
            <span>{filteredUsers.length} shown</span>
          </div>

          <div className="fox-admin-filters">
            <label>
              <Search size={17} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ค้นหาชื่อ email หรือ provider" />
            </label>
            <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value as Role | 'all')} aria-label="Filter by role">
              <option value="all">All roles</option>
              {roles.map((role) => (
                <option key={role} value={role}>
                  {roleLabels[role]}
                </option>
              ))}
            </select>
          </div>

          <div className="fox-admin-table" role="table" aria-label="Users and roles">
            <div className="fox-admin-table__header" role="row">
              <span role="columnheader">User</span>
              <span role="columnheader">Role</span>
              <span role="columnheader">Scope</span>
              <span role="columnheader">Updated</span>
            </div>

            {state === 'loading'
              ? Array.from({ length: 5 }, (_, index) => <div key={index} className="fox-admin-skeleton" />)
              : filteredUsers.map((user) => (
                  <article key={user.id} className="fox-admin-user-row" role="row">
                    <div role="cell">
                      <strong>{user.displayName ?? 'Unnamed user'}</strong>
                      <p>{user.email ?? 'No email from provider'}</p>
                      <small>{user.authAccounts.map((account) => account.provider).join(', ') || 'manual'}</small>
                    </div>
                    <div role="cell">
                      {admin?.permissions.canManageRoles ? (
                        <select
                          value={user.role}
                          onChange={(event) => void updateRole(user, event.target.value as Role)}
                          disabled={updatingUserId === user.id}
                          aria-label={`Change role for ${user.displayName ?? user.email ?? user.id}`}
                        >
                          {roles.map((role) => (
                            <option key={role} value={role}>
                              {roleLabels[role]}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className={roleClassName(user.role)}>{roleLabels[user.role]}</span>
                      )}
                    </div>
                    <div role="cell">
                      <span className={roleClassName(user.role)}>{roleLabels[user.role]}</span>
                      <p>
                        {user.vendorMemberships.length
                          ? `${user.vendorMemberships.length} tenant`
                          : user.driverProfile
                            ? `driver ${user.driverProfile.status}`
                            : 'platform account'}
                      </p>
                    </div>
                    <div role="cell">
                      <time dateTime={user.updatedAt}>{formatDateTime(user.updatedAt)}</time>
                    </div>
                  </article>
                ))}
          </div>
        </div>

        <aside className="fox-admin-panel fox-admin-panel--audit" aria-label="Audit log">
          <div className="fox-admin-panel__head">
            <div>
              <h2>Audit Logs</h2>
              <p>เหตุการณ์ล่าสุดจาก auth และ admin API</p>
            </div>
            <History size={19} />
          </div>

          <div className="fox-audit-list">
            {state === 'loading'
              ? Array.from({ length: 6 }, (_, index) => <div key={index} className="fox-admin-skeleton fox-admin-skeleton--compact" />)
              : auditLogs.map((log) => (
                  <article key={log.id} className="fox-audit-item">
                    <div>
                      <strong>{log.action}</strong>
                      <span>{log.actorUser?.displayName ?? log.actorUser?.email ?? log.actorRole ?? 'anonymous'}</span>
                    </div>
                    <p>
                      {log.method ?? 'SYS'} {log.route ?? log.resourceType ?? 'system'}
                    </p>
                    <time dateTime={log.createdAt}>{formatDateTime(log.createdAt)}</time>
                  </article>
                ))}
          </div>
        </aside>
      </section>
    </>
  );
}
